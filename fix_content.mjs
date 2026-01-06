
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

const SITE_URL = 'https://slopestohope.com';
const ROOT_DIR = process.cwd();

async function processHtmlFiles() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**', 'scraper/**'] });
    const missingAssets = new Set();

    for (const file of files) {
        const filePath = path.resolve(ROOT_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        let modified = false;

        // Hydrate lazy loaded images
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            const dataSrcset = img.getAttribute('data-srcset');

            if (dataSrc) {
                img.setAttribute('src', dataSrc);
                img.removeAttribute('data-src');
                modified = true;
                checkAsset(dataSrc, file, missingAssets);
            } else if (img.src && img.src.includes(SITE_URL)) {
                checkAsset(img.src, file, missingAssets);
            }

            if (dataSrcset) {
                img.setAttribute('srcset', dataSrcset);
                img.removeAttribute('data-srcset');
                modified = true;
                // checking srcset assets is complex parsing, skimming for now
            }

            // Remove lazy load classes if present
            if (img.classList.contains('lazyload')) {
                img.classList.remove('lazyload');
                modified = true;
            }
        });

        // Rewrite links to relative
        const relevantTags = ['img', 'script', 'link', 'a'];
        relevantTags.forEach(tagName => {
            const elements = doc.querySelectorAll(tagName);
            elements.forEach(el => {
                const attrs = ['src', 'href', 'srcset'];
                attrs.forEach(attr => {
                    const val = el.getAttribute(attr);
                    if (val && val.includes(SITE_URL)) {
                        const relativePath = makeRelative(val, file);
                        el.setAttribute(attr, relativePath);
                        modified = true;
                    }
                });
            });
        });


        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`Updated ${file}`);
        }
    }

    // Output missing assets
    console.log('\n--- Missing Assets ---');
    if (missingAssets.size > 0) {
        console.log(JSON.stringify(Array.from(missingAssets), null, 2));
        fs.writeFileSync('missing_assets.json', JSON.stringify(Array.from(missingAssets), null, 2));
    } else {
        console.log('No missing assets detected (from simple scan).');
    }
}

function checkAsset(url, sourceFile, missingSet) {
    if (!url.includes(SITE_URL)) return; // Only verify absolute links we are about to rewrite

    // Convert URL to local path
    const urlObj = new URL(url);
    const relativePath = urlObj.pathname; // /wp-content/...
    // Remove leading slash to make it relative to root
    let localPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    localPath = decodeURIComponent(localPath);

    const absoluteLocalPath = path.resolve(ROOT_DIR, localPath);

    if (!fs.existsSync(absoluteLocalPath)) {
        // We need this file!
        missingSet.add(relativePath); // Store web path for downloading
    }
}

function makeRelative(fullUrl, sourceFile) {
    try {
        if (!fullUrl.includes(SITE_URL)) return fullUrl;

        const urlObj = new URL(fullUrl);
        const targetPath = urlObj.pathname;

        // Calculate relative path from sourceFile to targetPath
        // sourceFile is like "staff/index.html" (relative to root)
        // targetPath is like "/wp-content/uploads/img.jpg"

        const sourceDir = path.dirname(sourceFile);
        let relative = path.relative(sourceDir, targetPath.startsWith('/') ? targetPath.substring(1) : targetPath);

        // Ensure standard separators
        relative = relative.split(path.sep).join('/');

        // Add query parameters back if they existed (e.g. version cache busting)
        if (urlObj.search) {
            relative += urlObj.search;
        }

        return relative;
    } catch (e) {
        return fullUrl;
    }
}

processHtmlFiles();
