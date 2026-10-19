import { handleSendMessage } from '../../server/services/chatHandler.js';

export default async function handler(req, res) {
    return handleSendMessage(req, res);
}
