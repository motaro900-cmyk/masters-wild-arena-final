import serverHandler from '../server/beacon-sync.js';

export default async function handler(req, res) {
    console.log(`[API PROXY] /api/beacon-sync called at ${new Date().toISOString()}`);
    return serverHandler(req, res);
}
