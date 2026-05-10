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
    { id: 'q1', title: 'Войти в игру', description: 'Зайдите в игру сегодня', target: 1, rewardGold: 100, rewardGems: 10, type: 'LOGIN' },
    { id: 'q2', title: 'Сыграть 2 матча', description: 'Проведите 2 любых боя', target: 2, rewardGold: 200, rewardGems: 20, type: 'PLAY' },
    { id: 'q3', title: 'Победить 2 раза', description: 'Одержите 2 победы на арене', target: 2, rewardGold: 300, rewardGems: 30, type: 'WIN' },
    { id: 'q4', title: 'Крушитель', description: 'Нанесите 5000 урона в боях', target: 5000, rewardGold: 400, rewardGems: 15, type: 'DAMAGE' },
    { id: 'q5', title: 'Транжира', description: 'Потратьте 1000 золота в магазине', target: 1000, rewardGold: 150, rewardGems: 5, type: 'SPEND_GOLD' },
    { id: 'q6', title: 'Охотник за удачей', description: 'Откройте любой сундук', target: 1, rewardGold: 250, rewardGems: 25, type: 'OPEN_CHEST' },
    { id: 'q7', title: 'Путь к силе', description: 'Улучшите любого героя 1 раз', target: 1, rewardGold: 350, rewardGems: 10, type: 'UPGRADE' },
    { id: 'q8', title: 'Марафонец', description: 'Сыграйте 5 матчей', target: 5, rewardGold: 600, rewardGems: 50, type: 'PLAY' },
    { id: 'q9', title: 'Чемпион', description: 'Победите 3 раза за день', target: 3, rewardGold: 500, rewardGems: 40, type: 'WIN' },
    { id: 'q10', title: 'Берсерк', description: 'Нанесите 10000 урона', target: 10000, rewardGold: 800, rewardGems: 30, type: 'DAMAGE' },
    { id: 'q11', title: 'Богатей', description: 'Потратьте 5000 золота', target: 5000, rewardGold: 400, rewardGems: 20, type: 'SPEND_GOLD' },
    { id: 'q12', title: 'Коллекционер', description: 'Откройте 3 сундука', target: 3, rewardGold: 1000, rewardGems: 100, type: 'OPEN_CHEST' },
];
