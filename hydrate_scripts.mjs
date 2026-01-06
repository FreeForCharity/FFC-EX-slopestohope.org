
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

const ROOT_DIR = process.cwd();

async function hydrateScripts() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**', 'scraper/**'] });

    for (const file of files) {
        const filePath = path.resolve(ROOT_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        let modified = false;

        const scripts = doc.querySelectorAll('script[type="litespeed/javascript"]');
        if (scripts.length > 0) {
            console.log(`Found ${scripts.length} LiteSpeed scripts in ${file}`);
            scripts.forEach(script => {
                script.setAttribute('type', 'text/javascript');

                // Also check for data-src in scripts if present (LiteSpeed sometimes does this)
                if (script.hasAttribute('data-src')) {
                    script.setAttribute('src', script.getAttribute('data-src'));
                    script.removeAttribute('data-src');
                }

                modified = true;
            });
        }

        // Also look for interactions that might need hydration
        // Remove 'lazyload' classes?
        // Let's stick to scripts first.

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`Hydrated scripts in ${file}`);
        }
    }
}

hydrateScripts();
