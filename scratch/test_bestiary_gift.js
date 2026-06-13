import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\0a09938f-a8b0-43ff-85ff-711e5edd14d8';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log('🎮 Starting automated Bestiary gift modal verification...');
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: true, // Run headless so it doesn't interrupt you, but still captures full screenshots
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-gl=angle',
                '--use-angle=d3d11',
                '--ignore-gpu-blocklist',
            ],
            defaultViewport: {
                width: 1280,
                height: 720,
            }
        });

        const page = await browser.newPage();

        // Relay console logs
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));

        console.log(`🔗 Navigating to ${GAME_URL}...`);
        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(8000);

        console.log('🤖 Bypassing onboarding and opening Bestiary with daily reward enabled...');
        await page.evaluate(() => {
            if (window.useGameStore) {
                const store = window.useGameStore;
                // Update state
                store.setState({
                    onboardingCompleted: true,
                    activeScreen: 'MAIN_MENU',
                    pet: {
                        ...store.getState().pet,
                        hasDailyPetReward: true // Force daily reward to be claimable
                    }
                });
            }
            if (window.setActiveHUDWindow) {
                window.setActiveHUDWindow('BESTIARY');
                console.log('QA: Store updated and Bestiary opened.');
            } else {
                console.error('QA: window.setActiveHUDWindow not found.');
            }
        });

        await delay(3000);
        
        // Take a screenshot showing the bestiary and the glowing gift box
        const beforeScreenshot = join(SCREENSHOT_DIR, 'bestiary_before_gift_claim.png');
        await page.screenshot({ path: beforeScreenshot });
        console.log(`📸 Captured bestiary state: ${beforeScreenshot}`);

        // Get the gift box element handle
        const giftBoxHandle = await page.evaluateHandle(() => {
            const elements = Array.from(document.querySelectorAll('span'));
            const match = elements.find(el => el.textContent === '🎁');
            if (match) {
                console.log('QA: Found gift box span in DOM:', match.outerHTML);
            }
            return match;
        });

        if (giftBoxHandle && await giftBoxHandle.asElement()) {
            const element = await giftBoxHandle.asElement();
            const box = await element.boundingBox();
            if (box) {
                console.log(`🤖 Clicking gift box at coordinates: x=${box.x + box.width / 2}, y=${box.y + box.height / 2}`);
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                await delay(2000);
                
                // Check if claimedReward state was successfully set and modal is shown
                const stateAfter = await page.evaluate(() => {
                    return {
                        petState: window.useGameStore.getState().pet,
                        claimedRewardIsShown: !!document.body.innerText.includes('ДАР ОТ ПИТОМЦА')
                    };
                });
                console.log('QA: State after click:', JSON.stringify(stateAfter));
            } else {
                console.error('QA: Bounding box for gift box not found.');
            }
        } else {
            console.error('QA: Gift box span handle not found.');
        }

        // Take a screenshot of the opened modal
        const afterScreenshot = join(SCREENSHOT_DIR, 'bestiary_after_gift_claim.png');
        await page.screenshot({ path: afterScreenshot });
        console.log(`📸 Captured opened gift modal state: ${afterScreenshot}`);

    } catch (err) {
        console.error('❌ Automation failed:', err);
    } finally {
        if (browser) {
            await browser.close();
        }
        console.log('🏁 Verification complete.');
    }
}

runTest();
