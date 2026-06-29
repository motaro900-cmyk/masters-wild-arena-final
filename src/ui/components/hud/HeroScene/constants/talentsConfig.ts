export const TALENTS_CONFIG = [
    {
        id: 'attack',
        title: 'АТАКА',
        icon: '⚔️',
        color: '#b53f3f',
        tiers: [
            {
                level: 1,
                requiredInBranch: 0,
                talents: [
                    {
                        id: 'atk_base',
                        name: 'Пламя Войны',
                        iconClass: 'sprite-talent talent-1',
                        max: 5,
                        desc: 'Увеличивает базовую силу атаки на {v}%.',
                    },
                ],
            },
            {
                level: 2,
                requiredInBranch: 3,
                talents: [
                    {
                        id: 'atk_crit',
                        name: 'Когти Хищника',
                        iconClass: 'sprite-talent talent-5',
                        max: 3,
                        desc: 'Шанс критического удара +{v}%.',
                    },
                    {
                        id: 'atk_pen',
                        name: 'Ярость Тигра',
                        iconClass: 'sprite-talent talent-6',
                        max: 3,
                        desc: 'Критический урон +{v}%.',
                    },
                ],
            },
            {
                level: 3,
                requiredInBranch: 10,
                talents: [
                    {
                        id: 'atk_ult',
                        name: 'Громовой Разряд',
                        iconClass: 'sprite-talent talent-7',
                        max: 1,
                        desc: 'Критические удары вызывают разряд молнии.',
                    },
                ],
            },
        ],
    },
    {
        id: 'defense',
        title: 'ЗАЩИТА',
        icon: '🛡️',
        color: '#346fa1',
        tiers: [
            {
                level: 1,
                requiredInBranch: 0,
                talents: [
                    {
                        id: 'def_base',
                        name: 'Стальная Шкура',
                        iconClass: 'sprite-talent talent-2',
                        max: 5,
                        desc: 'Увеличивает объем здоровья на {v}%.',
                    },
                ],
            },
            {
                level: 2,
                requiredInBranch: 3,
                talents: [
                    {
                        id: 'def_res',
                        name: 'Отражающий Вихрь',
                        iconClass: 'sprite-talent talent-3',
                        max: 3,
                        desc: 'Стойкость к критическим ударам +{v}.',
                    },
                    {
                        id: 'def_eva',
                        name: 'Мистический Барьер',
                        iconClass: 'sprite-talent talent-11',
                        max: 3,
                        desc: 'Защита +{v}%.',
                    },
                ],
            },
            {
                level: 3,
                requiredInBranch: 10,
                talents: [
                    {
                        id: 'def_ult',
                        name: 'Кровь Феникса',
                        iconClass: 'sprite-talent talent-8',
                        max: 1,
                        desc: 'Весь входящий урон снижен на 20%.',
                    },
                ],
            },
        ],
    },
    {
        id: 'mastery',
        title: 'МАСТЕРСТВО',
        icon: '✨',
        color: '#b3822b',
        tiers: [
            {
                level: 1,
                requiredInBranch: 0,
                talents: [
                    {
                        id: 'mas_base',
                        name: 'Дзен',
                        iconClass: 'sprite-talent talent-9',
                        max: 5,
                        desc: 'Восстановление энергии в бою +{v}.',
                    },
                ],
            },
            {
                level: 2,
                requiredInBranch: 3,
                talents: [
                    {
                        id: 'mas_spd',
                        name: 'Лунная Тень',
                        iconClass: 'sprite-talent talent-10',
                        max: 3,
                        desc: 'Скорость передвижения и атаки +{v}%.',
                    },
                    {
                        id: 'mas_focus',
                        name: 'Лотос Познания',
                        iconClass: 'sprite-talent talent-4',
                        max: 3,
                        desc: 'Шанс критического удара +{v}%.',
                    },
                ],
            },
            {
                level: 3,
                requiredInBranch: 10,
                talents: [
                    {
                        id: 'mas_ult',
                        name: 'Источник Жизни',
                        iconClass: 'sprite-talent talent-12',
                        max: 1,
                        desc: 'Критический урон увеличен на +10% за каждый уровень таланта.',
                    },
                ],
            },
        ],
    },
];
