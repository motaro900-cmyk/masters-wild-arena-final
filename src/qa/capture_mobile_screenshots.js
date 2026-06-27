import puppeteer from 'puppeteer-core';
import { join } from 'path';
import { mkdirSync } from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\4f469d25-f6bf-406c-978b-b93308fea26b\\';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('🎮 Starting capture_mobile_screenshots...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
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
        
        // Emulate mobile device user agent
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
        // Set mobile viewport to 375x812 (portrait)
        await page.setViewport({
            width: 375,
            height: 812,
            isMobile: true,
            hasTouch: true,
        });

        console.log(`🔗 Connecting to ${GAME_URL}...`);
        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ Page loaded.');

        // Clear local storage for a clean start
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle2' });
        await delay(5000);

        // Bypass rotation warning
        console.log('🤖 Dismissing rotation warning if visible...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const dismissBtn = btns.find(b => b.textContent && b.textContent.includes('Играть в портретном'));
            if (dismissBtn) dismissBtn.click();
        });
        await delay(2000);

        // Navigate intro screen (steps 1-3)
        console.log('🤖 Navigating intro...');
        for (let i = 1; i <= 3; i++) {
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent && b.textContent.includes('ДАЛЕЕ'));
                if (btn) btn.click();
            });
            await delay(1000);
        }

        // Registration with valid name
        const validName = `QA_Mobile_${Date.now()}`;
        console.log(`🤖 Registering as ${validName}...`);
        await page.evaluate((name) => {
            const input = document.querySelector('input');
            if (input) input.value = name;
        }, validName);
        await delay(500);

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('НАЧАТЬ ПУТЬ'));
            if (btn) btn.click();
        });
        await delay(4000); // wait for lobby/menu

        // Force gold/gems if needed to test shop
        await page.evaluate(() => {
            window.useGameStore.getState().addGold(10000);
        });

        // 1. SCREENSHOT: Daily Calendar Grid
        console.log('🤖 Opening Daily Calendar...');
        await page.evaluate(() => {
            window.setActiveHUDWindow('GIFT');
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'mobile_calendar.png') });
        console.log('📸 Captured: mobile_calendar.png');

        // Close Daily Calendar
        await page.evaluate(() => {
            window.setActiveHUDWindow(null);
        });
        await delay(1000);

        // 2. SCREENSHOT: Player Profile Modal (inspecting 'me')
        console.log('🤖 Opening Player Inspect Modal...');
        await page.evaluate(() => {
            window.useGameStore.getState().setInspectPlayerId('me');
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'mobile_profile.png') });
        console.log('📸 Captured: mobile_profile.png');

        // Close Player Profile
        await page.evaluate(() => {
            window.useGameStore.getState().setInspectPlayerId(null);
        });
        await delay(1000);

        // 3. SCREENSHOT: Inventory Grid
        console.log('🤖 Opening Inventory/Heroes...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToHeroes();
        });
        await delay(2000);
        // Select снаряжение (equipment) tab
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const equipTabBtn = btns.find(b => b.textContent && b.textContent.includes('СНАРЯЖЕНИЕ'));
            if (equipTabBtn) equipTabBtn.click();
        });
        await delay(1500);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'mobile_inventory.png') });
        console.log('📸 Captured: mobile_inventory.png');

        // Close Inventory (return to main menu)
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('MAIN_MENU');
        });
        await delay(1000);

        // 4. SCREENSHOT: Shop Catalog
        console.log('🤖 Opening Shop...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToShop();
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'mobile_shop.png') });
        console.log('📸 Captured: mobile_shop.png');

        // Return to main menu
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('MAIN_MENU');
        });
        await delay(1000);

        // 6. SCREENSHOT: City Screen
        console.log('🤖 Opening City Screen...');
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('CITY');
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'mobile_city.png') });
        console.log('📸 Captured: mobile_city.png');

        // Return to main menu
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('MAIN_MENU');
        });
        await delay(1000);

        // 5. SCREENSHOT: Chat Input Contrast
        console.log('🤖 Opening Chat Input...');
        const inputField = await page.$('input[placeholder*="Введите сообщение"]');
        if (inputField) {
            await inputField.focus();
            await page.type('input[placeholder*="Введите сообщение"]', 'Привет, это проверка контраста ввода!');
            await delay(1000);
            await page.screenshot({ path: join(SCREENSHOT_DIR, 'mobile_chat.png') });
            console.log('📸 Captured: mobile_chat.png');
        } else {
            console.log('⚠️ Chat input field not found! Taking general screen screenshot instead.');
            await page.screenshot({ path: join(SCREENSHOT_DIR, 'mobile_chat.png') });
        }

    } catch (err) {
        console.error('❌ Error during simulation:', err);
    } finally {
        await browser.close();
        console.log('🤖 Puppeteer closed.');
    }
}

run();
