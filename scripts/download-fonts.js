import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FONTS_DIR = path.resolve(__dirname, '../public/assets/fonts');

// Создаем директорию для шрифтов
if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
}

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Outfit:wght@400;700;800;900&family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Nunito:wght@700;900&family=Russo+One&display=swap';

// Имитируем User-Agent современного браузера для получения woff2
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function downloadFile(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function main() {
    console.log('Fetching Google Fonts CSS...');
    const res = await fetch(GOOGLE_FONTS_URL, {
        headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok) throw new Error(`Failed to fetch CSS: ${res.statusText}`);
    let cssText = await res.text();

    // Регулярное выражение для поиска URL шрифтов
    const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+)\)/g;
    let match;
    const urls = [];

    while ((match = urlRegex.exec(cssText)) !== null) {
        urls.push(match[1]);
    }

    console.log(`Found ${urls.length} font files to download.`);

    // Скачиваем уникальные файлы
    const uniqueUrls = Array.from(new Set(urls));
    const urlMap = {};

    for (let i = 0; i < uniqueUrls.length; i++) {
        const url = uniqueUrls[i];
        const filename = path.basename(url);
        const destPath = path.join(FONTS_DIR, filename);
        
        console.log(`[${i + 1}/${uniqueUrls.length}] Downloading ${filename}...`);
        try {
            await downloadFile(url, destPath);
            urlMap[url] = `/assets/fonts/${filename}`;
        } catch (e) {
            console.error(`Failed to download ${url}`, e);
        }
    }

    // Заменяем внешние URL в CSS на локальные
    console.log('Replacing URLs in CSS...');
    let localCss = cssText;
    for (const [remoteUrl, localUrl] of Object.entries(urlMap)) {
        localCss = localCss.replaceAll(remoteUrl, localUrl);
    }

    // Записываем локальный CSS
    const cssDest = path.join(FONTS_DIR, 'fonts.css');
    fs.writeFileSync(cssDest, localCss, 'utf-8');
    console.log(`✅ Success! Local CSS written to ${cssDest}`);
}

main().catch(console.error);
