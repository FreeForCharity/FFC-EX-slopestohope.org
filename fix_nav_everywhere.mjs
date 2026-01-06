
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

// CSS to inject: Hides the pseudo-element icon on the list item
const navFixCSS = `
<style>
    /* Clean up 'About Us' dropdown icons */
    .nav--toggle-sub li.menu-item-has-children:after {
        content: none !important;
    }
    .nav--toggle-sub .dropdown {
        display: none !important;
    }
    /* Ensure sub-menu still appears on hover if it relied on JS, 
       but usually these themes are CSS :hover based. 
       Let's ensure the parent LI has relative positioning just in case. */
    .main-navigation ul li.menu-item-has-children {
        position: relative;
    }
</style>
`;

async function main() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**'] });

    for (const file of files) {
        const filePath = path.resolve(process.cwd(), file);
        console.log(`Processing ${file}...`);

        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;

        let modified = false;

        // 1. Remove the 'span.dropdown' elements (The large V)
        // Targeting specific About Us item or all dropdown toggles?
        // User said "About Us", but consistency is good. 
        // Let's target the specific one first to be safe, or all .dropdown inside nav.
        const dropdownSpans = doc.querySelectorAll('.main-navigation .dropdown');
        dropdownSpans.forEach(span => {
            span.remove();
            modified = true;
        });

        // 2. Inject the CSS fix
        // Check if we already added it to avoid duplicates
        if (!doc.head.textContent.includes('Clean up \'About Us\' dropdown icons')) {
            doc.head.insertAdjacentHTML('beforeend', navFixCSS);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`  -> Fixed.`);
        }
    }
}

main();
