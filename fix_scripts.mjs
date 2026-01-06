
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';
import https from 'https';

const SITE_URL = 'https://slopestohope.com';
const ROOT_DIR = process.cwd();

async function fixScripts() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**', 'scraper/**'] });
    const missingAssets = new Set();

    for (const file of files) {
        const filePath = path.resolve(ROOT_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        let modified = false;

        // Find LiteSpeed scripts
        const scripts = doc.querySelectorAll('script[type="litespeed/javascript"], script[data-src]');
        scripts.forEach(script => {
            // 1. Handle External Scripts (data-src)
            const dataSrc = script.getAttribute('data-src');
            if (dataSrc) {
                checkAsset(dataSrc, file, missingAssets);
                const relative = makeRelative(dataSrc, file);

                script.setAttribute('src', relative);
                script.removeAttribute('data-src');
                script.removeAttribute('type'); // Make it executable standard JS
                script.removeAttribute('data-no-optimize'); // Clean up
                modified = true;
            }
            // 2. Handle Inline Scripts (type="litespeed/javascript")
            else if (script.getAttribute('type') === 'litespeed/javascript') {
                script.removeAttribute('type'); // Enable execution
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`Fixed scripts in ${file}`);
        }
    }

    // Download missing scripts
    if (missingAssets.size > 0) {
        console.log(`Downloading ${missingAssets.size} scripts...`);
        for (const assetPath of missingAssets) {
            const url = `${SITE_URL}${assetPath}`;
            const localPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
            const fullLocalPath = path.resolve(ROOT_DIR, localPath);

            // Check if exists
            if (!fs.existsSync(fullLocalPath)) {
                await downloadFile(url, fullLocalPath);
                console.log(`Downloaded ${localPath}`);
            }
        }
    }
}

function checkAsset(url, sourceFile, missingSet) {
    if (!url.includes(SITE_URL)) return;
    try {
        const urlObj = new URL(url);
        const relativePath = urlObj.pathname;
        let localPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        localPath = decodeURIComponent(localPath);
        // missingSet stores the PATHNAME (e.g. /wp-content/...)
        missingSet.add(relativePath);
    } catch (e) { }
}

function makeRelative(fullUrl, sourceFile) {
    try {
        if (!fullUrl.includes(SITE_URL)) return fullUrl;

        const urlObj = new URL(fullUrl);
        const targetPath = urlObj.pathname;

        const sourceDir = path.dirname(sourceFile);
        let relative = path.relative(sourceDir, targetPath.startsWith('/') ? targetPath.substring(1) : targetPath);
        relative = relative.split(path.sep).join('/');

        if (urlObj.search) {
            relative += urlObj.search;
        }

        return relative;
    } catch (e) {
        return fullUrl;
    }
}

function downloadFile(url, dest) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(dest, () => { });
                // Don't reject, just log (soft fail)
                console.error(`Failed ${url}: ${response.statusCode}`);
                resolve();
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', err => {
            fs.unlink(dest, () => { });
            console.error(err);
            resolve();
        });
    });
}

fixScripts();
