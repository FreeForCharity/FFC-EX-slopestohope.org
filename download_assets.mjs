
import fs from 'fs';
import path from 'path';
import https from 'https';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);
const SITE_URL = 'https://slopestohope.com';

async function downloadAssets() {
    if (!fs.existsSync('missing_assets.json')) {
        console.log('No missing_assets.json found.');
        return;
    }

    const assets = JSON.parse(fs.readFileSync('missing_assets.json', 'utf8'));
    console.log(`Found ${assets.length} missing assets to download.`);

    for (const assetPath of assets) {
        // assetPath is like "/wp-content/uploads/..."
        const url = `${SITE_URL}${assetPath}`;
        const localPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
        const fullLocalPath = path.resolve(process.cwd(), localPath);
        const dir = path.dirname(fullLocalPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        console.log(`Downloading: ${url} -> ${localPath}`);

        try {
            await downloadFile(url, fullLocalPath);
        } catch (e) {
            console.error(`Failed to download ${url}: ${e.message}`);
        }
    }
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Status code: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', err => {
            fs.unlink(dest, () => { }); // delete partial file
            reject(err);
        });
    });
}

downloadAssets();
