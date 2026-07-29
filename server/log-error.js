export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        console.warn('[CLIENT ERROR LOGGED]:', body.message || 'Unknown error', body.source || '', body.stack || '');
    } catch (e) {
        // Ignore parse errors
    }

    return res.status(200).json({ ok: true });
}
