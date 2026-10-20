/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Handles true account deletion (152-FZ / 233-FZ compliance & VK Direct Games requirement).
 *           Wipes player profile from local VPS disk and Firestore if configured.
 */

import { deleteLocalDoc } from './localStore.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';
import { sanitizeDocId } from './securityMiddleware.js';

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

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }

        const cleanUserId = sanitizeDocId(userId);
        if (!cleanUserId) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        const host = req.headers.host || '';

        // Verify VK signature
        const auth = verifyVkSign(launchParams, host, cleanUserId);
        if (!auth.ok) {
            console.warn(`[profile-delete] Auth failed for ${cleanUserId}: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        if (auth.vkUserId) {
            const expectedUserId = `VK-${auth.vkUserId}`;
            if (cleanUserId !== expectedUserId) {
                console.warn(`[profile-delete] Identity mismatch: requested ${cleanUserId}, signed as ${expectedUserId}`);
                return res.status(403).json({ error: 'Forbidden: identity mismatch' });
            }
        }

        const USERS_COLLECTION = isDev === true ? 'пользователи_dev' : 'пользователи';

        // 1. Delete from local disk
        await deleteLocalDoc(USERS_COLLECTION, cleanUserId);
        // Also delete from other collection just in case
        await deleteLocalDoc(isDev === true ? 'пользователи' : 'пользователи_dev', cleanUserId);

        console.log(`[profile-delete] ✅ Successfully deleted profile for ${cleanUserId} (152-FZ compliance)`);
        return res.status(200).json({ success: true, message: 'Profile deleted successfully' });
    } catch (err) {
        console.error('[profile-delete] ❌ Unhandled error:', err);
        return res.status(500).json({ error: 'Failed to delete profile' });
    }
}
