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
    await page.setViewport({ width: 812, height: 375, isMobile: true, hasTouch: true }); // Horizontal mobile view used in E2E
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

    // Dump top right elements
    const elements = await page.evaluate(() => {
        const info = [];
        const all = document.querySelectorAll('*');
        all.forEach(el => {
            const rect = el.getBoundingClientRect();
            // If the element is in the top right corner
            if (rect.right > 500 && rect.top < 100 && rect.width > 0 && rect.height > 0) {
                // Only include leaf-like nodes (with short inner text or button/img tags)
                if (el.children.length === 0 || el.tagName === 'BUTTON' || el.tagName === 'IMG') {
                    info.push({
                        tagName: el.tagName,
                        className: el.className,
                        text: el.innerText || el.textContent || '',
                        rect: {
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height
                        }
                    });
                }
            }
        });
        return info;
    });

    console.log('--- TOP RIGHT ELEMENTS ---');
    console.log(JSON.stringify(elements, null, 2));

    await browser.close();
}

inspect();
