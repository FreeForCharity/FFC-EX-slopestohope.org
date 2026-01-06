
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

const ROOT_DIR = process.cwd();

async function fixPaths() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**', 'scraper/**'] });

    for (const file of files) {
        const filePath = path.resolve(ROOT_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        let modified = false;

        const attributes = ['src', 'href', 'data-src', 'data-href', 'action', 'content'];
        // 'content' for meta tags usually not needing rewrite, but check og:image?
        // Let's stick to standard attributes for now.

        const elements = doc.querySelectorAll('*');
        elements.forEach(el => {
            // 1. Check Attributes
            attributes.forEach(attr => {
                if (el.hasAttribute(attr)) {
                    const val = el.getAttribute(attr);
                    if (val && val.startsWith('/') && !val.startsWith('//')) {
                        const rel = makeRelative(val, file);
                        el.setAttribute(attr, rel);
                        modified = true;
                    }
                }
            });

            // 2. Check srcset
            if (el.hasAttribute('srcset')) {
                const val = el.getAttribute('srcset');
                // srcset="path/to/img 1x, path/to/img 2x"
                const newVal = val.split(',').map(part => {
                    const trimmed = part.trim();
                    const spaceIdx = trimmed.lastIndexOf(' ');
                    if (spaceIdx === -1) {
                        if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
                            return makeRelative(trimmed, file);
                        }
                        return trimmed;
                    }
                    const url = trimmed.substring(0, spaceIdx);
                    const desc = trimmed.substring(spaceIdx);
                    if (url.startsWith('/') && !url.startsWith('//')) {
                        return makeRelative(url, file) + desc;
                    }
                    return trimmed;
                }).join(', ');

                if (newVal !== val) {
                    el.setAttribute('srcset', newVal);
                    modified = true;
                }
            }

            // 3. Check Style (inline)
            const style = el.getAttribute('style');
            if (style && style.includes('url(')) {
                const newStyle = style.replace(/url\(['"]?(\/[^)'"]+)['"]?\)/g, (match, url) => {
                    // url is like "/wp-content/..."
                    if (url.startsWith('//')) return match;
                    const rel = makeRelative(url, file);
                    return `url('${rel}')`;
                });
                if (newStyle !== style) {
                    el.setAttribute('style', newStyle);
                    modified = true;
                }
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`Fixed paths in ${file}`);
        }
    }
}

function makeRelative(rootPath, sourceFile) {
    // rootPath is "/wp-content/foo"
    // sourceFile is "staff/index.html"
    // target is ROOT_DIR + rootPath

    // We want path relative from path.dirname(sourceFile) to rootPath (treated as relative to root)

    const sourceDir = path.dirname(sourceFile);
    // target path relative to ROOT is just rootPath without leading slash
    const targetRelative = rootPath.substring(1);

    let relative = path.relative(sourceDir, targetRelative);
    relative = relative.split(path.sep).join('/');

    return relative;
}

fixPaths();
