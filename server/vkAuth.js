/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Shared VK launch parameters signature verification for all server handlers.
 *
 * Extracted from profile-save.js to eliminate duplication across
 * profile-load.js, profile-save.js, and beacon-sync.js.
 */

import crypto from 'crypto';

/**
 * Verifies VK launch parameters HMAC-SHA256 signature.
 *
 * @param {string} launchParams - Raw query string from window.location.search (e.g. "?vk_user_id=123&sign=...")
 * @param {string} host - Request host header (used to detect localhost)
 * @returns {{ ok: boolean, vkUserId: string|null, isUnsigned?: boolean, error: string|null }}
 */
export function verifyVkSign(launchParams, host) {
    const isLocal =
        !host ||
        host.includes('localhost') ||
        host.includes('127.0.0.1');

    const secretKey = process.env.VK_APP_SECRET;

    if (!launchParams || launchParams.trim() === '') {
        if (isLocal && !secretKey) {
            return { ok: true, vkUserId: null, isUnsigned: true, error: null };
        }
        return { ok: false, vkUserId: null, isUnsigned: true, error: 'Missing launch parameters' };
    }

    const params = new URLSearchParams(
        launchParams.startsWith('?') ? launchParams : `?${launchParams}`,
    );
    const query = Object.fromEntries(params.entries());

    const sign = query.sign;

    // If no signature provided
    if (!sign) {
        if (isLocal && !secretKey) {
            return { ok: true, vkUserId: query.vk_user_id || null, isUnsigned: true, error: null };
        }
        return { ok: false, vkUserId: null, isUnsigned: true, error: 'Signature missing for VK identity' };
    }

    // If signature provided but secret key is not set on server
    if (!secretKey) {
        return { ok: true, vkUserId: query.vk_user_id || null, isUnsigned: true, error: null };
    }

    // Check timestamp freshness if present (vk_ts is in seconds)
    if (query.vk_ts) {
        const ts = parseInt(query.vk_ts, 10);
        const nowSec = Math.floor(Date.now() / 1000);
        // Allow up to 7 days (604800s) for launch params in long sessions
        if (Number.isFinite(ts) && (nowSec - ts > 604800 || ts - nowSec > 3600)) {
            console.warn(`[vkAuth] VK launch parameters expired or futuristic: vk_ts=${ts}, now=${nowSec}`);
            return { ok: false, vkUserId: null, error: 'VK launch parameters expired' };
        }
    }

    const vkParams = Object.keys(query)
        .filter((k) => k.startsWith('vk_'))
        .sort()
        .map((k) => `${k}=${query[k]}`);

    if (vkParams.length === 0) {
        return { ok: false, vkUserId: null, error: 'Missing vk_ parameters' };
    }

    const queryString = vkParams.join('&');
    const expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest()
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=$/, '');

    if (expectedHash !== sign) {
        return { ok: false, vkUserId: null, error: 'Invalid VK signature' };
    }

    return { ok: true, vkUserId: query.vk_user_id || null, isUnsigned: false, error: null };
}

/**
 * Sends standard CORS headers for VK Mini App requests.
 */
export function setCorsHeaders(res, req) {
    const origin = req?.headers?.origin || '';
    const isAllowedOrigin =
        origin.endsWith('.vk.com') ||
        origin.endsWith('.vk-apps.com') ||
        origin === 'https://vk.com' ||
        origin === 'https://m.vk.com' ||
        origin.includes('mastersofthewild.ru') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}
