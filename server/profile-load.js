/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Loads player profile from local VPS disk (with fallback to Firestore if configured).
 *           Fully autonomous and independent of Google Cloud / Firebase for Russian deployment.
 */

import { getLocalDoc, saveLocalDoc } from './localStore.js';
import { fetchFirestoreRestDoc } from './firebaseAdmin.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';
import { sanitizeDocId } from './securityMiddleware.js';

export default async function handler(req, res) {
    setCorsHeaders(res, req);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { userId, isDev, launchParams } = req.query || {};

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }

        const cleanUserId = sanitizeDocId(userId);
        if (!cleanUserId) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        const host = req.headers.host || '';

        const auth = verifyVkSign(launchParams, host);
        if (!auth.ok) {
            console.warn(`[profile-load] VK signature verification failed for ${cleanUserId}: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        if (auth.vkUserId) {
            const expectedUserId = `VK-${auth.vkUserId}`;
            if (cleanUserId !== expectedUserId) {
                console.warn(`[profile-load] Identity mismatch: requested ${cleanUserId}, signed as ${expectedUserId}`);
                return res.status(403).json({ error: 'Forbidden: identity mismatch' });
            }
        }

        const USERS_COLLECTION = isDev === 'true' ? 'пользователи_dev' : 'пользователи';

        // 1. Primary: Check local VPS disk storage
        const localResult = await getLocalDoc(USERS_COLLECTION, cleanUserId);
        if (localResult.exists && localResult.data) {
            console.log(`[profile-load] ✅ Loaded profile locally for ${USERS_COLLECTION}/${cleanUserId}`);
            return res.status(200).json({ exists: true, data: localResult.data, isAdmin: false });
        }

        // 2. Secondary fallback (Optional): If not in local storage, check Firestore if configured
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            try {
                const docResult = await fetchFirestoreRestDoc(USERS_COLLECTION, cleanUserId);
                if (docResult.exists && docResult.data) {
                    console.log(`[profile-load] ✅ Loaded from Firestore, caching locally for ${cleanUserId}`);
                    await saveLocalDoc(USERS_COLLECTION, cleanUserId, docResult.data);
                    return res.status(200).json({ exists: true, data: docResult.data, isAdmin: false });
                }
            } catch (fbErr) {
                console.warn(`[profile-load] Firestore fallback skipped/failed for ${cleanUserId}:`, fbErr.message || fbErr);
            }
        }

        console.log(`[profile-load] Profile not found: ${USERS_COLLECTION}/${cleanUserId}`);
        return res.status(200).json({ exists: false, isAdmin: false });
    } catch (error) {
        console.error('[profile-load] ❌ Error loading profile:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error',
            code: error.code || null,
            details: error.details || String(error),
        });
    }
}
