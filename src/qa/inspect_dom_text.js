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
    await page.setViewport({ width: 1280, height: 720 });
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

    // Find all elements whose text is exactly '300' or '10/50'
    const results = await page.evaluate(() => {
        const elements = [];
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node;
        while (node = walk.nextNode()) {
            const text = node.nodeValue.trim();
            if (text === '300' || text === '10/50' || text === '50') {
                const parent = node.parentElement;
                elements.push({
                    text,
                    tagName: parent.tagName,
                    className: parent.className,
                    id: parent.id,
                    style: parent.getAttribute('style'),
                    parentTag: parent.parentElement ? parent.parentElement.tagName : null,
                    parentClass: parent.parentElement ? parent.parentElement.className : null
                });
            }
        }
        return elements;
    });

    console.log('--- TEXT MATCHING ELEMENTS ---');
    console.log(JSON.stringify(results, null, 2));

    await browser.close();
}

inspect();
