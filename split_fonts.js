const fs = require('fs');
const css = fs.readFileSync('public/assets/fonts/fonts.css', 'utf8');
const blocks = css.split(/(?=\/\*)/);
const critical = blocks.filter(b => b.includes("'Cinzel'") || b.includes("'Philosopher'"));
const secondary = blocks.filter(b => !b.includes("'Cinzel'") && !b.includes("'Philosopher'"));
fs.writeFileSync('public/assets/fonts/fonts.css', critical.join(''));
fs.writeFileSync('public/assets/fonts/fonts-secondary.css', secondary.join(''));
console.log('Fonts split');
