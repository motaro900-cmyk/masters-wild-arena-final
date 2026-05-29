export interface ForgeItem {
    id: string;
    level: number;
    reforgeMultiplier?: number;
}

export interface UpgradeRequirements {
    coalCost: number;
    steelCost: number;
    shardCost: number;
    goldCost: number;
    rareType: string | null;
    rareCost: number;
}
