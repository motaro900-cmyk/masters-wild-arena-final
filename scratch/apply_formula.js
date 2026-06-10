import fs from 'fs';
import path from 'path';

const itemsDir = 'src/game/configs/items';

const rarityConfigs = {
    COMMON: { base: 1, mult: 0.05 },
    RARE: { base: 2, mult: 0.08 },
    EPIC: { base: 3, mult: 0.12 },
    LEGENDARY: { base: 5, mult: 0.18 },
    MYTHIC: { base: 8, mult: 0.25 }
};

const slotBases = {
    helmets: { def: 'defenseBonus', hp: 'hpBonus' },
    armor: { def: 'defenseBonus', hp: 'hpBonus' },
    shields: { def: 'defenseBonus', hp: 'hpBonus' },
    shoulders: { def: 'defenseBonus', hp: 'hpBonus', atk: 'attackBonus' },
    pants: { hp: 'hpBonus' },
    boots: { def: 'defenseBonus', hp: 'hpBonus' }
};

const slotBaseValues = {
    helmets: { def: 8, hp: 80 },
    armor: { def: 7, hp: 70 },
    shields: { def: 9, hp: 90 },
    shoulders: { def: 5, hp: 50, atk: 3 },
    pants: { hp: 85 },
    boots: { def: 5, hp: 55 }
};

function processFile(fileName, slot) {
    const filePath = path.join(itemsDir, fileName);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We will parse the file using our scanner, but this time we will do a targeted replacement
    // of the item block values.
    const lines = content.split('\n');
    let currentItem = null;
    let currentLines = [];
    let startIdx = -1;
    
    const replacements = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace('\r', '');
        const startMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\{\s*$/);
        if (startMatch) {
            currentItem = startMatch[1];
            currentLines = [];
            startIdx = i;
            continue;
        }
        
        if (currentItem && line.match(/^\s*\}\s*,\s*$/)) {
            const endIdx = i;
            // Process item block
            const bodyLines = lines.slice(startIdx + 1, endIdx);
            const body = bodyLines.join('\n');
            
            const rarityMatch = body.match(/rarity\s*:\s*(?:ItemRarity\.)?['"`]?([A-Za-z0-9_]+)['"`]?/);
            const reqLvlMatch = body.match(/requiredLevel\s*:\s*(\d+)/);
            
            if (rarityMatch && reqLvlMatch) {
                let rarity = rarityMatch[1];
                if (rarity.startsWith('ItemRarity.')) {
                    rarity = rarity.replace('ItemRarity.', '');
                }
                const requiredLevel = parseInt(reqLvlMatch[1], 10);
                
                // Calculate new values
                const cfg = rarityConfigs[rarity];
                if (cfg) {
                    const factor = cfg.base + requiredLevel * cfg.mult;
                    const baseVals = slotBaseValues[slot];
                    
                    const newStats = {};
                    if (baseVals.def) newStats.defenseBonus = Math.round(baseVals.def * factor);
                    if (baseVals.hp) newStats.hpBonus = Math.round(baseVals.hp * factor);
                    if (baseVals.atk) newStats.attackBonus = Math.round(baseVals.atk * factor);
                    
                    // Now, construct the replacement block or replace properties in bodyLines
                    // We must preserve existing fields: id, name, rarity, priceGold/priceGem, requiredLevel, image, mainTab, subTab, desc, textureKey
                    // But we want to update/replace defenseBonus, hpBonus, attackBonus and remove speedBonus/critBonus/etc. if they were in guidelines, but wait, we already did the cleanup earlier. So we only need to write the new values of defenseBonus, hpBonus, attackBonus and make sure we don't have other stats unless allowed.
                    
                    // Let's filter out old bonus fields, and add the new calculated ones.
                    const finalBodyLines = [];
                    const statsKeys = ['defenseBonus', 'hpBonus', 'attackBonus'];
                    
                    for (let bodyLine of bodyLines) {
                        const trimmed = bodyLine.trim();
                        // If it defines one of our bonuses, skip it (we will append new values at the correct spot or just insert them)
                        if (trimmed.startsWith('defenseBonus:') || trimmed.startsWith('hpBonus:') || trimmed.startsWith('attackBonus:')) {
                            continue;
                        }
                        finalBodyLines.push(bodyLine);
                    }
                    
                    // Find where to insert our new stats (e.g., right after requiredLevel or rarity)
                    let insertIdx = -1;
                    for (let k = 0; k < finalBodyLines.length; k++) {
                        if (finalBodyLines[k].includes('rarity') || finalBodyLines[k].includes('requiredLevel')) {
                            insertIdx = k;
                        }
                    }
                    if (insertIdx === -1) {
                        insertIdx = finalBodyLines.length - 1;
                    }
                    
                    const statsToAppend = [];
                    if (newStats.defenseBonus !== undefined) statsToAppend.push(`        defenseBonus: ${newStats.defenseBonus},`);
                    if (newStats.hpBonus !== undefined) statsToAppend.push(`        hpBonus: ${newStats.hpBonus},`);
                    if (newStats.attackBonus !== undefined) statsToAppend.push(`        attackBonus: ${newStats.attackBonus},`);
                    
                    finalBodyLines.splice(insertIdx + 1, 0, ...statsToAppend);
                    
                    replacements.push({
                        start: startIdx + 1,
                        end: endIdx,
                        lines: finalBodyLines
                    });
                }
            }
            currentItem = null;
            continue;
        }
    }
    
    // Perform replacements from bottom to top to preserve indices
    replacements.sort((a, b) => b.start - a.start);
    for (let rep of replacements) {
        lines.splice(rep.start, rep.end - rep.start, ...rep.lines);
    }
    
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Updated ${fileName}`);
}

const slots = {
    helmets: 'helmets.ts',
    armor: 'armor.ts',
    shields: 'shields.ts',
    shoulders: 'shoulders.ts',
    pants: 'pants.ts',
    boots: 'boots.ts'
};

Object.entries(slots).forEach(([slot, file]) => {
    processFile(file, slot);
});
