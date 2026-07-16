/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: One-off cleanup script to delete all legacy/bot-generated guest profiles (starting with 'GUEST-')
 *           from the production or dev collections in Firestore using batches of 500.
 *
 * Run instructions:
 *   $ env FIREBASE_PROJECT_ID="masters-of-the-wilde" FIREBASE_CLIENT_EMAIL="..." FIREBASE_PRIVATE_KEY="..." node scripts/clean-guest-profiles.js [--dev]
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load variables from .env.production if present
dotenv.config({ path: '.env.production' });

// Auto-detect service account key from Downloads
const downloadsPath = 'C:/Users/Motar/Downloads';
const keyFileName = 'masters-of-the-wilde-firebase-adminsdk-fbsvc-c1eec1e84e.json';
const keyFilePath = path.join(downloadsPath, keyFileName);

if (fs.existsSync(keyFilePath)) {
    try {
        const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
        process.env.FIREBASE_PROJECT_ID = keyData.project_id;
        process.env.FIREBASE_CLIENT_EMAIL = keyData.client_email;
        process.env.FIREBASE_PRIVATE_KEY = keyData.private_key;
        console.log(`🔑 Automatically loaded credentials from: "${keyFilePath}"`);
    } catch (e) {
        console.warn(`⚠️ Failed to parse service account JSON from Downloads:`, e);
    }
}

const { getAdminDb } = await import('../server/firebaseAdmin.js');

// Get target collection based on flag
const isDevFlag = process.argv.includes('--dev');
const COLLECTION_NAME = isDevFlag ? 'пользователи_dev' : 'пользователи';

async function cleanGuestProfiles() {
    console.log(`🧹 Starting cleanup for collection: "${COLLECTION_NAME}"...`);

    try {
        const db = getAdminDb();
        const collectionRef = db.collection(COLLECTION_NAME);

        // Perform prefix query on document ID (__name__) to find all IDs starting with 'GUEST-'
        // 'GUEST-\uf8ff' is the standard Firestore query boundary for prefix search
        const query = collectionRef
            .where('__name__', '>=', 'GUEST-')
            .where('__name__', '<', 'GUEST-\uf8ff');

        console.log('📡 Querying documents starting with "GUEST-"...');
        const snapshot = await query.get();

        if (snapshot.empty) {
            console.log('✅ No documents found starting with "GUEST-". Nothing to delete.');
            return;
        }

        const totalCount = snapshot.size;
        console.log(`🔍 Found ${totalCount} legacy guest profiles. Preparing deletion in batches...`);

        const docs = snapshot.docs;
        let batch = db.batch();
        let count = 0;
        let batchCount = 0;

        for (let i = 0; i < docs.length; i++) {
            batch.delete(docs[i].ref);
            count++;

            // Firestore batch limit is 500 writes
            if (count === 500 || i === docs.length - 1) {
                batchCount++;
                console.log(`📦 Committing batch #${batchCount} (${count} deletes)...`);
                await batch.commit();
                
                // Reset batch for the next chunk
                batch = db.batch();
                count = 0;
            }
        }

        console.log(`\n🎉 Cleanup complete! Successfully deleted ${totalCount} legacy profiles from "${COLLECTION_NAME}".`);
    } catch (error) {
        console.error('❌ Legacy cleanup failed:', error);
    }
}

cleanGuestProfiles();
