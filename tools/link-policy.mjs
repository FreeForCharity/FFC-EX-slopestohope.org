// Official equivalent destinations verified on 2026-09-19.
// Keep captured inventory URLs unchanged so the original evidence is preserved.
export const LINK_REPLACEMENTS=new Map([
  ['https://www.hyatt.com/hyatt-vacation-club/en-US/bresh-the-residences-at-main-street-station','https://www.hyattvacationclub.com/resorts/main-street-station'],
  ['https://www.hyatt.com/hyatt-vacation-club/en-US/bresr-hyatt-vacation-club-at-the-ranahan','https://www.hyattvacationclub.com/resorts/the-ranahan'],
  ['https://www.changethetrend.com/','https://changethetrend.org/'],
]);
export function applyLinkRepairs(document){
  for(const link of document.querySelectorAll('a[href]')){
    const replacement=LINK_REPLACEMENTS.get(link.getAttribute('href'));
    if(replacement)link.setAttribute('href',replacement);
  }
}
