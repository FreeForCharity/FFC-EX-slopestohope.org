
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

const CSS_FIX = `
<style>
/* Footer Centering Fixes */
.custom-footer {
    text-align: center;
}
.custom-footer .footer-col {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.custom-footer address p {
    justify-content: center;
}
.custom-footer p {
    margin-left: auto;
    margin-right: auto;
}
/* Ensure the list items are centered */
.custom-footer ul {
    text-align: center;
}
</style>
`;

async function main() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**'] });

    for (const file of files) {
        const filePath = path.resolve(process.cwd(), file);
        // console.log(`Processing ${file}...`);

        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        let modified = false;

        // Check if we already added this fix to avoid duplication
        if (!doc.head.innerHTML.includes('Footer Centering Fixes')) {
            doc.head.insertAdjacentHTML('beforeend', CSS_FIX);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`  -> Applied footer centering to ${file}`);
        }
    }
}

main();
