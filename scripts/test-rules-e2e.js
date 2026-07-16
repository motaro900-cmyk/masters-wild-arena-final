/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: End-to-end simulation of the Custom Auth Token flow and Firestore Security Rules.
 * 
 * Instructions to run:
 *   1. Make sure your local VPS server is running:
 *      $ env VK_APP_SECRET="mock_secret" FIREBASE_PROJECT_ID="masters-of-the-wilde" FIREBASE_CLIENT_EMAIL="..." FIREBASE_PRIVATE_KEY="..." node server/vps-server.js
 *   2. Run this test script:
 *      $ node scripts/test-rules-e2e.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import crypto from 'crypto';

const firebaseConfig = {
    apiKey: 'AIzaSyCkdcAHtqY-K_HRfb0FpkVR8lU5tbJfmYE',
    authDomain: 'masters-of-the-wilde.firebaseapp.com',
    projectId: 'masters-of-the-wilde',
    storageBucket: 'masters-of-the-wilde.firebasestorage.app',
    messagingSenderId: '474922234777',
    appId: '1:474922234777:web:2300a8c87464b08c339908',
};

// Initialize Firebase client SDK
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const LOCAL_SERVER = 'http://localhost:3000';
const VK_SECRET = 'mock_secret';

// Generates valid VK launch params signed with our mock secret
function generateMockVkParams(vkUserId) {
    const params = {
        vk_app_id: '12345',
        vk_user_id: vkUserId.toString(),
    };
    const sortedQuery = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
        
    const sign = crypto
        .createHmac('sha256', VK_SECRET)
        .update(sortedQuery)
        .digest()
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=$/, '');
        
    return `?${sortedQuery}&sign=${sign}`;
}

async function fetchToken(vkUserId) {
    const searchParams = generateMockVkParams(vkUserId);
    const url = `${LOCAL_SERVER}/api/auth-token${searchParams}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch token: ${res.status} - ${text}`);
    }
    const data = await res.json();
    return data.token;
}

async function runTest() {
    console.log('🧪 Starting End-to-End Firestore Rules Simulation...');
    
    // We will simulate two players: Player A (VK-1111) and Player B (VK-2222)
    const uidA = 'VK-1111';
    const uidB = 'VK-2222';
    
    console.log(`\n1. Fetching Firebase Custom Auth Token for Player A (${uidA})...`);
    const tokenA = await fetchToken(1111);
    console.log('✅ Custom Token A received:', tokenA.substring(0, 30) + '...');
    
    console.log(`\n2. Signing in client SDK as Player A (${uidA})...`);
    const userCredential = await signInWithCustomToken(auth, tokenA);
    console.log('✅ Signed in successfully. Current User UID:', auth.currentUser.uid);
    
    if (auth.currentUser.uid !== uidA) {
        throw new Error(`Auth UID mismatch! Expected ${uidA}, got ${auth.currentUser.uid}`);
    }
    
    const docRefA = doc(db, 'пользователи', uidA);
    const docRefB = doc(db, 'пользователи', uidB);
    
    console.log(`\n3. [OWN WRITE] Player A writes their own profile document...`);
    await setDoc(docRefA, {
        name: 'Player A',
        gold: 100,
        crystals: 10,
        rating: 1200,
        friends: []
    }, { merge: true });
    console.log('✅ Successfully wrote own profile.');
    
    console.log(`\n4. [OWN READ] Player A reads their own profile...`);
    const snapA = await getDoc(docRefA);
    console.log('✅ Own profile loaded:', snapA.data());
    
    console.log(`\n5. [OTHER READ] Player A reads Player B\'s rating (matchmaking)...`);
    const snapB = await getDoc(docRefB);
    if (snapB.exists()) {
        console.log('✅ Read Player B rating successfully:', snapB.data().rating);
    } else {
        console.log('ℹ️ Player B profile does not exist yet (expected).');
    }
    
    console.log(`\n6. [EXPLOIT TEST] Player A attempts to write gold to Player B\'s document (should FAIL after rules deploy)...`);
    try {
        await setDoc(docRefB, { gold: 999999 }, { merge: true });
        console.log('⚠️ WARNING: Wrote gold to Player B successfully! (Expect this if rules are not deployed yet).');
    } catch (err) {
        console.log('✅ EXPECTED SECURITY REJECTION: Failed to write gold to Player B:', err.message);
    }
    
    console.log(`\n7. [FRIENDS UPDATE] Player A attempts to add themselves to Player B\'s friends list (should SUCCEED)...`);
    // Seed Player B profile first using Admin credentials or skip if rules allow creation
    // Assuming friends list exists or is initialized:
    const oldFriends = snapB.exists() ? (snapB.data().friends || []) : [];
    const newFriends = [...oldFriends.filter(f => f !== uidA), uidA];
    
    try {
        await updateDoc(docRefB, { friends: newFriends });
        console.log('✅ Successfully added Player A to Player B\'s friends list.');
    } catch (err) {
        console.warn('❌ Failed to update Player B friends list:', err.message);
    }

    console.log(`\n8. [EXPLOIT TEST] Player A attempts to corrupt Player B\'s friends list by writing arbitrary IDs...`);
    try {
        await updateDoc(docRefB, { friends: ['HACKER_1', 'HACKER_2'] });
        console.log('⚠️ WARNING: Corrupted Player B friends list successfully! (Expect this if rules are not deployed yet).');
    } catch (err) {
        console.log('✅ EXPECTED SECURITY REJECTION: Failed to corrupt friends list:', err.message);
    }

    console.log('\n9. Cleaning up test documents...');
    try {
        // Sign out client
        await signOut(auth);
        console.log('✅ Signed out successfully.');
    } catch (cleanupErr) {
        console.error('Cleanup failed:', cleanupErr);
    }
    
    console.log('\n🎉 Simulation run finished.');
}

runTest().catch(err => {
    console.error('❌ E2E Simulation failed:', err);
});
