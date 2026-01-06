
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

async function main() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**'] });

    for (const file of files) {
        const filePath = path.resolve(process.cwd(), file);
        // console.log(`Processing ${file}...`);

        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;

        let modified = false;

        // 1. Remove 'elementor-invisible' class
        const invisibleElements = doc.querySelectorAll('.elementor-invisible');
        invisibleElements.forEach(el => {
            el.classList.remove('elementor-invisible');

            // Also reset inline styles that might hide it
            if (el.style.opacity === '0') el.style.opacity = '';
            if (el.style.visibility === 'hidden') el.style.visibility = '';
            if (el.style.display === 'none') el.style.display = '';

            modified = true;
        });

        // 2. Ensuring all images are visible
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            if (img.style.opacity === '0') {
                img.style.opacity = '1';
                modified = true;
            }
            if (img.style.visibility === 'hidden') {
                img.style.visibility = 'visible';
                modified = true;
            }
        });

        // 3. Optional: Inject CSS to forcibly override elementor-invisible if it persists via other JS
        const cssFix = `
        <style>
        .elementor-invisible { visibility: visible !important; opacity: 1 !important; }
        </style>
        `;
        if (!doc.head.textContent.includes('.elementor-invisible { visibility: visible')) {
            doc.head.insertAdjacentHTML('beforeend', cssFix);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`  -> Fixed visibility in ${file}`);
        }
    }
}

main();
