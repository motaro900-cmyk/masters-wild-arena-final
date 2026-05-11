import { db } from '../utils/firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useGameStore } from '../store/useGameStore';
import { getVkUserInfo } from '../utils/VKBridge';

export class SyncService {
    private static instance: SyncService;
    private syncInterval: any = null;

    private constructor() {}

    public static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    /**
     * Синхронизирует текущее состояние игрока с Firebase
     */
    public async syncPlayerData(): Promise<void> {
        const state = useGameStore.getState();
        
        // Если пользователя нет в сторе, пробуем получить его из VK
        let vkUser = state.vkUser;
        if (!vkUser) {
            vkUser = await getVkUserInfo();
            if (vkUser) {
                state.setVkUser(vkUser);
            }
        }

        // Используем VK ID как основной ключ, если он есть, иначе - playerId
        const userId = vkUser ? String(vkUser.id) : state.playerId;
        
        if (!userId) {
            console.warn('[SyncService] No UserID found, skipping sync');
            return;
        }

        try {
            const playerRef = doc(db, 'пользователи', userId);
            
            const syncData = {
                id: userId,
                vkId: vkUser ? Number(vkUser.id) : 0,
                name: vkUser ? `${vkUser.firstName} ${vkUser.lastName}` : 'Guest',
                photo: vkUser ? vkUser.photo : '',
                лев: state.level || 1,
                золото: state.gold || 0,
                кристаллы: state.crystals || 0,
                rating: state.rating || 0,
                lastSeen: serverTimestamp(),
                activeScreen: state.activeScreen || 'MAIN_MENU',
                // Можно добавить инвентарь и прочее, если нужно для админки
                геройСнаряжение: {
                    weapon: state.heroEquipment?.panda?.WEAPONS || '',
                    helm: state.heroEquipment?.panda?.HELMETS || '',
                    armor: state.heroEquipment?.panda?.ARMOR || '',
                    shield: state.heroEquipment?.panda?.SHIELDS || '',
                },
                инвентарь: state.inventory || []
            };

            await setDoc(playerRef, syncData, { merge: true });
            console.log(`[SyncService] Data synced for player: ${syncData.name}`);
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
        }
    }

    /**
     * Запускает автоматическую периодическую синхронизацию
     */
    public startAutoSync(intervalMs: number = 60000): void {
        if (this.syncInterval) return;
        
        // Первая синхронизация сразу
        this.syncPlayerData();
        
        this.syncInterval = setInterval(() => {
            this.syncPlayerData();
        }, intervalMs);
        
        console.log(`[SyncService] Auto-sync started (every ${intervalMs/1000}s)`);
    }

    public stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Получает список всех игроков из Firebase (для админ-панели)
     */
    public async getAllPlayers(): Promise<any[]> {
        try {
            const playersRef = collection(db, 'пользователи');
            const q = query(playersRef, orderBy('lastSeen', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
        } catch (error) {
            console.error('[SyncService] Failed to fetch players:', error);
            return [];
        }
    /**
     * Удаленно обновляет данные игрока в Firebase (для админки)
     */
    public async updateRemotePlayerData(userId: string, data: any): Promise<void> {
        try {
            const playerRef = doc(db, 'пользователи', userId);
            await setDoc(playerRef, data, { merge: true });
            console.log(`[SyncService] Remote data updated for player: ${userId}`);
        } catch (error) {
            console.error('[SyncService] Remote update failed:', error);
            throw error;
        }
    }
}

export const syncService = SyncService.getInstance();
