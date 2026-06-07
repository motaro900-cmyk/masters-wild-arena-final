import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\ccb229ee-9ac6-48e8-8e69-1d19f584eae7\\';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('🤖 Launching browser to capture Hero screens...');
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
        
        // Emulate mobile device in landscape (similar to full_test.js)
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
        await page.setViewport({
            width: 812,
            height: 375,
            isMobile: true,
            hasTouch: true,
        });

        console.log(`🔗 Connecting to ${GAME_URL}...`);
        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ Page loaded.');

        // Clear local storage and reload to ensure fresh state
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle2' });
        await delay(3000);

        // --- 1. Intro Screen (Steps 1-3) ---
        console.log('🤖 Navigating Intro Steps 1-3...');
        for (let i = 1; i <= 3; i++) {
            await delay(1000);
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent && b.textContent.includes('ДАЛЕЕ'));
                if (btn) btn.click();
            });
        }
        await delay(1000);

        // --- 2. Step 4: Name Registration ---
        console.log('🤖 Registering player...');
        const inputHandle = await page.$('input');
        if (inputHandle) {
            await inputHandle.click();
            await page.type('input', 'QATester');
        }
        await delay(500);
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('НАЧАТЬ ПУТЬ'));
            if (btn) btn.click();
        });
        await delay(3000);

        // Bypassing onboarding directly using state store
        console.log('⚙️ Bypassing onboarding and setting up state...');
        await page.evaluate(() => {
            const store = window.useGameStore.getState();
            // Add items to inventory
            const mockInventory = [
                ...store.inventory,
                { id: 'dagger_bone', level: 1 },
                { id: 'starter_armor', level: 1 },
                { id: 'starter_shield', level: 1 },
                { id: 'starter_helm', level: 1 }
            ];
            // Give resources & points
            store.addGold(50000);
            store.addCrystals(5000);
            // Ensure we have talent points to spend and own all heroes with cat selected and equipped
            window.useGameStore.setState({ 
                inventory: mockInventory,
                talentPoints: 10,
                ownedHeroes: ['panda', 'raccoon'],
                selectedHeroId: 'panda',
                equippedSkins: { panda: 'panda_frost' },
                heroEquipment: {
                    ...store.heroEquipment,
                    panda: {
                        WEAPONS: 'dagger_bone',
                        ARMOR: 'starter_armor',
                        SHIELDS: 'starter_shield',
                        HELMETS: 'starter_helm'
                    }
                }
            });
        });
        await delay(1000);

        // Transition directly to HEROES screen, LIST tab
        console.log('📸 Transitioning to HEROES: LIST...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToHeroes('LIST');
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'test_hero_list.png') });
        console.log('📸 Captured: test_hero_list.png');

        // Transition to HEROES: HERO (Equipment) tab
        console.log('📸 Transitioning to HEROES: HERO (Equipment)...');
        await page.evaluate(() => {
            window.useGameStore.setState({ activeScreen: 'HEROES', heroesInitialTab: 'HERO' });
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'test_hero_gear_inventory.png') });
        console.log('📸 Captured: test_hero_gear_inventory.png');

        // Click stats sub-tab button
        console.log('📸 Switching to STATS sub-tab...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('СТАТЫ'));
            if (btn) btn.click();
        });
        await delay(1500);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'test_hero_gear_stats.png') });
        console.log('📸 Captured: test_hero_gear_stats.png');

        // Transition to HEROES: TALENTS tab
        console.log('📸 Transitioning to HEROES: TALENTS...');
        await page.evaluate(() => {
            window.useGameStore.setState({ activeScreen: 'HEROES', heroesInitialTab: 'TALENTS' });
        });
        await delay(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'test_hero_talents.png') });
        console.log('📸 Captured: test_hero_talents.png');

        console.log('🎉 Screenshots taken successfully.');
    } catch (e) {
        console.error('❌ Failed to capture screenshots:', e);
    } finally {
        await browser.close();
        console.log('🧹 Browser closed.');
    }
}

run();
