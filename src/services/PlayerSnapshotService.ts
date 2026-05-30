import { db } from '../utils/firebase';
import {
    doc,
    setDoc,
    collection,
    getDocs,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { useGameStore } from '../store/useGameStore';
import { syncService, SyncService } from './SyncService';

const MAX_OFFLINE_ATTACKS = 10; // Максимум атак пока офлайн

export interface PendingResult {
    id: string;
    attackerId: string;
    attackerName: string;
    attackerRating: number;
    defenderResult: 'WIN' | 'LOSS';
    cupsChange: number;      // изменение кубков защитника
    goldChange: number;      // золото за защиту (если ghost победил)
    timestamp: any;
}

export interface OfflineSummary {
    totalAttacks: number;
    wins: number;
    losses: number;
    totalCupsChange: number;
    totalGoldChange: number;
    attacks: PendingResult[];
}

class PlayerSnapshotServiceClass {
    /**
     * Вызывается при каждом входе в игру.
     * 1. Обновляет snapshot игрока в Firebase
     * 2. Читает и применяет pendingResults (атаки пока офлайн)
     * 3. Возвращает сводку для письма (или null если атак не было)
     */
    public async syncOnLogin(): Promise<OfflineSummary | null> {
        const state = useGameStore.getState();
        const vkUser = state.vkUser;
        const userId = SyncService.getPrefixedUserId(vkUser, state.playerId);
        if (!userId) return null;

        // 1. Обновляем snapshot
        await this.saveSnapshot(userId, state);

        // 2. Читаем и применяем pendingResults
        const summary = await this.applyPendingResults(userId, state);

        return summary;
    }

    /**
     * Сохраняет подробный snapshot игрока — используется для матчмейкинга противников.
     */
    private async saveSnapshot(userId: string, state: any): Promise<void> {
        try {
            const selectedHeroId = state.selectedHeroId || 'panda';
            const equipment = state.heroEquipment?.[selectedHeroId] || {};
            const stats = state.getCalculatedStats?.(selectedHeroId)?.total || {};
            const heroConfig = (await import('../configs/HeroesConfig')).HEROES_DB
                .find((h: any) => h.id === selectedHeroId);
            const vkUser = state.vkUser;

            const snapshotData = {
                id: userId,
                vkId: vkUser ? Number(vkUser.id) : 0,
                имя: state.name || (vkUser ? (vkUser.first_name || vkUser.firstName || '') : 'Мастер'),
                имяВК: vkUser ? (vkUser.first_name || vkUser.firstName || '') : '',
                фамилияВК: vkUser ? (vkUser.last_name || vkUser.lastName || '') : '',
                ссылкаВК: vkUser ? `https://vk.com/id${vkUser.id}` : '',
                уровень: state.level || 1,
                золото: state.gold || 0,
                кристаллы: state.crystals || 0,
                рейтинг: state.rating || 0,
                былВСети: serverTimestamp(),
                активныйЭкран: state.activeScreen || 'MAIN_MENU',
                герой: selectedHeroId,
                фото: state.avatar || (vkUser ? (vkUser.photo200 || vkUser.photo || '') : ''),
                снаряжение: {
                    WEAPONS: equipment.WEAPONS || null,
                    HELMETS: equipment.HELMETS || null,
                    ARMOR: equipment.ARMOR || null,
                    SHIELDS: equipment.SHIELDS || null,
                    SHOULDERS: equipment.SHOULDERS || null,
                    PANTS: equipment.PANTS || null,
                    BOOTS: equipment.BOOTS || null,
                },
                stats: {
                    hp: stats.hp || 100,
                    attack: stats.attack || 10,
                    defense: stats.defense || 5,
                    speed: stats.speed || 1,
                },
            };

            const playerRef = doc(db, 'пользователи', userId);
            await setDoc(playerRef, snapshotData, { merge: true });
        } catch (error) {
            console.error('[PlayerSnapshotService] Failed to save snapshot:', error);
        }
    }

    /**
     * Читает pendingResults, применяет кубки и золото, очищает очередь.
     */
    private async applyPendingResults(userId: string, state: any): Promise<OfflineSummary | null> {
        try {
            const pendingRef = collection(db, 'пользователи', userId, 'pendingResults');
            const snapshot = await getDocs(pendingRef);

            if (snapshot.empty) return null;

            const results: PendingResult[] = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() } as PendingResult))
                // Берём только последние MAX_OFFLINE_ATTACKS атак
                .slice(0, MAX_OFFLINE_ATTACKS);

            // Считаем итоги
            let totalCupsChange = 0;
            let totalGoldChange = 0;
            let wins = 0;
            let losses = 0;

            results.forEach((r) => {
                totalCupsChange += r.cupsChange || 0;
                totalGoldChange += r.goldChange || 0;
                if (r.defenderResult === 'WIN') wins++;
                else losses++;
            });

            // Применяем к стору
            if (totalCupsChange !== 0 || totalGoldChange !== 0) {
                const newRating = Math.max(0, (state.rating || 0) + totalCupsChange);
                const newGold = (state.gold || 0) + totalGoldChange;
                useGameStore.setState({ rating: newRating, gold: newGold });

                // Синхронизируем с Firebase
                syncService.syncPlayerData();
            }

            // Удаляем обработанные pendingResults
            await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));

            return {
                totalAttacks: results.length,
                wins,
                losses,
                totalCupsChange,
                totalGoldChange,
                attacks: results,
            };
        } catch (error) {
            console.error('[PlayerSnapshotService] Failed to apply pending results:', error);
            return null;
        }
    }
}

export const playerSnapshotService = new PlayerSnapshotServiceClass();
