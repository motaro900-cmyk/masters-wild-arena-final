import fs from 'fs';
import path from 'path';

// Simulation Constants based on codebase
const BATTLE_GOLD_WIN = 95;  // average of 70-120
const BATTLE_GOLD_LOSS = 10;
const PVE_ENERGY_COST = 10;

// Daily quest rewards (based on screenshots)
// Quest 1: 200 Gold, 20 Gems
// Quest 2: 400 Gold, 35 Gems
// Quest 3: 250 Gold, 20 Gems
// Quest 4: 600 Gold, 50 Gems
const DAILY_QUESTS = [
    { gold: 200, gems: 20 },
    { gold: 400, gems: 35 },
    { gold: 250, gems: 20 },
    { gold: 600, gems: 50 }
];

// Login rewards average per day (including X2 multiplier)
const DAILY_LOGIN_GOLD = 170;
const DAILY_LOGIN_GEMS = 8;

// Wheel of Fortune average rewards (1 free spin/day)
// 50% chance of Gold (average 750 Gold), 50% chance of Gems (average 15 Gems)
function spinWheel() {
    if (Math.random() < 0.5) {
        return { gold: 750, gems: 0 };
    } else {
        return { gold: 0, gems: 15 };
    }
}

// Ads rewards
const AD_GOLD = 700;
const AD_GEMS = 25;

function simulatePlayer(profile, days = 7) {
    let gold = 300;     // starting gold
    let gems = 50;      // starting gems
    
    if (profile === 'Spender') {
        gems += 300;    // +300 Gems from starter pack
    }
    
    let totalBattles = 0;
    let energyPurchased = 0;
    
    const logs = [];
    
    for (let day = 1; day <= days; day++) {
        let goldEarnedToday = 0;
        let gemsEarnedToday = 0;
        
        // 1. Daily Login & Ads
        goldEarnedToday += DAILY_LOGIN_GOLD;
        gemsEarnedToday += DAILY_LOGIN_GEMS;
        
        goldEarnedToday += AD_GOLD;
        gemsEarnedToday += AD_GEMS;
        
        // 2. Wheel of Fortune
        const wheel = spinWheel();
        goldEarnedToday += wheel.gold;
        gemsEarnedToday += wheel.gems;
        
        // 3. Determine energy budget and battles
        let dailyEnergy = 150; // 100 base + 50 from ad/login
        let battles = 0;
        
        if (profile === 'Grinder' || profile === 'Spender') {
            // Wants to play 200 energy (20 battles)
            // Buys 50 energy for 100 Gems
            if (gems >= 100) {
                gems -= 100;
                energyPurchased += 50;
                dailyEnergy += 50;
            }
            battles = Math.floor(dailyEnergy / PVE_ENERGY_COST);
        } else {
            // Casual player
            // Spends 50 energy (5 battles)
            battles = 5;
        }
        
        totalBattles += battles;
        
        // 4. Battle results (80% win rate)
        for (let b = 0; b < battles; b++) {
            if (Math.random() < 0.8) {
                goldEarnedToday += BATTLE_GOLD_WIN;
            } else {
                goldEarnedToday += BATTLE_GOLD_LOSS;
            }
        }
        
        // 5. Daily Quests
        if (profile === 'Grinder' || profile === 'Spender') {
            // Completes all 4 quests
            for (let q of DAILY_QUESTS) {
                goldEarnedToday += q.gold;
                gemsEarnedToday += q.gems;
            }
        } else {
            // Casual completes 2 quests
            goldEarnedToday += DAILY_QUESTS[0].gold + DAILY_QUESTS[2].gold;
            gemsEarnedToday += DAILY_QUESTS[0].gems + DAILY_QUESTS[2].gems;
        }
        
        // Update balances
        gold += goldEarnedToday;
        gems += gemsEarnedToday;
        
        logs.push({
            day,
            goldEarned: goldEarnedToday,
            gemsEarned: gemsEarnedToday,
            goldBalance: gold,
            gemsBalance: gems
        });
    }
    
    return {
        profile,
        finalGold: gold,
        finalGems: gems,
        totalBattles,
        energyPurchased,
        logs
    };
}

console.log('=== RUNNING ECONOMY SIMULATIONS (7 DAYS) ===\n');

const casual = simulatePlayer('Casual', 7);
console.log(`[Casual Player]`);
console.log(`  Ending Gold: ${casual.finalGold}`);
console.log(`  Ending Gems: ${casual.finalGems}`);
console.log(`  Total Battles: ${casual.totalBattles}`);
console.log(`  Energy purchased: ${casual.energyPurchased}`);

const grinder = simulatePlayer('Grinder', 7);
console.log(`\n[Grinder Player - Buys Energy for Gems]`);
console.log(`  Ending Gold: ${grinder.finalGold}`);
console.log(`  Ending Gems: ${grinder.finalGems}`);
console.log(`  Total Battles: ${grinder.totalBattles}`);
console.log(`  Energy purchased: ${grinder.energyPurchased}`);

const spender = simulatePlayer('Spender', 7);
console.log(`\n[Spender Player (300 Rubles) - Buys Energy for Gems]`);
console.log(`  Ending Gold: ${spender.finalGold}`);
console.log(`  Ending Gems: ${spender.finalGems}`);
console.log(`  Total Battles: ${spender.totalBattles}`);
console.log(`  Energy purchased: ${spender.energyPurchased}`);

// Write JSON report
const reportPath = path.join(process.cwd(), 'docs/reports/simulated_scenarios.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({ casual, grinder, spender }, null, 2));
console.log(`\nSaved simulation logs to ${reportPath}`);
