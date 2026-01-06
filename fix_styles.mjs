
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

const SITE_URL = 'https://slopestohope.com';
const ROOT_DIR = process.cwd();

async function fixContent() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**', 'scraper/**'] });
    const missingAssets = new Set();

    for (const file of files) {
        const filePath = path.resolve(ROOT_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        let modified = false;

        // 1. Fix Inline Style Background Images
        // Select ALL elements, as any could have a background image
        const allElements = doc.querySelectorAll('*');
        allElements.forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('url(') && style.includes(SITE_URL)) {
                // Regex to capture the URL inside url('...') or url("...") or url(...)
                const newStyle = style.replace(/url\(['"]?(https:\/\/slopestohope\.com[^)'"]+)['"]?\)/g, (match, url) => {
                    checkAsset(url, file, missingAssets);
                    const relative = makeRelative(url, file);
                    return `url('${relative}')`;
                });

                if (newStyle !== style) {
                    el.setAttribute('style', newStyle);
                    modified = true;
                }
            }
        });

        // 2. Fix Elementor/Data Attributes
        // Elementor often stores settings in data-settings or data-widget_settings
        // This is JSON encoded string, we need to try and replace it there too
        const elementsWithData = doc.querySelectorAll('[data-settings], [data-widget_settings]');
        elementsWithData.forEach(el => {
            ['data-settings', 'data-widget_settings'].forEach(attr => {
                let val = el.getAttribute(attr);
                if (val && val.includes(SITE_URL)) {
                    // It's a simple string replace for now, parsing JSON might be fragile if mixed with other stuff
                    // But we must be careful about escaping.
                    // Let's just do a global replace of the domain, assuming the structure mirrors local
                    // However, we need the RELATIVE path, which is hard in a JSON string that might be used anywhere.
                    // Elementor usually wants absolute URLs or root-relative. 
                    // Since we are on GH pages, root-relative starts with /FFC-EX-slopestohope.org/
                    // Let's try to make it root-relative with the repo prefix if possible, or just relative.
                    // For safety, let's just make it relative to the PROJECT ROOT for now, but GH pages needs module name.
                    // Actually, if we just replace `https://slopestohope.com` with `.` (empty) it implies root? No.

                    // STRATEGY: Replace https://slopestohope.com/wp-content... with ./wp-content... adjusted for file depth?
                    // No, JSON strings usually need absolute or root paths.
                    // Let's replace with `.` (current dir) relative paths won't work well in JSON passed to JS.
                    // Let's try to leave it alone? No, it breaks.
                    // Let's try to replacing it with a relative path logic if we can detect it's a URL.

                    // Simple regex replace for known assets in JSON
                    const newVal = val.replace(/https:\/\/slopestohope\.com\/([^"\\]+)/g, (match, pathPart) => {
                        // pathPart is "wp-content/uploads/..."
                        // We need to calculate the relative path from THIS html file to that target.
                        const fullUrl = `${SITE_URL}/${pathPart}`;
                        checkAsset(fullUrl, file, missingAssets);
                        const rel = makeRelative(fullUrl, file);
                        return rel;
                    });

                    if (newVal !== val) {
                        el.setAttribute(attr, newVal);
                        modified = true;
                    }
                }
            });
        });

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`Fixed styles in ${file}`);
        }
    }

    // Output missing assets
    if (missingAssets.size > 0) {
        console.log('Found new missing assets from inline styles:');
        console.log(JSON.stringify(Array.from(missingAssets), null, 2));
        fs.writeFileSync('missing_assets_2.json', JSON.stringify(Array.from(missingAssets), null, 2));
    }
}

function checkAsset(url, sourceFile, missingSet) {
    if (!url.includes(SITE_URL)) return;
    try {
        const urlObj = new URL(url);
        const relativePath = urlObj.pathname;
        let localPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        localPath = decodeURIComponent(localPath);
        const absoluteLocalPath = path.resolve(ROOT_DIR, localPath);
        if (!fs.existsSync(absoluteLocalPath)) {
            missingSet.add(relativePath);
        }
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

fixContent();
