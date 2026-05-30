import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const SCREENSHOT_PATH = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\2d214749-307c-4b28-9100-ce768a06b88e\\matchmaking_comparison.png';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('🎮 Launching Puppeteer...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[Browser Console ERROR] ${msg.text()}`);
            consoleErrors.push(msg.text());
        } else {
            console.log(`[Browser Console] ${msg.text()}`);
        }
    });

    page.on('pageerror', err => {
        console.error(`[Browser PageError] ${err.message}`);
        consoleErrors.push(err.message);
    });

    console.log(`🔗 Navigating to ${GAME_URL}...`);
    try {
        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
        console.error('❌ Failed to navigate. Vite server might not be running.', e.message);
        await browser.close();
        process.exit(2); // Exit code 2 means server is not running
    }

    console.log('✅ Page loaded. Clearing localStorage...');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(3000);

    console.log('🤖 Bypassing Intro/Registration screens...');
    // Skip intro steps
    for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('ДАЛЕЕ'));
            if (btn) btn.click();
        });
        await delay(500);
    }

    // Register a random player name
    const playerName = `TestMaster${Date.now().toString().slice(-4)}`;
    await page.type('input', playerName);
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('НАЧАТЬ ПУТЬ'));
        if (btn) btn.click();
    });
    await delay(3000);

    console.log('🤖 Triggering Matchmaking Overlay...');
    await page.evaluate(() => {
        if (typeof window.setActiveHUDWindow === 'function') {
            window.setActiveHUDWindow('RANKED_LOBBY');
        } else {
            console.error('window.setActiveHUDWindow not found!');
        }
    });

    console.log('⌛ Waiting for matchmaking searching to find opponent (7 seconds)...');
    await delay(7000);

    console.log('📸 Taking screenshot of matchmaking comparison...');
    await page.screenshot({ path: SCREENSHOT_PATH });
    console.log(`✅ Screenshot saved to ${SCREENSHOT_PATH}`);

    await browser.close();

    if (consoleErrors.length > 0) {
        console.log(`⚠️ Completed with ${consoleErrors.length} console/page errors.`);
        process.exit(0);
    } else {
        console.log('🎉 Completed successfully with no errors.');
        process.exit(0);
    }
}

run().catch(err => {
    console.error('❌ Run failed:', err);
    process.exit(1);
});
