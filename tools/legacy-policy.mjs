export const EXCLUDED_LEGACY_ROUTES = new Set(['/tag/community-across-america/', '/tag/caa/']);
export const EXCLUDED_GIVEWP_ROUTES = new Set(['/donation-confirmation/', '/donation-failed/', '/donor-dashboard/', '/test-donate/']);
export const EXCLUDED_POLICY_SHELL_ROUTES = new Set(['/privacy-policy-2/', '/terms-of-service-2/']);
export const EXCLUDED_ORPHANED_ROUTES = new Set([
  '/author/drewroberts/',
  '/elementskit-content/dynamic-content-widget-2e4e699-99/',
  '/elementskit-content/dynamic-content-widget-b7206bf-99/',
  '/tag/b3t/',
  '/tag/breckenridge/',
  '/tag/breckfest/',
  '/tag/cable-center/',
  '/tag/community/',
  '/tag/demo/',
  '/tag/fattys/',
  '/tag/fly-fishing/',
  '/tag/frisco/',
  '/tag/local/',
  '/tag/pizza/',
  '/tag/public-speaking/',
  '/tag/summit-co/',
  '/tag/summit-county/',
  '/tag/summit/',
  '/tag/tenmile/',
  '/tag/toastmasters/',
  '/volunteer/',
]);
export const EXCLUDED_ROUTES = new Set([
  ...EXCLUDED_LEGACY_ROUTES,
  ...EXCLUDED_GIVEWP_ROUTES,
  ...EXCLUDED_POLICY_SHELL_ROUTES,
  ...EXCLUDED_ORPHANED_ROUTES,
]);
export const REMOVED_CANDID_SEAL_LINKS = new Set([
  'https://app.candid.org/profile/16353783/slopes-to-hope-33-4379051/?pkId=6af5d7d1-d210-4cfe-a995-a15e189188c5',
]);

export function sanitizeLegacyContent(document, pathname) {
  if (pathname !== '/faq/') return;
  const page = document.querySelector('[data-elementor-id="3827"]');
  if (!page) throw new Error('FAQ page container not found');
  const sections = [...page.children];
  if (sections.length < 3) throw new Error('FAQ content sections not found');
  sections.slice(2).forEach(section => section.remove());
  const section = document.createElement('section');
  section.className = 'elementor-section elementor-top-section elementor-section-boxed elementor-section-height-default';
  section.innerHTML = '<div class="elementor-container elementor-column-gap-default"><div class="elementor-column elementor-col-100 elementor-top-column"><div class="elementor-widget-wrap elementor-element-populated"><div class="elementor-widget elementor-widget-text-editor"><div class="elementor-widget-container"><p>For questions about Slopes to Hope, please <a href="/contact-us/">contact us</a>.</p></div></div></div></div></div>';
  page.append(section);
}

export function sanitizeGiveWpContent(document, pathname) {
  if (pathname !== '/donors/') return;
  for (const link of document.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href');
    if (href && new URL(href, 'https://slopestohope.com').pathname === '/donations/slopes-to-hope') {
      link.setAttribute('href', 'https://givebutter.com/slopes-to-hope');
    }
  }
}
