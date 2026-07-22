/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Loads player profile from Firestore using Firebase Admin SDK.
 *
 * Migrated from REST API + Web API key to Admin SDK so that Firestore Security Rules
 * can be locked to `allow read, write: if false` — blocking all direct client access.
 *
 * Auth: VK launch parameters are verified via HMAC-SHA256 before any data is returned.
 * Previously this endpoint had NO signature verification — any caller knowing a userId
 * could read any player's profile. This is now fixed.
 */

import { fetchFirestoreRestDoc } from './firebaseAdmin.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { userId, isDev, launchParams } = req.query || {};

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }

        const host = req.headers.host || '';

        const auth = verifyVkSign(launchParams, host);
        if (!auth.ok) {
            console.warn(`[profile-load] VK signature verification failed for ${userId}: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        if (!isLocal && auth.vkUserId) {
            const expectedUserId = `VK-${auth.vkUserId}`;
            if (userId !== expectedUserId) {
                console.warn(`[profile-load] Identity mismatch: requested ${userId}, signed as ${expectedUserId}`);
                return res.status(403).json({ error: 'Forbidden: identity mismatch' });
            }
        }

        const USERS_COLLECTION = isDev === 'true' ? 'пользователи_dev' : 'пользователи';
        console.log(`[profile-load] Fetching Firestore document: ${USERS_COLLECTION}/${userId}`);

        const docResult = await fetchFirestoreRestDoc(USERS_COLLECTION, userId);

        if (!docResult.exists) {
            console.log(`[profile-load] Profile not found: ${USERS_COLLECTION}/${userId}`);
            return res.status(200).json({ exists: false, isAdmin: false });
        }

        console.log(`[profile-load] ✅ Loaded profile successfully for ${userId}`);
        return res.status(200).json({ exists: true, data: docResult.data, isAdmin: false });
    } catch (error) {
        console.error('[profile-load] ❌ Error loading profile:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error',
            code: error.code || null,
            details: error.details || String(error),
        });
    }
}
