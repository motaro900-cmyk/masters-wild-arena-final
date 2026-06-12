import { db } from '../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface BattleResultReport {
    attackerWon: boolean;
    myRating: number;
    myLevel: number;
    opponentRating: number;
    opponentLevel: number;
    winStreak: number;
    hasPremiumBP: boolean;
    clientCalculated: {
        cupsChange: number;
        goldChange: number;
        expChange: number;
    };
}

/**
 * Server replica of formula logic from BattleResultService.ts.
 * This is used for Shadow Validation to detect cheats/mismatches before enforcing server authority.
 */
const simulateCupsChange = (rating: number, opponentRating: number, won: boolean): number => {
    const diff = opponentRating - rating;
    const isWeakOpponent = diff < 0;
    const isStrongOpponent = diff > 0;

    if (rating < 1000) {
        return won ? (isWeakOpponent ? 70 : 100) : 0;
    } else if (rating < 3000) {
        if (won) return isWeakOpponent ? 40 : 60;
        return isStrongOpponent ? -3 : -5;
    } else if (rating < 4500) {
        if (won) return isWeakOpponent ? 20 : 35;
        return isStrongOpponent ? -7 : -10;
    } else if (rating < 6000) {
        if (won) return isWeakOpponent ? 12 : 25;
        return isStrongOpponent ? -9 : -13;
    } else if (rating < 7500) {
        if (won) return isWeakOpponent ? 10 : 20;
        return isStrongOpponent ? -11 : -15;
    } else if (rating < 9000) {
        if (won) return isWeakOpponent ? 10 : 18;
        return isStrongOpponent ? -13 : -18;
    } else { // >= 9000
        if (won) return isWeakOpponent ? 10 : 15;
        return isStrongOpponent ? -18 : -25;
    }
};

const simulateGoldReward = (level: number, won: boolean, clientGoldClaimed: number): { expectedBase: number; isWithinLimits: boolean } => {
    // Since client rewards have a random element:
    // e.g. base = won ? 70 + Math.random() * 50 : 20 + Math.random() * 20;
    // We check if the client reward falls within the mathematical bounds of the formula.
    let minBase = 0;
    let maxBase = 0;

    if (level <= 10) {
        minBase = won ? 70 : 20;
        maxBase = won ? 120 : 40;
    } else if (level <= 20) {
        minBase = won ? 150 : 40;
        maxBase = won ? 250 : 70;
    } else if (level <= 40) {
        minBase = won ? 300 : 80;
        maxBase = won ? 450 : 130;
    } else if (level <= 60) {
        minBase = won ? 400 : 100;
        maxBase = won ? 500 : 150;
    } else {
        minBase = won ? 450 : 120;
        maxBase = won ? 500 : 150;
    }

    const cap = won ? 500 : 150;
    const finalMin = Math.min(Math.round(minBase), cap);
    const finalMax = Math.min(Math.round(maxBase), cap);

    // Accept slight rounding tolerances
    const isWithinLimits = clientGoldClaimed >= finalMin - 2 && clientGoldClaimed <= finalMax + 2;

    return { expectedBase: finalMax, isWithinLimits };
};

const simulateXPReward = (won: boolean, level: number, hasPremiumBP: boolean): number => {
    const baseXP = won ? 150 + level * 4 : 50 + level * 1;
    const expMultiplier = hasPremiumBP ? 1.25 : 1.0;
    return Math.round(baseXP * expMultiplier);
};

export class ShadowServerService {
    /**
     * Shadow validates the battle results by simulating server-side validation rules.
     * Logs anomalies to Firestore `securityLogs` collection.
     */
    public static async validateBattleResultShadow(userId: string, report: BattleResultReport): Promise<{
        isValid: boolean;
        anomalies: string[];
    }> {
        const anomalies: string[] = [];

        // 1. Validate Cups (Rating)
        let expectedCups = simulateCupsChange(report.myRating, report.opponentRating, report.attackerWon);

        // Apply catch-up multiplier (simulated)
        if (report.attackerWon && report.myRating < 3000) {
            const expectedLevel = report.myRating < 1000 ? 1 : (report.myRating < 2000 ? 10 : 20);
            const levelDiff = report.myLevel - expectedLevel;
            if (levelDiff >= 20) {
                const multiplier = Math.min(5, 1 + levelDiff / 20);
                expectedCups = Math.round(expectedCups * multiplier);
            }
        }

        // Apply win streak bonus
        if (report.attackerWon) {
            const streak = report.winStreak + 1;
            let streakBonus = 0;
            if (streak >= 10) {
                streakBonus = 35;
            } else if (streak >= 5) {
                streakBonus = 20;
            } else if (streak >= 3) {
                streakBonus = 10;
            }
            expectedCups += streakBonus;
        }

        if (report.clientCalculated.cupsChange !== expectedCups) {
            anomalies.push(`Cups mismatch: client claimed ${report.clientCalculated.cupsChange}, server expected ${expectedCups}`);
        }

        // 2. Validate Gold
        const goldCheck = simulateGoldReward(report.myLevel, report.attackerWon, report.clientCalculated.goldChange);
        if (!goldCheck.isWithinLimits) {
            anomalies.push(`Gold mismatch: client claimed ${report.clientCalculated.goldChange}, server expects range up to ${goldCheck.expectedBase}`);
        }

        // 3. Validate XP
        const expectedXP = simulateXPReward(report.attackerWon, report.myLevel, report.hasPremiumBP);
        if (Math.abs(report.clientCalculated.expChange - expectedXP) > 2) {
            anomalies.push(`XP mismatch: client claimed ${report.clientCalculated.expChange}, server expected ${expectedXP}`);
        }

        const isValid = anomalies.length === 0;

        // Log to securityLogs collection if any anomaly is found
        if (!isValid) {
            console.error(`[ShadowServer] Security anomalies found for user ${userId}:`, anomalies);
            try {
                const logsRef = collection(db, 'securityLogs');
                await addDoc(logsRef, {
                    userId,
                    anomalies,
                    report,
                    timestamp: serverTimestamp(),
                });
            } catch (err) {
                console.error('[ShadowServer] Failed to write security log:', err);
            }
        } else {
            console.log(`[ShadowServer] Battle result validation passed for ${userId}`);
        }

        return { isValid, anomalies };
    }
}
