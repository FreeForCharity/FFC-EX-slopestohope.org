
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const filePath = path.resolve(process.cwd(), 'index.html');
const content = fs.readFileSync(filePath, 'utf8');
const dom = new JSDOM(content);
const doc = dom.window.document;

// Add Critical CSS to force slider visibility and static image
const style = doc.createElement('style');
style.textContent = `
    /* Force the container to be visible and have a background */
    .elementor-element-5a53669d {
        opacity: 1 !important;
        background-color: transparent !important;
        background-image: url('wp-content/uploads/2025/05/Screenshot-2025-05-27-173110-1-1.jpg') !important;
        background-size: cover !important;
        background-position: center center !important;
        background-repeat: no-repeat !important;
    }
    
    /* Hide the broken JS slider elements so they don't overlay the static bg */
    .elementor-element-5a53669d .elementor-background-slideshow {
        display: none !important;
    }
`;
doc.head.appendChild(style);

fs.writeFileSync(filePath, dom.serialize());
console.log('Injected static background CSS override into index.html');
