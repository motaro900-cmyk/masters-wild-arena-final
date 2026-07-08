/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Saves player profile to Firestore using REST API to bypass Russia regional blocks.
 */

import crypto from 'crypto';

const FIREBASE_PROJECT_ID = 'masters-of-the-wilde';
const FIREBASE_WEB_API_KEY = 'AIzaSyCkdcAHtqY-K_HRfb0FpkVR8lU5tbJfmYE';

function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
        if (Number.isInteger(val)) return { integerValue: String(val) };
        return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
        return { arrayValue: { values: val.map(toFirestoreValue) } };
    }
    if (typeof val === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(val)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
        if ((k === 'wasOnline' || k === 'былВСети') && v === '__serverTimestamp__') {
            fields[k] = { stringValue: new Date().toISOString() };
        } else {
            fields[k] = toFirestoreValue(v);
        }
    }
    return fields;
}

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
                console.warn('[profile-save] Failed to parse body string:', e);
                return res.status(400).json({ error: 'Invalid JSON body string' });
            }
        }

        const { userId, isDev, syncData, launchParams } = body;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }
        if (!syncData) {
            return res.status(400).json({ error: 'Missing syncData parameter' });
        }

        // --- VK SIGNATURE VALIDATION (Security Layer) ---
        const host = req.headers.host || '';
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

        if (!isLocal) {
            if (!launchParams) {
                return res.status(403).json({ error: 'Forbidden: missing launch parameters' });
            }
            const params = new URLSearchParams(launchParams.startsWith('?') ? launchParams : `?${launchParams}`);
            const query = {};
            for (const [key, value] of params.entries()) {
                query[key] = value;
            }

            const sign = query.sign;
            if (!sign) {
                return res.status(403).json({ error: 'Forbidden: missing signature' });
            }

            const secretKey = process.env.VK_APP_SECRET;
            if (!secretKey) {
                return res.status(500).json({ error: 'Server configuration error' });
            }

            const queryParams = [];
            for (const key of Object.keys(query)) {
                if (key.startsWith('vk_')) {
                    queryParams.push({ key, value: query[key] });
                }
            }

            if (queryParams.length === 0) {
                return res.status(403).json({ error: 'Forbidden: missing VK parameters' });
            }

            queryParams.sort((a, b) => a.key.localeCompare(b.key));
            const queryString = queryParams.reduce((acc, { key, value }, idx) => {
                return acc + (idx === 0 ? '' : '&') + `${key}=${value}`;
            }, '');

            const paramsHash = crypto
                .createHmac('sha256', secretKey)
                .update(queryString)
                .digest()
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=$/, '');

            if (paramsHash !== sign) {
                return res.status(403).json({ error: 'Forbidden: invalid signature' });
            }

            // Verify identity: ensure the userId matches the signed vk_user_id
            const verifiedVkUserId = query.vk_user_id;
            const expectedUserId = `VK-${verifiedVkUserId}`;
            if (userId !== expectedUserId) {
                return res.status(403).json({ error: 'Forbidden: identity mismatch' });
            }
        }
        // -------------------------------------------------

        const USERS_COLLECTION = isDev === true ? 'пользователи_dev' : 'пользователи';
        const docPath = `${encodeURIComponent(USERS_COLLECTION)}/${encodeURIComponent(userId)}`;

        // Translate flat JS syncData to Firestore document fields
        const fields = toFirestoreFields(syncData);

        // Build the updateMask query string for merge semantics (like { merge: true })
        const updateMask = Object.keys(fields)
            .map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
            .join('&');

        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${docPath}?${updateMask}&key=${FIREBASE_WEB_API_KEY}`;

        console.log(`[profile-save] Syncing to Firestore: ${USERS_COLLECTION}/${userId}`);
        const firestoreRes = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields }),
        });

        if (!firestoreRes.ok) {
            const errText = await firestoreRes.text();
            console.error(`[profile-save] Firestore PATCH failed (${firestoreRes.status}):`, errText);

            // If the document doesn't exist yet, try creating it with a POST
            if (firestoreRes.status === 404) {
                console.log(`[profile-save] Document 404. Creating new profile document: ${USERS_COLLECTION}/${userId}`);
                const createUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${USERS_COLLECTION}?documentId=${encodeURIComponent(userId)}&key=${FIREBASE_WEB_API_KEY}`;
                
                const createRes = await fetch(createUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields }),
                });

                if (!createRes.ok) {
                    const createErrText = await createRes.text();
                    console.error('[profile-save] Firestore POST failed:', createErrText);
                    return res.status(500).json({ error: 'Failed to create document' });
                }
            } else {
                return res.status(500).json({ error: `Firestore REST API error: ${firestoreRes.status}` });
            }
        }

        console.log(`[profile-save] ✅ Saved profile successfully for ${userId}`);
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[profile-save] ❌ Error saving profile:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
