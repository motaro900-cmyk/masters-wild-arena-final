import { useGameStore } from '../../store/useGameStore';

export interface CombatResult {
    damage: number;
    isCrit: boolean;
    isDodge: boolean;
    isDoubleHit: boolean;
}

export class CombatManager {
    public playerHp: number;
    public playerMaxHp: number;
    public enemyHp: number;
    public enemyMaxHp: number;
    public isBattleActive: boolean = true;

    constructor(public playerHeroId: string, public enemyHeroId: string) {
        const store = useGameStore.getState();
        const pStats = store.getCalculatedStats(playerHeroId);
        // Fallback to base stats if enemy is not found in player's heroes store
        const eStats = store.getCalculatedStats(enemyHeroId) || { hp: 4500, attack: 200, critChance: 0.1 };

        this.playerMaxHp = pStats?.hp || 3000;
        this.playerHp = this.playerMaxHp;

        this.enemyMaxHp = eStats?.hp || 4500;
        this.enemyHp = this.enemyMaxHp;
    }

    /**
     * РУССКИЕ КОММЕНТАРИИ: ФОРМУЛЫ БОЯ (Классическая Триада 2012 -> 2026)
     * Сила (Strength) -> Влияет на базовый урон (Attack)
     * Ловкость (Agility) -> Влияет на шанс уклонения (Dodge), Крит (Crit) и Скорость (Double Hit)
     * Выносливость (Stamina) -> Влияет на запас здоровья (HP)
     */
    public calculateAttack(attacker: 'player' | 'enemy'): CombatResult {
        const store = useGameStore.getState();
        const stats = store.getCalculatedStats(attacker === 'player' ? this.playerHeroId : this.enemyHeroId);
        const defStats = store.getCalculatedStats(attacker === 'player' ? this.enemyHeroId : this.playerHeroId);
        
        const baseAtk = stats?.attack || (attacker === 'player' ? 250 : 200);
        const critChance = stats?.critChance || 0.15;
        const dodgeChance = defStats?.dodgeChance || 0.05;
        const speedAdvantage = (stats?.speed || 2.0) / (defStats?.speed || 2.0);
        
        // 1. Уклонение (Dodge)
        if (Math.random() < dodgeChance) {
            return { damage: 0, isCrit: false, isDodge: true, isDoubleHit: false };
        }

        // 2. Крит и Урон
        const isCrit = Math.random() < critChance;
        const variance = 0.85 + Math.random() * 0.3; // Разброс 85-115%
        const damage = Math.max(1, Math.floor(baseAtk * variance * (isCrit ? 2.0 : 1.0)));

        // 3. Двойной удар (Double Hit) - Если скорость атакующего больше в 1.3 раза = 25% шанс
        const isDoubleHit = speedAdvantage >= 1.3 && Math.random() < 0.25;

        return { damage, isCrit, isDodge: false, isDoubleHit };
    }

    public takeDamage(target: 'player' | 'enemy', amount: number) {
        if (target === 'player') {
            this.playerHp = Math.max(0, this.playerHp - amount);
        } else {
            this.enemyHp = Math.max(0, this.enemyHp - amount);
        }
    }

    public checkWinCondition(): 'player' | 'enemy' | null {
        if (this.playerHp <= 0) return 'enemy';
        if (this.enemyHp <= 0) return 'player';
        return null;
    }
}
