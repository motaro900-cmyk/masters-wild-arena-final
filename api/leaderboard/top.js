import { handleGetLeaderboard } from '../../server/services/leaderboardHandler.js';

export default async function handler(req, res) {
    return handleGetLeaderboard(req, res);
}
