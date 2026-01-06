
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

        const links = doc.querySelectorAll('a');
        links.forEach(a => {
            if (a.href && a.href.includes('coloradogives.org')) {
                if (a.getAttribute('target') !== '_blank') {
                    a.setAttribute('target', '_blank');
                    // Security best practice for usage of target="_blank"
                    a.setAttribute('rel', 'noopener noreferrer');
                    modified = true;
                }
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`  -> Fixed Donate link in ${file}`);
        }
    }
}

main();
