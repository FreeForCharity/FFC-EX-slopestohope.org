// Official equivalent destinations verified through 2026-10-05.
// Keep captured inventory URLs unchanged so the original evidence is preserved.
export const LINK_REPLACEMENTS=new Map([
  ['https://www.hyatt.com/hyatt-vacation-club/en-US/bresh-the-residences-at-main-street-station','https://www.hyattvacationclub.com/resorts/main-street-station'],
  ['https://www.hyatt.com/hyatt-vacation-club/en-US/bresr-hyatt-vacation-club-at-the-ranahan','https://www.hyattvacationclub.com/resorts/the-ranahan'],
  ['https://www.changethetrend.com/','https://www.facebook.com/CTTtricities/'],
  ['https://changethetrend.org/','https://www.facebook.com/CTTtricities/'],
  ['http://summithabitat.org/restore/','https://summithabitat.org/shop-the-restore/'],
  ['https://www.assistanceleague.org/denver/','https://chapters.assistanceleague.org/chapter/denver/about-us/'],
  ['http://intermountaineds.salvationarmy.org/','https://www.salvationarmyusa.org/co/denver/'],
  ['http://www.comministry-denver.org/','https://comministry-denver.org/'],
  ['http://www.blueskybreckenridge.com/','https://blueskybreckenridge.com/'],
  ['http://hellyhansen.com/','https://www.hellyhansen.com/en_us'],
  ['http://www.springsrescuemission.org/','https://springsrescuemission.org/'],
  ['http://coloradosprings.salvationarmy.org/','https://www.salvationarmyusa.org/co/colorado-springs/'],
  ['mailto:drew@slopestohope.com','mailto:drew@slopestohope.org'],
]);
export function applyLinkRepairs(document){
  for(const link of document.querySelectorAll('a[href]')){
    const original=link.getAttribute('href');
    const replacement=LINK_REPLACEMENTS.get(original);
    if(!replacement)continue;
    link.setAttribute('href',replacement);
    if(original==='mailto:drew@slopestohope.com'&&link.textContent.trim()==='drew@slopestohope.com')link.textContent='drew@slopestohope.org';
  }
}
