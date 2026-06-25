const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles(path.join(__dirname, '../src'));
console.log(`Scanning ${files.length} source files...`);

let totalUseEffects = 0;
let withoutCleanup = 0;

const leakCandidates = [];

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    // Look for useEffect or React.useEffect
    if (line.includes('useEffect') && line.includes('(')) {
      totalUseEffects++;
      const lineNum = idx + 1;
      
      // Let's analyze the body of the useEffect.
      // We can do a simple brace matching to find the boundaries of the useEffect callback.
      let bracketCount = 0;
      let startIdx = -1;
      let fullBody = '';
      
      // Find start of callback
      const callbackStart = content.indexOf('useEffect', content.indexOf(line));
      if (callbackStart === -1) return;
      
      let i = callbackStart;
      let foundStart = false;
      while (i < content.length) {
        const char = content[i];
        if (char === '{') {
          if (!foundStart) {
            startIdx = i;
            foundStart = true;
          }
          bracketCount++;
        } else if (char === '}') {
          bracketCount--;
          if (foundStart && bracketCount === 0) {
            fullBody = content.slice(startIdx, i + 1);
            break;
          }
        }
        i++;
      }
      
      if (fullBody) {
        // Check if the body contains a return statement.
        // Usually, a cleanup is a `return () =>` or `return function`.
        const hasReturn = /\breturn\b/.test(fullBody);
        if (!hasReturn) {
          withoutCleanup++;
          // Let's check if there are potential leak patterns in the body, such as:
          // addEventListener, setInterval, setTimeout, subscribe, gsap, howler, onSnapshot, PixiApp, requestAnimationFrame, .on(
          const hasPotentialLeak = /addEventListener|setInterval|setTimeout|\.subscribe|gsap|howler|onSnapshot|PixiApp|requestAnimationFrame|\.on\(/.test(fullBody);
          leakCandidates.push({
            file: path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/'),
            line: lineNum,
            code: line.trim(),
            leakRisk: hasPotentialLeak ? '⚠️ LEAK RISK' : 'OK (No cleanup needed)'
          });
        }
      }
    }
  });
});

console.log(`Total useEffects found: ${totalUseEffects}`);
console.log(`Without cleanup: ${withoutCleanup}`);

console.log('\n--- ALL USEEFFECTS WITHOUT CLEANUP ---');
leakCandidates.forEach(c => {
  console.log(`[${c.leakRisk}] ${c.file}:${c.line} -> ${c.code}`);
});
