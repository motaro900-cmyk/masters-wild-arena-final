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
const filesWithStore = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const calls = [];
    
    lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        // Search for useGameStore( but ignore useGameStore.getState / setState / subscribe / etc.
        if (line.includes('useGameStore(')) {
            const match = line.match(/useGameStore\s*\(([^)]*)\)/);
            let hasSelector = false;
            let argText = '';
            if (match) {
                argText = match[1].trim();
                // A selector typically contains a function/arrow, like s => s.foo or state => state.foo
                // or a selector function name. Let's see if there is any argument.
                if (argText.length > 0) {
                    hasSelector = true;
                }
            } else {
                // Multi-line call or complex match
                // Let's see if there is text between useGameStore( and the matching )
                const startIdx = content.indexOf('useGameStore(', content.split('\n').slice(0, idx).join('\n').length);
                if (startIdx !== -1) {
                    // Try to find the matching closing paren
                    let openParens = 1;
                    let currIdx = startIdx + 'useGameStore('.length;
                    let extracted = '';
                    while (openParens > 0 && currIdx < content.length) {
                        const char = content[currIdx];
                        if (char === '(') openParens++;
                        else if (char === ')') openParens--;
                        if (openParens > 0) extracted += char;
                        currIdx++;
                    }
                    argText = extracted.trim();
                    if (argText.length > 0) {
                        hasSelector = true;
                    }
                }
            }
            
            calls.push({
                lineNum,
                content: line.trim(),
                hasSelector,
                argText
            });
        }
    });

    if (calls.length > 0) {
        filesWithStore.push({
            file: path.relative(path.join(__dirname, '..'), file),
            calls
        });
    }
});

const outputPath = path.join(__dirname, 'audit_results.json');
fs.writeFileSync(outputPath, JSON.stringify(filesWithStore, null, 2), 'utf8');
console.log(`Successfully wrote audit results to ${outputPath}`);
