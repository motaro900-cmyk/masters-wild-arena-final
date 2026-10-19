import { handleGetMessages } from '../../server/services/chatHandler.js';

export default async function handler(req, res) {
    return handleGetMessages(req, res);
}
