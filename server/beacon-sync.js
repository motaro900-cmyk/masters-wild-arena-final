/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Handles persistent saving of game state snapshots on app close via navigator.sendBeacon.
 *
 * Migrated from REST API + Web API key to Firebase Admin SDK.
 * Also adds VK signature verification that was previously absent (only userId prefix was checked).
 *
 * sendBeacon does not support custom headers, so launchParams are passed in the request body.
 */

import { saveFirestoreRestDoc } from './firebaseAdmin.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.warn('[beacon-sync] Failed to parse req.body string:', e);
                return res.status(400).json({ error: 'Invalid JSON body string' });
            }
        } else if (Buffer.isBuffer(body)) {
            try {
                body = JSON.parse(body.toString('utf-8'));
            } catch (e) {
                console.warn('[beacon-sync] Failed to parse req.body buffer:', e);
                return res.status(400).json({ error: 'Invalid JSON body buffer' });
            }
        }

        if (!body) {
            return res.status(400).json({ error: 'Missing request body' });
        }

        const userId = body.userId;
        if (!userId || !userId.startsWith('VK-')) {
            return res.status(400).json({ error: 'Invalid or missing userId' });
        }

        const host = req.headers.host || '';

        // Verify VK signature — previously missing from beacon-sync
        const auth = verifyVkSign(body.launchParams, host);
        if (!auth.ok) {
            console.warn(`[beacon-sync] VK signature verification failed for ${userId}: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        // Ensure userId matches the signed VK identity
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        if (!isLocal && auth.vkUserId) {
            const expectedUserId = `VK-${auth.vkUserId}`;
            if (userId !== expectedUserId) {
                console.warn(`[beacon-sync] Identity mismatch: requested ${userId}, signed as ${expectedUserId}`);
                return res.status(403).json({ error: 'Forbidden: identity mismatch' });
            }
        }

        const USERS_COLLECTION = body.isDev === true ? 'пользователи_dev' : 'пользователи';

        // Build the minimal beacon snapshot — only fields that meaningfully change at session end
        const now = new Date().toISOString();
        const snapshot = {
            beaconSyncAt: now,
            wasOnline: now,
            'былВСети': now,
        };

        if (body.energy    !== undefined) snapshot.energy       = Math.round(body.energy);
        if (body.gold      !== undefined) snapshot.gold         = Math.round(body.gold);
        if (body.crystals  !== undefined) snapshot.crystals     = Math.round(body.crystals);
        if (body.rating    !== undefined) snapshot.rating       = Math.round(body.rating);
        if (body.wins      !== undefined) snapshot.wins         = Math.round(body.wins);
        if (body.totalBattles !== undefined) snapshot.totalBattles = Math.round(body.totalBattles);
        if (body.trophies  !== undefined) snapshot.trophies     = Math.round(body.trophies);

        // Include full state snapshot if present
        if (body.fullStateJSON) {
            try {
                snapshot.fullStateJSON =
                    typeof body.fullStateJSON === 'string'
                        ? body.fullStateJSON
                        : JSON.stringify(body.fullStateJSON);
            } catch (e) {
                console.warn('[beacon-sync] Failed to serialize fullStateJSON:', e);
            }
        }

        await saveFirestoreRestDoc(USERS_COLLECTION, userId, snapshot);

        console.log(`[beacon-sync] ✅ Saved beacon for ${userId}`);
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[beacon-sync] ❌ Error saving beacon:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
