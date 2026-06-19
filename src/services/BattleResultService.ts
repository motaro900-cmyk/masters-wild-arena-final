import { db, USERS_COLLECTION } from '../utils/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { matchmakingService } from './MatchmakingService';
import { useGameStore } from '../store/useGameStore';

export interface BattleResult {
    attackerWon: boolean;
    attackerRating: number;
    defenderRating: number;
}

/**
 * Формула кубков — зависит от лиги и разницы рейтингов.
 */
const calcCupsChange = (rating: number, opponentRating: number, won: boolean): number => {
    const diff = opponentRating - rating;
    const isWeakOpponent = diff < 0;
    const isStrongOpponent = diff > 0;

    if (rating < 1000) {
        if (won) {
            return isWeakOpponent ? 70 : 100;
        } else {
            return 0;
        }
    } else if (rating < 3000) {
        if (won) {
            return isWeakOpponent ? 40 : 60;
        } else {
            return isStrongOpponent ? -3 : -5;
        }
    } else if (rating < 4500) {
        if (won) {
            return isWeakOpponent ? 20 : 35;
        } else {
            return isStrongOpponent ? -7 : -10;
        }
    } else if (rating < 6000) {
        if (won) {
            return isWeakOpponent ? 12 : 25;
        } else {
            return isStrongOpponent ? -9 : -13;
        }
    } else if (rating < 7500) {
        if (won) {
            return isWeakOpponent ? 10 : 20;
        } else {
            return isStrongOpponent ? -11 : -15;
        }
    } else if (rating < 9000) {
        if (won) {
            return isWeakOpponent ? 10 : 18;
        } else {
            return isStrongOpponent ? -13 : -18;
        }
    } else { // >= 9000
        if (won) {
            return isWeakOpponent ? 10 : 15;
        } else {
            return isStrongOpponent ? -18 : -25;
        }
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

function getXPReward(won: boolean, level: number): number {
    return won ? 150 + level * 4 : 50 + level * 1;
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
        winStreak?: number;
    }): Promise<{ myCupsChange: number; myGoldChange: number; myExpChange: number; serverResult?: 'win' | 'lose' }> {
        const {
            myUserId,
            opponentUserId,
            opponentRating,
            isOpponentBot,
            attackerWon,
        } = params;

        // ⚔️ Call resolveBattle Cloud Function (Server Authoritative)
        let serverResult: 'win' | 'lose' = attackerWon ? 'win' : 'lose';
        let myGoldChange = 0;
        let myExpChange = 0;

        // TODO: Cloud Function resolveBattle — uncomment when Cloud Functions are deployed.

        // Fallback to client calculation to ensure game stays playable
        myGoldChange = getGoldReward(params.myLevel, attackerWon);
        myExpChange = Math.round(getXPReward(attackerWon, params.myLevel) * (useGameStore.getState().isPremium ? 1.25 : 1.0));

        const serverAttackerWon = serverResult === 'win';
        let myCupsChange = calcCupsChange(params.myRating, opponentRating, serverAttackerWon);

        // Применяем Catch-up множитель (до 3000 кубков)
        if (serverAttackerWon && params.myRating < 3000) {
            const expectedLevel = params.myRating < 1000 ? 1 : (params.myRating < 2000 ? 10 : 20);
            const levelDiff = params.myLevel - expectedLevel;
            if (levelDiff >= 20) {
                const multiplier = Math.min(3, 1 + levelDiff / 30);
                myCupsChange = Math.round(myCupsChange * multiplier);
            }
        }

        // Применяем стрик-бонус за победы
        if (serverAttackerWon) {
            const streak = (params.winStreak || 0) + 1; // стрик включая текущую победу
            let streakBonus = 0;
            if (streak >= 10) {
                streakBonus = 35;
            } else if (streak >= 5) {
                streakBonus = 20;
            } else if (streak >= 3) {
                streakBonus = 10;
            }
            myCupsChange += streakBonus;
        }

        if (!isOpponentBot && opponentUserId) {
            // Записываем cooldown — нельзя атаковать этого игрока ещё 1 час
            matchmakingService.recordAttack(myUserId, opponentUserId);
        }

        return { myCupsChange, myGoldChange, myExpChange, serverResult };
    }

    public async writePendingResult(targetUserId: string, data: any): Promise<void> {
        try {
            const pendingRef = doc(collection(db, USERS_COLLECTION, targetUserId, 'pendingResults'));
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
