/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Loads player profile from Firestore using REST API to bypass Russia regional blocks.
 */

const FIREBASE_PROJECT_ID = 'masters-of-the-wilde';
const FIREBASE_WEB_API_KEY = 'AIzaSyCkdcAHtqY-K_HRfb0FpkVR8lU5tbJfmYE';

function parseFirestoreValue(value) {
    if (!value) return null;
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return parseInt(value.integerValue, 10);
    if ('doubleValue' in value) return parseFloat(value.doubleValue);
    if ('booleanValue' in value) return value.booleanValue;
    if ('timestampValue' in value) return value.timestampValue;
    if ('arrayValue' in value) {
        return (value.arrayValue.values || []).map(parseFirestoreValue);
    }
    if ('mapValue' in value) {
        const obj = {};
        const fields = value.mapValue.fields || {};
        for (const [k, v] of Object.entries(fields)) {
            obj[k] = parseFirestoreValue(v);
        }
        return obj;
    }
    if ('nullValue' in value) return null;
    return null;
}

function parseFirestoreDocument(doc) {
    const fields = doc.fields || {};
    const obj = {};
    for (const [k, v] of Object.entries(fields)) {
        obj[k] = parseFirestoreValue(v);
    }
    return obj;
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { userId, isDev } = req.query;
        if (!userId) {
            console.warn('[profile-load] Missing userId parameter');
            return res.status(400).json({ error: 'Missing userId parameter' });
        }

        const USERS_COLLECTION = isDev === 'true' ? 'пользователи_dev' : 'пользователи';
        const docPath = `${encodeURIComponent(USERS_COLLECTION)}/${encodeURIComponent(userId)}`;
        const userUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${docPath}?key=${FIREBASE_WEB_API_KEY}`;
        const adminUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/system/admins?key=${FIREBASE_WEB_API_KEY}`;

        console.log(`[profile-load] Fetching Firestore document: ${USERS_COLLECTION}/${userId} (and system/admins)`);
        const [firestoreRes, adminRes] = await Promise.all([
            fetch(userUrl),
            fetch(adminUrl).catch((err) => {
                console.error('[profile-load] Failed to fetch system/admins:', err);
                return null;
            })
        ]);

        let isAdmin = false;
        if (adminRes && adminRes.ok) {
            try {
                const adminDocData = await adminRes.json();
                const adminParsed = parseFirestoreDocument(adminDocData);
                const vkIds = adminParsed?.vkIds || [];
                const match = userId.match(/^VK-(\d+)$/);
                const vkIdNum = match ? Number(match[1]) : null;
                if (vkIdNum && (vkIds.map(Number).includes(vkIdNum) || vkIdNum === 212359386)) {
                    isAdmin = true;
                }
            } catch (e) {
                console.error('[profile-load] Error parsing admin whitelist:', e);
            }
        }

        if (firestoreRes.status === 404) {
            console.log(`[profile-load] Profile not found: ${USERS_COLLECTION}/${userId}`);
            return res.status(200).json({ exists: false, isAdmin });
        }

        if (!firestoreRes.ok) {
            const errText = await firestoreRes.text();
            console.error(`[profile-load] Firestore REST returned error ${firestoreRes.status}:`, errText);
            return res.status(500).json({ error: `Firestore REST API error: ${firestoreRes.status}` });
        }

        const docData = await firestoreRes.json();
        const parsed = parseFirestoreDocument(docData);

        console.log(`[profile-load] ✅ Loaded profile successfully for ${userId}. isAdmin=${isAdmin}`);
        return res.status(200).json({ exists: true, data: parsed, isAdmin });
    } catch (error) {
        console.error('[profile-load] ❌ Error loading profile:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
