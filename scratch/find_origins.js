import fs from 'fs';
import path from 'path';

const logFile = 'C:/Users/Motar/.gemini/antigravity/brain/ccb229ee-9ac6-48e8-8e69-1d19f584eae7/.system_generated/logs/transcript.jsonl';

function main() {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('tiger_warrior') || line.includes('lion_knight')) {
      try {
        const obj = JSON.parse(line);
        // We only care about user inputs, write_file, or command operations
        if (obj.type === 'USER_INPUT' || (obj.tool_calls && JSON.stringify(obj.tool_calls).includes('write_to_file')) || (obj.tool_calls && JSON.stringify(obj.tool_calls).includes('run_command'))) {
          console.log(`Line ${idx + 1} [${obj.source || 'SYSTEM'} / ${obj.type || ''}]:`);
          if (obj.content) {
            console.log(`  Content: ${obj.content.substring(0, 150)}`);
          }
          if (obj.tool_calls) {
            console.log(`  Tool calls: ${JSON.stringify(obj.tool_calls).substring(0, 150)}`);
          }
        }
      } catch (e) {}
    }
  });
}

main();
