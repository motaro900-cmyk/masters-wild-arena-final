import fs from 'fs';

// Load the raw data to see items and their current tier mappings
const planContent = fs.readFileSync('scratch/plan_tiers.js', 'utf8');
const mappingMatch = planContent.match(/const tierMapping = ({[\s\S]+?});\s*\r?\n\r?\nconst tierLevels/);
let tierMapping = eval(`(${mappingMatch[1]})`);

const rawData = JSON.parse(fs.readFileSync('scratch/slot_raw_data.json', 'utf8'));
const slots = ['weapons', 'helmets', 'armor', 'shields', 'shoulders', 'pants', 'boots'];

const rarityRanges = {
    COMMON: { min: 1, max: 8 },
    RARE: { min: 10, max: 22 },
    EPIC: { min: 26, max: 46 },
    LEGENDARY: { min: 50, max: 60 },
    MYTHIC: { min: 65, max: 80 }
};

const tierRarities = {
    1: 'COMMON', 2: 'COMMON',
    3: 'RARE', 4: 'RARE', 5: 'RARE',
    6: 'EPIC', 7: 'EPIC',
    8: 'LEGENDARY', 9: 'LEGENDARY',
    10: 'MYTHIC', 11: 'MYTHIC'
};

// We will store the new staggered levels here
const newLevels = {};

slots.forEach(slot => {
    newLevels[slot] = {};
    const items = rawData[slot];
    
    // Group items by their rarity based on mapped tier
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
        rarityGroups[rarity].push({ id: item.id, name: item.name, tier });
    });
    
    // For each rarity, sort by tier then ID, then stagger their levels within range
    Object.entries(rarityGroups).forEach(([rarity, group]) => {
        if (group.length === 0) return;
        
        group.sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return a.id.localeCompare(b.id);
        });
        
        const range = rarityRanges[rarity];
        const span = range.max - range.min;
        
        if (group.length === 1) {
            newLevels[slot][group[0].id] = range.min;
        } else {
            group.forEach((item, index) => {
                // Linear distribution
                const ratio = index / (group.length - 1);
                const lvl = Math.round(range.min + ratio * span);
                newLevels[slot][item.id] = lvl;
            });
        }
    });
});

console.log("Calculated new levels:");
console.log(JSON.stringify(newLevels, null, 2));
