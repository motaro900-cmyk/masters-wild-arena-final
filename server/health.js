/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Health check endpoint for verifying production readiness, VK secret configuration, and build status.
 */

import { getAdminDb, getGoogleAccessToken } from './firebaseAdmin.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const hasVkSecret = Boolean(process.env.VK_APP_SECRET && process.env.VK_APP_SECRET.trim().length > 0);
    let firebaseAdminInitialized = false;
    let firebaseAdminError = null;
    let oauthTokenActive = false;

    try {
        const { token } = await getGoogleAccessToken();
        if (token) {
            oauthTokenActive = true;
            firebaseAdminInitialized = true;
        }
    } catch (err) {
        firebaseAdminInitialized = false;
        firebaseAdminError = err.message || String(err);
    }

    return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        vkSecretConfigured: hasVkSecret,
        firebaseAdminConfigured: firebaseAdminInitialized,
        oauthTokenActive: oauthTokenActive,
        firebaseAdminError: firebaseAdminError,
        version: '1.1.5',
        environment: process.env.VERCEL_ENV || 'development',
    });
}
