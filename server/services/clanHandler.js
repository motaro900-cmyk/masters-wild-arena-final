/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-authoritative clan management system (create, join, leave, role verification, roster persistence).
 */

import { verifyVkSign, setCorsHeaders } from '../vkAuth.js';
import { sanitizeDocId } from '../securityMiddleware.js';
import { runAtomicTransaction } from '../game/transactionManager.js';
import { getLocalDoc, saveLocalDoc } from '../localStore.js';

const CLANS_COLLECTION = 'clans';
const CLAN_CREATION_COST_GOLD = 5000;
const MAX_CLAN_MEMBERS = 30;

export async function handleGetClanList(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const clanIndexDoc = await getLocalDoc('system', 'clans_index');
    const clans = (clanIndexDoc.exists && Array.isArray(clanIndexDoc.data?.list)) ? clanIndexDoc.data.list : [];

    return res.status(200).json({ ok: true, clans });
}

export async function handleCreateClan(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, clanName, clanTag, description = '', minRating = 0, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });
    if (!clanName || !clanTag) return res.status(400).json({ error: 'Missing clan name or tag' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const cleanClanName = String(clanName).trim().slice(0, 24);
    const cleanClanTag = String(clanTag).trim().toUpperCase().slice(0, 5);
    const clanId = `clan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `create_clan_${clanId}`,
        'clan.create',
        async (profile) => {
            if (profile.clanId) {
                return { success: false, error: 'Player is already in a clan' };
            }

            const currentGold = profile.gold || 0;
            if (currentGold < CLAN_CREATION_COST_GOLD) {
                return { success: false, error: `Недостаточно золота: требуется ${CLAN_CREATION_COST_GOLD}, у вас ${currentGold}` };
            }

            profile.gold = currentGold - CLAN_CREATION_COST_GOLD;
            profile.clanId = clanId;
            profile.clanRole = 'LEADER';

            const newClanData = {
                id: clanId,
                name: cleanClanName,
                tag: cleanClanTag,
                description: String(description).slice(0, 150),
                level: 1,
                exp: 0,
                minRating: Math.max(0, parseInt(minRating, 10) || 0),
                leaderId: cleanId,
                leaderName: profile.name || 'Мастер',
                membersCount: 1,
                maxMembers: MAX_CLAN_MEMBERS,
                members: [
                    {
                        userId: cleanId,
                        name: profile.name || 'Мастер',
                        role: 'LEADER',
                        rating: profile.rating || 1000,
                        joinedAt: Date.now(),
                    },
                ],
                createdAt: Date.now(),
            };

            await saveLocalDoc(CLANS_COLLECTION, clanId, newClanData);

            // Update clan index
            const indexDoc = await getLocalDoc('system', 'clans_index');
            const list = (indexDoc.exists && Array.isArray(indexDoc.data?.list)) ? indexDoc.data.list : [];
            list.push({
                id: clanId,
                name: cleanClanName,
                tag: cleanClanTag,
                level: 1,
                membersCount: 1,
                maxMembers: MAX_CLAN_MEMBERS,
                leaderName: profile.name || 'Мастер',
                minRating: newClanData.minRating,
            });
            await saveLocalDoc('system', 'clans_index', { list });

            return {
                success: true,
                data: { clan: newClanData, goldRemaining: profile.gold },
                changes: { gold: { oldVal: currentGold, newVal: profile.gold } },
                reason: `create_clan_${clanId}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({ ok: true, isDuplicate: result.isDuplicate, data: result.data });
}

export async function handleJoinClan(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, clanId, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });
    if (!clanId) return res.status(400).json({ error: 'Missing clanId' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const clanDoc = await getLocalDoc(CLANS_COLLECTION, clanId);
    if (!clanDoc.exists || !clanDoc.data) {
        return res.status(404).json({ error: 'Клан не найден' });
    }

    const clanData = clanDoc.data;
    if (clanData.members && clanData.members.length >= MAX_CLAN_MEMBERS) {
        return res.status(400).json({ error: 'Клан полон' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `join_clan_${clanId}_${Date.now()}`,
        'clan.join',
        async (profile) => {
            if (profile.clanId) {
                return { success: false, error: 'Вы уже состоите в клане' };
            }

            if ((profile.rating || 0) < (clanData.minRating || 0)) {
                return { success: false, error: `Требуется рейтинг ${clanData.minRating}` };
            }

            profile.clanId = clanId;
            profile.clanRole = 'MEMBER';

            if (!clanData.members) clanData.members = [];
            clanData.members.push({
                userId: cleanId,
                name: profile.name || 'Мастер',
                role: 'MEMBER',
                rating: profile.rating || 1000,
                joinedAt: Date.now(),
            });
            clanData.membersCount = clanData.members.length;

            await saveLocalDoc(CLANS_COLLECTION, clanId, clanData);

            return {
                success: true,
                data: { clanId, clanRole: 'MEMBER', clanName: clanData.name },
                changes: {},
                reason: `join_clan_${clanId}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({ ok: true, isDuplicate: result.isDuplicate, data: result.data });
}

export async function handleLeaveClan(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `leave_clan_${Date.now()}`,
        'clan.leave',
        async (profile) => {
            if (!profile.clanId) {
                return { success: false, error: 'Вы не состоите в клане' };
            }

            const clanId = profile.clanId;
            profile.clanId = null;
            profile.clanRole = null;

            const clanDoc = await getLocalDoc(CLANS_COLLECTION, clanId);
            if (clanDoc.exists && clanDoc.data) {
                const clanData = clanDoc.data;
                if (Array.isArray(clanData.members)) {
                    clanData.members = clanData.members.filter((m) => m.userId !== cleanId);
                    clanData.membersCount = clanData.members.length;
                    await saveLocalDoc(CLANS_COLLECTION, clanId, clanData);
                }
            }

            return {
                success: true,
                data: { clanId: null, clanRole: null },
                changes: {},
                reason: `leave_clan_${clanId}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({ ok: true, isDuplicate: result.isDuplicate, data: result.data });
}
