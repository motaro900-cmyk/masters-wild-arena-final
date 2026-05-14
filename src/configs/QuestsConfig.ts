export interface Quest {
    id: string;
    title: string;
    description: string;
    target: number;
    rewardGold: number;
    rewardGems: number;
    rewardExp: number;
    type: 'LOGIN' | 'PLAY' | 'WIN' | 'DAMAGE' | 'SPEND_GOLD' | 'OPEN_CHEST' | 'UPGRADE' | 'WIN_STREAK';
}

export const QUESTS_POOL: Quest[] = [
    { id: 'q1', title: 'ПЕРВЫЙ ШАГ', description: 'Первый вход в игру за сегодня', target: 1, rewardGold: 100, rewardGems: 10, rewardExp: 100, type: 'LOGIN' },
    { id: 'q2', title: 'БОЕВОЕ КРЕЩЕНИЕ', description: 'Проведи 2 любых сражения', target: 2, rewardGold: 200, rewardGems: 20, rewardExp: 200, type: 'PLAY' },
    { id: 'q3', title: 'ПОБЕДИТЕЛЬ', description: 'Одержи 2 победы над противниками', target: 2, rewardGold: 300, rewardGems: 30, rewardExp: 300, type: 'WIN' },
    { id: 'q4', title: 'РАЗРУШИТЕЛЬ', description: 'Нанеси суммарно 5000 урона в сражениях', target: 5000, rewardGold: 400, rewardGems: 15, rewardExp: 400, type: 'DAMAGE' },
    { id: 'q5', title: 'ЩЕДРЫЙ ПОКУПАТЕЛЬ', description: 'Потрать 1000 золота на покупки в магазине', target: 1000, rewardGold: 150, rewardGems: 5, rewardExp: 150, type: 'SPEND_GOLD' },
    { id: 'q6', title: 'ЕЖЕДНЕВНЫЙ ДАР', description: 'Забери 1 бесплатный подарок в главном меню', target: 1, rewardGold: 250, rewardGems: 25, rewardExp: 250, type: 'OPEN_CHEST' },
    { id: 'q7', title: 'КУЗНЕЦ В ДЕЛЕ', description: 'Повысь уровень любого предмета в инвентаре', target: 1, rewardGold: 350, rewardGems: 10, rewardExp: 350, type: 'UPGRADE' },
    { id: 'q8', title: 'ВЕТЕРАН ВОЙН', description: 'Докажи свою стойкость, проведя 5 боев', target: 5, rewardGold: 600, rewardGems: 50, rewardExp: 500, type: 'PLAY' },
    { id: 'q9', title: 'НЕПОБЕДИМЫЙ', description: 'Одержи 3 победы подряд без поражений', target: 3, rewardGold: 500, rewardGems: 40, rewardExp: 600, type: 'WIN_STREAK' },
    { id: 'q10', title: 'БЕРСЕРК', description: 'Обрушь на врагов 10000 ед. суммарного урона', target: 10000, rewardGold: 800, rewardGems: 30, rewardExp: 800, type: 'DAMAGE' },
    { id: 'q11', title: 'БОГАТЕЙ', description: 'Потрать 5000 золота в игровом магазине', target: 5000, rewardGold: 400, rewardGems: 20, rewardExp: 400, type: 'SPEND_GOLD' },
    { id: 'q12', title: 'КОЛЛЕКЦИОНЕР', description: 'Открой 3 любых подарка или сундука', target: 3, rewardGold: 1000, rewardGems: 100, rewardExp: 1000, type: 'OPEN_CHEST' },
];
