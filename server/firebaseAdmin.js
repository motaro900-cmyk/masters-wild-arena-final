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

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function formatPrivateKey(key) {
    if (!key) return '';
    let formatted = key.trim();
    if ((formatted.startsWith('"') && formatted.endsWith('"')) || (formatted.startsWith("'") && formatted.endsWith("'"))) {
        formatted = formatted.slice(1, -1);
    }
    return formatted.replace(/\\n/g, '\n');
}

function getAdminApp() {
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

/**
 * Returns a Firestore Admin instance.
 * Call once per serverless function invocation — Vercel reuses warm instances.
 */
export function getAdminDb() {
    const db = getFirestore(getAdminApp());
    try {
        db.settings({ preferRest: true, ignoreUndefinedProperties: true });
    } catch (e) {
        // Settings may already be locked on warm instance
    }
    return db;
}

/**
 * Returns a Firebase Admin Auth instance.
 */
export function getAdminAuth() {
    return getAuth(getAdminApp());
}
