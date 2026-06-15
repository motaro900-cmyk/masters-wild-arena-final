const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\0a09938f-a8b0-43ff-85ff-711e5edd14d8\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('=== BUNDLE') || line.includes('Проведи полный технический аудит')) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' || obj.source === 'USER_EXPLICIT') {
        console.log('--- FOUND USER INPUT ---');
        console.log(obj.content);
        rl.close();
        process.exit(0);
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }
});
