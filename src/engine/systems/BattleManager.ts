import { useGameStore } from '../../store/useGameStore';

/**
 * BattlePhase — Строгие фазы линейного боевого цикла.
 */
export enum BattlePhase {
    IDLE,
    INIT,
    PLAYER_TURN,
    ACTION_CALCULATION,
    AI_TURN,
    CHECK_END,
    VICTORY,
    DEFEAT
}

/**
 * BattleManager — Ядро боевой системы.
 * Изолирует математические расчеты от визуализации PixiJS.
 */
export class BattleManager {
    private static instance: BattleManager;
    private phase: BattlePhase = BattlePhase.IDLE;

    private playerHP: number = 100;
    private enemyHP: number = 100;

    public static getInstance() {
        if (!BattleManager.instance) BattleManager.instance = new BattleManager();
        return BattleManager.instance;
    }

    /**
     * Инициализация нового сражения.
     */
    public initBattle() {
        console.log('⚔️ [BattleManager] Инициализация боя...');
        const stats = useGameStore.getState().getCalculatedStats('panda');
        
        this.playerHP = stats?.hp || 1000;
        this.enemyHP = 1000; // Пример для врага
        
        this.phase = BattlePhase.PLAYER_TURN;
        this.broadcastPhase();
    }

    /**
     * Прямой расчет действия (Атака/Скилл).
     */
    public executePlayerAction(type: 'attack' | 'skill') {
        if (this.phase !== BattlePhase.PLAYER_TURN) return;

        this.phase = BattlePhase.ACTION_CALCULATION;
        
        // 1. Расчет урона (Логика)
        const stats = useGameStore.getState().getCalculatedStats('panda');
        const damage = (stats?.attack || 10) * (type === 'skill' ? 1.5 : 1);
        const isCrit = Math.random() > 0.8;
        const finalDamage = isCrit ? damage * 2 : damage;

        this.enemyHP -= finalDamage;
        console.log(`💥 Игрок наносит ${finalDamage} урона. (Враг HP: ${this.enemyHP})`);

        // 2. Сигнал к визуализации (Event или Callback)
        // Здесь можно вызвать анимацию в BattleView

        if (this.enemyHP <= 0) {
            this.endBattle(true);
        } else {
            this.phase = BattlePhase.AI_TURN;
            setTimeout(() => this.executeAITurn(), 1200); // Линейная задержка
        }
    }

    /**
     * Ход Искусственного Интеллекта.
     */
    private executeAITurn() {
        const aiDamage = 15 + Math.floor(Math.random() * 10);
        this.playerHP -= aiDamage;
        console.log(`💢 Враг наносит ${aiDamage} урона. (Игрок HP: ${this.playerHP})`);

        if (this.playerHP <= 0) {
            this.endBattle(false);
        } else {
            this.phase = BattlePhase.PLAYER_TURN;
            this.broadcastPhase();
        }
    }

    private endBattle(victory: boolean) {
        this.phase = victory ? BattlePhase.VICTORY : BattlePhase.DEFEAT;
        console.log(victory ? '🏆 Победа!' : '💀 Поражение!');
    }

    private broadcastPhase() {
        console.log(`➡️ Текущая фаза: ${BattlePhase[this.phase]}`);
    }

    // Getters для UI
    public getHPPercents() {
        return {
            player: (this.playerHP / 1000) * 100,
            enemy: (this.enemyHP / 1000) * 100
        };
    }
}
