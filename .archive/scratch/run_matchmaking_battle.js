import puppeteer from 'puppeteer-core';
import { join } from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\440dc9a0-1570-4979-b818-b2ef27a92ec0';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('🚀 Launching Chrome...');
    const browser = await puppeteer.launch({
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

    try {
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`[Browser] ${msg.text()}`);
        });

        console.log(`🔗 Navigating to ${GAME_URL}...`);
        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(5000);

        console.log('⚡ Bypassing onboarding and setting energy...');
        await page.evaluate(() => {
            if (window.useGameStore) {
                window.useGameStore.setState({
                    onboardingCompleted: true,
                    name: 'TestWarrior',
                    activeScreen: 'MAIN_MENU',
                    showIntro: false,
                    energy: 100,
                    gold: 5000,
                    crystals: 200
                });
                console.log('Store bypassed successfully.');
            } else {
                console.error('window.useGameStore not found!');
            }
        });
        await delay(2000);

        // Open Ranked Lobby modal to start matchmaking
        console.log('⚡ Opening Ranked Lobby...');
        await page.evaluate(() => {
            window.useGameStore.setState({ activeWindow: 'RANKED_LOBBY' });
        });
        
        // Wait for matchmaking search (takes ~4.5 to 6 seconds)
        console.log('⏳ Waiting for Matchmaking Search to find opponent...');
        await delay(8000);

        // Click "НАЧАТЬ БОЙ" on the VERSUS screen
        console.log('⚔️ Clicking "НАЧАТЬ БОЙ" to enter battle...');
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
            console.log('✅ Match started successfully!');
        } else {
            console.log('⚠️ "НАЧАТЬ БОЙ" button not found via UI. Forcing battle entry via store...');
            await page.evaluate(() => {
                const randomEnemy = 'panda'; // or other heroes
                useGameStore.setState({ selectedEnemyId: randomEnemy, battleMode: 'RANKED' });
                useGameStore.getState().setScreen('BATTLE');
            });
        }

        // Wait for Pixi and battle to load
        await delay(3000);

        // Capture combat at multiple points (5s, 10s, 15s)
        console.log('📸 Capturing combat visual effects...');
        
        await delay(5000);
        const ssPath1 = join(SCREENSHOT_DIR, 'combat_5s.png');
        await page.screenshot({ path: ssPath1 });
        console.log(`Captured: ${ssPath1}`);

        await delay(5000);
        const ssPath2 = join(SCREENSHOT_DIR, 'combat_10s.png');
        await page.screenshot({ path: ssPath2 });
        console.log(`Captured: ${ssPath2}`);

        await delay(5000);
        const ssPath3 = join(SCREENSHOT_DIR, 'combat_15s.png');
        await page.screenshot({ path: ssPath3 });
        console.log(`Captured: ${ssPath3}`);

        // Wait another 5 seconds just in case battle ends and shows post-combat HUD
        await delay(5000);
        const ssPath4 = join(SCREENSHOT_DIR, 'combat_20s.png');
        await page.screenshot({ path: ssPath4 });
        console.log(`Captured: ${ssPath4}`);

    } catch (e) {
        console.error('❌ Error during testing:', e);
    } finally {
        await browser.close();
        console.log('🧹 Browser closed.');
    }
}

run();
