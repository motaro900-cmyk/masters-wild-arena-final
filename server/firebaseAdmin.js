/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Firebase Admin SDK singleton for server-side Firestore access.
 *
 * Admin SDK uses a service account — it bypasses Firestore Security Rules entirely.
 * This allows rules to be set to `allow read, write: if false` (full lockdown),
 * blocking any direct client access via the public Web API key.
 *
 * Required Vercel env vars:
 *   FIREBASE_PROJECT_ID   — e.g. "masters-of-the-wilde"
 *   FIREBASE_CLIENT_EMAIL — service account email from Firebase Console
 *   FIREBASE_PRIVATE_KEY  — private key from service account JSON (with \n preserved)
 */

import crypto from 'node:crypto';

function formatPrivateKey(key) {
    if (!key) return '';
    let formatted = key.trim();
    if ((formatted.startsWith('"') && formatted.endsWith('"')) || (formatted.startsWith("'") && formatted.endsWith("'"))) {
        formatted = formatted.slice(1, -1);
    }
    return formatted.replace(/\\n/g, '\n');
}

export async function getGoogleAccessToken() {
    const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY');
    }

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const claim = Buffer.from(JSON.stringify({
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    })).toString('base64url');

    const signatureInput = `${header}.${claim}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(privateKey, 'base64url');

    const jwt = `${signatureInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google OAuth token fetch failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return { token: data.access_token, projectId };
}

export async function createFirebaseCustomToken(uid) {
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!clientEmail || !privateKey) {
        throw new Error('Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY');
    }

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const claim = Buffer.from(JSON.stringify({
        iss: clientEmail,
        sub: clientEmail,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        uid: uid,
        iat: now,
        exp: now + 3600,
    })).toString('base64url');

    const signatureInput = `${header}.${claim}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(privateKey, 'base64url');

    return `${signatureInput}.${signature}`;
}

export function parseFirestoreFields(fields) {
    if (!fields) return {};
    const res = {};
    for (const [k, v] of Object.entries(fields)) {
        if ('stringValue' in v) res[k] = v.stringValue;
        else if ('integerValue' in v) res[k] = Number(v.integerValue);
        else if ('doubleValue' in v) res[k] = Number(v.doubleValue);
        else if ('booleanValue' in v) res[k] = v.booleanValue;
        else if ('mapValue' in v) res[k] = parseFirestoreFields(v.mapValue?.fields);
        else if ('arrayValue' in v) res[k] = (v.arrayValue?.values || []).map((val) => parseFirestoreFields({ x: val }).x);
        else if ('nullValue' in v) res[k] = null;
        else res[k] = v;
    }
    return res;
}

export function toFirestoreFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj || {})) {
        if (v === null || v === undefined) fields[k] = { nullValue: null };
        else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
        else if (typeof v === 'number') {
            if (Number.isInteger(v)) fields[k] = { integerValue: String(v) };
            else fields[k] = { doubleValue: v };
        } else if (typeof v === 'string') fields[k] = { stringValue: v };
        else if (Array.isArray(v)) {
            fields[k] = {
                arrayValue: {
                    values: v.map((item) => toFirestoreFields({ x: item }).x || { nullValue: null }),
                },
            };
        } else if (typeof v === 'object') {
            fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
        }
    }
    return fields;
}

export async function fetchFirestoreRestDoc(collectionName, docId) {
    const { token, projectId } = await getGoogleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return { exists: false, data: null };
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Firestore REST GET failed (${res.status}): ${errText}`);
    }
    const doc = await res.json();
    return { exists: true, data: parseFirestoreFields(doc.fields) };
}

export async function saveFirestoreRestDoc(collectionName, docId, data) {
    const { token, projectId } = await getGoogleAccessToken();
    const fields = toFirestoreFields(data);
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Firestore REST PATCH failed (${res.status}): ${errText}`);
    }
    return true;
}
