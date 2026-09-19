import {readFileSync} from 'node:fs';

const galleryDescriptions=JSON.parse(readFileSync(new URL('../migration/gallery-descriptions.json',import.meta.url),'utf8'));

// Static adaptations also run during a future release-policy regeneration.
export function applyAccessibility(document){
  document.querySelectorAll('[id=""]').forEach(element=>element.removeAttribute('id'));
  const mobile=document.querySelector('.buddyx-mobile-menu ul.menu');
  if(mobile){
    mobile.id='primary-menu-mobile';
    document.querySelector('#menu-toggle')?.setAttribute('aria-controls',mobile.id);
  }
  for(const link of document.querySelectorAll('a[data-elementor-open-lightbox="yes"]')){
    const description=galleryDescriptions[link.getAttribute('href')];
    if(!description)continue;
    link.querySelector('img')?.setAttribute('alt',description);
    link.setAttribute('aria-label',`Open photo: ${description}`);
    link.setAttribute('data-elementor-lightbox-description',description);
  }
}
