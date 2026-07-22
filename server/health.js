/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Health check endpoint for verifying production readiness, VK secret configuration, and build status.
 */

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
    const hasFirebaseAdmin = Boolean(
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_PRIVATE_KEY.trim().length > 0
    );

    return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        vkSecretConfigured: hasVkSecret,
        firebaseAdminConfigured: hasFirebaseAdmin,
        version: '1.1.5',
        environment: process.env.VERCEL_ENV || 'development',
    });
}
