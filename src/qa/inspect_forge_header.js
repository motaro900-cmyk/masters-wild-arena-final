import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function inspect() {
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 }); // Desktop view
    await page.goto(GAME_URL, { waitUntil: 'networkidle2' });
    await delay(3000);

    // Skip intro
    for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('ДАЛЕЕ'));
            if (btn) btn.click();
        });
        await delay(500);
    }
    
    // Register
    await page.type('input', 'InspectForgePlayer');
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('НАЧАТЬ ПУТЬ'));
        if (btn) btn.click();
    });
    await delay(3000);

    // Go to forge screen
    await page.evaluate(() => {
        window.useGameStore.getState().setActiveScreen('FORGE');
    });
    await delay(2000);

    // Dump all visible buttons and elements in the header area (top 150px)
    const elements = await page.evaluate(() => {
        const info = [];
        const all = document.querySelectorAll('*');
        all.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < 150 && rect.width > 0 && rect.height > 0) {
                // If it is a leaf element or button
                if (el.children.length === 0 || el.tagName === 'BUTTON' || el.tagName === 'IMG') {
                    const styles = window.getComputedStyle(el);
                    info.push({
                        tagName: el.tagName,
                        id: el.id,
                        className: el.className,
                        text: el.innerText || el.textContent || '',
                        rect: {
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height
                        },
                        zIndex: styles.zIndex,
                        position: styles.position,
                        display: styles.display
                    });
                }
            }
        });
        return info;
    });

    console.log('--- HEADER ELEMENTS ---');
    console.log(JSON.stringify(elements, null, 2));

    await browser.close();
}

inspect();
