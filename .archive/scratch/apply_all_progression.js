import fs from 'fs';
import path from 'path';

// 1. Load the raw data to see items and their current tier mappings
const planContent = fs.readFileSync('scratch/plan_tiers.js', 'utf8');
const mappingMatch = planContent.match(/const tierMapping = ({[\s\S]+?});\s*\r?\n\r?\nconst tierLevels/);
let tierMapping;
try {
    tierMapping = eval(`(${mappingMatch[1]})`);
} catch (e) {
    console.error("Failed to parse tierMapping:", e);
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync('scratch/slot_raw_data.json', 'utf8'));
const slots = {
    weapons: 'weapons.ts',
    helmets: 'helmets.ts',
    armor: 'armor.ts',
    shields: 'shields.ts',
    shoulders: 'shoulders.ts',
    pants: 'pants.ts',
    boots: 'boots.ts'
};

// New ranges proposed by the user:
const rarityRanges = {
    COMMON: { min: 1, max: 10 },
    RARE: { min: 11, max: 27 },
    EPIC: { min: 28, max: 46 },
    LEGENDARY: { min: 47, max: 63 },
    MYTHIC: { min: 64, max: 80 }
};

const tierRarities = {
    1: 'COMMON', 2: 'COMMON',
    3: 'RARE', 4: 'RARE', 5: 'RARE',
    6: 'EPIC', 7: 'EPIC',
    8: 'LEGENDARY', 9: 'LEGENDARY',
    10: 'MYTHIC', 11: 'MYTHIC'
};

// Starter levels override
const starterLevels = {
    weapons: { stick: 1, sling_leather: 3 },
    helmets: { bandana: 1, starter_helm: 3 },
    armor: { ragged_tunic: 1, starter_armor: 3 },
    shields: { starter_shield: 1 },
    pants: { pants_void: 1, pants_mythic: 3 },
    boots: { kozhanye_porshni: 1, boots_wanderer: 3 }
};

const rarityConfigs = {
    COMMON: { base: 1, mult: 0.05 },
    RARE: { base: 2, mult: 0.08 },
    EPIC: { base: 3, mult: 0.12 },
    LEGENDARY: { base: 5, mult: 0.18 },
    MYTHIC: { base: 8, mult: 0.25 }
};

const slotBaseValues = {
    weapons: { atk: 30 },
    helmets: { def: 8, hp: 80 },
    armor: { def: 7, hp: 70 },
    shields: { def: 9, hp: 90 },
    shoulders: { def: 5, hp: 50, atk: 3 },
    pants: { hp: 85 },
    boots: { def: 5, hp: 55 }
};

// Calculate all staggered levels dynamically
const finalLevels = {};

Object.keys(slots).forEach(slot => {
    finalLevels[slot] = {};
    const items = rawData[slot];
    
    const rarityGroups = {
        COMMON: [],
        RARE: [],
        EPIC: [],
        LEGENDARY: [],
        MYTHIC: []
    };
    
    items.forEach(item => {
        const tier = tierMapping[slot][item.id];
        const rarity = tierRarities[tier];
        rarityGroups[rarity].push({ id: item.id, tier });
    });
    
    Object.entries(rarityGroups).forEach(([rarity, group]) => {
        if (group.length === 0) return;
        
        group.sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return a.id.localeCompare(b.id);
        });
        
        const range = rarityRanges[rarity];
        
        if (rarity === 'COMMON') {
            const overrideMap = starterLevels[slot] || {};
            const nonStartersInGroup = group.filter(item => overrideMap[item.id] === undefined);
            
            // Set overrides
            group.forEach(item => {
                if (overrideMap[item.id] !== undefined) {
                    finalLevels[slot][item.id] = overrideMap[item.id];
                }
            });
            
            // Distribute non-starters in COMMON (between 5 and 10)
            if (nonStartersInGroup.length > 0) {
                const minLvl = 5;
                const maxLvl = 10;
                const span = maxLvl - minLvl;
                
                if (nonStartersInGroup.length === 1) {
                    finalLevels[slot][nonStartersInGroup[0].id] = maxLvl;
                } else {
                    nonStartersInGroup.forEach((item, index) => {
                        const ratio = index / (nonStartersInGroup.length - 1);
                        finalLevels[slot][item.id] = Math.round(minLvl + ratio * span);
                    });
                }
            }
        } else {
            const minLvl = range.min;
            const maxLvl = range.max;
            const span = maxLvl - minLvl;
            
            if (group.length === 1) {
                finalLevels[slot][group[0].id] = maxLvl;
            } else {
                group.forEach((item, index) => {
                    const ratio = index / (group.length - 1);
                    finalLevels[slot][item.id] = Math.round(minLvl + ratio * span);
                });
            }
        }
    });
});

