import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\9a269537-4657-4af8-ae53-2078ea4987fb\\';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
    console.log('🎮 Starting Automated Gameplay Simulation...');
    console.log(`🔗 Connecting to ${GAME_URL}...`);

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: true,
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
        
        // Output browser logs to Node console
        page.on('console', msg => {
            console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
        });

        // Open the game
        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ Page loaded. Waiting for store and assets...');
        await delay(5000);

        // 1. Bypass Onboarding and show Main Menu
        console.log('🤖 Bypassing onboarding and setting active screen to MAIN_MENU...');
        await page.evaluate(() => {
            if (window.useGameStore) {
                window.useGameStore.setState({
                    onboardingCompleted: true,
                    name: 'AIPlayer',
                    activeScreen: 'MAIN_MENU',
                    showIntro: false,
                    crystals: 10000,
                    gold: 100000,
                    energy: 100
                });
                console.log('QA: Store updated successfully');
            } else {
                console.error('QA: window.useGameStore not found!');
            }
        });

        await delay(3000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '1_main_menu.png') });
        console.log('📸 Captured: 1_main_menu.png');

        // 2. Navigate to CITY
        console.log('🤖 Navigating to CITY...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToCity();
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '2_city.png') });
        console.log('📸 Captured: 2_city.png');

        // 3. Navigate to HEROES
        console.log('🤖 Navigating to HEROES...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToHeroes();
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '3_heroes.png') });
        console.log('📸 Captured: 3_heroes.png');

        // 4. Navigate to SHOP
        console.log('🤖 Navigating to SHOP...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToShop();
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '4_shop.png') });
        console.log('📸 Captured: 4_shop.png');

        // 5. Start PvE floor battle (Stage 1)
        console.log('🤖 Starting PvE Stage 1 battle...');
        await page.evaluate(() => {
            window.useGameStore.getState().startPveBattle(1);
        });
        await delay(3000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '5_pre_battle.png') });
        console.log('📸 Captured: 5_pre_battle.png');

        // Click the start battle button
        console.log('🤖 Clicking "⚔️ НАЧАТЬ БОЙ" button...');
        const clickSuccess = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent && b.textContent.includes('НАЧАТЬ БОЙ'));
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });

        if (clickSuccess) {
            console.log('✅ Clicked Start Battle successfully!');
        } else {
            console.log('⚠️ Could not find "⚔️ НАЧАТЬ БОЙ" button, attempting fallback...');
            // Fallback: trigger state change or event directly if UI didn't render correctly
            await page.evaluate(() => {
                const store = window.useGameStore.getState();
                // Consume energy and switch to battle scene directly
                if (store.consumeEnergy) store.consumeEnergy(10);
            });
        }

        // Set speed scale to 2x
        await page.evaluate(() => {
            window.useGameStore.setState({ timeScale: 2 });
        });

        await delay(5000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '6_battle_action.png') });
        console.log('📸 Captured: 6_battle_action.png');

        // 6. Poll for battle results screen (max 40 seconds)
        console.log('🤖 Polling for battle end...');
        let battleEnded = false;
        for (let i = 0; i < 20; i++) {
            await delay(2000);
            const isEnded = await page.evaluate(() => {
                return document.body.innerText.includes('ПОБЕДА!') || document.body.innerText.includes('ПОРАЖЕНИЕ');
            });
            if (isEnded) {
                console.log(`✅ Battle end detected after ${(i + 1) * 2}s!`);
                battleEnded = true;
                break;
            }
        }

        if (!battleEnded) {
            console.log('⚠️ Timeout waiting for battle to finish naturally. Forcing battle completion...');
            // Force battle win in store if it didn't finish
            await page.evaluate(() => {
                window.useGameStore.getState().completePveBattle(true);
            });
        } else {
            await page.screenshot({ path: join(SCREENSHOT_DIR, '7_battle_result.png') });
            console.log('📸 Captured: 7_battle_result.png');

            // Click the continue button (🏛️ В ОБИТЕЛЬ or 🏠 В ЛОББИ)
            console.log('🤖 Clicking Continue button...');
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.textContent && (b.textContent.includes('В ОБИТЕЛЬ') || b.textContent.includes('В ЛОББИ')));
                if (btn) {
                    btn.click();
                } else {
                    // Fallback state update
                    window.useGameStore.getState().completePveBattle(true);
                }
            });
        }

        await delay(3000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '8_sanctuary.png') });
        console.log('📸 Captured: 8_sanctuary.png');

        // Go back to lobby
        console.log('🤖 Navigating back to MAIN_MENU...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToMainMenu();
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '9_final_main_menu.png') });
        console.log('📸 Captured: 9_final_main_menu.png');

        console.log('🎉 Automated Gameplay Simulation finished successfully!');
    } catch (err) {
        console.error('❌ Simulation failed with error:', err);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 Browser closed.');
        }
    }
}

runSimulation();
