
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

async function main() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**'] });

    for (const file of files) {
        const filePath = path.resolve(process.cwd(), file);
        console.log(`Processing ${file}...`);

        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;

        let modified = false;

        // Find the 'About Us' list item (it has the class menu-item-has-children and contains 'About Us')
        // We look for the specific ID seen in index.html to be precise, or search by text if ID varies.
        // ID seen: menu-item-13436
        const aboutUsItems = doc.querySelectorAll('.main-navigation li.menu-item-has-children');

        aboutUsItems.forEach(li => {
            const anchor = li.querySelector('a');
            if (anchor && anchor.textContent.includes('About Us')) {
                // Found the About Us dropdown container
                const subMenu = li.querySelector('.sub-menu');
                if (subMenu) {
                    const subItems = subMenu.querySelectorAll('li');

                    // Logic: Insert sub-items before the About Us LI, then remove the About Us LI
                    // Wait, we want them in place of it.

                    // Create an array to hold the new elements to insert
                    const newItems = [];

                    subItems.forEach(subLi => {
                        // Clone the sub-item
                        const newItem = subLi.cloneNode(true);

                        // Clean up the text (remove the "– " prefix)
                        const subAnchor = newItem.querySelector('a');
                        if (subAnchor) {
                            subAnchor.textContent = subAnchor.textContent.replace(/^–\s*/, '');

                            // Ensure styling matches top-level items if there are specific classes
                            // The original top-level items have classes like 'menu-item menu-item-type-...'
                            // The sub-items also have 'menu-item', but maybe we need to strip 'sub-menu-item' if it exists?
                            // Looking at source, they seem compatible.
                        }

                        newItems.push(newItem);
                    });

                    // Insert new items before the 'About Us' li
                    newItems.forEach(item => {
                        li.parentNode.insertBefore(item, li);
                    });

                    // Remove the old 'About Us' li
                    li.remove();
                    modified = true;
                }
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`  -> Flattened.`);
        }
    }
}

main();
