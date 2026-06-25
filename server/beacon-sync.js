/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Handles persistent saving of game state snapshots on app close via navigator.sendBeacon.
 */

const FIREBASE_PROJECT_ID = 'masters-of-the-wilde';
const USERS_COLLECTION = 'пользователи';
const FIREBASE_WEB_API_KEY = 'AIzaSyCkdcAHtqY-K_HRfb0FpkVR8lU5tbJfmYE';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

        // Validate required fields
        const userId = body.userId;
        if (!userId || !userId.startsWith('VK-')) {
            return res.status(400).json({ error: 'Invalid or missing userId' });
        }

        // Parse the embedded fullStateJSON if present
        let fullStateParsed = null;
        if (body.fullStateJSON) {
            try {
                fullStateParsed = typeof body.fullStateJSON === 'string'
                    ? JSON.parse(body.fullStateJSON)
                    : body.fullStateJSON;
            } catch (e) {
                console.warn('[beacon-sync] Failed to parse fullStateJSON:', e);
            }
        }

        // Build Firestore REST API PATCH payload (merge semantics)
        // Each field must be typed: https://firebase.google.com/docs/firestore/reference/rest/v1/Value
        const fields = {
            beaconSyncAt: { stringValue: new Date().toISOString() },
            wasOnline: { stringValue: new Date().toISOString() },
        };

        if (body.energy !== undefined) fields.energy = { integerValue: String(Math.round(body.energy)) };
        if (body.gold !== undefined) fields.gold = { integerValue: String(Math.round(body.gold)) };
        if (body.crystals !== undefined) fields.crystals = { integerValue: String(Math.round(body.crystals)) };
        if (body.rating !== undefined) fields.rating = { integerValue: String(Math.round(body.rating)) };
        if (body.wins !== undefined) fields.wins = { integerValue: String(Math.round(body.wins)) };
        if (body.totalBattles !== undefined) fields.totalBattles = { integerValue: String(Math.round(body.totalBattles)) };
        if (body.trophies !== undefined) fields.trophies = { integerValue: String(Math.round(body.trophies)) };

        if (fullStateParsed) {
            fields.fullStateJSON = { stringValue: JSON.stringify(fullStateParsed) };
        }

        // Firebase Firestore REST API — PATCH with updateMask for merge semantics
        const docPath = `${encodeURIComponent(USERS_COLLECTION)}/${encodeURIComponent(userId)}`;
        const updateMask = Object.keys(fields).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${docPath}?${updateMask}&key=${FIREBASE_WEB_API_KEY}`;

        const firestoreRes = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields }),
        });

        if (!firestoreRes.ok) {
            const errText = await firestoreRes.text();
            console.error(`[beacon-sync] Firestore PATCH failed (${firestoreRes.status}):`, errText);
            // If document doesn't exist yet, try creating it
            if (firestoreRes.status === 404) {
                const createUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${USERS_COLLECTION}?documentId=${encodeURIComponent(userId)}&key=${FIREBASE_WEB_API_KEY}`;
                const createRes = await fetch(createUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields }),
                });
                if (!createRes.ok) {
                    return res.status(500).json({ error: 'Failed to create document' });
                }
            } else {
                return res.status(500).json({ error: `Firestore error: ${firestoreRes.status}` });
            }
        }

        console.log(`[beacon-sync] ✅ Saved beacon for ${userId}`);
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[beacon-sync] ❌ Error saving beacon:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
