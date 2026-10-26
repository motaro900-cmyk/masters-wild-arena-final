/**
 * PortalSyncBridge — Мост сквозной синхронизации данных между Веб-Порталом и PixiJS сессией игры.
 *
 * Решает проблему изолированности портала:
 *  1. Обеспечивает единую точку правды (SSOT) для PortalCabinet, PortalDailyCheckIn и useGameStore.
 *  2. Атомарно синхронизирует золото, кристаллы, кузницу и чекин в защищенное зеркало SafeStorage (motw_local_profile).
 *  3. Гарантирует сохранение изменений портала при переходе в матч арены через BootController.
 *  4. Предоставляет расчет стартовых статов заточки Кузницы для Фэн Луна, Рикки, Громма и других героев.
 */

import { useGameStore } from '../store/useGameStore';
import { safeGetItem, safeSetItem } from '../utils/SafeStorage';
import { TimeService } from '../utils/TimeService';
import {
    IMowPlayerPayload,
    createSignedSaveEnvelope,
    verifyAndLoadSaveEnvelope,
} from './SaveCryptoService';

export interface IPortalForgeTiers {
    weapon: number; // 1..10 (Атака, Крит. урон)
    armor: number;  // 1..10 (Здоровье, Защита)
    ring: number;   // 1..10 (Крит. шанс, Пробитие/Меткость)
    boots: number;  // 1..10 (Скорость, Уклонение)
}

export interface ICheckInData {
    streak: number; // 1..7
    lastClaimDate: string; // YYYY-MM-DD
    claimedToday: boolean;
}

export interface IPortalCombatBonus {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    critChance: number;
    critDamage: number;
}

const DEFAULT_TIERS: IPortalForgeTiers = {
    weapon: 1,
    armor: 1,
    ring: 1,
    boots: 1,
};

class PortalSyncBridgeService {
    private static instance: PortalSyncBridgeService;
    private eventListenersAttached = false;

    private constructor() {
        if (typeof window !== 'undefined' && !this.eventListenersAttached) {
            this.eventListenersAttached = true;
            // Слушаем кросс-вкладочные события localStorage
            window.addEventListener('storage', (e) => {
                if (e.key === 'mow_portal_event_dispatch') {
                    this.notifySubscribers();
                }
            });
        }
    }

    public static getInstance(): PortalSyncBridgeService {
        if (!PortalSyncBridgeService.instance) {
            PortalSyncBridgeService.instance = new PortalSyncBridgeService();
        }
        return PortalSyncBridgeService.instance;
    }

    /**
     * Получить актуальный срез профиля для портала
     */
    public getProfile(): IMowPlayerPayload {
        const storeState = typeof useGameStore !== 'undefined' ? useGameStore.getState() : ({} as any);

        // 1. Чтение из SafeStorage (motw_local_profile)
        let localProfile: any = null;
        try {
            const raw = safeGetItem('motw_local_profile');
            if (raw) localProfile = JSON.parse(raw);
        } catch {
            // fallback
        }

        // 2. Чтение заточки кузницы портала
        let equipTiers = DEFAULT_TIERS;
        try {
            const savedTiers = localStorage.getItem('mow_equip_tiers');
            if (savedTiers) {
                equipTiers = { ...DEFAULT_TIERS, ...JSON.parse(savedTiers) };
            } else if (localProfile?.portalForgeTiers) {
                equipTiers = { ...DEFAULT_TIERS, ...localProfile.portalForgeTiers };
            }
        } catch {
            equipTiers = DEFAULT_TIERS;
        }

        // 3. Чтение чекина
        const streak = parseInt(localStorage.getItem('wild_portal_checkin_streak') || '1', 10);
        const lastClaimDate = localStorage.getItem('wild_portal_last_checkin_date') || '';
        const todayStr = new Date().toDateString();
        const claimedToday = lastClaimDate === todayStr;

        const guestId =
            storeState.playerId ||
            localProfile?.id ||
            localStorage.getItem('mow_guest_id') ||
            'MOW-' + Math.floor(1000 + Math.random() * 9000);

        const playerName =
            storeState.name ||
            localProfile?.name ||
            localStorage.getItem('mow_player_name') ||
            'Дикий Мастер';

        const selectedHeroId =
            storeState.selectedHeroId ||
            localProfile?.hero ||
            'panda';

        const gold =
            storeState.gold !== undefined
                ? storeState.gold
                : localProfile?.gold !== undefined
                ? localProfile.gold
                : 2450;

        const diamonds =
            storeState.crystals !== undefined
                ? storeState.crystals
                : localProfile?.crystals !== undefined
                ? localProfile.crystals
                : 120;

        const energy =
            storeState.energy !== undefined
                ? storeState.energy
                : localProfile?.energy !== undefined
                ? localProfile.energy
                : 50;

        const rating =
            storeState.rating !== undefined
                ? storeState.rating
                : localProfile?.rating !== undefined
                ? localProfile.rating
                : 1480;

        return {
            guestId,
            playerName,
            selectedHeroId,
            gold,
            diamonds,
            energy,
            rating,
            equipTiers,
            checkIn: {
                streak: streak > 7 ? 1 : streak,
                lastClaimDate,
                claimedToday,
            },
            isLoggedIn: !!localStorage.getItem('mow_auth_token'),
            accountEmail: localStorage.getItem('mow_auth_email') || '',
            exportedAt: new Date().toISOString(),
            nonce: '',
        };
    }

