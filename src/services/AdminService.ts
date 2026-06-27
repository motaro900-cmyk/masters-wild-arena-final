/**
 * AdminService — admin-only operations: listing players, leaderboard, feedback, remote updates
 */
import { db, USERS_COLLECTION, FEEDBACK_COLLECTION } from '../utils/firebase';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    where,
    serverTimestamp,
    deleteDoc,
} from 'firebase/firestore';
import { useGameStore } from '../store/useGameStore';
import { sendMail } from './MailService';

type TrackFn = (unsub: () => void) => () => void;

export async function getAllPlayers(): Promise<any[]> {
    try {
        const playersRef = collection(db, USERS_COLLECTION);
        const q = query(playersRef, orderBy('былВСети', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    } catch (error) {
        console.error('[AdminService] Failed to fetch players:', error);
        return [];
    }
}

export function subscribeToAllPlayers(track: TrackFn, callback: (players: any[]) => void): () => void {
    try {
        const playersRef = collection(db, USERS_COLLECTION);
        const q = query(playersRef, orderBy('былВСети', 'desc'), limit(100));
        return track(
            onSnapshot(
                q,
                (snapshot: any) => {
                    callback(snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id })));
                },
                (error: any) => console.error('[AdminService] All players subscription error:', error),
            ),
        );
    } catch (error) {
        console.error('[AdminService] Failed to set up all players subscription:', error);
        return () => {};
    }
}

export async function sendFeedback(data: any): Promise<void> {
    try {
        const feedbackRef = doc(collection(db, FEEDBACK_COLLECTION));
        await setDoc(feedbackRef, { ...data, serverTimestamp: serverTimestamp() });
    } catch (error) {
        console.error('[AdminService] Failed to send feedback:', error);
        throw error;
    }
}

