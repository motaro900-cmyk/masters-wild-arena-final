import { handleClaimMail } from '../../server/services/mailHandler.js';

export default async function handler(req, res) {
    return handleClaimMail(req, res);
}
