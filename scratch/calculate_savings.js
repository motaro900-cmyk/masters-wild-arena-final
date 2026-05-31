const { execSync } = require('child_process');

try {
    const status = execSync('git status --porcelain').toString();
    let total = 0;
    let count = 0;
    status.split('\n').forEach(line => {
        if (line.startsWith(' D ') || line.startsWith('D  ') || line.trim().startsWith('deleted:')) {
            // Parse path
            let path = '';
            if (line.includes('deleted:')) {
                path = line.split('deleted:')[1].trim();
            } else {
                path = line.substring(3).trim();
            }
            if (!path) return;
            try {
                const size = parseInt(execSync(`git cat-file -s "HEAD:${path}"`).toString().trim());
                if (!isNaN(size)) {
                    total += size;
                    count++;
                }
            } catch (e) {
                // Ignore files that were not tracked previously
            }
        }
    });

    console.log(`=== Optimization Savings Report ===`);
    console.log(`Deleted files count: ${count}`);
    console.log(`Total saved space: ${(total / 1024 / 1024).toFixed(2)} MB (${total} bytes)`);
} catch (err) {
    console.error('Error running script:', err);
}