    /**
     * Атомарная фиксация изменений состояния на Портале
     */
    public commitMutation(patch: Partial<IMowPlayerPayload>): void {
        const current = this.getProfile();
        const updated: IMowPlayerPayload = {
            ...current,
            ...patch,
            equipTiers: { ...current.equipTiers, ...(patch.equipTiers || {}) },
            checkIn: { ...current.checkIn, ...(patch.checkIn || {}) },
        };

        // 1. Запись в постоянные локальные ключи
        if (patch.playerName) {
            localStorage.setItem('mow_player_name', patch.playerName);
        }
        if (patch.guestId) {
            localStorage.setItem('mow_guest_id', patch.guestId);
        }
        if (patch.equipTiers) {
            localStorage.setItem('mow_equip_tiers', JSON.stringify(updated.equipTiers));
        }
        if (patch.checkIn) {
            if (patch.checkIn.streak !== undefined) {
                localStorage.setItem('wild_portal_checkin_streak', patch.checkIn.streak.toString());
            }
            if (patch.checkIn.lastClaimDate !== undefined) {
                localStorage.setItem('wild_portal_last_checkin_date', patch.checkIn.lastClaimDate);
            }
        }

        // 2. Обновление in-memory useGameStore
        if (typeof useGameStore !== 'undefined' && useGameStore.setState) {
            const storePatch: any = {};
            if (patch.gold !== undefined) storePatch.gold = patch.gold;
            if (patch.diamonds !== undefined) storePatch.crystals = patch.diamonds;
            if (patch.rating !== undefined) storePatch.rating = patch.rating;
            if (patch.selectedHeroId) storePatch.selectedHeroId = patch.selectedHeroId;
            if (patch.playerName) storePatch.name = patch.playerName;
            storePatch.portalForgeTiers = updated.equipTiers;

            useGameStore.setState(storePatch);
        }

        // 3. Запись в защищенное зеркало SafeStorage (motw_local_profile)
        try {
            const existingRaw = safeGetItem('motw_local_profile');
            let profileObj: any = {};
            if (existingRaw) {
                profileObj = JSON.parse(existingRaw);
            }
            profileObj.gold = updated.gold;
            profileObj.crystals = updated.diamonds;
            profileObj.rating = updated.rating;
            profileObj.name = updated.playerName;
            profileObj.hero = updated.selectedHeroId;
            profileObj.portalForgeTiers = updated.equipTiers;
            profileObj.portalCheckIn = updated.checkIn;
            profileObj.lastSavedTimestamp = Date.now();

            safeSetItem('motw_local_profile', JSON.stringify(profileObj));
        } catch (e) {
            console.warn('[PortalSyncBridge] Failed to write SafeStorage mirror:', e);
        }

        // 4. Оповещение подписчиков интерфейса
        this.notifySubscribers();
    }

    /**
     * Заточка слота в Кузнице Портала
     */
    public upgradeSlot(slot: keyof IPortalForgeTiers): { success: boolean; newTier?: number; error?: string } {
        const profile = this.getProfile();
        const currentTier = profile.equipTiers[slot] || 1;

        if (currentTier >= 10) {
            return { success: false, error: 'Достигнут максимальный уровень заточки (Tier 10)!' };
        }

        const cost = (currentTier + 1) * 350;
        if (profile.gold < cost) {
            return { success: false, error: `Недостаточно золота! Требуется ${cost} 🪙` };
        }

        const newTier = currentTier + 1;
        const newGold = profile.gold - cost;
        const newTiers = { ...profile.equipTiers, [slot]: newTier };

        this.commitMutation({
            gold: newGold,
            equipTiers: newTiers,
        });

        return { success: true, newTier };
    }

    /**
     * Получить текущие уровни заточки для расчета боевой математики
     */
    public getForgeTiers(): IPortalForgeTiers {
        try {
            const saved = localStorage.getItem('mow_equip_tiers');
            if (saved) return { ...DEFAULT_TIERS, ...JSON.parse(saved) };
        } catch {
            // fallback
        }
        return DEFAULT_TIERS;
    }

