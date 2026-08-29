/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: High-performance, atomic local JSON storage engine for standalone Russian VPS hosting.
 *           Completely eliminates external dependency on Google Firebase / Firestore.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');

// Ensure base data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function sanitizeKey(key) {
    return String(key).replace(/[^a-zA-Z0-9_\u0400-\u04FF-]/g, '_');
}

function getCollectionDir(collectionName) {
    const dir = path.join(DATA_DIR, sanitizeKey(collectionName));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

function getDocFilePath(collectionName, docId) {
    const dir = getCollectionDir(collectionName);
    return path.join(dir, `${sanitizeKey(docId)}.json`);
}

/**
 * Deep merge helper for JSON objects (matching Firestore merge semantics)
 */
function mergeDeep(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);
    if (!isObject(target) || !isObject(source)) {
        return source;
    }
    const output = { ...target };
    for (const key of Object.keys(source)) {
        if (isObject(source[key])) {
            if (!(key in target)) {
                output[key] = source[key];
            } else {
                output[key] = mergeDeep(target[key], source[key]);
            }
        } else {
            output[key] = source[key];
        }
    }
    return output;
}

/**
 * Reads a document from local VPS disk with automatic corruption fallback to .bak
 */
export async function getLocalDoc(collectionName, docId) {
    const filePath = getDocFilePath(collectionName, docId);
    const backupPath = `${filePath}.bak`;

    try {
        if (fs.existsSync(filePath)) {
            const raw = await fs.promises.readFile(filePath, 'utf-8');
            const data = JSON.parse(raw);
            return { exists: true, data };
        }
    } catch (err) {
        console.error(`[LocalStore] ❌ Error reading primary ${collectionName}/${docId}:`, err.message);
        // Attempt recovery from backup .bak if primary is corrupted
        if (fs.existsSync(backupPath)) {
            try {
                console.warn(`[LocalStore] ⚠️ Attempting recovery from backup for ${collectionName}/${docId}...`);
                const bakRaw = await fs.promises.readFile(backupPath, 'utf-8');
                const bakData = JSON.parse(bakRaw);
                // Restore backup to primary
                await fs.promises.copyFile(backupPath, filePath);
                console.log(`[LocalStore] ✅ Successfully recovered ${collectionName}/${docId} from .bak`);
                return { exists: true, data: bakData, recoveredFromBackup: true };
            } catch (bakErr) {
                console.error(`[LocalStore] ❌ Backup also corrupted for ${collectionName}/${docId}:`, bakErr.message);
            }
        }
    }

    // Check backup if primary doesn't exist
    if (!fs.existsSync(filePath) && fs.existsSync(backupPath)) {
        try {
            const bakRaw = await fs.promises.readFile(backupPath, 'utf-8');
            const bakData = JSON.parse(bakRaw);
            return { exists: true, data: bakData, recoveredFromBackup: true };
        } catch {}
    }

    return { exists: false, data: null };
}

/**
 * Saves a document to local VPS disk using atomic write and pre-write .bak preservation.
 */
export async function saveLocalDoc(collectionName, docId, data, merge = true) {
    try {
        const filePath = getDocFilePath(collectionName, docId);
        const backupPath = `${filePath}.bak`;
        const tempPath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        let finalData = data;
        if (merge && fs.existsSync(filePath)) {
            try {
                const existingRaw = await fs.promises.readFile(filePath, 'utf-8');
                const existing = JSON.parse(existingRaw);
                finalData = mergeDeep(existing, data);
            } catch (readErr) {
                console.warn(`[LocalStore] Could not read existing doc for merge, overwriting:`, readErr);
                finalData = data;
            }
        }

        // Add metadata
        finalData._updatedAt = new Date().toISOString();
        const jsonString = JSON.stringify(finalData, null, 2);

        // 1. Write to temp file
        await fs.promises.writeFile(tempPath, jsonString, 'utf-8');

        // 2. If primary file currently exists and is valid, preserve it as .bak
        if (fs.existsSync(filePath)) {
            try {
                await fs.promises.copyFile(filePath, backupPath);
            } catch {}
        }

        // 3. Atomically rename temp file to primary file
        await fs.promises.rename(tempPath, filePath);
        return true;
    } catch (err) {
        console.error(`[LocalStore] ❌ Error saving ${collectionName}/${docId}:`, err);
        throw err;
    }
}

/**
 * Creates an explicit named backup of a document.
 */
export async function createDocBackup(collectionName, docId) {
    const filePath = getDocFilePath(collectionName, docId);
    if (!fs.existsSync(filePath)) return false;
    const backupPath = `${filePath}.bak`;
    await fs.promises.copyFile(filePath, backupPath);
    return true;
}

/**
 * Restores a document from its .bak copy.
 */
export async function restoreDocBackup(collectionName, docId) {
    const filePath = getDocFilePath(collectionName, docId);
    const backupPath = `${filePath}.bak`;
    if (!fs.existsSync(backupPath)) return false;
    await fs.promises.copyFile(backupPath, filePath);
    return true;
}

/**
 * Retrieves documents from a collection with optional sorting and limit.
 */
export async function getLocalCollection(collectionName, limitCount = 100) {
    try {
        const dir = getCollectionDir(collectionName);
        const files = await fs.promises.readdir(dir);
        const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.includes('.tmp.'));
        
        const docs = [];
        for (const file of jsonFiles.slice(0, limitCount)) {
            try {
                const raw = await fs.promises.readFile(path.join(dir, file), 'utf-8');
                docs.push(JSON.parse(raw));
            } catch (e) {
                // skip corrupted
            }
        }
        return docs;
    } catch (err) {
        console.error(`[LocalStore] ❌ Error listing collection ${collectionName}:`, err);
        return [];
    }
}
