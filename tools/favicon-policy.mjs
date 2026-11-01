// Shared favicon policy for every published HTML page, including new pages.
export const FAVICON_PATHS=Object.freeze({
  ico:'/favicon.ico',
  png192:'/wp-content/uploads/2025/06/cropped-Drew-1-192x192.png',
  apple:'/wp-content/uploads/2025/06/cropped-Drew-1-180x180.png',
});
export function applyFaviconLinks(html){
  if(typeof html!=='string'||!/<head\b[^>]*>/i.test(html))throw new Error('Published HTML is missing a head element');
  const withoutOld=html.replace(/<link\b(?=[^>]*\brel=["'](?:shortcut icon|icon|apple-touch-icon)["'])[^>]*>/gi,'');
  const links=[
    `<link rel="icon" href="${FAVICON_PATHS.ico}" sizes="any">`,
    `<link rel="icon" type="image/png" sizes="192x192" href="${FAVICON_PATHS.png192}">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="${FAVICON_PATHS.apple}">`,
  ].join('');
  return withoutOld.replace(/<head\b[^>]*>/i,match=>match+links);
}
