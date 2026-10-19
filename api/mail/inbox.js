import { handleGetMail } from '../../server/services/mailHandler.js';

export default async function handler(req, res) {
    return handleGetMail(req, res);
}
