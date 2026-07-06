import serverHandler from '../server/profile-load.js';

export default async function handler(req, res) {
    console.log(`[API PROXY] /api/profile-load called at ${new Date().toISOString()}`);
    return serverHandler(req, res);
}
