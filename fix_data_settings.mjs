
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

const ROOT_DIR = process.cwd();
const TARGET_DOMAIN = 'https://slopestohope.com';
const TARGET_DOMAIN_REGEX = /https?:\/\/(www\.)?slopestohope\.com/g;
const ESCAPED_TARGET_DOMAIN_REGEX = /https?:\\\/\\\/(www\.)?slopestohope\.com/g; // For JSON strings

async function fixDataSettings() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**', 'scraper/**'] });

    for (const file of files) {
        const filePath = path.resolve(ROOT_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        let modified = false;

        const elements = doc.querySelectorAll('*');
        elements.forEach(el => {
            ['data-settings', 'data-widget_settings'].forEach(attr => {
                if (el.hasAttribute(attr)) {
                    let val = el.getAttribute(attr);
                    if (val && (val.includes('slopestohope.com'))) {
                        // Attempt to parse JSON
                        try {
                            let json = JSON.parse(val);
                            let jsonStr = JSON.stringify(json);

                            // Simple string replace on the JSON string is safer and easier than traversing
                            // We need to handle the path relative to the current file

                            // Calculate relative prefix (e.g. "../" or "")
                            // But wait, the format in JSON usually needs valid URL. 
                            // If we replace "https://slopestohope.com/wp-content/..." with "wp-content/..."
                            // it might work if the base is set, or we can use relative paths.

                            const relativePrefix = getRelativePrefix(file);

                            // Replace absolute URLs with relative ones in the JSON string
                            // The strings in JSON might be escaped like "https:\/\/slopestohope.com"

                            // We will replace 'https://slopestohope.com/' with relativePrefix
                            // and 'https:\/\/slopestohope.com\/' with relativePrefix (escaped if needed?)
                            // JSON.stringify will escape slashes usually.

                            // Let's traverse to be safe and accurate
                            json = traverseAndFix(json, relativePrefix);

                            el.setAttribute(attr, JSON.stringify(json));
                            modified = true;
                        } catch (e) {
                            console.warn(`Failed to parse JSON in ${attr} for element in ${file}`, e);
                        }
                    }
                }
            });

            // Also fix the malformed srcset seen in index.html line 552
            // srcset="... %20https:/slopestohope.com/..."
            if (el.hasAttribute('srcset')) {
                let srcset = el.getAttribute('srcset');
                if (srcset.includes('slopestohope.com')) {
                    const relativePrefix = getRelativePrefix(file);
                    // Replace fully qualified domain variants with relative prefix/path
                    // Handle https:/slopestohope.com (single slash typo)
                    // Handle https://slopestohope.com

                    // We replace the domain + / with just the relative prefix (which might be empty string or ../)
                    // Example: https://slopestohope.com/wp-content -> wp-content (if root)

                    let newSrcset = srcset.replace(/https?:\/\/(www\.)?slopestohope\.com\//g, relativePrefix);
                    newSrcset = newSrcset.replace(/https?:\/slopestohope\.com\//g, relativePrefix); // Typo variant

                    if (newSrcset !== srcset) {
                        el.setAttribute('srcset', newSrcset);
                        modified = true;
                    }
                }
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`Fixed data-settings/srcset in ${file}`);
        }
    }
}

function getRelativePrefix(sourceFile) {
    const depth = sourceFile.split('/').length - 1; // "index.html" -> 0, "foo/index.html" -> 1
    // Actually sourceFile from glob matches relative to CWD, e.g. "index.html" or "subdir/file.html"
    // On Windows glob might return forward slashes.

    // If file is in root, prefix is "./" or just ""? 
    // Usually "wp-content/..." works from root.
    // If deep, "../../wp-content/...".

    // Let's use path.relative
    const sourceDir = path.dirname(sourceFile);
    let relative = path.relative(sourceDir, '.'); // path to root
    if (relative === '') return ''; // Same dir
    return relative + '/';
}

function traverseAndFix(obj, prefix) {
    if (typeof obj === 'string') {
        if (obj.match(TARGET_DOMAIN_REGEX)) {
            // Replace https://slopestohope.com/ with prefix
            return obj.replace(TARGET_DOMAIN_REGEX, '').replace(/^\//, prefix);
            // Note: recursive replace might be needed if multiple matches?
            // The regex is global, but replace only does one if not loop?
            // Actually regex replace with string replaces all matches? No, only if global flag.
            // We used global flag.

            // Wait, logic check:
            // obj: "https://slopestohope.com/wp-content/img.jpg"
            // replace: "/wp-content/img.jpg"
            // replace start commands: "prefix/wp-content/img.jpg" -> "wp-content/img.jpg" or "../wp-content/..."

            let newStr = obj.replace(TARGET_DOMAIN_REGEX, '');
            if (newStr.startsWith('/')) {
                return prefix + newStr.substring(1);
            }
            return prefix + newStr;
        }
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(item => traverseAndFix(item, prefix));
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            obj[key] = traverseAndFix(obj[key], prefix);
        }
        return obj;
    }
    return obj;
}

fixDataSettings();
