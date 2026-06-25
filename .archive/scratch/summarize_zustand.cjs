const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_results.json'), 'utf8'));

const outLines = [];
function log(msg = '') {
    outLines.push(msg);
}

log('# ZUSTAND STORE USAGE AUDIT REPORT\n');

let totalCalls = 0;
let totalWithoutSelector = 0;
let totalWithSelector = 0;

const noSelectorFiles = [];
const selectorFiles = [];
const mixedFiles = [];

data.forEach(item => {
    let hasSelCount = 0;
    let noSelCount = 0;
    
    item.calls.forEach(call => {
        totalCalls++;
        if (call.hasSelector) {
            hasSelCount++;
            totalWithSelector++;
        } else {
            noSelCount++;
            totalWithoutSelector++;
        }
    });
    
    if (noSelCount > 0 && hasSelCount === 0) {
        noSelectorFiles.push({ file: item.file, calls: item.calls });
    } else if (hasSelCount > 0 && noSelCount === 0) {
        selectorFiles.push({ file: item.file, calls: item.calls });
    } else {
        mixedFiles.push({ file: item.file, calls: item.calls });
    }
});

log(`Total useGameStore calls found: ${totalCalls}`);
log(`- Without Selector: ${totalWithoutSelector}`);
log(`- With Selector: ${totalWithSelector}\n`);

log('## 1. FILES WITH ONLY SELECTORLESS CALLS (useGameStore())\n');
log(`Found ${noSelectorFiles.length} files subscribing to the entire store:\n`);
noSelectorFiles.forEach(f => {
    log(`### File: \`${f.file}\` (${f.calls.length} occurrences)`);
    f.calls.forEach(c => {
        log(`- Line ${c.lineNum}: \`${c.content}\``);
    });
    log();
});

log('## 2. FILES WITH MIXED CALLS (both with and without selectors)\n');
log(`Found ${mixedFiles.length} files:\n`);
mixedFiles.forEach(f => {
    log(`### File: \`${f.file}\` (${f.calls.length} occurrences)`);
    f.calls.forEach(c => {
        const type = c.hasSelector ? 'With Selector' : 'WITHOUT Selector';
        log(`- Line ${c.lineNum} [${type}]: \`${c.content}\``);
    });
    log();
});

log('## 3. FILES WITH ONLY SELECTOR CALLS (useGameStore(s => ...))\n');
log(`Found ${selectorFiles.length} files using selectors exclusively:\n`);
selectorFiles.forEach(f => {
    log(`### File: \`${f.file}\` (${f.calls.length} occurrences)`);
    f.calls.forEach(c => {
        log(`- Line ${c.lineNum}: \`${c.content}\``);
    });
    log();
});

const reportPath = path.join(__dirname, 'zustand_report.md');
fs.writeFileSync(reportPath, outLines.join('\n'), 'utf8');
console.log(`Successfully wrote markdown report to ${reportPath}`);
