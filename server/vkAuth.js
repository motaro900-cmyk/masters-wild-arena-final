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
 * @returns {{ ok: boolean, vkUserId: string|null, error: string|null }}
 */
export function verifyVkSign(launchParams, host) {
    const isLocal =
        !host ||
        host.includes('localhost') ||
        host.includes('127.0.0.1');

    if (isLocal) {
        // Skip signature check on localhost — extract userId from params as-is
        const params = new URLSearchParams(
            launchParams?.startsWith('?') ? launchParams : `?${launchParams ?? ''}`,
        );
        return { ok: true, vkUserId: params.get('vk_user_id'), error: null };
    }

    if (!launchParams) {
        return { ok: false, vkUserId: null, error: 'Missing launch parameters' };
    }

    const secretKey = process.env.VK_APP_SECRET;
    if (!secretKey) {
        return { ok: false, vkUserId: null, error: 'Server configuration error: VK_APP_SECRET not set' };
    }

    const params = new URLSearchParams(
        launchParams.startsWith('?') ? launchParams : `?${launchParams}`,
    );
    const query = Object.fromEntries(params.entries());

    const sign = query.sign;
    if (!sign) {
        return { ok: false, vkUserId: null, error: 'Missing VK signature' };
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

    return { ok: true, vkUserId: query.vk_user_id || null, error: null };
}

/**
 * Sends standard CORS headers for VK Mini App serverless functions.
 */
export function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
