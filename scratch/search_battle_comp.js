import fs from 'fs';
import path from 'path';

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                searchDir(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('complete') || content.includes('Battle') || content.includes('Result')) {
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    if (line.includes('complete') && (line.includes('Battle') || line.includes('Fight') || line.includes('Match'))) {
                        console.log(`Found complete match line in ${fullPath}:${idx+1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

searchDir('.');
