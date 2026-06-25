const fs = require('fs');
const file = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\045c5236-1f75-4df2-bce9-c36818f92404\\.system_generated\\steps\\1173\\content.md';
if (!fs.existsSync(file)) {
    console.log('File does not exist');
    process.exit(1);
}
const content = fs.readFileSync(file, 'utf8');

// Find all matches for "shortDescription" or description in the file
const shortDescMatches = content.match(/"shortDescription"\s*:\s*"(.*?)"/g);
if (shortDescMatches) {
    console.log('--- shortDescription MATCHES ---');
    shortDescMatches.forEach(m => console.log(m.slice(0, 500)));
}

// Find descriptions in ytInitialPlayerResponse
const playerResponseMatch = content.match(/ytInitialPlayerResponse\s*=\s*(.*?);/);
if (playerResponseMatch) {
    console.log('--- ytInitialPlayerResponse FOUND ---');
    try {
        const obj = JSON.parse(playerResponseMatch[1]);
        if (obj.videoDetails) {
            console.log('Title:', obj.videoDetails.title);
            console.log('Description:', obj.videoDetails.shortDescription);
        }
    } catch (e) {
        console.log('Parse failed, extracting substrings instead:');
        const start = content.indexOf('ytInitialPlayerResponse');
        console.log(content.slice(start, start + 2000));
    }
}
