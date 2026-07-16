/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-side generator for Firebase Custom Auth Tokens.
 *
 * Verifies VK launch signature. If valid, generates a Firebase Custom Token
 * for the user ID (e.g. `VK-{vk_user_id}`).
 *
 * The client uses this token to sign in to Firebase client SDK, allowing
 * authenticated Firestore operations (which can be controlled via firestore.rules).
 */

import { getAdminAuth } from './firebaseAdmin.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { launchParams } = req.query;
        const host = req.headers.host || '';

        // Validate the VK launch signature
        const auth = verifyVkSign(launchParams, host);
        if (!auth.ok) {
            console.warn(`[auth-token] VK signature validation failed: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        const vkUserId = auth.vkUserId;
        if (!vkUserId) {
            console.warn('[auth-token] Missing vkUserId in verified signature');
            return res.status(400).json({ error: 'Bad Request: Missing VK user identity' });
        }

        const uid = `VK-${vkUserId}`;
        console.log(`[auth-token] Generating Custom Auth Token for UID: ${uid}`);

        // Generate custom token with a verified identity
        const token = await getAdminAuth().createCustomToken(uid);

        console.log(`[auth-token] ✅ Generated Custom Auth Token successfully for ${uid}`);
        return res.status(200).json({ token });
    } catch (error) {
        console.error('[auth-token] ❌ Failed to generate custom token:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
