/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Pure standalone health check endpoint for Russian VPS hosting.
 */

const START_TIME = Date.now();

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
    const uptimeSec = Math.floor((Date.now() - START_TIME) / 1000);

    return res.status(200).json({
        status: 'ok',
        version: '1.2.0-rc1',
        uptime: uptimeSec,
        storage: 'local_json_atomic',
        vkSecretConfigured: hasVkSecret,
        timestamp: new Date().toISOString(),
    });
}
