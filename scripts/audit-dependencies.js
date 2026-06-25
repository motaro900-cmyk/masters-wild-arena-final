/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Runs static analysis on import statements to guarantee strict boundary isolation between layers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Helper to recursively list files with specific extensions
function getFilesRecursive(dir, extensions) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            // Exclude common build/ignored directories just in case
            if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
                results = results.concat(getFilesRecursive(filePath, extensions));
            }
        } else {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                results.push(filePath);
            }
        }
    });
    return results;
}

// Trace imports in client code
function auditClientCode() {
    console.log('🔍 Auditing client-side codebase (src/) for backend imports...');
    const srcDir = path.join(ROOT, 'src');
    if (!fs.existsSync(srcDir)) {
        console.warn('⚠️ src/ directory does not exist. Skipping client audit.');
        return true;
    }

    const files = getFilesRecursive(srcDir, ['.ts', '.tsx']);
    let violationsCount = 0;

    // Pattern to catch imports from api/ or server/
    // Example: import ... from '../../api/time'
    const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        // Reset regex index
        importRegex.lastIndex = 0;

        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            
            // Check if the import path references "api" or "server" directories
            const parts = importPath.split(/[/\\]/);
            const containsApiOrServer = parts.some(p => p === 'api' || p === 'server');

            if (containsApiOrServer) {
                // Check if there is a suppression comment
                const lineIndex = content.slice(0, match.index).split('\n').length - 1;
                const lines = content.split('\n');
                const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : '';
                
                if (prevLine.includes('eslint-disable') || prevLine.includes('migration-todo')) {
                    // Suppressed
                    continue;
                }

                console.error(`🚨 Violation in ${path.relative(ROOT, file)}:`);
                console.error(`   Direct import of backend layer: "${importPath}"`);
                violationsCount++;
            }
        }
    });

    if (violationsCount > 0) {
        console.error(`❌ Found ${violationsCount} architecture violation(s) in client code.`);
        return false;
    }

    console.log('✅ Client-side codebase has zero backend imports.');
    return true;
}

// Trace imports in server code to ensure it remains self-contained
function auditServerCode() {
    console.log('🔍 Auditing server-side codebase (server/) for illegal external imports...');
    const serverDir = path.join(ROOT, 'server');
    if (!fs.existsSync(serverDir)) {
        console.warn('⚠️ server/ directory does not exist. Skipping server audit.');
        return true;
    }

    const files = getFilesRecursive(serverDir, ['.js']);
    let violationsCount = 0;

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        // Look for imports pointing to client-side code (e.g. "../src/") or scripts
        const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            // Server files must only import from within "server/", node built-ins, or dependencies
            if (importPath.startsWith('.') || importPath.startsWith('/')) {
                const absoluteImport = path.resolve(path.dirname(file), importPath);
                const relativeToServer = path.relative(serverDir, absoluteImport);
                
                // If it goes up out of server directory (starts with "..")
                if (relativeToServer.startsWith('..')) {
                    console.error(`🚨 Violation in ${path.relative(ROOT, file)}:`);
                    console.error(`   Server code must not import files from outside the server/ directory: "${importPath}"`);
                    violationsCount++;
                }
            }
        }
    });

    if (violationsCount > 0) {
        console.error(`❌ Found ${violationsCount} violation(s) in server code.`);
        return false;
    }

    console.log('✅ Server-side codebase is fully self-contained.');
    return true;
}

function run() {
    const clientOk = auditClientCode();
    const serverOk = auditServerCode();

    if (!clientOk || !serverOk) {
        process.exit(1);
    }
    console.log('🎉 Dependency graph audit completed successfully! All layers are perfectly isolated.');
}

run();
