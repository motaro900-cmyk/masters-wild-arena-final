export interface PetDailyRewardResult {
    gold: number;
    crystals: number;
    loot: {
        id: string;
        name: string;
        icon: string;
        amount: number;
    } | null;
    multiplier: number;
}

export const getMskDateKey = (timestamp: number = Date.now()): string => {
    const MSK_OFFSET = 3 * 60 * 60 * 1000; // UTC+3 hours
    const mskDate = new Date(timestamp + MSK_OFFSET);
    const year = mskDate.getUTCFullYear();
    const month = String(mskDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(mskDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const calculatePetDailyReward = (petLevel: number, hunger: number, happiness: number): PetDailyRewardResult => {
    // 1. Calculate Multiplier based on pet state
    let multiplier = 1.0;
    if (hunger >= 80 && happiness >= 80) {
        multiplier = 1.2;
    } else if (hunger >= 50 && happiness >= 50) {
        multiplier = 1.0;
    } else if (hunger < 20 || happiness < 20) {
        multiplier = 0.05;
    } else {
        multiplier = 0.3;
    }

    // 2. Base gold reward scaled by pet level and multiplier
    const baseGold = 500;
    const goldReward = Math.round(baseGold * petLevel * multiplier);

    // 3. Crystals (Diamonds) are now a rare daily find (20% chance)
    let crystalsReward = 0;
    if (happiness >= 50 && Math.random() < 0.2) {
        const baseCrystals = 2;
        crystalsReward = Math.round((baseCrystals + Math.floor(petLevel / 2)) * multiplier);
        if (crystalsReward < 1) crystalsReward = 1;
    }

    // Loot is disabled for now (returns null)
    const lootResult: PetDailyRewardResult['loot'] = null;

    return {
        gold: goldReward,
        crystals: crystalsReward,
        loot: lootResult,
        multiplier,
    };
};
