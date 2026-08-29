/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Saves player profile to local storage on VPS (and optionally mirrors to Firestore if configured).
 *           Fully autonomous and independent of Google Cloud / Firebase for Russian deployment.
 */

import { getLocalDoc, saveLocalDoc } from './localStore.js';
import { saveFirestoreRestDoc } from './firebaseAdmin.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';
import { sanitizeDocId, sanitizeAndReconcileProfile } from './securityMiddleware.js';

export default async function handler(req, res) {
    setCorsHeaders(res, req);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { userId, isDev, launchParams } = body;
        const syncData = body.syncData || body.state;

        if (!userId || !syncData) {
            return res.status(400).json({ error: 'Missing userId or syncData parameter' });
        }

        const cleanUserId = sanitizeDocId(userId);
        if (!cleanUserId) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        const host = req.headers.host || '';

        // Verify VK launch parameters signature
        const auth = verifyVkSign(launchParams, host);
        if (!auth.ok) {
            console.warn(`[profile-save] VK signature verification failed for ${cleanUserId}: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        // Ensure userId matches the VK identity that signed the request
        if (auth.vkUserId) {
            const expectedUserId = `VK-${auth.vkUserId}`;
            if (cleanUserId !== expectedUserId) {
                console.warn(`[profile-save] Identity mismatch: requested ${cleanUserId}, signed as ${expectedUserId}`);
                return res.status(403).json({ error: 'Forbidden: identity mismatch' });
            }
        }

        const USERS_COLLECTION = isDev === true ? 'пользователи_dev' : 'пользователи';

        // 1. Fetch existing profile to apply server-authoritative field protection
        const existingDoc = await getLocalDoc(USERS_COLLECTION, cleanUserId);
        const existingProfile = existingDoc.exists ? existingDoc.data : null;

        // 2. Reconcile client syncData with server authority (protect gold, crystals, rating, etc.)
        const reconciledProfile = sanitizeAndReconcileProfile(existingProfile, syncData);

        // Resolve server-side timestamps
        const now = new Date().toISOString();
        if (syncData.wasOnline === '__serverTimestamp__') reconciledProfile.wasOnline = now;
        if (syncData['былВСети'] === '__serverTimestamp__') reconciledProfile['былВСети'] = now;

        // 3. Primary storage: Local VPS disk storage (Fast, Reliable, RF-compatible)
        await saveLocalDoc(USERS_COLLECTION, cleanUserId, reconciledProfile);
        console.log(`[profile-save] ✅ Saved profile locally for ${USERS_COLLECTION}/${cleanUserId}`);

        // 4. Secondary storage (Optional): Firestore REST mirror if Firebase is configured
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            saveFirestoreRestDoc(USERS_COLLECTION, cleanUserId, reconciledProfile).catch((err) => {
                console.warn(`[profile-save] Optional Firestore mirror skipped/failed for ${cleanUserId}:`, err.message || err);
            });
        }

        return res.status(200).json({ ok: true, lastSavedTimestamp: reconciledProfile.lastSavedTimestamp });
    } catch (error) {
        console.error('[profile-save] ❌ Error saving profile:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
