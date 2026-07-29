/**
 * Resolve a request path inside a root directory, or return null if it escapes.
 *
 * A `join(root, p).startsWith(root)` prefix test is not containment. join()
 * normalises `..` first, so a request for `/../public2/x` under root
 * `/repo/public` resolves to `/repo/public2/x` - which still passes the prefix
 * test while pointing at a sibling directory entirely outside the root.
 * Comparing the *relative* path is the check that actually holds.
 *
 * This matters most on the write side. tools/sync-runtime-assets.mjs derives
 * destination paths from URLs observed at runtime - i.e. from the cloned site's
 * own JavaScript, which is vendored WordPress plugin code we do not control. A
 * page requesting `/%2e%2e/%2e%2e/x` decodes to `../../x`, and without this
 * check the script would fetch that from the live origin and write it outside
 * the clone.
 *
 * Shared by the two tools that serve or write into a fixed root so the rule is
 * stated once. Mirrors resolveWithin() in FFC-Cloudflare-Automation's
 * scripts/verify-no-legacy.mjs and scripts/sync-runtime-assets.mjs.
 */
import { resolve, relative, isAbsolute } from 'node:path'

export function resolveWithin(root, requestPath) {
  const base = resolve(root)
  const abs = resolve(base, requestPath.replace(/^\/+/, ''))
  const rel = relative(base, abs)
  // '' means abs === base (the root itself, not a file under it).
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null
  return abs
}

/* Self-test: `node tools/lib/resolve-within.mjs` */
if (process.argv[1] && process.argv[1].endsWith('resolve-within.mjs')) {
  const ROOT = '/repo/public'
  const cases = [
    ['/assets/js/site.js', '/repo/public/assets/js/site.js', 'a normal path resolves'],
    ['assets/js/site.js', '/repo/public/assets/js/site.js', 'a leading slash is optional'],
    ['/a/../b.js', '/repo/public/b.js', 'an interior .. that stays inside is fine'],
    ['/../public2/x', null, 'sibling-dir traversal is contained'],
    ['/../../etc/passwd', null, 'parent traversal is contained'],
    ['/', null, 'the root itself is not a file'],
  ]
  let failures = 0
  for (const [input, want, name] of cases) {
    const got = resolveWithin(ROOT, input)
    const ok = got === want
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`)
    if (!ok) {
      console.log(`       input ${input}\n       want  ${want}\n       got   ${got}`)
      failures++
    }
  }
  console.log(failures ? `\n${failures} failure(s)` : '\nall resolve-within tests passed')
  process.exit(failures ? 1 : 0)
}
