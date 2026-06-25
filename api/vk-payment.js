import serverHandler from '../server/vk-payment.js';

export default async function handler(req, res) {
    console.log(`[API PROXY] /api/vk-payment called at ${new Date().toISOString()}`);
    return serverHandler(req, res);
}