const itemsDir = 'src/game/configs/items';

function processFile(slot, fileName) {
    const filePath = path.join(itemsDir, fileName);
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let currentItem = null;
    let startIdx = -1;
    const replacements = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace('\r', '');
        const startMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\{\s*$/);
        if (startMatch) {
            currentItem = startMatch[1];
            startIdx = i;
            continue;
        }
        
        if (currentItem && line.match(/^\s*\}\s*,\s*$/)) {
            const endIdx = i;
            const bodyLines = lines.slice(startIdx + 1, endIdx);
            
            const level = finalLevels[slot][currentItem];
            if (level === undefined) {
                console.warn(`Warning: Item ${currentItem} in slot ${slot} has no calculated level mapping!`);
                currentItem = null;
                continue;
            }
            
            // Find correct rarity bracket based on calculated level
            let rarity = 'COMMON';
            if (level >= 11 && level <= 27) rarity = 'RARE';
            else if (level >= 28 && level <= 46) rarity = 'EPIC';
            else if (level >= 47 && level <= 63) rarity = 'LEGENDARY';
            else if (level >= 64) rarity = 'MYTHIC';
            
            // Calculate new stats
            const cfg = rarityConfigs[rarity];
            const baseVals = slotBaseValues[slot];
            const factor = cfg.base + level * cfg.mult;
            
            const newStats = {};
            if (baseVals.atk) newStats.attackBonus = Math.round(baseVals.atk * factor);
            if (baseVals.def) newStats.defenseBonus = Math.round(baseVals.def * factor);
            if (baseVals.hp) newStats.hpBonus = Math.round(baseVals.hp * factor);
            
            // Build the updated lines for the body
            const updatedBodyLines = [];
            const processedKeys = new Set(['requiredLevel', 'rarity', 'attackBonus', 'defenseBonus', 'hpBonus']);
            
            for (let bodyLine of bodyLines) {
                const trimmed = bodyLine.trim();
                const keyMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*:/);
                if (keyMatch && processedKeys.has(keyMatch[1])) {
                    continue; // Skip these keys, we will insert updated ones
                }
                updatedBodyLines.push(bodyLine);
            }
            
            // Insert updated/new properties
            const inserts = [
                `        requiredLevel: ${level},`,
                `        rarity: '${rarity}',`
            ];
            
            if (newStats.attackBonus !== undefined) inserts.push(`        attackBonus: ${newStats.attackBonus},`);
            if (newStats.defenseBonus !== undefined) inserts.push(`        defenseBonus: ${newStats.defenseBonus},`);
            if (newStats.hpBonus !== undefined) inserts.push(`        hpBonus: ${newStats.hpBonus},`);
            
            // Insert right at the beginning or after name/id
            let insertIdx = 0;
            for (let k = 0; k < updatedBodyLines.length; k++) {
                if (updatedBodyLines[k].includes('id:') || updatedBodyLines[k].includes('name:')) {
                    insertIdx = k + 1;
                }
            }
            updatedBodyLines.splice(insertIdx, 0, ...inserts);
            
            replacements.push({
                start: startIdx + 1,
                end: endIdx,
                lines: updatedBodyLines
            });
            
            currentItem = null;
        }
    }
    
    // Apply replacements from bottom to top
    replacements.sort((a, b) => b.start - a.start);
    for (let rep of replacements) {
        lines.splice(rep.start, rep.end - rep.start, ...rep.lines);
    }
    
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Successfully updated ${fileName}`);
}

Object.entries(slots).forEach(([slot, file]) => {
    processFile(slot, file);
});
