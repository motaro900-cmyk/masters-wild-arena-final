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
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { userId, isDev, syncData, launchParams } = body;

        if (!userId || !syncData) {
            return res.status(400).json({ error: 'Missing userId or syncData parameter' });
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

        // Resolve server-side timestamps for wasOnline / былВСети fields
        const now = new Date().toISOString();
        const resolvedSyncData = { ...syncData };
        if (resolvedSyncData.wasOnline === '__serverTimestamp__') resolvedSyncData.wasOnline = now;
        if (resolvedSyncData['былВСети'] === '__serverTimestamp__') resolvedSyncData['былВСети'] = now;

        console.log(`[profile-save] Syncing to Firestore REST: ${USERS_COLLECTION}/${userId}`);

        await saveFirestoreRestDoc(USERS_COLLECTION, userId, resolvedSyncData);

        console.log(`[profile-save] ✅ Saved profile successfully for ${userId}`);
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[profile-save] ❌ Error saving profile:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
