import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';

interface IPlayerState {
    level: number;
    exp: number;
    gold: number;
    crystals: number;
    energy: number;
    maxEnergy: number;
    
    // Профиль
    avatar: string;
    frame: string;
    title: string;
    
    // Battle Pass
    bpLevel: number;
    bpExp: number;
    isPremium: boolean;
    claimedRewards: string[];

    // Actions
    addGold: (amount: number) => void;
    addCrystals: (amount: number) => void;
    addExp: (amount: number) => void;
    consumeEnergy: () => boolean;
    updateProfile: (data: { avatar?: string, frame?: string, title?: string }) => void;
    claimReward: (id: string) => void;
    addBpExp: (amount: number) => void;
    setPremium: (val: boolean) => void;
}

export const usePlayerStore = create<IPlayerState>()(
    persist(
        (set, get) => ({
            level: 1,
            exp: 0,
            gold: 25850,
            crystals: 1250,
            energy: 6,
            maxEnergy: 10,
            avatar: 'панда.png',
            frame: 'Рамка 6.png',
            title: 'ЛЕГЕНДА АРЕНЫ',
            bpLevel: 1,
            bpExp: 250,
            isPremium: false,
            claimedRewards: [],

            addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
            addCrystals: (amount) => set((state) => ({ crystals: state.crystals + amount })),
            addExp: (amount) => set((state) => {
                let newExp = state.exp + amount;
                let newLevel = state.level;
                const expNeeded = newLevel * 600;
                if (newExp >= expNeeded) {
                    newExp -= expNeeded;
                    newLevel += 1;
                }
                return { exp: newExp, level: newLevel };
            }),
            consumeEnergy: () => {
                const state = get();
                if (state.energy > 0) {
                    set({ energy: state.energy - 1 });
                    return true;
                }
                return false;
            },
            updateProfile: (data) => set((state) => ({ ...state, ...data })),
            claimReward: (id) => set((state) => ({ 
                claimedRewards: state.claimedRewards.includes(id) 
                    ? state.claimedRewards 
                    : [...state.claimedRewards, id] 
            })),
            addBpExp: (amount) => set((state) => {
                let newExp = state.bpExp + amount;
                let newLevel = state.bpLevel;
                const expPerLevel = 1000;
                while (newExp >= expPerLevel) {
                    newExp -= expPerLevel;
                    newLevel += 1;
                }
                return { bpExp: newExp, bpLevel: newLevel };
            }),
            setPremium: (val) => set({ isPremium: val }),
        }),
        {
            name: 'player-storage',
            storage: createJSONStorage(() => getStorage()),
        }
    )
);
