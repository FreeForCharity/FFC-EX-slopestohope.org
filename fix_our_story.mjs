
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const filePath = path.resolve(process.cwd(), 'our-story/index.html');
console.log(`Processing ${filePath}...`);

const content = fs.readFileSync(filePath, 'utf8');
const dom = new JSDOM(content);
const doc = dom.window.document;
let modified = false;

// 1. Remove data-settings (kills Elementor JS for sliders/animations)
const elementsWithDataSettings = doc.querySelectorAll('[data-settings]');
elementsWithDataSettings.forEach(el => {
    // console.log('Removing data-settings from:', el.tagName, el.className);
    el.removeAttribute('data-settings');
    modified = true;
});

// 2. Fix Images (Make them static)
const images = doc.querySelectorAll('img');
images.forEach(img => {
    // Remove complex attributes that might break or invoke JS
    if (img.hasAttribute('srcset')) {
        img.removeAttribute('srcset');
        modified = true;
    }
    if (img.hasAttribute('data-lazyloaded')) {
        img.removeAttribute('data-lazyloaded');
        modified = true;
    }
    if (img.hasAttribute('loading')) {
        img.removeAttribute('loading'); // loading="lazy" can be an issue if scripts interfere
        modified = true;
    }

    // Ensure src is valid
    const src = img.getAttribute('src');
    if (src === 'about:blank' || !src) {
        // Try to recover from data-src or litespeed-src
        const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-litespeed-src');
        if (dataSrc) {
            img.setAttribute('src', dataSrc);
            console.log(`Recovered src for image: ${dataSrc}`);
            modified = true;
        }
    }
});

// 3. Remove "swiper" classes just in case they trigger global JS
const swipers = doc.querySelectorAll('.swiper-container, .swiper-wrapper, .swiper-slide');
swipers.forEach(el => {
    el.classList.remove('swiper-container', 'swiper-wrapper', 'swiper-slide');
    // Maybe add a simple class to ensure visibility?
    el.style.display = 'block';
    el.style.opacity = '1';
    el.style.transform = 'none';
    modified = true;
});

if (modified) {
    fs.writeFileSync(filePath, dom.serialize());
    console.log(`  -> Our Story page updated.`);
} else {
    console.log('  -> No changes needed.');
}
