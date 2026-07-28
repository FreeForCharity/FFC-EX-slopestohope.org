#!/usr/bin/env node
/**
 * Clone the live WordPress site at slopestohope.com into this repository as a
 * fully self-contained static site, with no runtime dependency on the legacy
 * WordPress host.
 *
 * This exists because the site is being cut over at the DNS level: once
 * slopestohope.com points at GitHub Pages, any asset still referencing that
 * hostname resolves back to this same static site and 404s. Every legacy URL
 * therefore has to become a local one.
 *
 * Re-run this whenever content changes on the WordPress site:
 *
 *     node tools/clone-wordpress.mjs
 *     node tools/clone-wordpress.mjs --only=home,team    # subset
 *     node tools/clone-wordpress.mjs --dry-run           # report, write nothing
 *
 * The script is idempotent: unchanged pages and already-downloaded assets are
 * rewritten to identical bytes, so `git status` after a run shows exactly what
 * changed upstream.
 */

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://slopestohope.com';
const CONCURRENCY = 8;

/**
 * Pages to clone.
 *
 *   mode: 'full'  - clone the page as-is
 *   mode: 'shell' - clone chrome (header/nav/footer) but render title-only,
 *                   discarding the page body
 *
 * The shell pages are ones the live site currently renders as empty, or with
 * content that must not be published: /faq/ carries boilerplate about an
 * unrelated organization, and the donation pages emit raw GiveWP shortcodes
 * because the plugin is inactive. Cloning those verbatim would ship visibly
 * broken content the moment DNS is cut over.
 */
const PAGES = [
  { slug: '', out: 'index.html', mode: 'full', title: 'Home' },
  { slug: 'our-story', out: 'our-story/index.html', mode: 'full', title: 'Our Story' },
  { slug: 'team', out: 'team/index.html', mode: 'full', title: 'Team' },
  { slug: 'gallery', out: 'gallery/index.html', mode: 'full', title: 'Gallery' },
  { slug: 'contact-us', out: 'contact-us/index.html', mode: 'full', title: 'Contact Us' },
  { slug: 'donors', out: 'donors/index.html', mode: 'full', title: 'Donors' },

  { slug: 'faq', out: 'faq/index.html', mode: 'shell', title: 'F.A.Q.' },
  { slug: 'volunteer', out: 'volunteer/index.html', mode: 'shell', title: 'Volunteer' },
  { slug: 'donor-dashboard', out: 'donor-dashboard/index.html', mode: 'shell', title: 'Donor Dashboard' },
  { slug: 'donation-confirmation', out: 'donation-confirmation/index.html', mode: 'shell', title: 'Donation Confirmation' },
  { slug: 'donation-failed', out: 'donation-failed/index.html', mode: 'shell', title: 'Donation Failed' },
  { slug: 'test-donate', out: 'test-donate/index.html', mode: 'shell', title: 'Donate' },
  { slug: 'privacy-policy-2', out: 'privacy-policy-2/index.html', mode: 'shell', title: 'Privacy Policy' },
  { slug: 'terms-of-service-2', out: 'terms-of-service-2/index.html', mode: 'shell', title: 'Terms of Service' },
];

/**
 * Client-side redirect stubs. GitHub Pages serves no redirect rules, so a URL
 * that has to keep working is published as a small HTML page that forwards.
 *
 * /staff/ is where the previous clone published the team page. The live site
 * uses /team/, which the clone now matches, but the old URL has been public and
 * may be linked, so it forwards rather than 404ing.
 */
const REDIRECTS = [
  { from: 'staff/index.html', to: '/team/' },
];

/** Live URL path -> local path, for in-page links. */
const LINK_MAP = new Map([
  ['/', '/'],
  ...PAGES.filter(p => p.slug).map(p => [`/${p.slug}/`, `/${p.slug}/`]),
  // The clone previously published the team page at /staff/; a redirect stub
  // keeps that URL alive, but canonical links should point at the live slug.
  ['/staff/', '/team/'],
]);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '')
  .split(',').filter(Boolean);

const stats = { pages: 0, assets: 0, skipped: 0, failed: [], missingUpstream: [], bytes: 0 };
const assetQueue = new Set();
const assetDone = new Set();

/* ------------------------------------------------------------------ utils */

