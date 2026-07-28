#!/usr/bin/env node
/**
 * Build the policy pages.
 *
 * The live WordPress site renders /privacy-policy-2/ and /terms-of-service-2/
 * as title-only pages with no body, and the repository's markdown policies were
 * inherited from the Free For Charity template - they describe freeforcharity.org,
 * WordPress comment forms, user logins and Microsoft Forms, none of which exist
 * here. Publishing either as-is would state something untrue about this site.
 *
 * These pages are therefore authored in content/policies/ to describe what
 * slopestohope.org actually does, and injected into the site's own page chrome
 * so they match the rest of the site exactly.
 *
 * Usage: node tools/build-policies.mjs
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** A cloned empty page supplies the header, nav and footer chrome. */
const TEMPLATE = join(ROOT, 'privacy-policy-2/index.html');

const POLICIES = [
  { src: 'privacy-policy.html', out: 'privacy-policy/index.html', title: 'Privacy Policy' },
  { src: 'cookie-policy.html', out: 'cookie-policy/index.html', title: 'Cookie Policy' },
  { src: 'terms-of-service.html', out: 'terms-of-service/index.html', title: 'Terms of Service' },
];

/** Readable defaults for long-form prose, which the theme CSS does not cover. */
const POLICY_CSS = `
<style id="sth-policy-styles">
.entry-content{max-width:52rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;line-height:1.7}
.entry-content h1{font-size:2rem;margin:0 0 .5rem}
.entry-content h2{font-size:1.25rem;margin:2.25rem 0 .75rem;line-height:1.3}
.entry-content p,.entry-content li{font-size:1rem}
.entry-content ul{margin:0 0 1rem 1.25rem;list-style:disc}
.entry-content li{margin-bottom:.5rem}
.entry-content a{text-decoration:underline}
.entry-content table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.95rem}
.entry-content th,.entry-content td{border:1px solid #ddd;padding:.6rem .75rem;text-align:left;vertical-align:top}
.entry-content th{background:#f5f5f5}
.entry-content table{display:block;overflow-x:auto}
@media (min-width:640px){.entry-content table{display:table}}
</style>`;

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  if (!await exists(TEMPLATE)) {
    console.error(`Template missing: ${TEMPLATE}\nRun tools/clone-wordpress.mjs first.`);
    process.exit(1);
  }
  const template = await readFile(TEMPLATE, 'utf8');

  for (const policy of POLICIES) {
    const body = await readFile(join(ROOT, 'content/policies', policy.src), 'utf8');

    let html = template;

    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${policy.title} &#8211; Slopes to Hope</title>`,
    );
    html = html.replace(
      /(<meta[^>]*property=["']og:title["'][^>]*content=["'])[^"']*(["'])/i,
      `$1${policy.title} - Slopes to Hope$2`,
    );
    html = html.replace(
      /(<link[^>]*rel=["']canonical["'][^>]*href=["'])[^"']*(["'])/i,
      `$1https://slopestohope.org/${policy.out.replace('/index.html', '/')}$2`,
    );

    const injected = html.replace(
      /(<div class="entry-content">)([\s\S]*?)(<\/div><!-- \.entry-content -->)/,
      (_m, open, _old, close) => open + '\n' + body + '\n' + close,
    );
    if (injected === html) {
      console.error(`! could not find the content slot for ${policy.out}`);
      process.exit(1);
    }
    html = injected.replace('</head>', `${POLICY_CSS}\n</head>`);

    const dest = join(ROOT, policy.out);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, html);
    console.log(`  built ${policy.out}`);
  }
  console.log(`\n${POLICIES.length} policy pages built.`);
}

main().catch(err => { console.error(err); process.exit(1); });
