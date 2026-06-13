import { ITEMS_DATABASE } from './src/game/configs/items/index.ts';

console.log('Total items in ITEMS_DATABASE:', Object.keys(ITEMS_DATABASE).length);

let missingRequiredLevel = 0;
let range1_20 = 0;
let range21_40 = 0;
let range41_60 = 0;
let range61_80 = 0;
let other = 0;

Object.values(ITEMS_DATABASE).forEach((item: any) => {
    if (item.requiredLevel === undefined) {
        missingRequiredLevel++;
    }
    const lvl = item.requiredLevel || 1;
    if (lvl <= 20) range1_20++;
    else if (lvl <= 40) range21_40++;
    else if (lvl <= 60) range41_60++;
    else if (lvl <= 80) range61_80++;
    else other++;
});

console.log('Items missing requiredLevel (default to 1):', missingRequiredLevel);
console.log('Items in range 1-20 (loaded at start):', range1_20);
console.log('Items in range 21-40:', range21_40);
console.log('Items in range 41-60:', range41_60);
console.log('Items in range 61-80:', range61_80);
console.log('Items in other levels:', other);
