/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Verifies the authenticity of VK launch parameters using HMAC-SHA256 signature.
 */

import { verifyVkSign, setCorsHeaders } from './vkAuth.js';

export default async function handler(req, res) {
    setCorsHeaders(res, req);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        let queryString = '';
        if (req.url && req.url.includes('?')) {
            queryString = req.url.slice(req.url.indexOf('?'));
        } else if (req.query && Object.keys(req.query).length > 0) {
            queryString = '?' + new URLSearchParams(req.query).toString();
        }

        const host = req?.headers?.host || '';
        const auth = verifyVkSign(queryString, host);

        console.log(`[VK AUTH RESULT] valid=${auth.ok} | vk_user_id=${auth.vkUserId || 'unknown'}`);
        if (!auth.ok && (auth.error === 'Missing VK signature' || auth.error === 'Missing launch parameters')) {
            return res.status(400).json({ valid: false, vkUserId: null, error: auth.error });
        }
        return res.status(200).json({ valid: auth.ok, vkUserId: auth.vkUserId, error: auth.error });
    } catch (error) {
        console.error('Signature verification error:', error);
        return res.status(500).json({ valid: false, error: 'Internal server error' });
    }
}
