/**
 * ЦЕНТРАЛЬНАЯ БАЗА ГЕРОЕВ
 * Содержит визуальные данные, статы и метаданные для рендеринга (анкоры).
 */

export interface ISocket {
    x: number;
    y: number;
    angle?: number;
    scale?: number;
}

export interface IHeroAnchors {
    feet: ISocket;
    head: ISocket;
    rightHand: ISocket;
    leftHand?: ISocket;
    center: ISocket;
}

export interface IHeroConfig {
    id: string;
    name: string;
    title: string;
    image: string;
    color: number;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
    role: 'WARRIOR' | 'TANK' | 'ASSASSIN' | 'MAGE' | 'SUPPORT';
    unlockType: 'gold' | 'diamonds' | 'level' | 'achievement' | 'free';
    unlockCost: number;
    unlockAchievement?: string;
    stats: {
        strength: number;
        agility: number;
        stamina: number;
        intelligence: number;
    };
    anchors: IHeroAnchors;
    baseScale?: number;
    sheet?: { cols: number; rows: number };
    lore?: string;
}

export const HEROES_DB: IHeroConfig[] = [
    {
        id: 'panda',
        name: 'Фэн Лун',
        title: 'Страж Окраин',
        image: '/assets/characters/panda/panda_base.webp',
        color: 0x00ff00,
        rarity: 'COMMON',
        role: 'WARRIOR',
        unlockType: 'free',
        unlockCost: 0,
        stats: { strength: 18, agility: 12, stamina: 20, intelligence: 10 },
        baseScale: 0.9,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.48, y: 0.22 },
            rightHand: { x: 0.74, y: 0.4, angle: -45, scale: 1.1 },
            leftHand: { x: 0.26, y: 0.4, angle: 45, scale: 1.0 },
            center: { x: 0.5, y: 0.5 },
        },
        lore: 'Часть 1: Ленивое солнце Туманной Долины\nФэн Лун никогда не стремился к славе. Большую часть жизни он провёл на южных рубежах — в Туманной Долине, где бамбуковые рощи шелестят под тёплым ветром. Его идеальный день состоял из сочной бамбуковой ветки на завтрак и многочасового сна на прогретых солнцем валунах у реки. Местные жители подшучивали над его ленью, но любили его за добродушный нрав и готовность всегда помочь дотащить тяжёлую телегу.\n\nЧасть 2: Тень отца и пыльный сундук\nВ углу его скромной хижины всегда стоял тяжёлый окованный сундук, оставшийся от отца — некогда прославленного воина ордена, ушедшего на покой. Фэн никогда не открывал его, предпочитая мирную жизнь простого фермера. Отец всегда говорил ему: «Сила — это не только умение наносить удары, это ответственность за тех, кто слабее. Надеюсь, тебе никогда не придётся это понять».\n\nЧасть 3: Ночь багровой луны\nВсё изменилось, когда из глубин Дикого Леса — проклятых земель за границей долины — начали выходить осквернённые хищники. Обычные лесные звери под воздействием темной магии превратились в яростных чудовищ. В ночь, когда первая стая тварей прорвала ветхий палисад деревни, Фэн Лун понял, что прятаться больше негде.\n\nОн смахнул вековую пыль с отцовского сундука. Доспехи отца — латы из закалённой бронзы с гравировкой драконьей чешуи — оказались ему впору. На самом дне лежал семейный реликвийный шест из железного бамбука, пропитанный смолой священного источника.\n\nЧасть 4: Первое испытание\nВ ту ночь жители долины впервые увидели другого Фэн Луна. Ленивый увалень двигался с грацией штормового ветра. Каждый удар его шеста отзывался глухим гулом, отбрасывая монстров назад. Он защитил свой дом, но понял, что это лишь начало. Тьма на Окраинах сгущается, и чтобы долина могла спать спокойно, ему придётся распрощаться со своими ленивыми днями под солнцем.',
    },
    {
        id: 'raccoon',
        name: 'Рикки',
        title: 'Дикий Страж',
        image: '/assets/characters/raccoon/raccoon_base.webp',
        color: 0xffaa00,
        rarity: 'EPIC',
        role: 'ASSASSIN',
        unlockType: 'gold',
        unlockCost: 200,
        stats: { strength: 14, agility: 24, stamina: 16, intelligence: 12 },
        baseScale: 0.8,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.22, scale: 0.8 },
            rightHand: { x: 0.72, y: 0.45, angle: -30, scale: 1.0 },
            leftHand: { x: 0.28, y: 0.45, angle: 30, scale: 0.9 },
            center: { x: 0.5, y: 0.55 },
        },
        lore: 'Маленький, но невероятно проворный Рикки вырос в верхних кронах Древнего Леса. Он научился сливаться с тенями и слышать шепот листвы задолго до того, как освоил искусство клинка.\n\nКогда темная скверна начала сгущаться на границах его родины, Рикки стал тайным защитником леса. Он наносит быстрые и смертоносные удары из тени, бесшумно нейтрализуя любую угрозу и исчезая в лесной чаще прежде, чем враг успеет понять, откуда пришла смерть.',
    },
    // ── 5 НОВЫХ ПЕРСОНАЖЕЙ ──────────────────────────────────────────────────
    // TODO: ОТКЛЮЧЕНО — спрайты ещё не готовы. Раскомментировать после добавления ассетов.
    /*
    {
        id: 'shadow_dancer',
        name: 'Нyx',
        title: 'Танцор Теней',
        image: '/assets/characters/shadow_dancer/shadow_dancer_base.webp',
        color: 0x7b2d8b,
        rarity: 'EPIC',
        role: 'ASSASSIN',
        unlockType: 'diamonds',
        unlockCost: 50,
        stats: { strength: 16, agility: 28, stamina: 14, intelligence: 14 },
        baseScale: 0.85,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.72, y: 0.42, angle: -30, scale: 1.0 },
            leftHand: { x: 0.28, y: 0.42, angle: 30, scale: 0.9 },
            center: { x: 0.5, y: 0.55 },
        },
        lore: 'Нyx вышла из пустоты между мирами, где нет ни света, ни звука. Её движения — это не бой, а ритуальный танец смерти. Каждая жертва, помеченная её тенью, обречена: следующий удар всегда находит уязвимое место.',
    },
    {
        id: 'crystal_guardian',
        name: 'Кристалл',
        title: 'Хранитель Кристалла',
        image: '/assets/characters/crystal_guardian/crystal_guardian_base.webp',
        color: 0x00d4ff,
        rarity: 'RARE',
        role: 'TANK',
        unlockType: 'gold',
        unlockCost: 350,
        stats: { strength: 14, agility: 10, stamina: 30, intelligence: 16 },
        baseScale: 1.0,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.15 },
            rightHand: { x: 0.75, y: 0.38, angle: -45, scale: 1.2 },
            leftHand: { x: 0.25, y: 0.38, angle: 45, scale: 1.1 },
            center: { x: 0.5, y: 0.5 },
        },
        lore: 'Когда-то это был обычный горный медведь, пока молния небесного кристалла не пронзила его насквозь. Теперь его тело — живой щит из мерцающего камня. Урон, который он принимает, частично отражается обратно врагу.',
    },
    {
        id: 'storm_caller',
        name: 'Тэзар',
        title: 'Призыватель Гроз',
        image: '/assets/characters/storm_caller/storm_caller_base.webp',
        color: 0xf5e642,
        rarity: 'LEGENDARY',
        role: 'MAGE',
        unlockType: 'diamonds',
        unlockCost: 150,
        stats: { strength: 12, agility: 18, stamina: 16, intelligence: 30 },
        baseScale: 0.9,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.18 },
            rightHand: { x: 0.73, y: 0.4, angle: -40, scale: 1.1 },
            leftHand: { x: 0.27, y: 0.4, angle: 40, scale: 1.0 },
            center: { x: 0.5, y: 0.52 },
        },
        lore: 'Старый орёл-шаман, проживший три века на вершинах Громовых гор. Тэзар не атакует мгновенно — он накапливает силу грозы внутри врага, и в нужный момент выпускает разрушительный разряд, способный испепелить кого угодно.',
    },
    {
        id: 'nature_warden',
        name: 'Эльра',
        title: 'Страж Природы',
        image: '/assets/characters/nature_warden/nature_warden_base.webp',
        color: 0x3ecf4f,
        rarity: 'RARE',
        role: 'SUPPORT',
        unlockType: 'level',
        unlockCost: 15,
        stats: { strength: 10, agility: 16, stamina: 22, intelligence: 24 },
        baseScale: 0.85,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.72, y: 0.43, angle: -20, scale: 1.0 },
            leftHand: { x: 0.28, y: 0.43, angle: 20, scale: 0.95 },
            center: { x: 0.5, y: 0.54 },
        },
        lore: 'Эльра — белая лисица, последний хранитель Священной Рощи. Её магия не разрушает, а восстанавливает. Природная сила, текущая сквозь неё, медленно исцеляет тех, кого она взяла под защиту.',
    },
    {
        id: 'void_walker',
        name: 'Каэль',
        title: 'Ходок по Пустоте',
        image: '/assets/characters/void_walker/void_walker_base.webp',
        color: 0x4a1a8c,
        rarity: 'MYTHIC',
        role: 'ASSASSIN',
        unlockType: 'achievement',
        unlockCost: 0,
        unlockAchievement: 'win_100_battles',
        stats: { strength: 18, agility: 22, stamina: 16, intelligence: 18 },
        baseScale: 0.88,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.18 },
            rightHand: { x: 0.73, y: 0.41, angle: -35, scale: 1.05 },
            leftHand: { x: 0.27, y: 0.41, angle: 35, scale: 0.95 },
            center: { x: 0.5, y: 0.53 },
        },
        lore: 'Каэль существует между измерениями. Его тёмная магия замедляет само время для врагов: те, кто попадает в зону его пустоты, чувствуют, как каждый шаг даётся им с удвоенным усилием. Мифическое существо, открывающееся лишь опытнейшим воинам.',
    },
    */
];


export const getHeroConfig = (id: string) => HEROES_DB.find((h) => h.id === id) || HEROES_DB[0];
