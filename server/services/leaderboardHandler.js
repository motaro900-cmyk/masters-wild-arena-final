/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-authoritative leaderboard based on actual verified profile ratings on the VPS.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setCorsHeaders } from '../vkAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

export async function handleGetLeaderboard(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { limit = '50', isDev } = req.query || {};
    const maxCount = Math.min(100, Math.max(10, parseInt(limit, 10) || 50));
    const targetFolder = isDev === 'true' ? 'пользователи_dev' : 'пользователи';
    const folderPath = path.join(DATA_DIR, targetFolder);

    const players = [];

    if (fs.existsSync(folderPath)) {
        try {
            const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.json'));
            for (const file of files) {
                try {
                    const content = fs.readFileSync(path.join(folderPath, file), 'utf8');
                    const profile = JSON.parse(content);
                    if (profile && typeof profile.rating === 'number') {
                        players.push({
                            userId: file.replace('.json', ''),
                            name: profile.name || 'Мастер',
                            rating: profile.rating || 1000,
                            trophies: profile.trophies || profile.rating || 1000,
                            level: profile.level || 1,
                            avatar: profile.avatar || '/assets/images/avatars/panda.webp',
                            frame: profile.frame || 'none',
                            selectedHeroId: profile.selectedHeroId || 'panda',
                            wins: profile.wins || 0,
                            totalBattles: profile.totalBattles || 0,
                        });
                    }
                } catch {}
            }
        } catch (err) {
            console.error('[LeaderboardHandler] Error reading players folder:', err);
        }
    }

    // If few players in database, fill with canon NPC champions
    if (players.length < 5) {
        players.push(
            { userId: 'NPC_1', name: 'Верховный Друид', rating: 3500, trophies: 3500, level: 35, avatar: '/assets/images/avatars/owl_magician.webp', frame: 'frame_gold', selectedHeroId: 'owl_magician', wins: 180, totalBattles: 210 },
            { userId: 'NPC_2', name: 'Капитан Лютоволка', rating: 2800, trophies: 2800, level: 28, avatar: '/assets/images/avatars/wolf_knight.webp', frame: 'frame_silver', selectedHeroId: 'wolf_knight', wins: 140, totalBattles: 175 },
            { userId: 'NPC_3', name: 'Хранитель Чащи', rating: 2200, trophies: 2200, level: 22, avatar: '/assets/images/avatars/panda.webp', frame: 'none', selectedHeroId: 'panda', wins: 95, totalBattles: 120 }
        );
    }

    // Sort descending by rating
    players.sort((a, b) => b.rating - a.rating);
    const topLeaderboard = players.slice(0, maxCount).map((p, idx) => ({ ...p, rank: idx + 1 }));

    return res.status(200).json({
        ok: true,
        count: topLeaderboard.length,
        leaderboard: topLeaderboard,
        generatedAt: Date.now(),
    });
}
