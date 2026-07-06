import serverHandler from '../server/profile-save.js';

export default async function handler(req, res) {
    console.log(`[API PROXY] /api/profile-save called at ${new Date().toISOString()}`);
    return serverHandler(req, res);
}
