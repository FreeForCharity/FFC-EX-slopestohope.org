
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const filePath = path.resolve(process.cwd(), 'index.html');
const content = fs.readFileSync(filePath, 'utf8');
const dom = new JSDOM(content);
const doc = dom.window.document;
let modified = false;

// 1. Fix Broken Images
// Target specific images we know are problematic by their filename
const imageTargets = [
    '20240403_095651',
    '20240403_131227',
    'CBM.jpg', // partial match
    'Screenshot-2025-05-27-173110-1-1'
];

const images = doc.querySelectorAll('img');
images.forEach(img => {
    const src = img.getAttribute('src');
    if (!src) return;

    // Check if this image is one of our targets
    const isTarget = imageTargets.some(t => src.includes(t));
    if (isTarget) {
        console.log(`Fixing image: ${src}`);
        
        // Remove problematic attributes that rely on JS or missing WebP
        img.removeAttribute('srcset');
        img.removeAttribute('data-lazyloaded');
        img.removeAttribute('data-sizes');
        img.removeAttribute('loading'); // Let it load eagerly to be safe
        img.removeAttribute('decoding');

        // Ensure src is valid (it seems valid in HTML, just hidden by the other attrs)
        // If src was 'about:blank' due to lazy load, we'd need to fix it, but previous view showed src was populated.
        // Double check if src is a placeholder
        if (src.includes('data:image') || src === 'about:blank') {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
                img.setAttribute('src', dataSrc);
            }
        }
        modified = true;
    }
});

// 2. Fix Progress Bar / Thermometer
// The user sees it stuck at 0. We will inject a script to force it to the target value.
const progressBarFixScript = `
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Fix ElementsKit Progress Bar (Horizontal)
    const progressBars = document.querySelectorAll('.elementskit-progressbar .single-skill-bar');
    progressBars.forEach(bar => {
        const percentageEl = bar.querySelector('.number-percentage');
        const trackEl = bar.querySelector('.skill-track');
        
        if (percentageEl) {
            const target = percentageEl.getAttribute('data-value');
            if (target) {
                // Set text
                percentageEl.innerText = target;
                
                // Set width
                if (trackEl) {
                    trackEl.style.width = target + '%';
                    // Ensure the 'track-icon' or end marker follows logic if needed, 
                    // usually width on the track is enough.
                }
            }
        }
    });

    // Fix EAEL Progress Bar (Circular) - just in case
    const circBars = document.querySelectorAll('.eael-progressbar-circle');
    circBars.forEach(bar => {
         const countEl = bar.querySelector('.eael-progressbar-count');
         const layout = bar.getAttribute('data-layout');
         // This is more complex canvas stuff usually, but let's at least set the text
         if (countEl) {
            // Find target from json data or attribute?
            const count = bar.getAttribute('data-count');
            if (count) countEl.innerText = count;
         }
         // Unhide if hidden
         const wrap = bar.querySelector('.eael-progressbar-count-wrap');
         if (wrap) wrap.style.display = 'block';
    });
});
</script>
`;

// Check if we already added it
if (!doc.body.innerHTML.includes('Fix ElementsKit Progress Bar')) {
    doc.body.insertAdjacentHTML('beforeend', progressBarFixScript);
    console.log('Injected Progress Bar Fix Script');
    modified = true;
}

if (modified) {
    fs.writeFileSync(filePath, dom.serialize());
    console.log('Successfully applied fixes to index.html');
} else {
    console.log('No changes needed.');
}
