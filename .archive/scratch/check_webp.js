import fs from 'fs';

function getWebpSize(filepath) {
    const buffer = fs.readFileSync(filepath);
    // WebP header starts with RIFF
    if (buffer.toString('ascii', 0, 4) !== 'RIFF') {
        console.log('Not a RIFF/WebP file');
        return;
    }
    // WebP signature at offset 8 is WEBP
    if (buffer.toString('ascii', 8, 12) !== 'WEBP') {
        console.log('Not a WEBP container');
        return;
    }
    // Let's find width and height from VP8/VP8L chunk
    const chunkHeader = buffer.toString('ascii', 12, 16);
    if (chunkHeader === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        console.log({ chunkHeader, width, height });
    } else if (chunkHeader === 'VP8L') {
        const val = buffer.readUInt32LE(21);
        const width = (val & 0x3fff) + 1;
        const height = ((val >> 14) & 0x3fff) + 1;
        console.log({ chunkHeader, width, height });
    } else if (chunkHeader === 'VP8X') {
        const width = (buffer.readUInt8(24) | (buffer.readUInt8(25) << 8) | (buffer.readUInt8(26) << 16)) + 1;
        const height = (buffer.readUInt8(27) | (buffer.readUInt8(28) << 8) | (buffer.readUInt8(29) << 16)) + 1;
        console.log({ chunkHeader, width, height });
    } else {
        // Search for VP8, VP8L, VP8X in the file
        console.log('Format VP8X or other. Reading bytes...');
        const vp8xIndex = buffer.indexOf('VP8X');
        if (vp8xIndex !== -1) {
            const width = (buffer.readUInt8(vp8xIndex + 10) | (buffer.readUInt8(vp8xIndex + 11) << 8) | (buffer.readUInt8(vp8xIndex + 12) << 16)) + 1;
            const height = (buffer.readUInt8(vp8xIndex + 13) | (buffer.readUInt8(vp8xIndex + 14) << 8) | (buffer.readUInt8(vp8xIndex + 15) << 16)) + 1;
            console.log({ found: 'VP8X', width, height });
            return;
        }
        const vp8lIndex = buffer.indexOf('VP8L');
        if (vp8lIndex !== -1) {
            const val = buffer.readUInt32LE(vp8lIndex + 9);
            const width = (val & 0x3fff) + 1;
            const height = ((val >> 14) & 0x3fff) + 1;
            console.log({ found: 'VP8L', width, height });
            return;
        }
        const vp8Index = buffer.indexOf('VP8 ');
        if (vp8Index !== -1) {
            const width = buffer.readUInt16LE(vp8Index + 14) & 0x3fff;
            const height = buffer.readUInt16LE(vp8Index + 16) & 0x3fff;
            console.log({ found: 'VP8', width, height });
            return;
        }
        console.log('Could not find VP8/VP8L/VP8X header');
    }
}

getWebpSize('public/assets/images/sheets/talents_sheet.webp');
