import fs from 'fs';

const planContent = fs.readFileSync('scratch/plan_tiers.js', 'utf8');
const mappingMatch = planContent.match(/const tierMapping = ({[\s\S]+?});\s*\r?\n\r?\nconst tierLevels/);
let tierMapping = eval(`(${mappingMatch[1]})`);

const rawData = JSON.parse(fs.readFileSync('scratch/slot_raw_data.json', 'utf8'));
const slots = ['weapons', 'helmets', 'armor', 'shields', 'shoulders', 'pants', 'boots'];

// New ranges proposed by the user:
// COMMON: 1–10
// RARE: 11–27
// EPIC: 28–46
// LEGENDARY: 47–63
// MYTHIC: 64–80
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

// Items that MUST start at level 1 (starter items)
const starterItems = new Set([
    'stick', 'sling_leather',
    'bandana', 'starter_helm',
    'ragged_tunic', 'starter_armor',
    'starter_shield',
    'pants_mythic', 'pants_void',
    'boots_wanderer', 'kozhanye_porshni'
]);

const newLevels = {};

slots.forEach(slot => {
    newLevels[slot] = {};
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
        
        // Sort items by tier first, then by ID
        group.sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return a.id.localeCompare(b.id);
        });
        
        const range = rarityRanges[rarity];
        
        // Handle starters specially (forces level 1)
        const startersInGroup = group.filter(item => starterItems.has(item.id));
        const nonStartersInGroup = group.filter(item => !starterItems.has(item.id));
        
        startersInGroup.forEach(item => {
            newLevels[slot][item.id] = 1;
        });
        
        if (nonStartersInGroup.length > 0) {
            // For non-starters, distribute them between [range.min, range.max]
            // If it's COMMON group, min is adjusted to 4 or 5 since starters are level 1
            const minLvl = rarity === 'COMMON' ? 5 : range.min;
            const maxLvl = range.max;
            const span = maxLvl - minLvl;
            
            if (nonStartersInGroup.length === 1) {
                newLevels[slot][nonStartersInGroup[0].id] = maxLvl;
            } else {
                nonStartersInGroup.forEach((item, index) => {
                    const ratio = index / (nonStartersInGroup.length - 1);
                    newLevels[slot][item.id] = Math.round(minLvl + ratio * span);
                });
            }
        }
    });
});

console.log("Calculated staggered levels for new ranges:");
console.log(JSON.stringify(newLevels, null, 2));
