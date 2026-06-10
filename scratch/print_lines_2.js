import fs from 'fs';

const logFile = 'C:/Users/Motar/.gemini/antigravity/brain/ccb229ee-9ac6-48e8-8e69-1d19f584eae7/.system_generated/logs/transcript.jsonl';

function main() {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  
  const targetLines = [8237, 8251];
  targetLines.forEach(lNum => {
    if (lNum <= lines.length) {
      console.log(`=== Line ${lNum} ===`);
      console.log(lines[lNum - 1]);
    }
  });
}

main();
