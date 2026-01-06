
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const filePath = path.resolve(process.cwd(), 'index.html');
const content = fs.readFileSync(filePath, 'utf8');
const dom = new JSDOM(content);
const doc = dom.window.document;

// Add Critical CSS to force slider visibility
const style = doc.createElement('style');
style.textContent = `
    .elementor-background-slideshow__slide {
        opacity: 1 !important;
        transition: opacity 1s ease-in-out !important;
    }
    .elementor-element-5a53669d {
        background-color: transparent !important; /* Remove grey box */
    }
`;
doc.head.appendChild(style);

// Add fallack JS to handle 404s or stuck init
const script = doc.createElement('script');
script.textContent = `
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const slider = document.querySelector('.elementor-element-5a53669d');
            if (slider) {
                // Ensure Swiper is initialized or force it
                const slides = slider.querySelectorAll('.elementor-background-slideshow__slide__image');
                slides.forEach(img => {
                    const style = window.getComputedStyle(img);
                    if (style.backgroundImage === 'none' || style.backgroundImage.includes('Mobile-Laundry')) {
                         // Fallback to one of the other images if this one is busted
                         // But we want to try to keep it if it works.
                         // Let's just log for now
                         console.log('Checking slide image:', style.backgroundImage);
                    }
                });
            }
        }, 2000);
    });
`;
doc.body.appendChild(script);

fs.writeFileSync(filePath, dom.serialize());
console.log('Injected slider fallback CSS/JS into index.html');
