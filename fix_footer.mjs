
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

const CSS = `
<style>
/* Custom Footer Styles */
.custom-footer {
    background-color: #2c3e50;
    color: #ecf0f1;
    padding-top: 50px;
    margin-top: 0;
    font-family: 'Open Sans', Helvetica, Arial, sans-serif;
}
.custom-footer .footer-widgets {
    padding-bottom: 40px;
}
.custom-footer .footer-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 40px;
}
.custom-footer .footer-col {
    flex: 1;
    min-width: 250px;
}
.custom-footer h3 {
    color: #fff;
    font-size: 1.25rem;
    margin-bottom: 20px;
    border-bottom: 3px solid #ef5455;
    display: inline-block;
    padding-bottom: 5px;
    font-weight: 700;
}
.custom-footer p {
    color: #bdc3c7;
    line-height: 1.6;
}
.custom-footer ul {
    list-style: none;
    padding: 0;
    margin: 0;
}
.custom-footer ul li {
    margin-bottom: 10px;
}
.custom-footer ul li a {
    color: #bdc3c7;
    text-decoration: none;
    transition: all 0.3s ease;
    display: block;
}
.custom-footer ul li a:hover {
    color: #ef5455;
    padding-left: 8px;
}
.custom-footer address {
    font-style: normal;
    color: #bdc3c7;
}
.custom-footer address p {
    margin-bottom: 15px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
}
.custom-footer address i {
    color: #ef5455;
    margin-top: 5px;
}
.custom-footer address a {
    color: #bdc3c7;
    text-decoration: none;
    transition: color 0.3s;
}
.custom-footer address a:hover {
    color: #fff;
}
.custom-footer .site-info {
    background-color: #1a252f;
    padding: 25px 0;
    border-top: 1px solid rgba(255,255,255,0.05);
}
.custom-footer .site-info .container {
    display: flex;
    justify-content: center;
    color: #7f8c8d;
    font-size: 0.9rem;
}
/* Mobile Adjustments */
@media (max-width: 768px) {
    .custom-footer {
        padding-top: 30px;
    }
    .custom-footer .footer-row {
        flex-direction: column;
        gap: 30px;
    }
    .custom-footer .footer-col {
        min-width: 100%;
    }
}
</style>
`;

async function main() {
    const files = await glob('**/*.html', { ignore: ['node_modules/**'] });

    for (const file of files) {
        // Calculate relative path to root for links
        const dir = path.dirname(file);
        let relRoot = path.relative(dir, '.');
        if (relRoot === '') relRoot = '.';

        // Helper to prepend root
        const link = (p) => relRoot === '.' ? p : `${relRoot}/${p}`;

        const filePath = path.resolve(process.cwd(), file);
        console.log(`Processing ${file}...`);

        const content = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        let modified = false;

        // 1. Inject CSS if not present
        if (!doc.head.innerHTML.includes('Custom Footer Styles')) {
            doc.head.insertAdjacentHTML('beforeend', CSS);
            modified = true;
        }

        // 2. Replace Footer
        const oldFooter = doc.getElementById('colophon');
        if (oldFooter) {
            const newFooterHTML = `
    <footer id="colophon" class="site-footer custom-footer">
        <div class="footer-widgets">
            <div class="container">
                <div class="footer-row">
                    <!-- Column 1: Brand -->
                    <div class="footer-col brand-col">
                        <h3>Slopes to Hope</h3>
                        <p>Slopes to Hope diverts thousands of pounds of winter clothing from Colorado landfills by collecting items left behind at resorts and distributing them to those in need.</p>
                    </div>

                    <!-- Column 2: Quick Links -->
                    <div class="footer-col links-col">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><a href="${link('index.html')}">Home</a></li>
                            <li><a href="https://www.coloradogives.org/organization/Slopes-To-Hope">Donate</a></li>
                            <li><a href="${link('gallery/index.html')}">Gallery</a></li>
                            <li><a href="${link('our-story/index.html')}">Our Story</a></li>
                            <li><a href="${link('staff/index.html')}">Staff</a></li>
                            <li><a href="${link('contact-us/index.html')}">Contact</a></li>
                        </ul>
                    </div>

                    <!-- Column 3: Contact -->
                    <div class="footer-col contact-col">
                        <h3>Contact Us</h3>
                        <address>
                            <p><i class="fas fa-map-marker-alt"></i> <span>400 N. Park Ave #12B<br>Breckenridge, CO 80424</span></p>
                            <p><i class="fas fa-envelope"></i> <a href="mailto:support@slopestohope.com">support@slopestohope.com</a></p>
                        </address>
                    </div>
                </div>
            </div>
        </div>
        <div class="site-info">
            <div class="container">
                <div class="copyright-text">Copyright &copy; 2026 Slopes to Hope. All rights reserved.</div>
            </div>
        </div>
    </footer>`;

            // JSDOM replacement
            // We can't just set outerHTML easily on the element object itself depending on version,
            // but replaceWith is standard.
            // Or create a temp element.
            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = newFooterHTML;
            const newFooter = tempDiv.firstElementChild;

            oldFooter.replaceWith(newFooter);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, dom.serialize());
            console.log(`  -> Footer updated.`);
        }
    }
}

main();