async function fetchWithRetry(url, { binary = false, attempts = 4 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'slopestohope-static-clone/1.0' },
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, 2000 * 2 ** i));
      }
    }
  }
  throw lastErr;
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function writeIfChanged(path, contents) {
  if (DRY_RUN) return false;
  await mkdir(dirname(path), { recursive: true });
  const buf = Buffer.isBuffer(contents) ? contents : Buffer.from(contents, 'utf8');
  if (await exists(path)) {
    const current = await readFile(path);
    if (current.equals(buf)) return false;
  }
  await writeFile(path, buf);
  return true;
}

/** Map a legacy absolute URL to the repo-relative path it will live at. */
function localPathFor(url) {
  const u = new URL(url, ORIGIN);
  return decodeURIComponent(u.pathname).replace(/^\/+/, '');
}

/** Legacy asset URLs we mirror locally (everything WordPress serves). */
const ASSET_PREFIXES = ['/wp-content/', '/wp-includes/'];

function isMirrorableAsset(pathname) {
  return ASSET_PREFIXES.some(p => pathname.startsWith(p));
}

/* ------------------------------------------------------- URL rewriting */

/**
 * Elementor stores widget configuration as HTML-escaped JSON inside data-
 * attributes, so a URL there is terminated by `&quot;` rather than a real
 * quote character. Left unhandled, the match runs past the end of the URL and
 * swallows the rest of the JSON blob, producing a bogus asset request.
 */
/**
 * A single URL character: any character legal in a URL, except where it begins
 * an HTML entity that terminates the URL. Encoding this as a negative lookahead
 * stops the match at the boundary, which is what makes a global replace resume
 * scanning immediately after it - trimming the match afterwards would leave
 * every following URL in the same JSON blob unrewritten.
 */
const ENTITY_BOUNDARY = '&(?:quot|apos|lt|gt|#0?3[49]|#x27);';
const URL_CHAR = `(?:(?!${ENTITY_BOUNDARY})[^\\s"'<>()\\\\])`;

