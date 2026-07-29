import type { NextConfig } from 'next'

/**
 * This repository is an FFC-EX site: a faithful static clone of the live
 * WordPress site, served from GitHub Pages after WordPress is decommissioned.
 *
 * With `output: 'export'`, Next copies everything in `public/` verbatim into
 * `out/`, which is what gets deployed. The clone lives in `public/`, so the
 * export ships the exact cloned site — see
 * FFC-Cloudflare-Automation/docs/ffc-ex-static-clone-runbook.md.
 *
 * There are deliberately no application routes: a route resolving to the same
 * path as a file in `public/` would collide with the clone.
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    // The clone ships pre-sized WordPress images; Next's optimizer is not
    // available in a static export anyway.
    unoptimized: true,
  },
  // Set only for subdirectory previews (e.g. the github.io project URL before
  // the custom domain is bound). Empty for the apex deployment.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

export default nextConfig
