import serverHandler from '../server/health.js';

export default async function handler(req, res) {
    return serverHandler(req, res);
}
