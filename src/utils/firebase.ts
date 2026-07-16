import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Ваш конфиг из консоли Firebase
const firebaseConfig = {
    apiKey: 'AIzaSyCkdcAHtqY-K_HRfb0FpkVR8lU5tbJfmYE',
    authDomain: 'masters-of-the-wilde.firebaseapp.com',
    projectId: 'masters-of-the-wilde',
    storageBucket: 'masters-of-the-wilde.firebasestorage.app',
    messagingSenderId: '474922234777',
    appId: '1:474922234777:web:2300a8c87464b08c339908',
};

// Инициализация с современным многовкладочным кэшированием
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
    }),
});
export const auth = getAuth(app);

const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.endsWith('.local') ||
        window.location.protocol === 'file:');

export const USERS_COLLECTION = isLocalhost ? 'пользователи_dev' : 'пользователи';
export const CHAT_COLLECTION = isLocalhost ? 'чат_dev' : 'чат';
export const FEEDBACK_COLLECTION = isLocalhost ? 'отзывы_dev' : 'отзывы';
