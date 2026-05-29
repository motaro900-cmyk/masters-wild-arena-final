import fs from 'fs';

const log = fs.readFileSync('runtime_errors.log', 'utf8');
const blocks = log.split(/\n\n/);
const errors = blocks.filter(b => b.includes('ERROR'));
console.log(`Total errors: ${errors.length}`);
console.log("Last 5 errors:");
errors.slice(-5).forEach((e, idx) => {
    console.log(`--- Error #${idx} ---\n${e}\n`);
});
