/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Saves player profile to Firestore using Firebase Admin SDK.
 *
 * Migrated from REST API + Web API key to Admin SDK so that Firestore Security Rules
 * can be locked to `allow read, write: if false` — blocking all direct client access.
 *
 * Admin SDK uses merge semantics via { merge: true } — equivalent to the previous
 * PATCH with updateMask. Existing fields not present in syncData are preserved.
 * If the document does not exist, it is created automatically (no separate POST needed).
 */

import { getAdminDb } from './firebaseAdmin.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.warn('[profile-save] Failed to parse body string:', e);
                return res.status(400).json({ error: 'Invalid JSON body string' });
            }
        }

        const { userId, isDev, syncData, launchParams } = body;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }
        if (!syncData) {
            return res.status(400).json({ error: 'Missing syncData parameter' });
        }

        const host = req.headers.host || '';

        // Verify VK launch parameters signature
        const auth = verifyVkSign(launchParams, host);
        if (!auth.ok) {
            console.warn(`[profile-save] VK signature verification failed for ${userId}: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        // Ensure userId matches the VK identity that signed the request
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        if (!isLocal && auth.vkUserId) {
            const expectedUserId = `VK-${auth.vkUserId}`;
            if (userId !== expectedUserId) {
                console.warn(`[profile-save] Identity mismatch: requested ${userId}, signed as ${expectedUserId}`);
                return res.status(403).json({ error: 'Forbidden: identity mismatch' });
            }
        }

        const USERS_COLLECTION = isDev === true ? 'пользователи_dev' : 'пользователи';
        const db = getAdminDb();

        // Resolve server-side timestamps for wasOnline / былВСети fields
        const now = new Date().toISOString();
        const resolvedSyncData = { ...syncData };
        if (resolvedSyncData.wasOnline === '__serverTimestamp__') resolvedSyncData.wasOnline = now;
        if (resolvedSyncData['былВСети'] === '__serverTimestamp__') resolvedSyncData['былВСети'] = now;

        console.log(`[profile-save] Syncing to Firestore: ${USERS_COLLECTION}/${userId}`);

        // Admin SDK set() with merge: true = upsert semantics
        // If doc exists: updates only provided fields (like PATCH + updateMask)
        // If doc missing: creates the document (no separate POST needed)
        await db.collection(USERS_COLLECTION).doc(userId).set(resolvedSyncData, { merge: true });

        console.log(`[profile-save] ✅ Saved profile successfully for ${userId}`);
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[profile-save] ❌ Error saving profile:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
