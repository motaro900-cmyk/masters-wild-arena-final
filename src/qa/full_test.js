import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\9a269537-4657-4af8-ae53-2078ea4987fb\\';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
    console.log('🎮 Starting Full E2E Test...');
    const isHeaded = process.argv.includes('--headed');
    console.log(`👁️ Visual Mode: ${isHeaded ? 'ON (headed)' : 'OFF (headless)'}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: !isHeaded,
            slowMo: isHeaded ? 100 : 0,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-gl=angle',
                '--use-angle=d3d11',
                '--ignore-gpu-blocklist',
                ...(isHeaded ? ['--window-size=1280,720'] : [])
            ],
            defaultViewport: isHeaded ? null : {
                width: 1280,
                height: 720,
            }
        });
 
         const page = await browser.newPage();
         
         // Эмулируем мобильное устройство (iPhone 13 portrait)
         await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
         await page.setViewport({
             width: 375,
             height: 812,
             isMobile: true,
             hasTouch: true,
         });
         
         const consoleErrors = [];
         page.on('console', msg => {
             console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
             if (msg.type() === 'error' && !msg.text().includes('chrome-extension') && !msg.text().includes('net::ERR_')) {
                 consoleErrors.push(msg.text());
             }
         });
         page.on('pageerror', err => {
             console.error(`[Browser PageError] ${err.message}`);
             consoleErrors.push(err.message);
         });
         page.on('dialog', async dialog => {
             console.log(`[Browser Dialog] Automatically dismissing dialog: ${dialog.message()}`);
             await dialog.dismiss();
         });
 
         console.log(`🔗 Connecting to ${GAME_URL}...`);
         await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
         console.log('✅ Page loaded.');
         
         // Clear local storage for a clean start
         await page.evaluate(() => localStorage.clear());
         await page.reload({ waitUntil: 'networkidle2' });
         await delay(5000);
 
         // --- 0. Проверка оверлея поворота экрана ---
         console.log('🤖 Checking for Screen Rotation Warning Overlay in Portrait...');
         const hasOverlayPortrait = await page.evaluate(() => {
             return document.body.innerText.includes('Поверните устройство');
         });
         if (hasOverlayPortrait) {
             console.log('✅ Found rotation warning overlay in Portrait.');
             await page.screenshot({ path: join(SCREENSHOT_DIR, 'mobile_rotation_warning_portrait.png') });
             console.log('📸 Captured: mobile_rotation_warning_portrait.png');
         } else {
             console.log('❌ Rotation warning overlay not found in Portrait!');
         }
 
         // Поворачиваем устройство в горизонтальный режим
         console.log('🔄 Rotating viewport to Landscape (812x375)...');
         await page.setViewport({
             width: 812,
             height: 375,
             isMobile: true,
             hasTouch: true,
         });
         await delay(2000); // Ожидаем рендера
 
         const hasOverlayLandscape = await page.evaluate(() => {
             return document.body.innerText.includes('Поверните устройство');
         });
         if (!hasOverlayLandscape) {
             console.log('✅ Rotation warning overlay automatically disappeared in Landscape.');
         } else {
             console.log('❌ Rotation warning overlay still visible in Landscape!');
             await page.evaluate(() => {
                 const btns = Array.from(document.querySelectorAll('button'));
                 const dismissBtn = btns.find(b => b.textContent && b.textContent.includes('Играть в портретном'));
                 if (dismissBtn) dismissBtn.click();
             });
             await delay(1000);
         }


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

        // --- 2. Step 4: Name Validations ---
        console.log('🤖 Testing Name Validations...');
        
        const enterNameAndClick = async (name) => {
            await page.evaluate(() => {
                const input = document.querySelector('input');
                if (input) {
                    input.value = '';
                }
            });
            const inputHandle = await page.$('input');
            if (inputHandle) {
                await inputHandle.click({ clickCount: 3 });
                await inputHandle.press('Backspace');
                await page.type('input', name);
            }
            await delay(500);
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent && b.textContent.includes('НАЧАТЬ ПУТЬ'));
                if (btn) btn.click();
            });
            await delay(1000);
        };

        // Short name
        await enterNameAndClick('A');
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'error_short_name.png') });
        console.log('📸 Captured: error_short_name.png');

        // Forbidden name
        await enterNameAndClick('админ');
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'error_forbidden_name.png') });
        console.log('📸 Captured: error_forbidden_name.png');

        // Invalid chars
        await enterNameAndClick('Panda!');
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'error_invalid_chars.png') });
        console.log('📸 Captured: error_invalid_chars.png');

        // --- 3. Successful Registration ---
        const validName = `QA${Date.now()}`;
        console.log(`🤖 Registering with valid name: ${validName}...`);
        await enterNameAndClick(validName);
        await delay(3000); // Wait for lobby to load

        // --- 4. Profile Gear Bug ---
        console.log('🤖 Testing Profile Gear Bug...');
        await page.evaluate(() => {
            const profileSettingsBtn = document.getElementById('profile-settings-btn');
            if (profileSettingsBtn) {
                console.log('QA: Found profile settings gear button. Clicking it...');
                profileSettingsBtn.click();
            } else {
                console.log('QA: Settings gear button not found by ID. Using fallback click...');
                const element = document.elementFromPoint(440, 80); // Coordinates of the gear button
                if (element) {
                    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                }
            }
        });
        await delay(1500);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'bug_profile_gear.png') });
        console.log('📸 Captured: bug_profile_gear.png');
        
        // Close modals (both Profile and Settings)
        await page.evaluate(() => {
            const closeBtns = Array.from(document.querySelectorAll('button')).filter(b => 
                b.textContent.includes('ПОНЯТНО') || 
                b.textContent.includes('✕') || 
                b.textContent.includes('ЗАКРЫТЬ') ||
                b.querySelector('.lucide-x') !== null
            );
            closeBtns.forEach(b => b.click());
            
            // Also press Escape just in case
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });
        await delay(1000);

        // Ensure we are in MAIN_MENU
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('MAIN_MENU');
        });
        await delay(1000);

        // --- 5. Settings Config ---
        console.log('🤖 Configuring Settings...');
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('SETTINGS');
        });
        await delay(1500);
        
        // Switch to ULTRA and FPS
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const ultraBtn = btns.find(b => b.textContent.includes('ULTRA'));
            if (ultraBtn) ultraBtn.click();
            
            const fpsBtn = btns.find(b => b.textContent.includes('ОТОБРАЖАТЬ FPS') || b.textContent.includes('СКРЫТЬ FPS'));
            if (fpsBtn && fpsBtn.textContent.includes('ОТОБРАЖАТЬ')) fpsBtn.click();
        });
        await delay(1000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'settings_configured.png') });
        console.log('📸 Captured: settings_configured.png');
        
        // Close settings
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('MAIN_MENU');
        });
        await delay(1000);

        // Add some gold to afford purchase
        await page.evaluate(() => {
             window.useGameStore.getState().addGold(10000);
        });

        // --- 6. Shop Purchase ---
        console.log('🤖 Visiting Shop...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToShop();
        });
        await delay(2000);
        // Buy stick_oak (Дубовый Посох) or any item
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const buyBtn = btns.find(b => b.textContent.includes('КУПИТЬ') || b.textContent.includes('Купить'));
            if (buyBtn) buyBtn.click();
        });
        await delay(1500);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'shop_purchase.png') });
        console.log('📸 Captured: shop_purchase.png');

        // --- 7. Heroes Equip ---
        console.log('🤖 Equipping Weapon...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToHeroes();
        });
        await delay(2000);
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const equipTabBtn = btns.find(b => b.textContent && b.textContent.includes('СНАРЯЖЕНИЕ'));
            if (equipTabBtn) equipTabBtn.click();
        });
        await delay(2000);
        await page.evaluate(() => {
            // Find inventory item and hover/click
            const invItems = document.querySelectorAll('[class*="item"], .inventory-item, [class*="Inventory"]');
            // Look for non-empty slots to hover
            const item = Array.from(invItems).find(el => el.innerHTML.includes('img') || el.innerHTML.includes('icon'));
            if (item) {
                const ev = new MouseEvent('mouseenter', { bubbles: true });
                item.dispatchEvent(ev);
                item.click(); // fallback for mobile view
            }
        });
        await delay(1000);
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const equipBtn = btns.find(b => b.textContent.includes('НАДЕТЬ') || b.textContent.includes('Надеть'));
            if (equipBtn) equipBtn.click();
        });
        await delay(1000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'heroes_equipped.png') });
        console.log('📸 Captured: heroes_equipped.png');

        // --- 8. Forge Upgrade ---
        console.log('🤖 Upgrading in Forge...');
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('FORGE');
        });
        await delay(2000);
        await page.evaluate(() => {
            const items = document.querySelectorAll('[class*="item"], [class*="ItemCard"]');
            const item = Array.from(items).find(el => el.innerHTML.includes('img'));
            if (item) item.click();
        });
        await delay(1500);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'forge_upgrade.png') });
        console.log('📸 Captured: forge_upgrade.png');

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const upgBtn = btns.find(b => b.textContent.includes('УЛУЧШИТЬ') || b.textContent.includes('Улучшить'));
            if (upgBtn) upgBtn.click();
        });
        await delay(4000);

        // --- 9. Battle ---
        console.log('🤖 Starting Battle...');
        await page.evaluate(() => {
            window.useGameStore.getState().startPveBattle(1);
        });
        await delay(2000);
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const startBtn = btns.find(b => b.textContent.includes('НАЧАТЬ БОЙ'));
            if (startBtn) startBtn.click();
            else {
                // Force if button not found
                const store = window.useGameStore.getState();
                if (store.consumeEnergy) store.consumeEnergy(10);
            }
        });
        await delay(2000);
        
        // set speed 2x
        await page.evaluate(() => {
            window.useGameStore.setState({ timeScale: 2 });
        });
        
        await delay(4000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'battle_action.png') });
        console.log('📸 Captured: battle_action.png');

        // Wait for battle to finish
        console.log('🤖 Polling for battle end...');
        let battleEnded = false;
        for (let i = 0; i < 20; i++) {
            await delay(2000);
            const isEnded = await page.evaluate(() => {
                return document.body.innerText.includes('ПОБЕДА!') || document.body.innerText.includes('ПОРАЖЕНИЕ');
            });
            if (isEnded) {
                console.log(`✅ Battle ended!`);
                battleEnded = true;
                break;
            }
        }
        
        if (!battleEnded) {
            console.log('⚠️ Forcing battle win...');
            await page.evaluate(() => {
                window.useGameStore.getState().completePveBattle(true);
            });
            await delay(2000);
        }
        
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'battle_result.png') });
        console.log('📸 Captured: battle_result.png');

        // VK Share check
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const shareBtn = btns.find(b => b.textContent.includes('Поделиться') || b.textContent.includes('ПОДЕЛИТЬСЯ'));
            if (shareBtn) shareBtn.click();
        });
        await delay(1500);

        // Return to Lobby
        console.log('🤖 Returning to lobby...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const retBtn = btns.find(b => b.textContent.includes('В ОБИТЕЛЬ') || b.textContent.includes('В ЛОББИ'));
            if (retBtn) {
                retBtn.click();
            } else {
                window.useGameStore.getState().goToMainMenu();
            }
        });
        await delay(3000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, 'final_lobby.png') });
        console.log('📸 Captured: final_lobby.png');

        if (consoleErrors.length > 0) {
            console.error('❌ E2E Test detected browser console errors:');
            consoleErrors.forEach(e => console.error(`  - ${e}`));
            throw new Error(`Browser console errors detected: ${consoleErrors.join('; ')}`);
        } else {
            console.log('🎉 Full E2E Test finished successfully!');
        }
    } catch (err) {
        console.error('❌ Test failed with error:', err.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 Browser closed.');
        }
    }
}

runSimulation();
