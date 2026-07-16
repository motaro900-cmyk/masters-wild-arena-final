import serverHandler from '../server/auth-token.js';

export default async function handler(req, res) {
    console.log(`[API PROXY] /api/auth-token called at ${new Date().toISOString()}`);
    return serverHandler(req, res);
}
