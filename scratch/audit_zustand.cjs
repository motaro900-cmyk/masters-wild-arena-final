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
        if (line.includes('useGameStore(')) {
            // Find all text inside useGameStore(...) including across line boundaries if needed,
            // but let's first check simple single-line calls.
            // Match useGameStore(anything)
            const match = line.match(/useGameStore\s*\(([^)]*)\)/);
            if (match) {
                const arg = match[1].trim();
                const hasSelector = arg.length > 0 && !arg.startsWith(')');
                
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
