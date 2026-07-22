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

async function getAdminApp() {
    const { initializeApp, cert, getApps, getApp } = await import('firebase-admin/app');
    if (getApps().length > 0) {
        return getApp();
    }

    const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            '[firebaseAdmin] Missing required env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY. ' +
            'Set these in Vercel → Project → Settings → Environment Variables.',
        );
    }

    return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });
}

process.env.FIRESTORE_PREFER_REST = 'true';

let adminDbInstance = null;

/**
 * Returns a Firestore Admin instance.
 * Call once per serverless function invocation — Vercel reuses warm instances.
 */
export async function getAdminDb() {
    if (!adminDbInstance) {
        const { getFirestore } = await import('firebase-admin/firestore');
        const app = await getAdminApp();
        adminDbInstance = getFirestore(app);
        try {
            adminDbInstance.settings({ ignoreUndefinedProperties: true });
        } catch (e) {}
    }
    return adminDbInstance;
}

/**
 * Returns a Firebase Admin Auth instance.
 */
export async function getAdminAuth() {
    const { getAuth } = await import('firebase-admin/auth');
    const app = await getAdminApp();
    return getAuth(app);
}
