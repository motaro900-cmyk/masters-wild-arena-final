/**
 * /api/time
 * Ultra-simple endpoint that returns the current server time.
 * Used by calibrateTime() in main.tsx to sync client clock with server.
 * No parameters required.
 */
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache');
    // The Date header is automatically set by Vercel/Node, but we also return JSON
    // so the client can use either the Date header or the JSON body
    return res.status(200).json({
        serverTime: Date.now(),
        iso: new Date().toISOString(),
    });
}
