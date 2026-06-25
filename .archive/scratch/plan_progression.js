import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('scratch/slot_raw_data.json', 'utf8'));

// We want to assign beautifully spaced level steps for each item within its rarity in each slot.
// Let's look at the number of items of each rarity in each slot.

const slots = ['weapons', 'helmets', 'armor', 'shields', 'shoulders', 'pants', 'boots'];

const rarityOrder = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];

// We want level ranges that don't overlap rarities too much, but follow a logical progression:
// COMMON: level 1 to 5
// RARE: level 10 to 20
// EPIC: level 25 to 45
// LEGENDARY: level 50 to 60
// MYTHIC: level 65 to 80

const slotsProposal = {};

slots.forEach(slot => {
    const items = rawData[slot];
    
    // Sort items by rarity (order) and then by their original requiredLevel
    items.sort((a, b) => {
        const rA = rarityOrder.indexOf(a.rarity);
        const rB = rarityOrder.indexOf(b.rarity);
        if (rA !== rB) return rA - rB;
        return a.requiredLevel - b.requiredLevel;
    });
    
    // Let's divide items of each rarity into spaced levels
    // Helmets has 22 items:
    // COMMON: 3 items (bandana, starter_helm, maybe h_forest was rare? Let's check).
    // Let's see the count of items in slot:
    const groups = {};
    rarityOrder.forEach(r => groups[r] = []);
    items.forEach(it => groups[it.rarity].push(it));
    
    slotsProposal[slot] = [];
    
    rarityOrder.forEach(rarity => {
        const list = groups[rarity];
        if (list.length === 0) return;
        
        // Define levels for this rarity
        let levels = [];
        if (rarity === 'COMMON') {
            // levels between 1 and 8
            // If 1 item: 1
            // If 2 items: 1, 4
            // If 3 items: 1, 4, 7
            // If 4 items: 1, 3, 5, 8
            // If more: evenly spaced between 1 and 8
            levels = getSpacedLevels(1, 8, list.length);
        } else if (rarity === 'RARE') {
            // levels between 10 and 22
            levels = getSpacedLevels(10, 22, list.length);
        } else if (rarity === 'EPIC') {
            // levels between 26 and 46
            levels = getSpacedLevels(26, 46, list.length);
        } else if (rarity === 'LEGENDARY') {
            // levels between 50 to 60
            levels = getSpacedLevels(50, 60, list.length);
        } else if (rarity === 'MYTHIC') {
            // levels between 65 to 80
            levels = getSpacedLevels(65, 80, list.length);
        }
        
        list.forEach((item, index) => {
            slotsProposal[slot].push({
                id: item.id,
                name: item.name,
                rarity: item.rarity,
                oldLvl: item.requiredLevel,
                newLvl: levels[index],
                desc: item.desc
            });
        });
    });
});

function getSpacedLevels(min, max, count) {
    if (count === 1) return [min];
    const levels = [];
    const step = (max - min) / (count - 1);
    for (let i = 0; i < count; i++) {
        levels.push(Math.round(min + i * step));
    }
    return levels;
}

// Format the markdown report
let out = '';
slots.forEach(slot => {
    out += `\n### Слот: ${slot.toUpperCase()}\n`;
    out += `| ID | Название | Редкость | Описание / Спрайт | Старый уровень | Новый уровень |\n`;
    out += `| :--- | :--- | :--- | :--- | :---: | :---: |\n`;
    
    slotsProposal[slot].forEach(item => {
        out += `| \`${item.id}\` | ${item.name} | **${item.rarity}** | *${item.desc}* | ${item.oldLvl} | **${item.newLvl}** |\n`;
    });
});

fs.writeFileSync('scratch/proposed_progression.md', out);
console.log("Proposal saved to scratch/proposed_progression.md");
