import { useGameStore } from '../../store/useGameStore';
import { HeroUnit } from '../entities/HeroUnit';

/**
 * СИСТЕМА СИНХРОНИЗАЦИИ ГЕРОЕВ
 * Связывает Zustand-стор с PixiJS-сущностями.
 */
export class HeroSyncSystem {
    private static activeSubscriptions: Map<string, () => void> = new Map();

    /**
     * Настраивает автоматическую синхронизацию для юнита
     */
    public static async setupHeroSync(heroId: string, heroUnit: HeroUnit) {
        // 1. Сначала загружаем базу героя
        await heroUnit.loadHero(heroId);

        // 2. Подписываемся на изменения экипировки
        // Используем селектор, чтобы срабатывало только при смене шмота конкретного героя
            const unsubscribe = useGameStore.subscribe(
                (state: any) => {
                    const newEquipment = state.heroEquipment[heroId];
                    if (newEquipment) {
                        console.log(`[HeroSync] Updating equipment for ${heroId}`);
                        heroUnit.updateEquipment(newEquipment);
                    }
                }
            );

        // Сохраняем подписку для последующей очистки
        const subKey = `${heroId}_${heroUnit.heroInstanceId}`;
        this.activeSubscriptions.set(subKey, unsubscribe);

        return unsubscribe;
    }

    /**
     * Очистка всех подписок (вызывать при смене сцены)
     */
    public static clearAll() {
        this.activeSubscriptions.forEach(unsub => unsub());
        this.activeSubscriptions.clear();
    }
}
