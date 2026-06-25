import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyCkdcAHtqY-K_HRfb0FpkVR8lU5tbJfmYE',
    authDomain: 'masters-of-the-wilde.firebaseapp.com',
    projectId: 'masters-of-the-wilde',
    storageBucket: 'masters-of-the-wilde.firebasestorage.app',
    messagingSenderId: '474922234777',
    appId: '1:474922234777:web:2300a8c87464b08c339908',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const docRef = doc(db, 'пользователи', 'ГОСТЬ-QL6KM4hN');
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            console.log('Document exists! Data:', snap.data());
            await deleteDoc(docRef);
            console.log('Document deleted successfully!');
        } else {
            console.log('Document does not exist (already deleted).');
        }
    } catch (err) {
        console.error('Error checking/deleting document:', err);
    }
}
run();
