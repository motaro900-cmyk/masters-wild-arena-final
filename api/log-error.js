import serverHandler from '../server/log-error.js';

export default async function handler(req, res) {
    return serverHandler(req, res);
}
