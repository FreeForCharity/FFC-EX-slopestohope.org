// Official equivalent destinations verified on 2026-09-19 and 2026-09-20.
// Keep captured inventory URLs unchanged so the original evidence is preserved.
export const LINK_REPLACEMENTS=new Map([
  ['https://www.hyatt.com/hyatt-vacation-club/en-US/bresh-the-residences-at-main-street-station','https://www.hyattvacationclub.com/resorts/main-street-station'],
  ['https://www.hyatt.com/hyatt-vacation-club/en-US/bresr-hyatt-vacation-club-at-the-ranahan','https://www.hyattvacationclub.com/resorts/the-ranahan'],
  ['http://coloradosprings.salvationarmy.org/','https://www.salvationarmyusa.org/co/colorado-springs/yuma-street-corps/'],
  ['http://www.springsrescuemission.org/','https://springsrescuemission.org/'],
  ['http://summithabitat.org/restore/','https://summithabitat.org/'],
  ['https://www.changethetrend.com/','https://www.tricitieshomeless.com/about-the-work'],
  ['http://intermountaineds.salvationarmy.org/','https://intermountaineds.salvationarmy.org/'],
  ['http://www.comministry-denver.org/','https://comministry-denver.org/'],
  ['http://hellyhansen.com/','https://www.hellyhansen.com/en_us'],
  ['http://www.blueskybreckenridge.com/','https://blueskybreckenridge.com/'],
]);
export function applyLinkRepairs(document){
  for(const link of document.querySelectorAll('a[href]')){
    const replacement=LINK_REPLACEMENTS.get(link.getAttribute('href'));
    if(replacement)link.setAttribute('href',replacement);
  }
}
