/**
 * RESTING ENERGY SERVICE (Благословение Леса)
 * Offline progress accumulation system for standalone web players.
 * Rewards returning players after hours of absence with Gold, XP, and Energy.
 */
import { safeGetItem, safeSetItem } from './SafeStorage';
import { useGameStore } from '../store/useGameStore';
import { proceduralAudio } from './ProceduralAudio';

const STORAGE_KEY = 'mow_last_active_time';
const MAX_REST_SECONDS = 24 * 60 * 60; // 24-hour cap
const MIN_REST_SECONDS = 15 * 60; // Minimum 15 minutes to trigger reward

export interface IRestingReward {
    elapsedSeconds: number;
    hoursFormatted: string;
    gold: number;
    exp: number;
    energy: number;
}

export class RestingEnergyService {
    /**
     * Records current heartbeat timestamp
     */
    public static recordHeartbeat(): void {
        try {
            safeSetItem(STORAGE_KEY, String(Date.now()));
        } catch {}
    }

    /**
     * Checks if player is eligible for offline resting rewards
     */
    public static checkRestingReward(): IRestingReward | null {
        try {
            const lastStr = safeGetItem(STORAGE_KEY);
            if (!lastStr) {
                this.recordHeartbeat();
                return null;
            }

            const lastTime = Number(lastStr);
            if (isNaN(lastTime) || lastTime <= 0) {
                this.recordHeartbeat();
                return null;
            }

            const now = Date.now();
            const elapsedSeconds = Math.floor((now - lastTime) / 1000);

            if (elapsedSeconds < MIN_REST_SECONDS) {
                // Not enough time passed
                return null;
            }

            const cappedSeconds = Math.min(elapsedSeconds, MAX_REST_SECONDS);
            const intervals10m = Math.floor(cappedSeconds / 600);

            const gold = Math.max(intervals10m * 6, 25);
            const exp = Math.max(intervals10m * 3, 10);
            const energy = Math.min(Math.floor(cappedSeconds / 1800), 20); // 1 per 30m, max 20

            const hours = Math.floor(elapsedSeconds / 3600);
            const minutes = Math.floor((elapsedSeconds % 3600) / 60);
            const hoursFormatted = hours > 0 ? `${hours} ч. ${minutes} мин.` : `${minutes} мин.`;

            return {
                elapsedSeconds,
                hoursFormatted,
                gold,
                exp,
                energy,
            };
        } catch (err) {
            console.warn('[RestingEnergyService] Failed to check offline reward:', err);
            return null;
        }
    }

    /**
     * Claims resting reward and commits to player's store
     */
    public static claimReward(reward: IRestingReward): void {
        proceduralAudio.playFanfare();

        const store: any = useGameStore.getState();
        store.addGold?.(reward.gold);
        store.addExp?.(reward.exp);
        if (reward.energy > 0) {
            store.addEnergy?.(reward.energy);
        }

        // Reset timer
        this.recordHeartbeat();
    }
}
