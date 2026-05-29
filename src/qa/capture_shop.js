import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const OUTPUT_PATH = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\9a269537-4657-4af8-ae53-2078ea4987fb\\shop_purchase.png';

async function run() {
    console.log('🏁 Launching browser to capture shop screen...');
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: CHROME_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--use-gl=angle',
            '--use-angle=d3d11',
            '--ignore-gpu-blocklist'
        ]
    });

    try {
        const page = await browser.newPage();
        
        await page.setViewport({
            width: 1920,
            height: 1080,
            isMobile: false
        });

        page.on('console', msg => {
            console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
        });
        page.on('pageerror', err => {
            console.error(`[Browser PageError] ${err.message}`);
        });

        console.log(`🔗 Navigating to ${GAME_URL}...`);
        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ Page loaded.');

        console.log('⏳ Waiting 5 seconds for Game Engine & App to finish initialization...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('⚙️ Force setting game state to SHOP now that initialization is complete...');
        await page.evaluate(() => {
            const store = (window).useGameStore;
            if (store) {
                store.setState({
                    onboardingCompleted: true,
                    activeScreen: 'SHOP',
                    gold: 15908,
                    crystals: 757,
                    energy: 1399
                });
            } else {
                console.error('Zustand store not found on window!');
            }
        });

        console.log('⏳ Waiting 4 seconds for ShopScene to render items...');
        await new Promise(r => setTimeout(r, 4000));

        console.log(`📸 Capturing screenshot to ${OUTPUT_PATH}...`);
        await page.screenshot({ path: OUTPUT_PATH });
        console.log('✅ Screenshot captured successfully!');
    } catch (err) {
        console.error('❌ Error during capture:', err);
    } finally {
        await browser.close();
    }
}

run();
