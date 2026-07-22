/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Verifies the authenticity of VK launch parameters using HMAC-SHA256 signature.
 */

import crypto from 'crypto';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const secretKey = process.env.VK_APP_SECRET;
        if (!secretKey || secretKey.trim().length === 0) {
            console.error('[VK AUTH CRITICAL] VK_APP_SECRET environment variable is missing or empty!');
            return res.status(500).json({ valid: false, error: 'VK configuration missing (VK_APP_SECRET not configured on server)' });
        }

        // Vercel parses query parameters into req.query
        const query = req.query || {};
        let sign = query.sign;

        // Filter and collect vk_ parameters
        const queryParams = [];
        for (const key of Object.keys(query)) {
            if (key.startsWith('vk_')) {
                const val = query[key];
                // In case of array of values, take the first one
                const value = Array.isArray(val) ? val[0] : val;
                queryParams.push({ key, value });
            }
        }

        if (!sign) {
            return res.status(400).json({ valid: false, error: 'Missing sign parameter' });
        }

        if (queryParams.length === 0) {
            return res.status(400).json({ valid: false, error: 'Missing VK launch parameters' });
        }

        // Sort keys alphabetically
        queryParams.sort((a, b) => a.key.localeCompare(b.key));

        // Reconstruct query string
        const queryString = queryParams
            .reduce((acc, { key, value }, idx) => {
                return acc + (idx === 0 ? '' : '&') + `${key}=${value}`;
            }, '');

        // Compute HMAC-SHA256 signature
        const paramsHash = crypto
            .createHmac('sha256', secretKey)
            .update(queryString)
            .digest()
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=$/, '');

        const isValid = paramsHash === sign;
        console.log(`[VK AUTH RESULT] valid=${isValid} | vk_user_id=${query.vk_user_id || 'unknown'} | vk_platform=${query.vk_platform || 'unknown'}`);
        return res.status(200).json({ valid: isValid });
    } catch (error) {
        console.error('Signature verification error:', error);
        return res.status(500).json({ valid: false, error: 'Internal server error' });
    }
}