export async function getAllFeedback(): Promise<any[]> {
    try {
        const feedbackRef = collection(db, FEEDBACK_COLLECTION);
        const q = query(feedbackRef, orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    } catch (error) {
        console.error('[AdminService] Failed to fetch feedback:', error);
        return [];
    }
}

export async function searchPlayerById(playerId: string): Promise<any | null> {
    try {
        let id = playerId.trim();
        if (id.toUpperCase().startsWith('MW-')) id = id.substring(3);

        let playerRef = doc(db, USERS_COLLECTION, id);
        let playerSnap = await getDoc(playerRef);

        if (!playerSnap.exists() && !id.startsWith('VK-') && !id.startsWith('GUEST-') && !id.startsWith('ГОСТЬ-')) {
            playerRef = doc(db, USERS_COLLECTION, `GUEST-${id}`);
            playerSnap = await getDoc(playerRef);
            if (!playerSnap.exists()) {
                playerRef = doc(db, USERS_COLLECTION, `ГОСТЬ-${id}`);
                playerSnap = await getDoc(playerRef);
            }
        }

        if (playerSnap.exists()) return { id: playerSnap.id, ...playerSnap.data() };

        const playersRef = collection(db, USERS_COLLECTION);
        const snapName = await getDocs(query(playersRef, where('name', '==', id)));
        if (!snapName.empty) return { id: snapName.docs[0].id, ...snapName.docs[0].data() };

        const snapImya = await getDocs(query(playersRef, where('имя', '==', id)));
        if (!snapImya.empty) return { id: snapImya.docs[0].id, ...snapImya.docs[0].data() };

        return null;
    } catch (error) {
        console.error('[AdminService] Player search failed:', error);
        return null;
    }
}

export async function getGlobalPlayers(limitCount: number = 20): Promise<any[]> {
    try {
        const playersRef = collection(db, USERS_COLLECTION);
        const q = query(playersRef, orderBy('былВСети', 'desc'), limit(limitCount + 15));
        const snapshot = await getDocs(q);
        const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const state = useGameStore.getState();
        return raw
            .filter((p: any) => {
                const name = (p.name || p.имя || '').toLowerCase();
                const isMe = p.id === state.playerId || (p.vkId && String(p.vkId) === String(state.vkUser?.id));
                if (isMe) return true;
                if (name === 'мастер') return false; // Hide guest/mock profiles with default name
                if (['разработчик', 'test'].some((w) => name.includes(w))) return false;
                if (p.тестовый || p.разработчик) return false;
                return true;
            })
            .slice(0, limitCount);
    } catch (error) {
        console.error('[AdminService] Failed to get global players:', error);
        return [];
    }
}

export function subscribeToGlobalLeaders(
    track: TrackFn,
    limitCount: number = 50,
    callback: (leaders: any[]) => void,
): () => void {
    try {
        const playersRef = collection(db, USERS_COLLECTION);
        const q = query(playersRef, orderBy('рейтинг', 'desc'), limit(limitCount + 15));
        const state = useGameStore.getState();
        return track(
            onSnapshot(
                q,
                (snapshot: any) => {
                    const raw = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                    const filtered = raw
                        .filter((p: any) => {
                            const name = (p.name || p.имя || '').toLowerCase();
                            const isMe =
                                p.id === state.playerId || (p.vkId && String(p.vkId) === String(state.vkUser?.id));
                            if (isMe) return true;
                            if (name === 'мастер') return false; // Hide guest/mock profiles with default name from leaderboard
                            if (['разработчик', 'test'].some((w) => name.includes(w))) return false;
                            if (p.тестовый || p.разработчик) return false;
                            return true;
                        })
                        .slice(0, limitCount);
                    callback(filtered);
                },
                (error: any) => console.error('[AdminService] Global leaders subscription error:', error),
            ),
        );
    } catch (error) {
        console.error('[AdminService] Failed to set up global leaders subscription:', error);
        return () => {};
    }
}

export async function updateRemotePlayerData(userId: string, data: any): Promise<void> {
    try {
        const playerRef = doc(db, USERS_COLLECTION, userId);
        const playerSnap = await getDoc(playerRef);

        const mapping: Record<string, string> = {
            gold: 'золото',
            crystals: 'кристаллы',
            level: 'уровень',
            rating: 'рейтинг',
            avatar: 'фото',
            inventory: 'инвентарь',
            heroEquipment: 'снаряжение',
            talentPoints: 'talentPoints',
            hasInfiniteEnergy: 'hasInfiniteEnergy',
        };

        const updatedData: any = {};
        for (const key in data) {
            updatedData[mapping[key] || key] = data[key];
        }
        updatedData.adminChangedFields = Object.keys(data);

        if (playerSnap.exists()) {
            const docData = playerSnap.data();
            updatedData.adminVersion = Number(docData.adminVersion || 0) + 1;
            const fullStateStr = docData.fullStateJSON || docData.полноеСостояниеJSON;
            if (fullStateStr) {
                try {
                    const parsed = JSON.parse(fullStateStr);
                    if (data.золото !== undefined || data.gold !== undefined)
                        parsed.gold = Number(data.золото ?? data.gold);
                    if (data.кристаллы !== undefined || data.crystals !== undefined)
                        parsed.crystals = Number(data.кристаллы ?? data.crystals);
                    if (data.уровень !== undefined || data.level !== undefined)
                        parsed.level = Number(data.уровень ?? data.level);
                    if (data.рейтинг !== undefined || data.rating !== undefined) {
                        const val = Number(data.рейтинг ?? data.rating);
                        parsed.rating = val;
                        parsed.trophies = val;
                    }
                    if (data.инвентарь !== undefined || data.inventory !== undefined)
                        parsed.inventory = data.инвентарь ?? data.inventory;
                    if (data.снаряжение !== undefined || data.heroEquipment !== undefined)
                        parsed.heroEquipment = data.снаряжение ?? data.heroEquipment;
                    if (data.ownedSkins !== undefined) parsed.ownedSkins = data.ownedSkins;
                    if (data.ownedHeroes !== undefined) parsed.ownedHeroes = data.ownedHeroes;
                    if (data.talentPoints !== undefined) parsed.talentPoints = Number(data.talentPoints);
                    if (data.hasInfiniteEnergy !== undefined) parsed.hasInfiniteEnergy = !!data.hasInfiniteEnergy;
                    updatedData.fullStateJSON = JSON.stringify(parsed);
                } catch (e) {
                    console.error('[AdminService] Failed to parse fullStateJSON:', e);
                }
            }
        } else {
            updatedData.adminVersion = 1;
        }

        await setDoc(playerRef, updatedData, { merge: true });
    } catch (error) {
        console.error('[AdminService] Remote update failed:', error);
        throw error;
    }
}

export async function sendBroadcastMail(mailData: any): Promise<void> {
    try {
        const players = await getAllPlayers();
        await Promise.all(players.map((p) => sendMail(p.id, mailData)));
        console.log(`[AdminService] Broadcast mail sent to ${players.length} players`);
    } catch (error) {
        console.error('[AdminService] Broadcast mail failed:', error);
        throw error;
    }
}

export async function distributeSeasonRewards(): Promise<number> {
    try {
        const playersRef = collection(db, USERS_COLLECTION);
        const q = query(playersRef, orderBy('рейтинг', 'desc'));
        const snapshot = await getDocs(q);
        const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const filtered = raw.filter((p: any) => {
            const name = (p.name || p.имя || '').toLowerCase();
            if (['разработчик', 'test'].some((w) => name.includes(w))) return false;
            if (p.тестовый || p.разработчик) return false;
            return true;
        });

        let count = 0;
        const timestamp = Date.now();

        for (let i = 0; i < Math.min(filtered.length, 100); i++) {
            const player = filtered[i];
            const rank = i + 1;
            let rewards: any[] = [];

            if (rank >= 1 && rank <= 3) {
                rewards = [
                    { type: 'CRYSTALS', amount: 500 },
                    { type: 'GOLD', amount: 25000 },
                    { type: 'ITEM', itemId: 'season_chest', amount: 1 },
                ];
            } else if (rank >= 4 && rank <= 10) {
                rewards = [
                    { type: 'CRYSTALS', amount: 250 },
                    { type: 'GOLD', amount: 10000 },
                ];
            } else if (rank >= 11 && rank <= 100) {
                rewards = [
                    { type: 'CRYSTALS', amount: 100 },
                    { type: 'GOLD', amount: 3000 },
                ];
            }

            const mailData = {
                id: `season_reward_s1_${timestamp}_${rank}`,
                tab: 'INBOX',
                type: 'REWARD',
                from: 'ВЕСТНИК СЕЗОНА',
                subject: '🏆 НАГРАДА ЗА СЕЗОН I',
                body: `Поздравляем! Вы заняли ${rank}-е место в глобальном рейтинге по итогам Сезона I • Рассвет дикого леса. Ваша заслуженная награда прикреплена к этому письму! Спасибо за участие в сражениях!`,
                date: 'СЕГОДНЯ',
                isRead: false,
                isStarred: false,
                rewards,
                timestamp,
            };

            await sendMail(player.id, mailData);
            count++;
        }

        console.log(`[AdminService] Distributed season rewards to ${count} players.`);
        return count;
    } catch (error) {
        console.error('[AdminService] Season rewards distribution failed:', error);
        throw error;
    }
}

export async function searchPlayersGlobal(searchTerm: string): Promise<any[]> {
    try {
        const playersRef = collection(db, USERS_COLLECTION);
        const results: any[] = [];
        const cleanTerm = searchTerm.trim();
        if (!cleanTerm) return [];

        // 1. Поиск по точному ID документа
        const docRef = doc(db, USERS_COLLECTION, cleanTerm);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            results.push({ ...docSnap.data(), id: docSnap.id });
        }

        // 2. Поиск по короткому гостевому ID
        if (!cleanTerm.toUpperCase().startsWith('VK-') && !cleanTerm.toUpperCase().startsWith('GUEST-')) {
            const guestDocSnap = await getDoc(doc(db, USERS_COLLECTION, `GUEST-${cleanTerm}`));
            if (guestDocSnap.exists()) {
                results.push({ ...guestDocSnap.data(), id: guestDocSnap.id });
            }
        }

        // 3. Поиск по префиксу имени (name)
        const qName = query(
            playersRef,
            where('name', '>=', cleanTerm),
            where('name', '<=', cleanTerm + '\uf8ff'),
            limit(20),
        );
        const snapName = await getDocs(qName);
        snapName.forEach((d) => {
            if (!results.some((r) => r.id === d.id)) {
                results.push({ ...d.data(), id: d.id });
            }
        });

        // 4. Поиск по префиксу имени (имя)
        const qImya = query(
            playersRef,
            where('имя', '>=', cleanTerm),
            where('имя', '<=', cleanTerm + '\uf8ff'),
            limit(20),
        );
        const snapImya = await getDocs(qImya);
        snapImya.forEach((d) => {
            if (!results.some((r) => r.id === d.id)) {
                results.push({ ...d.data(), id: d.id });
            }
        });

        return results;
    } catch (error) {
        console.error('[AdminService] Global player search failed:', error);
        return [];
    }
}

export async function deleteFeedback(id: string): Promise<void> {
    try {
        const feedbackRef = doc(db, FEEDBACK_COLLECTION, id);
        await deleteDoc(feedbackRef);
        console.log(`[AdminService] Feedback doc ${id} deleted successfully.`);
    } catch (error) {
        console.error('[AdminService] Failed to delete feedback:', error);
        throw error;
    }
}
