export interface Quest {
    id: string;
    title: string;
    description: string;
    target: number;
    rewardGold: number;
    rewardGems: number;
    type: 'LOGIN' | 'PLAY' | 'WIN' | 'DAMAGE' | 'SPEND_GOLD' | 'OPEN_CHEST' | 'UPGRADE';
}

export const QUESTS_POOL: Quest[] = [
    { id: 'q1', title: 'ВХОД В ИГРУ', description: 'Зайди в игру сегодня', target: 1, rewardGold: 100, rewardGems: 10, type: 'LOGIN' },
    { id: 'q2', title: 'СЫГРАЙ 2 БОЯ', description: 'Заверши 2 любых боя', target: 2, rewardGold: 200, rewardGems: 20, type: 'PLAY' },
    { id: 'q3', title: 'ПОБЕДИ 2 РАЗА', description: 'Одержи 2 победы на арене', target: 2, rewardGold: 300, rewardGems: 30, type: 'WIN' },
    { id: 'q4', title: 'РАЗРУШИТЕЛЬ', description: 'Нанеси 5000 урона в боях', target: 5000, rewardGold: 400, rewardGems: 15, type: 'DAMAGE' },
    { id: 'q5', title: 'ТРАНЖИРА', description: 'Потрать 1000 золота в магазине', target: 1000, rewardGold: 150, rewardGems: 5, type: 'SPEND_GOLD' },
    { id: 'q6', title: 'УДАЧЛИВЫЙ КУПЕЦ', description: 'Открой любой сундук', target: 1, rewardGold: 250, rewardGems: 25, type: 'OPEN_CHEST' },
    { id: 'q7', title: 'КУЗНЕЦ В ДЕЛЕ', description: 'Улучши любой предмет 1 раз', target: 1, rewardGold: 350, rewardGems: 10, type: 'UPGRADE' },
    { id: 'q8', title: 'ВЕТЕРАН', description: 'Сыграй 5 боев', target: 5, rewardGold: 600, rewardGems: 50, type: 'PLAY' },
    { id: 'q9', title: 'ЧЕМПИОН', description: 'Победи 3 раза подряд', target: 3, rewardGold: 500, rewardGems: 40, type: 'WIN' },
    { id: 'q10', title: 'БЕРСЕРК', description: 'Нанеси 10000 урона', target: 10000, rewardGold: 800, rewardGems: 30, type: 'DAMAGE' },
    { id: 'q11', title: 'БОГАТЕЙ', description: 'Потрать 5000 золота', target: 5000, rewardGold: 400, rewardGems: 20, type: 'SPEND_GOLD' },
    { id: 'q12', title: 'КОЛЛЕКЦИОНЕР', description: 'Открой 3 сундука', target: 3, rewardGold: 1000, rewardGems: 100, type: 'OPEN_CHEST' },
];
