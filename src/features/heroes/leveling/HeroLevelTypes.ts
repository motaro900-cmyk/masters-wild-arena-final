export interface HeroProgress {
    level: number;
    exp: number;
    strength: number;
    agility: number;
    stamina: number;
}

export interface LevelUpStatsDelta {
    heroId: string;
    oldLevel: number;
    newLevel: number;
    hpDelta: number;
    atkDelta: number;
    unlockedTier: number | null;
}
