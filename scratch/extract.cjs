const fs = require('fs');

const content = fs.readFileSync('c:\\Users\\Motar\\Desktop\\Masters of the Wild\\temp_extract\\word\\document.xml', 'utf-8');

const matches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);

if (matches) {
    const text = matches.map(m => m.replace(/<w:t[^>]*>/, '').replace('</w:t>', '')).join('\n');
    fs.writeFileSync('c:\\Users\\Motar\\Desktop\\Masters of the Wild\\extracted_text.txt', text, 'utf-8');
    console.log('Done');
} else {
    console.log('No matches found');
}
