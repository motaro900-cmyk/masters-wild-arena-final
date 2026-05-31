import { db } from '../utils/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { matchmakingService } from './MatchmakingService';

export interface BattleResult {
    attackerWon: boolean;
    attackerRating: number;
    defenderRating: number;
}

/**
 * Формула кубков — зависит от разницы рейтингов.
 */
const calcCupsChange = (attackerRating: number, defenderRating: number, attackerWon: boolean): number => {
    const diff = defenderRating - attackerRating;
    if (attackerWon) {
        if (diff >= 100) return 30; // победа над более сильным
        if (diff >= 0) return 20; // победа над равным
        return 10; // победа над слабым
    } else {
        if (diff <= -100) return -20; // поражение от слабого
        if (diff <= 0) return -15; // поражение от равного
        return -10; // поражение от более сильного
    }
};

function getGoldReward(level: number, won: boolean): number {
    let base: number;

    if (level <= 10) {
        base = won ? 70 + Math.random() * 50 : 20 + Math.random() * 20;
    } else if (level <= 20) {
        base = won ? 150 + Math.random() * 100 : 40 + Math.random() * 30;
    } else if (level <= 40) {
        base = won ? 300 + Math.random() * 150 : 80 + Math.random() * 50;
    } else if (level <= 60) {
        base = won ? 400 + Math.random() * 100 : 100 + Math.random() * 50;
    } else {
        base = won ? 450 + Math.random() * 50 : 120 + Math.random() * 30;
    }

    const cap = won ? 500 : 150;
    return Math.min(Math.round(base), cap);
}

function getXPReward(level: number, won: boolean): number {
    if (won) {
        if (level <= 10) return 100 + level * 20; // 120 to 300 XP
        if (level <= 30) return 300 + (level - 10) * 10; // 310 to 500 XP
        return Math.min(500 + (level - 30) * 5, 600); // 505 to 600 XP
    } else {
        if (level <= 10) return 20 + level * 4; // 24 to 60 XP
        if (level <= 30) return 60 + (level - 10) * 2; // 62 to 100 XP
        return Math.min(100 + (level - 30) * 1, 120); // 101 to 120 XP
    }
}

class BattleResultServiceClass {
    /**
     * Вызывается после каждого боя.
     * Если противник — реальный игрок, записывает pendingResult в его Firebase.
     * Возвращает изменение кубков атакующего.
     */
    public async recordResult(params: {
        myUserId: string;
        myName: string;
        myRating: number;
        myLevel: number;
        opponentUserId: string | undefined; // undefined если бот
        opponentName: string;
        opponentRating: number;
        opponentLevel?: number;
        isOpponentBot: boolean;
        attackerWon: boolean;
    }): Promise<{ myCupsChange: number; myGoldChange: number; myExpChange: number }> {
        const {
            myUserId,
            myName,
            myRating,
            myLevel,
            opponentUserId,
            opponentRating,
            opponentLevel = 1,
            isOpponentBot,
            attackerWon,
        } = params;

        const myCupsChange = calcCupsChange(myRating, opponentRating, attackerWon);
        const myGoldChange = getGoldReward(myLevel, attackerWon);

        // Experience rewards calculation with Premium BP bonus multiplier and level-based scaling
        const baseXP = getXPReward(myLevel, attackerWon);
        const { useGameStore } = await import('../store/useGameStore');
        const state = useGameStore.getState();
        const hasPremiumBP = state.isPremium;
        const expMultiplier = hasPremiumBP ? 1.25 : 1.0;
        const myExpChange = Math.round(baseXP * expMultiplier);

        if (!isOpponentBot && opponentUserId) {
            // Записываем результат в Firebase защищающегося игрока
            await this.writePendingResult(opponentUserId, {
                attackerId: myUserId,
                attackerName: myName,
                attackerRating: myRating,
                // С точки зрения защитника: если атакующий выиграл → защитник проиграл
                defenderResult: attackerWon ? 'LOSS' : 'WIN',
                cupsChange: calcCupsChange(opponentRating, myRating, !attackerWon),
                goldChange: !attackerWon ? Math.round(getGoldReward(opponentLevel, true) * 0.5) : 0, // золото только если ghost победил
            });

            // Записываем cooldown — нельзя атаковать этого игрока ещё 1 час
            matchmakingService.recordAttack(myUserId, opponentUserId);
        }

        return { myCupsChange, myGoldChange, myExpChange };
    }

    private async writePendingResult(targetUserId: string, data: any): Promise<void> {
        try {
            const pendingRef = doc(collection(db, 'пользователи', targetUserId, 'pendingResults'));
            await setDoc(pendingRef, {
                ...data,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('[BattleResultService] Failed to write pending result:', error);
        }
    }
}

export const battleResultService = new BattleResultServiceClass();