function trimEntityBoundary(path) {
  const cut = path.search(/&(?:quot|apos|lt|gt|#0?3[49]|#x27);/);
  return cut === -1 ? path : path.slice(0, cut);
}

/**
 * Collect every legacy URL in a blob of text, in both plain and
 * JSON-escaped (`https:\/\/slopestohope.com\/...`) form. Elementor stores
 * widget configuration as escaped JSON inside data- attributes, so the escaped
 * variant has to be handled or those assets silently keep pointing at the old
 * host.
 */
function collectLegacyUrls(text) {
  const found = new Set();
  const plain = new RegExp(`https?://(?:www\\.)?slopestohope\\.com(/${URL_CHAR}*)`, 'g');
  const escaped = new RegExp(`https?:\\\\/\\\\/(?:www\\.)?slopestohope\\.com((?:\\\\/${URL_CHAR}*)*)`, 'g');
  let m;
  while ((m = plain.exec(text))) found.add(trimEntityBoundary(m[1]));
  while ((m = escaped.exec(text))) found.add(trimEntityBoundary(m[1].replace(/\\\//g, '/')));
  return found;
}

/**
 * Rewrite every legacy reference in `text` to a local one.
 *
 * Asset paths become root-relative (`/wp-content/...`). The site is published
 * at a domain root via CNAME, so root-relative paths resolve identically from
 * every directory depth, which matters because pages live at varying depths.
 */
function rewriteLegacyUrls(text) {
  const replacePath = (pathAndQuery) => {
    const [rawPath] = pathAndQuery.split(/[?#]/);
    const suffix = pathAndQuery.slice(rawPath.length);

    if (isMirrorableAsset(rawPath)) {
      // Query strings on assets are WordPress cache-busters; the mirrored file
      // has no such versioning, so they are dropped to keep paths stable.
      return rawPath;
    }
    if (LINK_MAP.has(rawPath)) return LINK_MAP.get(rawPath);
    if (rawPath.startsWith('/wp-admin/')) return rawPath + suffix;
    return rawPath + suffix;
  };

  // Each match is trimmed at the first HTML entity boundary and the remainder
  // re-appended verbatim, so rewriting a URL embedded in escaped JSON cannot
  // eat the JSON that follows it.
  let out = text.replace(
    new RegExp(`https?://(?:www\\.)?slopestohope\\.com(/${URL_CHAR}*)?`, 'g'),
    (_full, p) => {
      const path = p || '/';
      const trimmed = trimEntityBoundary(path);
      return replacePath(trimmed || '/') + path.slice(trimmed.length);
    },
  );

  out = out.replace(
    new RegExp(`https?:\\\\/\\\\/(?:www\\.)?slopestohope\\.com((?:\\\\/${URL_CHAR}*)*)`, 'g'),
    (_full, p) => {
      const plainPath = (p || '/').replace(/\\\//g, '/');
      const trimmed = trimEntityBoundary(plainPath);
      const rewritten = replacePath(trimmed || '/').replace(/\//g, '\\/');
      return rewritten + plainPath.slice(trimmed.length);
    },
  );

  return out;
}

/* ------------------------------------------------------------ asset sync */

function queueAssetsFrom(text) {
  for (const p of collectLegacyUrls(text)) {
    const [rawPath] = p.split(/[?#]/);
    if (!isMirrorableAsset(rawPath)) continue;
    // Some plugin configuration values are directory prefixes rather than
    // files (the SVG-shape base path, for instance); there is nothing to
    // download and the host answers 403 for the bare directory.
    if (rawPath.endsWith('/')) continue;
    const key = decodeURIComponent(rawPath);
    if (!assetDone.has(key)) assetQueue.add(key);
  }
}

/** CSS references more assets (fonts, background images) via url() and @import. */
function queueAssetsFromCss(css, cssPath) {
  const refs = [
    ...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g),
    ...css.matchAll(/@import\s+['"]([^'"]+)['"]/g),
  ].map(m => m[1]);

  for (const ref of refs) {
    if (/^(data:|https?:|\/\/)/.test(ref)) {
      // Absolute legacy URLs are picked up by the generic collector.
      continue;
    }
    // Resolve relative to the stylesheet's own directory.
    const resolved = new URL(ref, `${ORIGIN}/${cssPath}`);
    const p = decodeURIComponent(resolved.pathname);
    if (isMirrorableAsset(p) && !assetDone.has(p)) assetQueue.add(p);
  }
}

async function downloadAsset(assetPath) {
  const key = decodeURIComponent(assetPath);
  if (assetDone.has(key)) return;
  assetDone.add(key);

  const dest = join(ROOT, localPathFor(assetPath));
  const isCss = /\.css$/i.test(assetPath);
  const isText = isCss || /\.(js|svg|json|map)$/i.test(assetPath);

  // Assets are immutable content; skip re-downloading ones already mirrored,
  // except CSS, which must be re-parsed so newly referenced fonts are queued.
  if (!isCss && await exists(dest)) {
    stats.skipped++;
    return;
  }

  try {
    const url = ORIGIN + assetPath.split('#')[0];
    const body = await fetchWithRetry(url, { binary: !isText });

    if (isCss) {
      queueAssetsFromCss(body, assetPath.replace(/^\/+/, ''));
      queueAssetsFrom(body);
      const rewritten = rewriteLegacyUrls(body);
      if (await writeIfChanged(dest, rewritten)) stats.assets++;
      stats.bytes += Buffer.byteLength(rewritten);
      return;
    }

    const payload = isText ? rewriteLegacyUrls(body) : body;
    if (await writeIfChanged(dest, payload)) stats.assets++;
    stats.bytes += Buffer.isBuffer(payload) ? payload.length : Buffer.byteLength(payload);
  } catch (err) {
    const message = String(err.message || err);
    // A 404 means the reference is already broken on the live WordPress site
    // (the theme ships a few such dangling background images). That is worth
    // reporting but is not a cloning failure - there is nothing to mirror.
    const bucket = message.includes('HTTP 404') ? stats.missingUpstream : stats.failed;
    bucket.push({ url: assetPath, error: message });
  }
}

async function drainAssetQueue() {
  while (assetQueue.size) {
    const batch = [...assetQueue].slice(0, CONCURRENCY);
    batch.forEach(a => assetQueue.delete(a));
    await Promise.all(batch.map(downloadAsset));
  }
}

/* ------------------------------------------------------- HTML processing */

/**
 * Strip WordPress plumbing that cannot work on a static host and would 404
 * against the cut-over domain: REST/oEmbed discovery, RSD/XML-RPC, feeds and
 * the LiteSpeed cache "guest mode" probe (which triggers a page reload loop
 * when its endpoint is missing).
 */
function stripWordPressPlumbing(html) {
  const dropLinkRels = [
    'https://api.w.org/', 'EditURI', 'wlwmanifest', 'alternate', 'shortlink', 'pingback',
  ];

  let out = html;

  out = out.replace(/<link[^>]*>/g, (tag) => {
    const rel = (tag.match(/rel=["']([^"']+)["']/) || [])[1] || '';
    const href = (tag.match(/href=["']([^"']+)["']/) || [])[1] || '';
    if (/wp-json|xmlrpc\.php|wlwmanifest|\/feed\/|comments\/feed/.test(href)) return '';
    if (rel === 'alternate' && /oembed|rss\+xml/.test(tag)) return '';
    if (dropLinkRels.includes(rel) && /wp-json|xmlrpc|wlwmanifest/.test(href)) return '';
    return tag;
  });

  // LiteSpeed guest-mode probe: POSTs to a PHP endpoint and reloads the page
  // when it answers. With no PHP behind the static host this is dead weight at
  // best and a reload loop at worst.
  out = out.replace(
    /<script[^>]*data-no-optimize="1"[^>]*>\s*var litespeed_vary[\s\S]*?<\/script>/g,
    '',
  );

  // RSD / XML-RPC discovery meta.
  out = out.replace(/<meta[^>]*name=["']generator["'][^>]*WordPress[^>]*>/gi, '');

  return out;
}

/**
 * Script sources dropped from every cloned page.
 *
 * The Elementor family assembles content-hashed webpack chunk URLs at runtime,
 * so a static mirror cannot capture them - the chunks 404 and every widget
 * handler dies with them, which is how the counter ended up frozen at 0.
 * Rather than chase generated filenames, the runtimes are dropped wholesale and
 * assets/js/site.js reimplements the behaviour natively.
 *
 * The buddyx theme scripts are deliberately kept: they drive the mobile menu
 * and are plain self-contained jQuery, with nothing dynamically fetched.
 */
const DROP_SCRIPT_PATTERNS = [
  /\/wp-content\/plugins\/elementor\//,
  /\/wp-content\/plugins\/elementskit-lite\//,
  /\/wp-content\/plugins\/essential-addons-for-elementor-lite\//,
  /\/wp-content\/uploads\/essential-addons-elementor\/.*\.js/,
  // Click tracking that POSTs to admin-ajax.php, which no longer exists.
  /\/wp-content\/plugins\/track-the-click\//,
];

/** Inline scripts that only configure the dropped runtimes. */
const DROP_INLINE_SCRIPT_IDS = [
  'elementor-frontend-js-before',
  'elementor-frontend-js-extra',
  'eael-general-js-extra',
  'elementskit-elementor-js-extra',
  'elementskit-framework-js-frontend-js-after',
  'ekit-widget-scripts-js-extra',
];

function replaceElementorRuntime(html) {
  let out = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (tag) => {
    const src = (tag.match(/\bsrc=["']([^"']+)["']/) || [])[1];
    if (src && DROP_SCRIPT_PATTERNS.some(re => re.test(src))) return '';

    const id = (tag.match(/\bid=["']([^"']+)["']/) || [])[1];
    if (id && DROP_INLINE_SCRIPT_IDS.includes(id)) return '';

    // Inline bootstraps that call into the dropped runtimes.
    if (!src && /elementorFrontend|eael|elementskit|ekit_config/.test(tag)) return '';
    return tag;
  });

  // Stylesheets stay: they carry the entire layout and design. Only behaviour
  // is replaced.
  out = out.replace(
    /<\/body>/i,
    '<script src="/assets/js/site.js"></script>\n</body>',
  );

  return out;
}

/**
 * Link the policy pages from the footer. The live WordPress footer carries no
 * policy links at all, so without this the pages would be published but
 * unreachable by anyone browsing the site.
 */
function addPolicyFooterLinks(html) {
  const nav =
    '<nav class="sth-legal-links" aria-label="Legal">' +
    '<a href="/privacy-policy/">Privacy Policy</a>' +
    '<a href="/cookie-policy/">Cookie Policy</a>' +
    '<a href="/terms-of-service/">Terms of Service</a>' +
    '</nav>';

  const style =
    '<style id="sth-legal-links-style">' +
    '.sth-legal-links{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;' +
    'justify-content:center;margin-top:.75rem;font-size:.9rem}' +
    '.sth-legal-links a{text-decoration:underline}' +
    '</style>';

  if (html.includes('sth-legal-links')) return html;

  const withNav = html.replace(
    /(<div class="site-info">\s*<div class="container">)([\s\S]*?)(<\/div>)/,
    (_m, open, body, close) => open + body + nav + close,
  );
  if (withNav === html) return html;

  return withNav.replace('</head>', `${style}\n</head>`);
}

/**
 * Rewrite the canonical/og URLs to the destination domain. After cutover the
 * site answers on both slopestohope.com and slopestohope.org, and canonical
 * tags pointing at a WordPress install that no longer exists would be wrong.
 */
function rewriteCanonical(html, slug) {
  const canonical = `https://slopestohope.org/${slug ? slug + '/' : ''}`;
  return html
    .replace(/(<link[^>]*rel=["']canonical["'][^>]*href=["'])[^"']*(["'])/gi, `$1${canonical}$2`)
    .replace(/(<meta[^>]*property=["']og:url["'][^>]*content=["'])[^"']*(["'])/gi, `$1${canonical}$2`);
}

/**
 * Build a title-only page from the live "empty page" template, so shells are
 * visually identical to a genuine empty WordPress page rather than a hand-made
 * approximation that would drift from the theme.
 */
function buildShell(templateHtml, page) {
  let out = templateHtml;

  // Swap <title> and the on-page heading.
  out = out.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${page.title} &#8211; Slopes to Hope</title>`,
  );
  out = out.replace(
    /(<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>)[\s\S]*?(<\/h1>)/,
    `$1${page.title}$2`,
  );
  // Elementor renders the page heading as a heading widget on some templates.
  out = out.replace(
    /(<h1[^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>)[\s\S]*?(<\/h1>)/,
    `$1${page.title}$2`,
  );

  out = out.replace(
    /(<meta[^>]*property=["']og:title["'][^>]*content=["'])[^"']*(["'])/gi,
    `$1${page.title} - Slopes to Hope$2`,
  );

  return out;
}

async function processPage(page, shellTemplate) {
  const url = `${ORIGIN}/${page.slug ? page.slug + '/' : ''}`;
  process.stdout.write(`  fetching ${url}\n`);
  const raw = await fetchWithRetry(url);

  let html = page.mode === 'shell' ? buildShell(shellTemplate, page) : raw;

  queueAssetsFrom(html);
  html = stripWordPressPlumbing(html);
  html = replaceElementorRuntime(html);
  html = addPolicyFooterLinks(html);
  html = rewriteLegacyUrls(html);
  html = rewriteCanonical(html, page.slug);

  const dest = join(ROOT, page.out);
  const changed = await writeIfChanged(dest, html);
  stats.pages++;
  return { page, changed, bytes: Buffer.byteLength(html), raw };
}

/* -------------------------------------------------------------- entry */

async function main() {
  const selected = ONLY.length
    ? PAGES.filter(p => ONLY.includes(p.slug || 'home'))
    : PAGES;

  console.log(`Cloning ${selected.length} page(s) from ${ORIGIN}`);
  if (DRY_RUN) console.log('(dry run - nothing will be written)\n');

  // The shell template comes from a page the live site genuinely renders empty,
  // so shells inherit the real theme chrome instead of a hand-built copy.
  console.log('  fetching shell template (/privacy-policy-2/)');
  const shellTemplate = await fetchWithRetry(`${ORIGIN}/privacy-policy-2/`);

  const results = [];
  for (const page of selected) {
    results.push(await processPage(page, shellTemplate));
  }

  console.log(`\nResolving assets (${assetQueue.size} queued)...`);
  await drainAssetQueue();

  for (const r of REDIRECTS) {
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting&hellip;</title>
<link rel="canonical" href="https://slopestohope.org${r.to}">
<meta http-equiv="refresh" content="0; url=${r.to}">
<meta name="robots" content="noindex">
</head>
<body>
<p>This page has moved to <a href="${r.to}">${r.to}</a>.</p>
<script>window.location.replace(${JSON.stringify(r.to)});</script>
</body>
</html>
`;
    if (await writeIfChanged(join(ROOT, r.from), html)) {
      console.log(`  redirect ${r.from} -> ${r.to}`);
    }
  }

  console.log('\n--- summary ---');
  console.log(`pages written   : ${stats.pages}`);
  console.log(`assets written  : ${stats.assets}`);
  console.log(`assets cached   : ${stats.skipped}`);
  console.log(`asset failures  : ${stats.failed.length}`);
  for (const f of stats.failed) console.log(`   ! ${f.url} (${f.error})`);
  if (stats.missingUpstream.length) {
    console.log(`\nmissing upstream (already broken on the live site, nothing to mirror):`);
    for (const f of stats.missingUpstream) console.log(`   - ${f.url}`);
  }

  const changed = results.filter(r => r.changed).map(r => r.page.out);
  console.log(`\npages changed   : ${changed.length ? changed.join(', ') : 'none'}`);

  if (stats.failed.length) process.exitCode = 1;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
