import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function inspect() {
    console.log('🔗 Connecting to browser...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('🔗 Navigating...');
    page.on('console', msg => console.log(`[Browser] ${msg.text()}`));
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
    await page.type('input', 'InspectPlayer');
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('НАЧАТЬ ПУТЬ'));
        if (btn) btn.click();
    });
    await delay(3000);

    // Go to shop
    await page.evaluate(() => {
        window.useGameStore.getState().goToShop();
    });
    await delay(2000);

    // Inspect elements
    const elementsInfo = await page.evaluate(() => {
        const info = [];
        
        // Find elements with classes that contain flex items-center
        const allResBars = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.className && typeof el.className === 'string' && el.className.includes('flex items-center gap-3 pointer-events-auto');
        });

        allResBars.forEach((bar, idx) => {
            const parents = [];
            let curr = bar.parentElement;
            while (curr) {
                parents.push(`${curr.tagName}.${curr.className || ''}`);
                curr = curr.parentElement;
            }
            info.push({
                index: idx,
                tagName: bar.tagName,
                className: bar.className,
                parents: parents.slice(0, 5),
                text: bar.innerText
            });
        });

        const buyBtns = Array.from(document.querySelectorAll('button')).map(btn => {
            return {
                text: btn.innerText,
                className: btn.className,
                style: btn.getAttribute('style')
            };
        });

        return {
            activeScreen: window.useGameStore.getState().activeScreen,
            resBars: info,
            buyButtons: buyBtns.filter(b => b.text.includes('💰') || b.text.includes('💎') || b.text.includes('500') || b.text.includes('100') || b.text.includes('2 000') || b.text.includes('2 500'))
        };
    });

    console.log('Active Screen:', elementsInfo.activeScreen);
    console.log('--- RESOURCE BARS FOUND ---');
    console.log(JSON.stringify(elementsInfo.resBars, null, 2));
    console.log('--- BUY/PRICE BUTTONS FOUND ---');
    console.log(JSON.stringify(elementsInfo.buyButtons, null, 2));

    await browser.close();
}

inspect();
