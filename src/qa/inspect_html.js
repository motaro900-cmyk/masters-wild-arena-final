import puppeteer from 'puppeteer-core';

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
    await page.setViewport({ width: 812, height: 375, isMobile: true, hasTouch: true });
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

    // Dump top right outer HTML
    const html = await page.evaluate(() => {
        // Let's find the main scaled container or body, and find elements at the top right
        // We'll return the outer HTML of the containers in the top right
        const elements = [];
        const all = document.querySelectorAll('*');
        all.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > 500 && rect.top < 100 && rect.width > 100 && rect.height > 20) {
                // If it's a parent container containing the resource bars
                if (el.className && typeof el.className === 'string' && (el.className.includes('hud-interactive') || el.className.includes('game-hud-root') || el.className.includes('header') || el.style.width === '100%')) {
                    elements.push({
                        tagName: el.tagName,
                        className: el.className,
                        html: el.outerHTML
                    });
                }
            }
        });
        return elements;
    });

    console.log('--- TOP RIGHT CONTAINERS HTML ---');
    html.forEach(h => {
        console.log(`=== ${h.tagName}.${h.className} ===`);
        console.log(h.html.substring(0, 1000)); // print first 1000 chars of each
        console.log('\n');
    });

    await browser.close();
}

inspect();
