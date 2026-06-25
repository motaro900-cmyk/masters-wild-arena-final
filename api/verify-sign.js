import serverHandler from '../server/verify-sign.js';

export default async function handler(req, res) {
    console.log(`[API PROXY] /api/verify-sign called at ${new Date().toISOString()}`);
    return serverHandler(req, res);
}
