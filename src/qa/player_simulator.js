import puppeteer from 'puppeteer-core';
import { join } from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const REPORT_PATH = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\9a269537-4657-4af8-ae53-2078ea4987fb\\simulation_report.json';
const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\9a269537-4657-4af8-ae53-2078ea4987fb\\';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulator() {
    console.log('🤖 Starting Automated Player Simulator Bot (Step 22)...');
    console.log(`🔗 Connecting to local instance: ${GAME_URL}...`);

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
        
        page.on('console', msg => {
            console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
        });

        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ Game loaded. Initializing player store for simulation...');
        await delay(5000);

        // Reset player state to a known starting point
        await page.evaluate(() => {
            if (window.useGameStore) {
                window.useGameStore.setState({
                    onboardingCompleted: true,
                    name: 'SimBot',
                    activeScreen: 'MAIN_MENU',
                    showIntro: false,
                    crystals: 1000,
                    gold: 5000,
                    energy: 100,
                    level: 1,
                    xp: 0,
                    inventory: [
                        { id: 'stick_oak', level: 1, amount: 1 },
                        { id: 'starter_helm', level: 1, amount: 1 }
                    ],
                    heroEquipment: {
                        panda: {
                            WEAPONS: 'stick_oak',
                            HELMETS: 'starter_helm'
                        }
                    }
                });
                console.log('QA Sim: Player store initialized.');
            }
        });

        const history = [];
        let pveStage = 1;
        let wins = 0;
        let losses = 0;
        let purchases = 0;
        let upgrades = 0;

        const maxCycles = 30; // Perform 30 simulated actions
        for (let cycle = 1; cycle <= maxCycles; cycle++) {
            console.log(`\n--- Cycle ${cycle}/${maxCycles} ---`);

            const playerState = await page.evaluate(() => {
                const store = window.useGameStore.getState();
                const totalStats = store.getCalculatedStats ? store.getCalculatedStats('panda')?.total : {};
                return {
                    gold: store.gold,
                    crystals: store.crystals,
                    energy: store.energy,
                    level: store.level,
                    inventoryCount: store.inventory.length,
                    activeScreen: store.activeScreen,
                    stats: totalStats
                };
            });

            console.log(`Player State: Gold: ${playerState.gold}, Gems: ${playerState.crystals}, Level: ${playerState.level}, HP: ${playerState.stats?.hpBonus || 'N/A'}, Attack: ${playerState.stats?.attackBonus || 'N/A'}`);

            // Decision making
            // 1. If energy is high, fight PVE stage
            // 2. If gold is high, buy a shop item or upgrade
            // 3. Equip any better gear
            
            const actions = ['FIGHT', 'SHOP_BUY', 'FORGE_UPGRADE', 'EQUIP_GEAR'];
            let chosenAction = 'FIGHT';

            if (playerState.energy < 10) {
                chosenAction = 'SHOP_BUY'; // Buy/upgrade if no energy
            } else {
                const rand = Math.random();
                if (rand < 0.5) chosenAction = 'FIGHT';
                else if (rand < 0.75) chosenAction = 'SHOP_BUY';
                else if (rand < 0.9) chosenAction = 'FORGE_UPGRADE';
                else chosenAction = 'EQUIP_GEAR';
            }

            console.log(`Action chosen: ${chosenAction}`);

            if (chosenAction === 'FIGHT') {
                const result = await page.evaluate((stage) => {
                    const store = window.useGameStore.getState();
                    if (store.energy < 10) return { success: false, reason: 'No energy' };
                    
                    // Consume energy & start battle
                    store.startPveBattle(stage);
                    
                    // Direct math simulation of battle outcome
                    const stats = store.getCalculatedStats('panda')?.total || {};
                    const playerPower = (stats.attackBonus || 10) + (stats.hpBonus || 100) / 10;
                    const mobPower = 15 + stage * 18;
                    
                    const winChance = playerPower / (playerPower + mobPower);
                    const win = Math.random() < winChance;
                    
                    // Force complete battle
                    store.completePveBattle(win);
                    
                    return { success: true, win, stage };
                }, pveStage);

                if (result.success) {
                    if (result.win) {
                        console.log(`🏆 WIN: Fought Stage ${pveStage}!`);
                        wins++;
                        pveStage++;
                    } else {
                        console.log(`💀 LOSS: Fought Stage ${pveStage}!`);
                        losses++;
                    }
                    history.push({ cycle, action: `PVE Battle Stage ${result.stage}`, result: result.win ? 'WIN' : 'LOSS' });
                } else {
                    console.log(`⚠️ PVE battle skipped: ${result.reason}`);
                }
            } else if (chosenAction === 'SHOP_BUY') {
                const result = await page.evaluate(() => {
                    const store = window.useGameStore.getState();
                    const { ITEMS_DATABASE } = window;
                    if (!ITEMS_DATABASE) return { success: false, reason: 'ITEMS_DATABASE missing' };

                    // Find cheap items to buy
                    const affordable = Object.values(ITEMS_DATABASE).filter((item) => {
                        return item.priceGold && item.priceGold <= store.gold && !store.inventory.some((i) => i.id === item.id);
                    });

                    if (affordable.length === 0) return { success: false, reason: 'No affordable items' };

                    const itemToBuy = affordable[Math.floor(Math.random() * affordable.length)];
                    store.buyItem(itemToBuy.id, 'gold');
                    return { success: true, item: itemToBuy.name, price: itemToBuy.priceGold };
                });

                if (result.success) {
                    console.log(`🛒 BOUGHT: ${result.item} for ${result.price} gold`);
                    purchases++;
                    history.push({ cycle, action: `Buy Item: ${result.item}`, result: 'SUCCESS' });
                } else {
                    console.log(`⚠️ Shop skipped: ${result.reason}`);
                }
            } else if (chosenAction === 'FORGE_UPGRADE') {
                const result = await page.evaluate(() => {
                    const store = window.useGameStore.getState();
                    const upgradeable = store.inventory.filter((item) => {
                        const level = item.level || 1;
                        return level < 3;
                    });

                    if (upgradeable.length === 0) return { success: false, reason: 'No upgradeable items' };

                    const itemToUpgrade = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                    const success = store.upgradeItem(itemToUpgrade.id);
                    return { success, itemId: itemToUpgrade.id };
                });

                if (result.success) {
                    console.log(`🔨 UPGRADED: ${result.itemId}`);
                    upgrades++;
                    history.push({ cycle, action: `Upgrade: ${result.itemId}`, result: 'SUCCESS' });
                } else {
                    console.log(`⚠️ Upgrade skipped: ${result.reason}`);
                }
            } else if (chosenAction === 'EQUIP_GEAR') {
                const result = await page.evaluate(() => {
                    const store = window.useGameStore.getState();
                    // Equip random unequipped item
                    const unequipped = store.inventory.filter((invItem) => {
                        const gear = store.heroEquipment.panda || {};
                        return !Object.values(gear).includes(invItem.id);
                    });

                    if (unequipped.length === 0) return { success: false, reason: 'No unequipped items' };

                    const itemToEquip = unequipped[Math.floor(Math.random() * unequipped.length)];
                    store.equipItem(itemToEquip.id);
                    return { success: true, item: itemToEquip.id };
                });

                if (result.success) {
                    console.log(`🛡️ EQUIPPED: ${result.item}`);
                    history.push({ cycle, action: `Equip Item: ${result.item}`, result: 'SUCCESS' });
                } else {
                    console.log(`⚠️ Equip action skipped: ${result.reason}`);
                }
            }

            // Take a screenshot mid-way
            if (cycle === Math.floor(maxCycles / 2)) {
                await page.screenshot({ path: join(SCREENSHOT_DIR, 'sim_mid.png') });
                console.log('📸 Captured: sim_mid.png');
            }

            await delay(500);
        }

        await page.screenshot({ path: join(SCREENSHOT_DIR, 'sim_end.png') });
        console.log('📸 Captured: sim_end.png');

        // Extract final report
        const finalReport = await page.evaluate(() => {
            const store = window.useGameStore.getState();
            const stats = store.getCalculatedStats ? store.getCalculatedStats('panda')?.total : {};
            return {
                gold: store.gold,
                crystals: store.crystals,
                level: store.level,
                inventory: store.inventory,
                equipped: store.heroEquipment.panda,
                stats
            };
        });

        const reportData = {
            botName: 'PlayerSimulatorV2',
            totalCycles: maxCycles,
            pveWins: wins,
            pveLosses: losses,
            shopPurchases: purchases,
            forgeUpgrades: upgrades,
            endingGold: finalReport.gold,
            endingCrystals: finalReport.crystals,
            endingLevel: finalReport.level,
            equippedGear: finalReport.equipped,
            characterStats: finalReport.stats,
            actionHistory: history
        };

        fs.writeFileSync(REPORT_PATH, JSON.stringify(reportData, null, 4));
        console.log(`\n🎉 Simulation completed successfully!`);
        console.log(`📊 Report saved to: ${REPORT_PATH}`);
        console.log(`- Final level: ${finalReport.level}`);
        console.log(`- Wins/Losses: ${wins}/${losses}`);
        console.log(`- Upgrades: ${upgrades}, Purchases: ${purchases}`);

    } catch (err) {
        console.error('❌ Simulation execution failed:', err);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 Browser closed.');
        }
    }
}

runSimulator();
