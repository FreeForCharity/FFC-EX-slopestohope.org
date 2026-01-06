
import fs from 'fs';
import path from 'path';
import https from 'https';

const url = 'https://slopestohope.com/wp-content/litespeed/ucss/8b1f027dc64668341437990e2eb28e91.css?ver=69d21';
const localPath = 'wp-content/litespeed/ucss/8b1f027dc64668341437990e2eb28e91.css';

const fullPath = path.resolve(process.cwd(), localPath);
const dir = path.dirname(fullPath);

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const file = fs.createWriteStream(fullPath);
const req = https.get(url, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Failed to download: ${res.statusCode}`);
        return;
    }
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${localPath}`);
    });
});

req.on('error', (e) => {
    console.error(e);
});
