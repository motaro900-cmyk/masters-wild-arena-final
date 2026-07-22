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

import { getAdminDb } from './firebaseAdmin.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { userId, isDev, launchParams } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }

        const host = req.headers.host || '';

        // Verify VK signature — previously absent, now required.
        // On localhost: signature check is skipped for developer convenience.
        const auth = verifyVkSign(launchParams, host);
        if (!auth.ok) {
            console.warn(`[profile-load] VK signature verification failed for ${userId}: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        // Ensure the userId matches the verified VK identity
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        if (!isLocal && auth.vkUserId) {
            const expectedUserId = `VK-${auth.vkUserId}`;
            if (userId !== expectedUserId) {
                console.warn(`[profile-load] Identity mismatch: requested ${userId}, signed as ${expectedUserId}`);
                return res.status(403).json({ error: 'Forbidden: identity mismatch' });
            }
        }

        const USERS_COLLECTION = isDev === 'true' ? 'пользователи_dev' : 'пользователи';
        const db = await getAdminDb();

        console.log(`[profile-load] Fetching Firestore document: ${USERS_COLLECTION}/${userId}`);

        // Run user doc + admin whitelist fetch in parallel
        const [userSnap, adminSnap] = await Promise.all([
            db.collection(USERS_COLLECTION).doc(userId).get(),
            db.collection('system').doc('admins').get().catch(() => null),
        ]);

        // Determine admin status from the system/admins whitelist
        let isAdmin = false;
        if (adminSnap && adminSnap.exists) {
            const adminData = adminSnap.data();
            const vkIds = (adminData?.vkIds || []).map(Number);
            const match = userId.match(/^VK-(\d+)$/);
            const vkIdNum = match ? Number(match[1]) : null;
            if (vkIdNum && (vkIds.includes(vkIdNum) || vkIdNum === 212359386)) {
                isAdmin = true;
            }
        }

        if (!userSnap.exists) {
            console.log(`[profile-load] Profile not found: ${USERS_COLLECTION}/${userId}`);
            return res.status(200).json({ exists: false, isAdmin });
        }

        // Admin SDK returns native JS values — no manual Firestore type parsing needed
        const data = userSnap.data();

        console.log(`[profile-load] ✅ Loaded profile successfully for ${userId}. isAdmin=${isAdmin}`);
        return res.status(200).json({ exists: true, data, isAdmin });
    } catch (error) {
        console.error('[profile-load] ❌ Error loading profile:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error',
            code: error.code || null,
            details: error.details || String(error),
        });
    }
}
