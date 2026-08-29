/**
 * @owner: @Motaro900 / Frontend & Backend Team
 * @purpose: PlayerSnapshotService for offline matchmaking and summaries (zero Firebase dependencies).
 */

export interface PendingResult {
    id: string;
    attackerId: string;
    attackerName: string;
    attackerRating: number;
    defenderResult: 'WIN' | 'LOSS';
    cupsChange: number;
    goldChange: number;
    timestamp: any;
}

export interface OfflineSummary {
    totalAttacks: number;
    wins: number;
    losses: number;
    totalCupsChange: number;
    totalGoldChange: number;
    attacks: PendingResult[];
}

class PlayerSnapshotServiceClass {
    public async syncOnLogin(): Promise<OfflineSummary | null> {
        return null;
    }
}

export const playerSnapshotService = new PlayerSnapshotServiceClass();
