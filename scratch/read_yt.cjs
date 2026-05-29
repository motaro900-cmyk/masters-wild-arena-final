const fs = require('fs');
const file = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\045c5236-1f75-4df2-bce9-c36818f92404\\.system_generated\\steps\\1173\\content.md';
if (!fs.existsSync(file)) {
    console.log('File does not exist');
    process.exit(1);
}
const content = fs.readFileSync(file, 'utf8');

const startKey = 'ytInitialPlayerResponse = ';
const idx = content.indexOf(startKey);
if (idx !== -1) {
    const textFromResponse = content.slice(idx + startKey.length);
    let braceCount = 0;
    let endIdx = 0;
    for (let i = 0; i < textFromResponse.length; i++) {
        if (textFromResponse[i] === '{') braceCount++;
        else if (textFromResponse[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                endIdx = i;
                break;
            }
        }
    }
    const jsonStr = textFromResponse.slice(0, endIdx + 1);
    try {
        const obj = JSON.parse(jsonStr);
        console.log('playabilityStatus:', JSON.stringify(obj.playabilityStatus, null, 2));
    } catch (e) {
        console.log('JSON parse failed:', e.message);
    }
}
