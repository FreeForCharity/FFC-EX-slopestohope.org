
import fs from 'fs';
import path from 'path';
import https from 'https';

const SITE_URL = 'https://slopestohope.com';
const ROOT_DIR = process.cwd();

const assets = [
    '/wp-content/uploads/2025/12/222Untitled-1.webp',
    '/wp-content/uploads/2025/05/20240403_130757-scaled-e1750104382827.jpg'
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
