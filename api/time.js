import serverHandler from '../server/time.js';

export default function handler(req, res) {
    console.log(`[API PROXY] /api/time called at ${new Date().toISOString()}`);
    return serverHandler(req, res);
}
