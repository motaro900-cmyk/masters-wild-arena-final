const fs = require('fs');
const path = require('path');

console.log('📦 Starting Balanced Content Generator...');

// Scaling ratios
const RARITY_MULTIPLIERS = {
    COMMON: 1.0,
    UNCOMMON: 1.3,
    RARE: 1.8,
    EPIC: 2.5,
    LEGENDARY: 3.8,
    MYTHIC: 5.5,
};

const SLOT_STATS = {
    WEAPONS: { statName: 'attackBonus', base: 10, multiplier: 1.25 },
    HELMETS: { statName: 'hpBonus', base: 120, multiplier: 1.22 },
    ARMOR: { statName: 'defenseBonus', base: 8, multiplier: 1.23 },
    SHIELDS: { statName: 'defenseBonus', base: 6, multiplier: 1.20 },
    PANTS: { statName: 'hpBonus', base: 80, multiplier: 1.21 },
    BOOTS: { statName: 'hpBonus', base: 50, multiplier: 1.18 },
    SHOULDERS: { statName: 'attackBonus', base: 5, multiplier: 1.15 }
};

// Generate balanced items
function generateItems() {
    const generated = {};
    const slots = Object.keys(SLOT_STATS);
    const rarities = Object.keys(RARITY_MULTIPLIERS);

    slots.forEach(slot => {
        const config = SLOT_STATS[slot];
        rarities.forEach((rarity, rIdx) => {
            for (let level = 1; level <= 10; level++) {
                const id = `${slot.toLowerCase()}_t${level}_${rarity.toLowerCase()}`;
                const rMult = RARITY_MULTIPLIERS[rarity];
                
                // Exponential stats scaling
                const baseStatValue = Math.round(config.base * Math.pow(config.multiplier, level - 1) * rMult);
                const priceGold = Math.round(150 * Math.pow(1.6, level) * rMult);
                const priceGem = rarity === 'LEGENDARY' || rarity === 'MYTHIC' ? Math.round(20 * level * rMult) : 0;

                const nameMap = {
                    WEAPONS: ['Меч', 'Посох', 'Лук', 'Топор', 'Молот'],
                    HELMETS: ['Шлем', 'Капюшон', 'Корона', 'Маска'],
                    ARMOR: ['Доспех', 'Роба', 'Кираса', 'Колет'],
                    SHIELDS: ['Щит', 'Баклер', 'Эгида'],
                    PANTS: ['Поножи', 'Штаны', 'Брюки'],
                    BOOTS: ['Сапоги', 'Ботинки', 'Тулки'],
                    SHOULDERS: ['Наплечники', 'Погоны', 'Щитки']
                };

                const prefixMap = {
                    COMMON: 'Простой',
                    UNCOMMON: 'Укрепленный',
                    RARE: 'Редкий',
                    EPIC: 'Эпический',
                    LEGENDARY: 'Легендарный',
                    MYTHIC: 'Мифический'
                };

                const nameList = nameMap[slot];
                const baseName = nameList[(level + rIdx) % nameList.length];
                const prefix = prefixMap[rarity];

                const item = {
                    id,
                    name: `${prefix} ${baseName} (Т-${level})`,
                    rarity,
                    desc: `Сбалансированное снаряжение ранга ${rarity} для игроков ${level} уровня.`,
                    mainTab: 'ARSENAL',
                    subTab: slot,
                    requiredLevel: level,
                    priceGold,
                    priceGem: priceGem || undefined,
                    [config.statName]: baseStatValue,
                };

                // Add secondary stats for epic/legendary/mythic
                if (rarity === 'EPIC' || rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                    if (slot === 'WEAPONS') {
                        item.critChance = 5 + level;
                        item.attackSpeed = 1.05 + (level * 0.02);
                    } else if (slot === 'ARMOR' || slot === 'SHIELDS') {
                        item.evasion = 3 + level;
                    }
                }

                generated[id] = item;
            }
        });
    });

    return generated;
}

// Generate balanced mobs
function generateMobs() {
    const generated = [];
    const names = ['Каменный Голем', 'Лесной Паук', 'Волк Обители', 'Пещерный Грифон', 'Болотная Пантера', 'Хранитель Рощи'];
    
    for (let level = 1; level <= 30; level++) {
        const baseName = names[level % names.length];
        const isBoss = level % 5 === 0;
        const difficultyMult = 1.0 + (level * 0.18);
        
        const mob = {
            id: `gen_mob_level_${level}`,
            name: isBoss ? `🔥 БОСС: ${baseName}` : baseName,
            level,
            rarity: isBoss ? 'BOSS' : (level % 3 === 0 ? 'EPIC' : 'COMMON'),
            baseStats: {
                hp: Math.round(400 * difficultyMult * (isBoss ? 1.8 : 1.0)),
                attack: Math.round(40 * difficultyMult * (isBoss ? 1.35 : 1.0)),
                defense: Math.round(10 * difficultyMult),
                speed: parseFloat((1.0 + (level * 0.01)).toFixed(2)),
                crit: isBoss ? 0.2 : 0.1
            }
        };
        generated.push(mob);
    }
    return generated;
}

const itemsDb = generateItems();
const mobsDb = generateMobs();

const outputDir = path.join(__dirname, '..', 'src', 'game', 'configs', 'generated');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'balanced_items.json'), JSON.stringify(itemsDb, null, 4));
fs.writeFileSync(path.join(outputDir, 'balanced_mobs.json'), JSON.stringify(mobsDb, null, 4));

console.log(`✅ Balanced content generated!`);
console.log(`- Saved ${Object.keys(itemsDb).length} items to src/game/configs/generated/balanced_items.json`);
console.log(`- Saved ${mobsDb.length} mobs to src/game/configs/generated/balanced_mobs.json`);
