// Пул реалистичных имён для замаскированных ботов
// Внешне неотличимы от реальных VK-игроков

const FIRST_NAMES_MALE = [
    'Александр',
    'Дмитрий',
    'Максим',
    'Сергей',
    'Андрей',
    'Алексей',
    'Артём',
    'Илья',
    'Кирилл',
    'Михаил',
    'Никита',
    'Роман',
    'Егор',
    'Даниил',
    'Тимур',
    'Владислав',
    'Евгений',
    'Иван',
    'Антон',
    'Павел',
    'Денис',
    'Виктор',
    'Глеб',
    'Руслан',
    'Степан',
    'Фёдор',
    'Игорь',
    'Юрий',
    'Вадим',
    'Константин',
];

const FIRST_NAMES_FEMALE = [
    'Анастасия',
    'Мария',
    'Екатерина',
    'Дарья',
    'Елена',
    'Ксения',
    'Анна',
    'Виктория',
    'Полина',
    'Алина',
    'Валерия',
    'Наталья',
    'Ольга',
    'Юлия',
    'Татьяна',
    'Кристина',
    'Ирина',
    'Светлана',
    'Вероника',
    'Диана',
];

const LAST_NAMES_MALE = [
    'Иванов',
    'Смирнов',
    'Кузнецов',
    'Попов',
    'Васильев',
    'Петров',
    'Соколов',
    'Михайлов',
    'Новиков',
    'Фёдоров',
    'Морозов',
    'Волков',
    'Алексеев',
    'Лебедев',
    'Семёнов',
    'Егоров',
    'Павлов',
    'Козлов',
    'Степанов',
    'Николаев',
    'Орлов',
    'Андреев',
    'Макаров',
    'Никитин',
    'Захаров',
    'Зайцев',
    'Соловьёв',
    'Борисов',
    'Яковлев',
    'Григорьев',
];

const LAST_NAMES_FEMALE = [
    'Иванова',
    'Смирнова',
    'Кузнецова',
    'Попова',
    'Васильева',
    'Петрова',
    'Соколова',
    'Михайлова',
    'Новикова',
    'Фёдорова',
    'Морозова',
    'Волкова',
    'Алексеева',
    'Лебедева',
    'Семёнова',
    'Егорова',
    'Павлова',
    'Козлова',
    'Степанова',
    'Николаева',
    'Орлова',
    'Андреева',
    'Макарова',
    'Никитина',
    'Захарова',
];

const ENGLISH_NICKNAMES = [
    'Shadow', 'Hunter', 'Storm', 'Rogue', 'Alex', 'Max', 'Drake', 'Viper', 'Slayer', 'Ghost',
    'Rex', 'Luna', 'Ranger', 'Paladin', 'Druid', 'Stalker', 'Titan', 'Zeus', 'Thor', 'Loki',
    'Sophia', 'Emma', 'Oliver', 'Leo', 'Jack', 'Mia', 'Nova', 'Kai', 'Finn', 'Blaze',
    'Frost', 'Ash', 'Ember', 'Goliath', 'Phoenix', 'Raven', 'Talon', 'Vortex', 'Kratos', 'Odin'
];

export const getRandomBotName = (): string => {
    const isRussian = Math.random() < 0.5;
    if (isRussian) {
        const isMale = Math.random() < 0.65;
        if (isMale) {
            const firstName = FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)];
            const lastName = LAST_NAMES_MALE[Math.floor(Math.random() * LAST_NAMES_MALE.length)];
            return `${firstName} ${lastName}`;
        } else {
            const firstName = FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
            const lastName = LAST_NAMES_FEMALE[Math.floor(Math.random() * LAST_NAMES_FEMALE.length)];
            return `${firstName} ${lastName}`;
        }
    } else {
        return ENGLISH_NICKNAMES[Math.floor(Math.random() * ENGLISH_NICKNAMES.length)];
    }
};
