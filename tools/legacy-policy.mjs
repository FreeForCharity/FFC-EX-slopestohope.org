export const EXCLUDED_LEGACY_ROUTES = new Set(['/tag/community-across-america/']);

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
