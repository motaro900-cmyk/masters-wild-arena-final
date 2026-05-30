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
        if (diff >= 100) return 30;   // победа над более сильным
        if (diff >= 0)   return 20;   // победа над равным
        return 10;                     // победа над слабым
    } else {
        if (diff <= -100) return -20; // поражение от слабого
        if (diff <= 0)    return -15; // поражение от равного
        return -10;                    // поражение от более сильного
    }
};

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
        opponentUserId: string | undefined;  // undefined если бот
        opponentName: string;
        opponentRating: number;
        isOpponentBot: boolean;
        attackerWon: boolean;
    }): Promise<{ myCupsChange: number; myGoldChange: number }> {
        const { myUserId, myName, myRating, opponentUserId, opponentRating, isOpponentBot, attackerWon } = params;

        const myCupsChange = calcCupsChange(myRating, opponentRating, attackerWon);
        const myGoldChange = attackerWon ? Math.floor(70 + Math.random() * 50) : Math.floor(20 + Math.random() * 20);

        if (!isOpponentBot && opponentUserId) {
            // Записываем результат в Firebase защищающегося игрока
            await this.writePendingResult(opponentUserId, {
                attackerId: myUserId,
                attackerName: myName,
                attackerRating: myRating,
                // С точки зрения защитника: если атакующий выиграл → защитник проиграл
                defenderResult: attackerWon ? 'LOSS' : 'WIN',
                cupsChange: calcCupsChange(opponentRating, myRating, !attackerWon),
                goldChange: !attackerWon ? Math.floor(50 + Math.random() * 50) : 0, // золото только если ghost победил
            });

            // Записываем cooldown — нельзя атаковать этого игрока ещё 1 час
            matchmakingService.recordAttack(myUserId, opponentUserId);
        }

        return { myCupsChange, myGoldChange };
    }

    private async writePendingResult(targetUserId: string, data: any): Promise<void> {
        try {
            const pendingRef = doc(
                collection(db, 'пользователи', targetUserId, 'pendingResults')
            );
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
