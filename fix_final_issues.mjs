
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// Part 1: Fix Map in index.html
function fixMap() {
    const filePath = path.resolve(process.cwd(), 'index.html');
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;
    let modified = false;

    const iframe = doc.querySelector('iframe[src="about:blank"]');
    if (iframe) {
        const dataSrc = iframe.getAttribute('data-litespeed-src') || iframe.getAttribute('data-src');
        if (dataSrc) {
            console.log(`Restoring map src: ${dataSrc}`);
            iframe.setAttribute('src', dataSrc);
            iframe.removeAttribute('data-lazyloaded');
            iframe.removeAttribute('data-litespeed-src');
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, dom.serialize());
        console.log('  -> Fixed Map in index.html');
    } else {
        console.log('  -> Map already fixed or not found.');
    }
}

// Part 2: Fix Image in our-story/index.html
function fixOurStoryImage() {
    const htmlPath = path.resolve(process.cwd(), 'our-story/index.html');
    const content = fs.readFileSync(htmlPath, 'utf8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;
    let modified = false;

    // The problematic image
    // Original src: ../wp-content/uploads/2023/03/20200831_095516-1-scaled.jpg
    // We will copy this file to our-story/story-image.jpg and just link it directly.
    const originalRelPath = 'wp-content/uploads/2023/03/20200831_095516-1-scaled.jpg';
    const originalAbsPath = path.resolve(process.cwd(), originalRelPath);

    const newFileName = 'story-image.jpg';
    const newAbsPath = path.resolve(process.cwd(), 'our-story', newFileName);

    if (fs.existsSync(originalAbsPath)) {
        // Copy file
        fs.copyFileSync(originalAbsPath, newAbsPath);
        console.log(`Copied image to: ${newAbsPath}`);

        // Update HTML
        const img = doc.querySelector(`img[src*="20200831_095516"]`);
        if (img) {
            console.log('Updating image src to local copy');
            img.setAttribute('src', newFileName); // Simple relative path since it's in same dir
            img.removeAttribute('srcset');
            img.removeAttribute('sizes');
            img.removeAttribute('data-sizes');
            modified = true;
        }
    } else {
        console.error(`Could not find original image at ${originalAbsPath}`);
    }

    if (modified) {
        fs.writeFileSync(htmlPath, dom.serialize());
        console.log('  -> Fixed Our Story image path');
    }
}

fixMap();
fixOurStoryImage();