    /**
     * Расчет боевых бонусов заточки Портала по классу героя
     */
    public calculatePortalForgeBonus(heroRole: string, tiers: IPortalForgeTiers = this.getForgeTiers()): IPortalCombatBonus {
        // Множитель уровня заточки M(T): 1: 1.0, 2: 1.15, 3: 1.30, 4: 1.50, 5: 1.65, 6: 1.80, 7: 2.05, 8: 2.20, 9: 2.35, 10: 2.65
        const getTierMult = (tier: number) => {
            const t = Math.max(1, Math.min(10, tier));
            const baseSteps: Record<number, number> = {
                1: 1.0,
                2: 1.15,
                3: 1.3,
                4: 1.5,
                5: 1.65,
                6: 1.8,
                7: 2.05,
                8: 2.2,
                9: 2.35,
                10: 2.65,
            };
            return baseSteps[t] ?? 1.0;
        };

        const wMult = getTierMult(tiers.weapon);
        const aMult = getTierMult(tiers.armor);
        const rMult = getTierMult(tiers.ring);
        const bMult = getTierMult(tiers.boots);

        const bonus: IPortalCombatBonus = {
            hp: 0,
            attack: 0,
            defense: 0,
            speed: 0,
            critChance: 0,
            critDamage: 0,
        };

        switch (heroRole) {
            case 'WARRIOR': // Фэн Лун (Баланс, сильный урон шестом, парирование)
                bonus.attack += Math.round(16 * wMult);
                bonus.critDamage += +(0.08 * wMult).toFixed(2);
                bonus.hp += Math.round(120 * aMult);
                bonus.defense += Math.round(10 * aMult);
                bonus.critChance += +(3.5 * rMult).toFixed(1);
                bonus.hp += Math.round(40 * rMult);
                bonus.speed += +(0.1 * bMult).toFixed(2);
                bonus.defense += Math.round(5 * bMult);
                break;

            case 'ASSASSIN': // Рикки (Взрывной крит, скорость атаки, яд)
                bonus.attack += Math.round(22 * wMult);
                bonus.critDamage += +(0.15 * wMult).toFixed(2);
                bonus.hp += Math.round(70 * aMult);
                bonus.defense += Math.round(5 * aMult);
                bonus.critChance += +(6.0 * rMult).toFixed(1);
                bonus.speed += +(0.05 * rMult).toFixed(2);
                bonus.speed += +(0.18 * bMult).toFixed(2);
                bonus.critChance += +(1.5 * bMult).toFixed(1);
                break;

            case 'TANK': // Громм (Колоссальное HP, блоки, плотная броня)
                bonus.attack += Math.round(12 * wMult);
                bonus.critDamage += +(0.04 * wMult).toFixed(2);
                bonus.hp += Math.round(240 * aMult);
                bonus.defense += Math.round(18 * aMult);
                bonus.hp += Math.round(80 * rMult);
                bonus.defense += Math.round(6 * rMult);
                bonus.critChance += +(2.0 * rMult).toFixed(1);
                bonus.speed += +(0.06 * bMult).toFixed(2);
                bonus.defense += Math.round(12 * bMult);
                break;

            default: // MAGE / SUPPORT / Универсальный
                bonus.attack += Math.round(18 * wMult);
                bonus.critDamage += +(0.1 * wMult).toFixed(2);
                bonus.hp += Math.round(100 * aMult);
                bonus.defense += Math.round(8 * aMult);
                bonus.critChance += +(4.0 * rMult).toFixed(1);
                bonus.speed += +(0.12 * bMult).toFixed(2);
                break;
        }

        return bonus;
    }

    /**
     * Экспорт защищенного сохранения .mow с SHA-256
     */
    public async exportMowSave(): Promise<Blob> {
        const payload = this.getProfile();
        const envelope = await createSignedSaveEnvelope(payload);
        const jsonStr = JSON.stringify(envelope, null, 2);
        return new Blob([jsonStr], { type: 'application/json' });
    }

    /**
     * Импорт и криптопроверка сохранения .mow
     */
    public async importMowSave(jsonText: string): Promise<{ success: boolean; payload?: IMowPlayerPayload; error?: string }> {
        const res = await verifyAndLoadSaveEnvelope(jsonText);
        if (!res.success || !res.payload) {
            return res;
        }

        // Атомарно накатываем валидированный профиль
        this.commitMutation(res.payload);
        return { success: true, payload: res.payload };
    }

    private notifySubscribers() {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mow:portal_sync', { detail: this.getProfile() }));
        }
    }
}

export const portalSyncBridge = PortalSyncBridgeService.getInstance();
