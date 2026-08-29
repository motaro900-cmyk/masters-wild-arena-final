/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-authoritative player mail service with safe, idempotent attachment claiming.
 */

import { verifyVkSign, setCorsHeaders } from '../vkAuth.js';
import { sanitizeDocId } from '../securityMiddleware.js';
import { runAtomicTransaction } from '../game/transactionManager.js';
import { getLocalDoc } from '../localStore.js';

export async function handleGetMail(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { userId, isDev, launchParams } = req.query || {};
    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const USERS_COLLECTION = isDev === 'true' ? 'пользователи_dev' : 'пользователи';
    const docResult = await getLocalDoc(USERS_COLLECTION, cleanId);
    const profile = docResult.exists && docResult.data ? docResult.data : null;
    const mailList = (profile && Array.isArray(profile.mail)) ? profile.mail : [];

    return res.status(200).json({ ok: true, mail: mailList });
}

export async function handleClaimMail(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, mailId, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });
    if (!mailId) return res.status(400).json({ error: 'Missing mailId' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `claim_mail_${mailId}_${Date.now()}`,
        'mail.claim',
        async (profile) => {
            if (!profile.mail || !Array.isArray(profile.mail)) {
                return { success: false, error: 'Mailbox is empty' };
            }

            const mailIndex = profile.mail.findIndex((m) => m.id === mailId);
            if (mailIndex === -1) {
                return { success: false, error: 'Mail not found' };
            }

            const targetMail = profile.mail[mailIndex];
            if (targetMail.isClaimed) {
                return { success: false, error: 'Mail attachments already claimed' };
            }

            const rewards = Array.isArray(targetMail.rewards) ? targetMail.rewards : [];
            let goldAdded = 0;
            let crystalsAdded = 0;
            const itemsAdded = [];

            for (const r of rewards) {
                if (r.type === 'GOLD') {
                    goldAdded += (r.amount || 0);
                } else if (r.type === 'CRYSTALS' || r.type === 'GEMS') {
                    crystalsAdded += (r.amount || 0);
                } else if (r.type === 'ITEM' && r.itemId) {
                    const newItem = {
                        id: r.itemId,
                        level: 1,
                        amount: r.amount || 1,
                        instanceId: `${r.itemId}_mail_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    };
                    if (!profile.inventory) profile.inventory = [];
                    profile.inventory.push(newItem);
                    itemsAdded.push(newItem);
                }
            }

            const oldGold = profile.gold || 0;
            const oldCrystals = profile.crystals || 0;

            profile.gold = oldGold + goldAdded;
            profile.crystals = oldCrystals + crystalsAdded;
            targetMail.isClaimed = true;
            targetMail.isRead = true;

            return {
                success: true,
                data: {
                    mailId,
                    gold: profile.gold,
                    crystals: profile.crystals,
                    awarded: { gold: goldAdded, crystals: crystalsAdded, items: itemsAdded },
                    mail: profile.mail,
                },
                changes: {
                    gold: { oldVal: oldGold, newVal: profile.gold },
                    crystals: { oldVal: oldCrystals, newVal: profile.crystals },
                },
                reason: `mail_claim_${mailId}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({ ok: true, isDuplicate: result.isDuplicate, data: result.data });
}
