const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(srcDir);
const auditResults = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        // Search for useGameStore call (but ignore useGameStore.getState, useGameStore.subscribe, etc.)
        // We look for "useGameStore("
        if (line.includes('useGameStore(')) {
            // Check if there is a selector inside useGameStore( ... )
            // A simple check: if it is "useGameStore()" or "useGameStore( )"
            // Let's analyze the argument list.
            const match = line.match(/useGameStore\s*\(([^)]*)\)/);
            if (match) {
                const arg = match[1].trim();
                const hasSelector = arg.length > 0;
                
                // Let's categorize it. We want to find cases without a selector.
                auditResults.push({
                    file: path.relative(path.join(__dirname, '..'), file),
                    lineNum,
                    content: line.trim(),
                    hasSelector,
                    arg
                });
            } else {
                // If it spans multiple lines, or matched differently
                auditResults.push({
                    file: path.relative(path.join(__dirname, '..'), file),
                    lineNum,
                    content: line.trim(),
                    hasSelector: 'unknown',
                    arg: ''
                });
            }
        }
    });
});

// Print all without selector
const noSelector = auditResults.filter(r => !r.hasSelector || r.hasSelector === 'unknown');
console.log(`\nFound ${noSelector.length} occurrences of useGameStore() without selector:`);
noSelector.forEach(r => {
    console.log(`- ${r.file}:${r.lineNum} | ${r.content}`);
});
