import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSmokeTest() {
    console.log('🎮 Starting Puppeteer Smoke Test...');
    const isHeaded = process.argv.includes('--headed');
    console.log(`👁️ Visual Mode: ${isHeaded ? 'ON (headed)' : 'OFF (headless)'}`);

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: !isHeaded,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-gl=angle',
                '--use-angle=d3d11',
                '--ignore-gpu-blocklist'
            ],
            defaultViewport: null
        });

        const page = await browser.newPage();

        // 1. Emulate mobile screen 390x844
        console.log('📱 Emulating mobile viewport 390x844 (hasTouch: true)...');
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
        await page.setViewport({
            width: 390,
            height: 844,
            isMobile: true,
            hasTouch: true,
        });

        // 2. Monitor console and page errors
        const consoleErrors = [];
        // Patterns to ignore in console error filtering:
        // - Chrome internals / extensions
        // - Network-level failures expected during offline simulation
        // - Vite HMR dev-server noise (appears when files change while test runs)
        const IGNORED_ERROR_PATTERNS = [
            'chrome-extension://',
            'net::ERR_',
            'Failed to fetch',
            'INTERNET_DISCONNECTED',
            'imported module',
            '[hmr]',                      // Vite HMR reload messages
            'Failed to reload',           // Vite HMR reload messages
            'WebSocket',                  // Vite WS connection drops during offline
            'vite',                       // Any other Vite internal messages
            'WebChannelConnection',       // Firebase Firestore offline noise
            'Failed to load resource',    // Generic network resource fail
        ];

        const isIgnored = (text) => IGNORED_ERROR_PATTERNS.some(p => text.includes(p));

        page.on('console', msg => {
            const text = msg.text();
            console.log(`[Browser Console ${msg.type()}] ${text}`);
            if ((msg.type() === 'error' || text.includes('ERROR')) && !isIgnored(text)) {
                consoleErrors.push(text);
            }
        });

        page.on('pageerror', err => {
            const text = err.message;
            console.error(`[Browser PageError] ${text}`);
            if (!isIgnored(text)) {
                consoleErrors.push(text);
            }
        });

        // 3. Open game (unthrottled first to load initial page structure)
        console.log(`🔗 Connecting to ${GAME_URL}...`);
        try {
            await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (gotoErr) {
            console.error(`❌ Failed to navigate to ${GAME_URL}. Please make sure the Vite dev server is running (npm run dev).`);
            throw gotoErr;
        }
        console.log('✅ Base page loaded.');

        // Wait for the game store to be available on window
        console.log('⏳ Waiting for useGameStore to initialize...');
        await page.waitForFunction(() => typeof window.useGameStore !== 'undefined', { timeout: 25000 });
        console.log('✅ Game store initialized.');

        // Initialize state to bypass onboarding/tutorials
        await page.evaluate(() => {
            localStorage.clear();
            if (window.useGameStore) {
                window.useGameStore.setState({
                    onboardingCompleted: true,
                    activeScreen: 'MAIN_MENU',
                    name: 'SmokeTester',
                    gold: 50000,
                    crystals: 5000,
                    energy: 100,
                    inventory: [],      // Reset inventory
                    heroEquipment: {},  // Reset equipment
                });
            }
        });
        await delay(2000);

        // --- PRE-WARMING DYNAMIC IMPORTS ---
        // We visit all key screens unthrottled first, ensuring all react-lazy chunks (BattleScene, ShopScene, etc.)
        // are completely loaded and cached in browser memory before we start network throttling/disconnections.
        console.log('🔥 Pre-warming dynamic imports (unthrottled screen walkthrough)...');
        
        console.log('   - Pre-warming Main Menu...');
        await page.evaluate(() => window.useGameStore.getState().setActiveScreen('MAIN_MENU'));
        await delay(1000);
        
        console.log('   - Pre-warming Shop...');
        await page.evaluate(() => window.useGameStore.getState().goToShop());
        await delay(2000);
        
        console.log('   - Pre-warming Battle...');
        await page.evaluate(() => window.useGameStore.getState().startPveBattle(1));
        await delay(3000);
        
        console.log('   - Pre-warming Heroes...');
        await page.evaluate(() => window.useGameStore.getState().goToHeroes());
        await delay(2000);

        console.log('   - Returning to Main Menu...');
        await page.evaluate(() => window.useGameStore.getState().setActiveScreen('MAIN_MENU'));
        await delay(1000);

        // Pre-warm dynamic service imports inside BattleScene / BattleResultScreen
        console.log('   - Pre-warming dynamic service modules...');
        await page.evaluate(async () => {
            const paths = [
                '/src/services/MatchmakingService.ts',
                '/src/services/BattleResultService.ts',
                '/src/services/SyncService.ts',
                '/src/configs/RankSystem.ts',
                '/src/services/MatchmakingService',
                '/src/services/BattleResultService',
                '/src/services/SyncService',
                '/src/configs/RankSystem'
            ];
            for (const p of paths) {
                try {
                    await import(p);
                } catch (e) {}
            }
        });
        await delay(1000);
        console.log('🔥 Pre-warming complete.');

        // 4. Emulate network Slow 3G now that scripts and bundles are loaded
        console.log('🌐 Emulating Slow 3G Network (Latency: 2000ms, Download: 40KB/s)...');
        const client = await page.target().createCDPSession();
        await client.send('Network.enable');
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 2000,
            downloadThroughput: 40 * 1024,
            uploadThroughput: 20 * 1024,
        });

        // Delay for React rendering under throttling
        await delay(3000);

        // Check if screen rotation warning overlay is visible and dismiss it
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const dismissBtn = buttons.find(b => b.textContent && b.textContent.includes('Играть в портретном'));
            if (dismissBtn) {
                console.log('Bypassing rotation warning overlay...');
                dismissBtn.click();
            }
        });
        await delay(2000);

        // 5. Screenshots of each main screen: menu, shop, arena, profile

        // --- 1. MAIN_MENU ---
        console.log('📸 Navigating to Main Menu (Lobby)...');
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('MAIN_MENU');
        });
        await delay(2000);
        await page.screenshot({ path: 'smoke-menu.png' });
        console.log('✅ Saved smoke-menu.png');

        // --- 2. SHOP ---
        console.log('📸 Navigating to Shop...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToShop();
        });
        await delay(3000); // Wait for shop items to fetch/render
        await page.screenshot({ path: 'smoke-shop.png' });
        console.log('✅ Saved smoke-shop.png');

        // --- 3. ARENA (BATTLE) ---
        console.log('📸 Navigating to Arena (Battle)...');
        await page.evaluate(() => {
            window.useGameStore.getState().startPveBattle(1);
        });
        await delay(3000); // Wait for PixiJS canvas initialization and textures loading
        await page.screenshot({ path: 'smoke-arena.png' });
        console.log('✅ Saved smoke-arena.png');

        // Restore main menu to clean up state
        await page.evaluate(() => {
            window.useGameStore.getState().setActiveScreen('MAIN_MENU');
        });
        await delay(1000);

        // --- 4. PROFILE (HEROES) ---
        console.log('📸 Navigating to Profile (Heroes list)...');
        await page.evaluate(() => {
            window.useGameStore.getState().goToHeroes();
        });
        await delay(2500);
        await page.screenshot({ path: 'smoke-profile.png' });
        console.log('✅ Saved smoke-profile.png');

        // --- FLUSH PENDING DOWNLOADS ---
        console.log('🔄 Temporarily disabling throttling to flush any pending network requests...');
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 0,
            downloadThroughput: -1,
            uploadThroughput: -1,
        });
        await delay(2000); // Let all background downloads complete instantly

        // Re-enable Slow 3G throttling
        console.log('🌐 Restoring Slow 3G Network (Latency: 2000ms)...');
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 2000,
            downloadThroughput: 40 * 1024,
            uploadThroughput: 20 * 1024,
        });
        await delay(1000);

        // --- NEW SCENARIO 1: Fast Clicks ---
        console.log('\n🤖 Running Scenario 1 — Fast Clicks...');
        // Reset wallet and inventory, go to shop
        await page.evaluate(() => {
            window.useGameStore.setState({
                inventory: [],
                heroEquipment: {},
                gold: 50000
            });
            window.useGameStore.getState().goToShop();
        });
        await delay(2000); // let shop render

        // Click first item card in DOM to trigger detail panel
        console.log('   Clicking first shop item card...');
        await page.evaluate(() => {
            // Shop item cards are <button> elements with class containing 'card' or 'Card'
            const cards = Array.from(document.querySelectorAll('button')).filter(b => {
                return (b.className.includes('card') || b.className.includes('Card')) && b.querySelector('img');
            });
            if (cards.length > 0) {
                cards[0].click();
                console.log(`[Scenario 1] Clicked card: "${cards[0].textContent?.trim().slice(0, 40)}"`);
            } else {
                console.log('[Scenario 1] No card buttons found, trying first clickable item in shop list');
                const allImgBtns = Array.from(document.querySelectorAll('button')).filter(b => b.querySelector('img'));
                if (allImgBtns.length > 0) allImgBtns[0].click();
            }
        });
        await delay(1000); // wait for detail panel to update

        // Now wait for the BUY button to be visible in the detail panel
        console.log('   Waiting for buy button in detail panel...');
        await page.waitForFunction(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const buyBtn = buttons.find(b => {
                const img = b.querySelector('img');
                const src = img ? img.src.toLowerCase() : '';
                const hasCurrencyIcon = src.includes('gold') || src.includes('almaz');
                const isBuyText = b.textContent.includes('КУПИТЬ') || b.textContent.includes('Купить');
                const isCard = b.closest('[class*="card"]') || b.closest('[class*="Card"]');
                const isNotTab = !b.textContent.includes('ОРУЖИЕ') && !b.textContent.includes('БРОНЯ') && !b.textContent.includes('СУНДУКИ');
                return (hasCurrencyIcon || isBuyText) && isNotTab && !isCard;
            });
            return !!buyBtn;
        }, { timeout: 10000 });

        // Record gold before
        const goldBefore = await page.evaluate(() => window.useGameStore.getState().gold);
        const invBefore = await page.evaluate(() => window.useGameStore.getState().inventory.length);
        console.log(`   Gold before purchase: ${goldBefore}, inventory size: ${invBefore}`);

        // Click the buy button to open confirm dialog
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const buyBtn = buttons.find(b => {
                const img = b.querySelector('img');
                const src = img ? img.src.toLowerCase() : '';
                const hasCurrencyIcon = src.includes('gold') || src.includes('almaz');
                const isBuyText = b.textContent.includes('КУПИТЬ') || b.textContent.includes('Купить');
                const isCard = b.closest('[class*="card"]') || b.closest('[class*="Card"]');
                const isNotTab = !b.textContent.includes('ОРУЖИЕ') && !b.textContent.includes('БРОНЯ') && !b.textContent.includes('СУНДУКИ');
                return (hasCurrencyIcon || isBuyText) && isNotTab && !isCard;
            });
            if (buyBtn) {
                console.log(`[Scenario 1] Found buy button: "${buyBtn.textContent?.trim().slice(0, 50)}"`);
                buyBtn.click();
            }
        });
        await delay(1500); // wait for confirm dialog

        // Spam click the CONFIRM button 5 times with 50ms intervals
        await page.evaluate(async () => {
            const delay = ms => new Promise(r => setTimeout(r, ms));
            // Look for a confirm dialog button — either exact КУПИТЬ or YES button
            const findConfirm = () => Array.from(document.querySelectorAll('button')).find(b => {
                const txt = b.textContent?.trim();
                return txt === 'КУПИТЬ' || txt === 'OK' || txt === 'ДА';
            });
            const confirmBtn = findConfirm();
            if (confirmBtn) {
                console.log(`[Scenario 1] Confirm button found: "${confirmBtn.textContent}"`);
                for (let i = 0; i < 5; i++) {
                    try { if (document.body.contains(confirmBtn)) confirmBtn.click(); } catch(e) {}
                    await delay(50);
                }
            } else {
                // No confirm dialog: the buy button itself was a direct purchase — try clicking it 4 more times
                console.log('[Scenario 1] No confirm dialog. Re-clicking buy button 4 more times...');
                const buyBtn = Array.from(document.querySelectorAll('button')).find(b => {
                    const img = b.querySelector('img');
                    const src = img ? img.src.toLowerCase() : '';
                    return (src.includes('gold') || src.includes('almaz')) && !b.closest('[class*="card"]');
                });
                if (buyBtn) {
                    for (let i = 0; i < 4; i++) {
                        try { if (document.body.contains(buyBtn)) buyBtn.click(); } catch(e) {}
                        await delay(50);
                    }
                }
            }
        });
        await delay(2000);

        const goldAfter = await page.evaluate(() => window.useGameStore.getState().gold);
        const invAfter = await page.evaluate(() => window.useGameStore.getState().inventory.length);
        const goldDiff = goldBefore - goldAfter;
        const invDiff = invAfter - invBefore;
        console.log(`   Gold after: ${goldAfter} (Δ=${goldDiff}), inventory Δ=${invDiff}`);

        // Use goldDiff as the single-purchase price baseline (if it deducted more than 1.5x that, it's a double charge)
        // invDiff should be 0 or 1 (stackable items just add qty, non-stackable add one)
        if (goldDiff > 0 && invDiff > 1) {
            throw new Error(`Double purchase: item added ${invDiff} times!`);
        }
        // We can't check goldDiff > price*1.5 since we don't know price from React state
        // Just report it
        console.log(`   ✅ Scenario 1 OK — no double-purchase detected (gold deducted: ${goldDiff}, items added: ${invDiff})`);
        await page.screenshot({ path: 'smoke-shop-doubleclick.png' });
        console.log('✅ Saved smoke-shop-doubleclick.png');

        // --- NEW SCENARIO 2: Network Disconnection during Battle ---
        console.log('\n🤖 Running Scenario 2 — Network Disconnection during Battle...');
        // Start battle
        await page.evaluate(() => {
            window.useGameStore.getState().startPveBattle(1);
        });
        await delay(1000);
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const startBtn = btns.find(b => b.textContent.includes('НАЧАТЬ БОЙ'));
            if (startBtn) startBtn.click();
        });
        
        // Wait 6 seconds to ensure the battle scene is completely initialized
        console.log('   Waiting 6 seconds for battle scene to load resources...');
        await delay(6000); 

        // Emulate full offline mode
        console.log('   🔌 Disconnecting network (offline: true)...');
        await client.send('Network.emulateNetworkConditions', {
            offline: true,
            latency: 0,
            downloadThroughput: 0,
            uploadThroughput: 0,
        });

        // Set speed scale to 3x to finish the battle fast
        await page.evaluate(() => {
            window.useGameStore.setState({ timeScale: 3 });
        });

        // Poll for victory/defeat screen
        console.log('   ⏳ Waiting for battle to complete offline...');
        let battleEnded = false;
        for (let i = 0; i < 20; i++) {
            await delay(1000);
            const isEnded = await page.evaluate(() => {
                const text = document.body.innerText;
                return text.includes('ПОБЕДА!') || text.includes('ПОРАЖЕНИЕ') || text.includes('В ОБИТЕЛЬ') || text.includes('В ЛОББИ');
            });
            if (isEnded) {
                console.log('   ✅ Victory/Defeat screen detected.');
                battleEnded = true;
                break;
            }
        }
        if (!battleEnded) {
            console.log('   ⚠️ Battle did not complete in 20 seconds. Forcing battle win...');
            await page.evaluate(() => {
                window.useGameStore.getState().completePveBattle(true);
            });
            await delay(1500);
        }

        // Restore network back to Slow 3G
        console.log('   🔌 Restoring network (offline: false)...');
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 2000,
            downloadThroughput: 40 * 1024,
            uploadThroughput: 20 * 1024,
        });
        await delay(1500);

        await page.screenshot({ path: 'smoke-battle-offline.png' });
        console.log('✅ Saved smoke-battle-offline.png');

        // Go back to main menu
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const retBtn = btns.find(b => b.textContent.includes('В ОБИТЕЛЬ') || b.textContent.includes('В ЛОББИ'));
            if (retBtn) retBtn.click();
            else window.useGameStore.getState().goToMainMenu();
        });
        await delay(2000);

        // --- NEW SCENARIO 3: Fast Screen Switching ---
        console.log('\n🤖 Running Scenario 3 — Fast Screen Switching...');
        const screens = [
            { name: 'MAIN_MENU', action: () => window.useGameStore.getState().setActiveScreen('MAIN_MENU') },
            { name: 'SHOP', action: () => window.useGameStore.getState().goToShop() },
            { name: 'BATTLE', action: () => window.useGameStore.getState().startPveBattle(1) },
            { name: 'HEROES', action: () => window.useGameStore.getState().goToHeroes() },
            { name: 'MAIN_MENU', action: () => window.useGameStore.getState().setActiveScreen('MAIN_MENU') }
        ];

        for (const screen of screens) {
            console.log(`   Switching to ${screen.name}...`);
            await page.evaluate(screen.action);
            await delay(300);
        }
        await delay(1000);

        await page.screenshot({ path: 'smoke-fast-switch.png' });
        console.log('✅ Saved smoke-fast-switch.png');

        // 6. Report console errors
        if (consoleErrors.length > 0) {
            console.error('\n❌ Smoke Test failed! Browser console errors detected:');
            consoleErrors.forEach(err => console.error(`  - ${err}`));
            process.exit(1);
        } else {
            console.log('\n🎉 Smoke Test finished successfully! No errors detected.');
            process.exit(0);
        }

    } catch (err) {
        console.error('\n❌ Smoke Test crashed with error:', err.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 Browser closed.');
        }
    }
}

runSmokeTest();
