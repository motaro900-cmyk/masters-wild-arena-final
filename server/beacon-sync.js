/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Handles persistent saving of game state snapshots on app close via navigator.sendBeacon.
 *           Saves locally to VPS disk (with optional Firestore mirror).
 */

import { saveLocalDoc, getLocalDoc } from './localStore.js';
import { saveFirestoreRestDoc } from './firebaseAdmin.js';
import { verifyVkSign, setCorsHeaders } from './vkAuth.js';
import { hasPrototypePollution } from './securityMiddleware.js';

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
        const auth = verifyVkSign(body.launchParams, host, userId);
        if (!auth.ok) {
            console.warn(`[beacon-sync] VK signature verification failed for ${userId}: ${auth.error}`);
            return res.status(403).json({ error: `Forbidden: ${auth.error}` });
        }

        // Ensure userId matches the signed VK identity
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        if (!isLocal && userId.startsWith('VK-')) {
            if (auth.isUnsigned || !auth.vkUserId || userId !== `VK-${auth.vkUserId}`) {
                console.warn(`[beacon-sync] Identity mismatch or unsigned VK request: requested ${userId}`);
                return res.status(403).json({ error: 'Forbidden: identity mismatch or unsigned VK request' });
            }
        }

        const USERS_COLLECTION = body.isDev === true ? 'пользователи_dev' : 'пользователи';

        // Build the minimal beacon snapshot — strictly timestamps and session indicators
        const now = new Date().toISOString();
        const snapshot = {
            beaconSyncAt: now,
            wasOnline: now,
            'былВСети': now,
        };

        // If client passed fullStateJSON, check for prototype pollution before storing
        if (body.fullStateJSON) {
            try {
                const parsed = typeof body.fullStateJSON === 'string' ? JSON.parse(body.fullStateJSON) : body.fullStateJSON;
                if (!hasPrototypePollution(parsed)) {
                    snapshot.fullStateJSON = JSON.stringify(parsed);
                } else {
                    console.warn('[beacon-sync] Security alert: Prototype pollution blocked in beacon payload');
                }
            } catch (e) {
                console.warn('[beacon-sync] Failed to parse/validate fullStateJSON:', e);
            }
        }

        // 1. Primary: Save locally on VPS disk
        await saveLocalDoc(USERS_COLLECTION, userId, snapshot);
        console.log(`[beacon-sync] ✅ Saved beacon locally for ${userId}`);

        // 2. Secondary (Optional): Mirror to Firestore if configured
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            saveFirestoreRestDoc(USERS_COLLECTION, userId, snapshot).catch((err) => {
                console.warn(`[beacon-sync] Firestore mirror skipped/failed for ${userId}:`, err.message || err);
            });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[beacon-sync] ❌ Error saving beacon:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
