export interface Quest {
    id: string;
    title: string;
    description: string;
    target: number;
    rewardGold: number;
    rewardGems: number;
    rewardExp: number;
    type: 'LOGIN' | 'PLAY' | 'WIN' | 'DAMAGE' | 'SPEND_GOLD' | 'OPEN_CHEST' | 'UPGRADE' | 'WIN_STREAK' | 'SPEND_ENERGY' | 'SEND_CHAT' | 'SEND_GIFT';
}

export const QUESTS_POOL: Quest[] = [
    {
        id: 'q1',
        title: 'ПЕРВЫЙ ШАГ',
        description: 'Первый вход в игру за сегодня',
        target: 1,
        rewardGold: 100,
        rewardGems: 10,
        rewardExp: 100,
        type: 'LOGIN',
    },
    {
        id: 'q2',
        title: 'БОЕВОЕ КРЕЩЕНИЕ',
        description: 'Проведи 2 любых сражения',
        target: 2,
        rewardGold: 200,
        rewardGems: 15,
        rewardExp: 150,
        type: 'PLAY',
    },
    {
        id: 'q3',
        title: 'ПОБЕДИТЕЛЬ',
        description: 'Одержи 2 победы над противниками',
        target: 2,
        rewardGold: 250,
        rewardGems: 20,
        rewardExp: 200,
        type: 'WIN',
    },
    {
        id: 'q4',
        title: 'РАЗРУШИТЕЛЬ',
        description: 'Нанеси суммарно 5000 урона в сражениях',
        target: 5000,
        rewardGold: 300,
        rewardGems: 25,
        rewardExp: 250,
        type: 'DAMAGE',
    },
    {
        id: 'q5',
        title: 'ЩЕДРЫЙ ПОКУПАТЕЛЬ',
        description: 'Потрать 1000 золота на покупки в магазине',
        target: 1000,
        rewardGold: 150,
        rewardGems: 15,
        rewardExp: 150,
        type: 'SPEND_GOLD',
    },
    {
        id: 'q6',
        title: 'ЕЖЕДНЕВНЫЙ ДАР',
        description: 'Забери 1 бесплатный подарок в главном меню',
        target: 1,
        rewardGold: 200,
        rewardGems: 20,
        rewardExp: 150,
        type: 'OPEN_CHEST',
    },
    {
        id: 'q7',
        title: 'КУЗНЕЦ В ДЕЛЕ',
        description: 'Повысь уровень любого предмета в инвентаре',
        target: 1,
        rewardGold: 250,
        rewardGems: 20,
        rewardExp: 200,
        type: 'UPGRADE',
    },
    {
        id: 'q8',
        title: 'ВЕТЕРАН ВОЙН',
        description: 'Докажи свою стойкость, проведя 5 боев',
        target: 5,
        rewardGold: 400,
        rewardGems: 35,
        rewardExp: 350,
        type: 'PLAY',
    },
    {
        id: 'q9',
        title: 'НЕПОБЕДИМЫЙ',
        description: 'Одержи 3 победы подряд без поражений',
        target: 3,
        rewardGold: 400,
        rewardGems: 35,
        rewardExp: 400,
        type: 'WIN_STREAK',
    },
    {
        id: 'q10',
        title: 'БЕРСЕРК',
        description: 'Обрушь на врагов 10000 ед. суммарного урона',
        target: 10000,
        rewardGold: 500,
        rewardGems: 45,
        rewardExp: 450,
        type: 'DAMAGE',
    },
    {
        id: 'q11',
        title: 'БОГАТЕЙ',
        description: 'Потрать 5000 золота в игровом магазине',
        target: 5000,
        rewardGold: 400,
        rewardGems: 35,
        rewardExp: 350,
        type: 'SPEND_GOLD',
    },
    {
        id: 'q12',
        title: 'КОЛЛЕКЦИОНЕР',
        description: 'Открой 3 любых подарка или сундука',
        target: 3,
        rewardGold: 600,
        rewardGems: 50,
        rewardExp: 500,
        type: 'OPEN_CHEST',
    },
    {
        id: 'q13',
        title: 'ЭНЕРГИЧНЫЙ',
        description: 'Потрать 50 ед. энергии в приключениях',
        target: 50,
        rewardGold: 250,
        rewardGems: 20,
        rewardExp: 200,
        type: 'SPEND_ENERGY',
    },
    {
        id: 'q14',
        title: 'СЛОВО ХРАБРЕЦА',
        description: 'Отправь 3 сообщения в общий чат',
        target: 3,
        rewardGold: 150,
        rewardGems: 15,
        rewardExp: 100,
        type: 'SEND_CHAT',
    },
    {
        id: 'q15',
        title: 'ДРУЖЕСКИЙ ЖЕСТ',
        description: 'Отправь 1 письмо другу',
        target: 1,
        rewardGold: 200,
        rewardGems: 20,
        rewardExp: 150,
        type: 'SEND_GIFT',
    },
];

export interface BPQuest {
    id: string;
    title: string;
    description: string;
    target: number;
    rewardExp: number;
    type: string;
}

export const BP_DAILY_QUESTS_POOL: BPQuest[] = [
    {
        id: 'bpd1',
        title: 'Путь Арены',
        description: 'Проведи 3 боя на Арене',
        target: 3,
        rewardExp: 150,
        type: 'PLAY',
    },
    {
        id: 'bpd2',
        title: 'Победитель БП',
        description: 'Одержи 2 победы в битвах',
        target: 2,
        rewardExp: 200,
        type: 'WIN',
    },
    {
        id: 'bpd3',
        title: 'Боевая мощь',
        description: 'Нанеси 6000 урона в боях',
        target: 6000,
        rewardExp: 150,
        type: 'DAMAGE',
    },
    {
        id: 'bpd4',
        title: 'Пополнение запасов',
        description: 'Открой 2 сундука или подарка',
        target: 2,
        rewardExp: 150,
        type: 'OPEN_CHEST',
    },
    {
        id: 'bpd5',
        title: 'Усиление БП',
        description: 'Улучши любой предмет 1 раз',
        target: 1,
        rewardExp: 150,
        type: 'UPGRADE',
    },
];
