
import fs from 'fs';
import path from 'path';
import https from 'https';

const SITE_URL = 'https://slopestohope.com';
const ROOT_DIR = process.cwd();

const assets = [
    // Fonts
    '/wp-content/themes/buddyx/assets/fonts/fa-solid-900.woff2',
    '/wp-content/plugins/elementor/assets/lib/font-awesome/webfonts/fa-solid-900.woff2',
    '/wp-content/themes/buddyx/assets/fonts/fa-solid-900.ttf',
    '/wp-content/plugins/elementor/assets/lib/font-awesome/webfonts/fa-solid-900.woff',
    '/wp-content/plugins/elementor/assets/lib/font-awesome/webfonts/fa-solid-900.ttf',
    '/wp-content/plugins/pojo-accessibility/assets/build/fonts/Roboto-700-latin.75e6c243.woff2',
    '/wp-content/plugins/pojo-accessibility/assets/build/fonts/Roboto-500-latin.75e6c243.woff2',
    '/wp-content/plugins/pojo-accessibility/assets/build/fonts/Roboto-400-latin.75e6c243.woff2',

    // Images
    '/wp-content/uploads/2025/05/20240403_095651-scaled-e1748389950935.jpg',
    '/wp-content/uploads/2025/05/20240403_131227-scaled.jpg',
    '/wp-content/uploads/2025/05/CBM.jpg',
    '/wp-content/uploads/2025/05/Screenshot-2025-05-27-173110-1-1.jpg'
];

async function downloadAssets() {
    for (const assetPath of assets) {
        const url = `${SITE_URL}${assetPath}`;
        // Remove leading slash for local path
        const localPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
        const fullLocalPath = path.resolve(ROOT_DIR, localPath);

        // Ensure directory exists
        const dir = path.dirname(fullLocalPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        console.log(`Downloading ${url}...`);
        await downloadFile(url, fullLocalPath);
    }
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            if (response.statusCode !== 200) {
                console.error(`Failed ${url}: ${response.statusCode}`);
                file.close();
                // Resolve validation failure as success to continue
                resolve();
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Saved to ${dest}`);
                resolve();
            });
        }).on('error', err => {
            fs.unlink(dest, () => { });
            console.error(`Error downloading ${url}: ${err.message}`);
            resolve();
        });
    });
}

downloadAssets();
