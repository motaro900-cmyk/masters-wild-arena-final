import { create } from 'zustand';

/**
 * @interface IBattleState
 * Состояние боевого движка
 */
export interface IBattleState {
    // Состояние боя
    battleActive: boolean;
    battlePhase: 'start' | 'combat' | 'end' | 'victory' | 'defeat';

    // Персонажи
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    enemyMaxHp: number;

    // Ресурсы
    gold: number;
    goldEarned: number;

    // Статистика боя
    damageDealt: number;
    damageTaken: number;
    comboCount: number;
    battleDuration: number;

    // Навыки
    availableSkills: boolean[];
    skillCooldowns: number[];

    // Методы
    startBattle: () => void;
    setBattlePhase: (phase: 'start' | 'combat' | 'end' | 'victory' | 'defeat') => void;
    endBattle: (victory: boolean) => void;
    updatePlayerHp: (hp: number) => void;
    updateEnemyHp: (hp: number) => void;
    addGold: (amount: number) => void;
    addDamageDealt: (amount: number) => void;
    addDamageTaken: (amount: number) => void;
    updateComboCount: (count: number) => void;
    updateBattleDuration: (duration: number) => void;
    updateSkillCooldowns: (cooldowns: number[]) => void;
    resetBattle: () => void;
}

/**
 * @hook useBattleStore
 * Хук для управления состоянием боя
 */
export const useBattleStore = create<IBattleState>((set, get) => ({
    // Начальное состояние
    battleActive: false,
    battlePhase: 'start',

    playerHp: 1000,
    playerMaxHp: 1000,
    enemyHp: 800,
    enemyMaxHp: 800,

    gold: 5000,
    goldEarned: 0,

    damageDealt: 0,
    damageTaken: 0,
    comboCount: 0,
    battleDuration: 0,

    availableSkills: [true, true, true, true],
    skillCooldowns: [0, 0, 0, 0],

    // Методы
    startBattle: () => {
        set({
            battleActive: true,
            battlePhase: 'combat',
            damageDealt: 0,
            damageTaken: 0,
            comboCount: 0,
            battleDuration: 0,
        });
    },

    setBattlePhase: (phase) => set({ battlePhase: phase }),

    endBattle: (victory: boolean) => {
        set({
            battleActive: false,
            battlePhase: victory ? 'victory' : 'defeat',
        });
    },

    updatePlayerHp: (hp: number) => {
        set({ playerHp: hp });
    },

    updateEnemyHp: (hp: number) => {
        set({ enemyHp: hp });
    },

    addGold: (amount: number) => {
        const currentGold = get().gold;
        const currentEarned = get().goldEarned;
        set({
            gold: currentGold + amount,
            goldEarned: currentEarned + amount,
        });
    },

    addDamageDealt: (amount: number) => {
        const currentDamage = get().damageDealt;
        set({ damageDealt: currentDamage + amount });
    },

    addDamageTaken: (amount: number) => {
        const currentDamage = get().damageTaken;
        set({ damageTaken: currentDamage + amount });
    },

    updateComboCount: (count: number) => {
        set({ comboCount: count });
    },

    updateBattleDuration: (duration: number) => {
        set({ battleDuration: duration });
    },

    updateSkillCooldowns: (cooldowns: number[]) => {
        set({ skillCooldowns: cooldowns });
    },

    resetBattle: () => {
        set({
            battleActive: false,
            battlePhase: 'start',
            playerHp: get().playerMaxHp,
            enemyHp: get().enemyMaxHp,
            damageDealt: 0,
            damageTaken: 0,
            comboCount: 0,
            battleDuration: 0,
            availableSkills: [true, true, true, true],
            skillCooldowns: [0, 0, 0, 0],
        });
    },
}));
