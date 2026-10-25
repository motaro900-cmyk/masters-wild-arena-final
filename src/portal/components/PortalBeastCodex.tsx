/**
 * PORTAL BEAST CODEX (Интерактивный Бестиарий Портала)
 * Официальные игровые персонажи Masters of the Wild (Фэн Лун, Аурелиус, Варкан, Рикки, Громм)
 * 3D Parallax эффект, многослойный композит спрайта и локации, тактические статы и способности.
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { useGameStore } from '../../store/useGameStore';

export interface IPortalBeast {
    id: string;
    name: string;
    title: string;
    avatar: string;
    sprite: string;
    backdrop: string;
    element: string;
    elementColor: string;
    role: string;
    rarity: string;
    stats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        critChance: number;
    };
    skills: {
        name: string;
        icon: string;
        cooldown: string;
        desc: string;
    }[];
    lore: string;
    quote: string;
}

export const PORTAL_BEASTS: IPortalBeast[] = [
    {
        id: 'panda',
        name: 'Фэн Лун',
        title: 'Страж Окраин',
        avatar: '/assets/images/avatars/panda.webp',
        sprite: '/assets/characters/panda/panda_base.png',
        backdrop: '/assets/images/backgrounds/bg_main.webp',
        element: 'Энергия Ци & Бамбук',
        elementColor: '#4ade80',
        role: 'Воин (WARRIOR)',
        rarity: 'БАЗОВЫЙ',
        stats: { hp: 770, attack: 32, defense: 12, speed: 1.95, critChance: 9.5 },
        skills: [
            { name: 'Удар Дзена', icon: 'strike', cooldown: '3 хода', desc: 'Концентрирует внутреннюю энергию Ци в наконечнике шеста, нанося 2.5× урона и оглушая противника на 1 ход.' },
            { name: 'Ожог Ци', icon: 'flame', cooldown: 'Пассивно (30%)', desc: 'Обычные атаки с шансом 30% поджигают цель священным огнем, нанося 12% урона от атаки каждый ход.' },
            { name: 'Железный Бамбук', icon: 'shield', cooldown: 'Реликвия Отца', desc: 'Реликвийный шест из закаленного бронзового бамбука, отражающий атаки (+12 Защиты, +9.5% Крита).' },
        ],
        lore: 'Фэн Лун вырос на южных рубежах Туманной Долины. Когда оскверненные хищники вырвались из Дикого Леса, он открыл старый отцовский сундук, надел бронзовые доспехи и взял семейный бамбуковый шест, чтобы защитить свой дом.',
        quote: '«Сила — это не только умение наносить удары, это ответственность за тех, кто слабее.»',
    },
    {
        id: 'raccoon',
        name: 'Рикки',
        title: 'Дикий Страж',
        avatar: '/assets/images/avatars/cat.webp',
        sprite: '/assets/characters/raccoon/raccoon_base.png',
        backdrop: '/assets/images/backgrounds/bg_city_hub.webp',
        element: 'Яд & Тени Леса',
        elementColor: '#a855f7',
        role: 'Ассасин (ASSASSIN)',
        rarity: 'РЕДКИЙ',
        stats: { hp: 560, attack: 42, defense: 6, speed: 2.1, critChance: 11.5 },
        skills: [
            { name: 'Танец Теней', icon: 'shadow', cooldown: '4 хода', desc: 'Мгновенное перемещение сквозь тени изумрудных крон с серией выпадов: 3.5× урона и отравление цели на 4 хода.' },
            { name: 'Ядовитый Разрез', icon: 'poison', cooldown: 'Пассивно (35%)', desc: 'Каждая атака с шансом 35% заражает врага ядом древнего ящера, нанося 9% урона в ход.' },
            { name: 'Костяные Клинки', icon: 'daggers', cooldown: 'Реликвия Следопыта', desc: 'Парные клинки деда, вырезанные из клыков древнего ящера (+42 Атаки, +11.5% Крита).' },
        ],
        lore: 'Рикки провел юность на верхнем ярусе Древнего Леса среди висячих мостов и лиан. Когда темное облако скверны накрыло лес, он спустился в тени с костяными клинками деда, став Диким Стражем.',
        quote: '«Настоящее оружие стража не должно звенеть сталью. Оно должно петь в унисон с ветром.»',
    },
    {
        id: 'minotaur',
        name: 'Громм',
        title: 'Хранитель Лабиринта',
        avatar: '/assets/images/avatars/bear.webp',
        sprite: '/assets/characters/minotaur/minotaur_base.png',
        backdrop: '/assets/images/backgrounds/bg_main.webp',
        element: 'Руны Скал & Гром',
        elementColor: '#eab308',
        role: 'Танк (TANK)',
        rarity: 'ЭПИЧЕСКИЙ',
        stats: { hp: 1120, attack: 28, defense: 18, speed: 1.45, critChance: 4.0 },
        skills: [
            { name: 'Молот Лабиринта', icon: 'hammer', cooldown: '3 хода', desc: 'Сокрушительный рунический удар оземь (1.8× урона) и защитный барьер в 12% от макс. HP.' },
            { name: 'Оглушение Камнем', icon: 'stun', cooldown: 'Пассивно (25%)', desc: 'Тяжесть упавшей звезды в клинке позволяет с шансом 25% оглушать противника на 1 ход.' },
            { name: 'Звездный Рунический Меч', icon: 'blade', cooldown: 'Священное Оружие', desc: 'Массивный рунический меч, выкованный из осколка упавшей звезды (+1120 HP, +18 Защиты).' },
        ],
        lore: 'Громм родился в подземных коридорах Древнего Лабиринта. Защитив святилище от оскверненных тварей в трехдневной битве, он впервые вышел на поверхность, чтобы найти и искоренить скверну.',
        quote: '«Древние камни помнят всё. И они не простят скверну.»',
    },
    {
        id: 'tiger_warrior',
        name: 'Варкан',
        title: 'Повелитель Джунглей',
        avatar: '/assets/images/avatars/tiger.webp',
        sprite: '/assets/characters/tiger_warrior/tiger_warrior_base.png',
        backdrop: '/assets/images/backgrounds/bg_forge.webp',
        element: 'Ярость & Луна',
        elementColor: '#f97316',
        role: 'Ассасин (ASSASSIN)',
        rarity: 'ЭПИЧЕСКИЙ',
        stats: { hp: 640, attack: 44, defense: 7, speed: 2.25, critChance: 13.5 },
        skills: [
            { name: 'Лунное Сечение', icon: 'slash', cooldown: '3 хода', desc: 'Молниеносный полукруглый взмах Лунной Секирой (3.25× урона) и наложение Метки Теней.' },
            { name: 'Метка Теней', icon: 'mark', cooldown: 'Пассивно (35%)', desc: 'Атаки по меченым целям снимают метку и наносят гарантированный сокрушительный крит +50% урона.' },
            { name: 'Лунная Секира', icon: 'axe', cooldown: 'Оружие Клана', desc: 'Выкованная из серебряной руды священных вод секира клана оборотней (+44 Атаки, +13.5% Крита).' },
        ],
        lore: 'Варкан принадлежит к древнему клану тигров Изумрудных Джунглей. Пройдя испытание полной луны, он получил священную Лунную Секиру и поклялся очистить джунгли от чумы тьмы.',
        quote: '«Вся их броня — лишь преграда перед яростью моих клыков и лунной стали!»',
    },
    {
        id: 'lion_knight',
        name: 'Аурелиус',
        title: 'Лорд Прайда',
        avatar: '/assets/images/avatars/lion.webp',
        sprite: '/assets/characters/lion_knight/lion_knight_base.png',
        backdrop: '/assets/images/backgrounds/bg_city_hub.webp',
        element: 'Солнечный Свет',
        elementColor: '#fbbf24',
        role: 'Воин (WARRIOR)',
        rarity: 'МИФИЧЕСКИЙ',
        stats: { hp: 805, attack: 34, defense: 11, speed: 1.8, critChance: 8.0 },
        skills: [
            { name: 'Королевский Гнев', icon: 'crown', cooldown: '3 хода', desc: 'Благословение Золотого Солнца (2.6× урона) и запуск регенерации +5% HP на 3 хода.' },
            { name: 'Солнечный Ожог', icon: 'sun', cooldown: 'Пассивно (30%)', desc: 'Удары Золотого Клинка с вероятностью 30% поджигают врага священным огнем на 2 хода.' },
            { name: 'Золотой Клинок Солнца', icon: 'sword', cooldown: 'Королевская Реликвия', desc: 'Королевский меч прайда, выкованный в пламени падающей звезды (+805 HP, +34 Атаки).' },
        ],
        lore: 'Сын павшего короля Золотой Саванны, принявший титул Лорда Прайда во время осады Королевской Цитадели. В его руках Золотой Клинок горит незатухающим праведным пламенем.',
        quote: '«Свет не просит прощения у тьмы. За Саванну, за павших братьев!»',
    },
];

interface PortalBeastCodexProps {
    onSelectAndPlay: (heroId: string) => void;
}

export const PortalBeastCodex: React.FC<PortalBeastCodexProps> = ({ onSelectAndPlay }) => {
    const [selectedBeast, setSelectedBeast] = useState<IPortalBeast>(PORTAL_BEASTS[0]);
    const [roaring, setRoaring] = useState(false);

    // 3D Tilt calculation
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;

        const maxTilt = 10;
        setTilt({
            rx: -deltaY * maxTilt,
            ry: deltaX * maxTilt,
            glareX: (x / rect.width) * 100,
            glareY: (y / rect.height) * 100,
            active: true,
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });
    }, []);

    const handleSelectBeast = (beast: IPortalBeast) => {
        proceduralAudio.playShimmer();
        setSelectedBeast(beast);
    };

    const handleRoar = () => {
        proceduralAudio.playDuelHorn();
        setRoaring(true);
        setTimeout(() => setRoaring(false), 800);
    };

    const handlePlayWithBeast = () => {
        proceduralAudio.playFanfare();
        const store: any = useGameStore.getState();
        store.setSelectedHeroId?.(selectedBeast.id);
        onSelectAndPlay(selectedBeast.id);
    };

    return (
        <section
            id="beasts"
            style={{
                position: 'relative',
                padding: '90px 24px',
                backgroundColor: '#0a0812',
                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                overflow: 'hidden',
            }}
        >
            {/* Background ambient radial glow */}
            <div
                style={{
                    position: 'absolute',
                    top: '20%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    background: `radial-gradient(circle, ${selectedBeast.elementColor}20 0%, rgba(0,0,0,0) 70%)`,
                    pointerEvents: 'none',
                    filter: 'blur(90px)',
                    transition: 'background 0.8s ease',
                }}
            />

            <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                {/* Section Header */}
                <div style={{ textAlign: 'center', marginBottom: '45px' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 18px',
                            borderRadius: '30px',
                            background: 'rgba(212, 175, 55, 0.12)',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            color: '#d4af37',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            marginBottom: '14px',
                        }}
                    >
                        <span>📜</span> КОДЕКС ЗВЕРЕЙ & ОФИЦИАЛЬНЫЕ ГЕРОИ
                    </div>
                    <h2
                        style={{
                            margin: '0 0 14px 0',
                            fontFamily: "'Philosopher', 'Cinzel', serif",
                            fontSize: 'clamp(28px, 4vw, 44px)',
                            color: '#f9f5ea',
                            textShadow: '0 4px 14px rgba(0,0,0,0.8)',
                        }}
                    >
                        Воины Вселенной Masters of the Wild
                    </h2>
                    <p
                        style={{
                            margin: '0 auto',
                            maxWidth: '680px',
                            fontSize: '15px',
                            color: '#a39886',
                            lineHeight: 1.7,
                        }}
                    >
                        Подлинные персонажи игры с детальной боевой механикой, набором способностей
                        и глубокой историей. Выберите своего зверя и сразу отправляйтесь на боевую арену.
                    </p>
                </div>

                {/* Beast Selector Tabs */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginBottom: '40px',
                    }}
                >
                    {PORTAL_BEASTS.map((beast) => {
                        const isSelected = selectedBeast.id === beast.id;
                        return (
                            <button
                                key={beast.id}
                                onClick={() => handleSelectBeast(beast)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 18px',
                                    background: isSelected
                                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(30, 22, 40, 0.95) 100%)'
                                        : 'rgba(20, 16, 26, 0.75)',
                                    border: isSelected
                                        ? '1.5px solid #d4af37'
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    boxShadow: isSelected
                                        ? '0 6px 20px rgba(212, 175, 55, 0.25)'
                                        : 'none',
                                }}
                            >
                                <img
                                    src={beast.avatar}
                                    alt={beast.name}
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        objectFit: 'cover',
                                        border: `1.5px solid ${isSelected ? beast.elementColor : 'rgba(255,255,255,0.2)'}`,
                                    }}
                                />
                                <div style={{ textAlign: 'left' }}>
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            color: isSelected ? '#f5ede0' : '#b2a594',
                                            fontFamily: "'Philosopher', serif",
                                        }}
                                    >
                                        {beast.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: beast.elementColor }}>
                                        {beast.role}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Main Beast Showcase (2 Columns: Authentic Composite 3D Card + Full Dossier) */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '36px',
                        alignItems: 'center',
                    }}
                >
                    {/* Left: 3D Parallax Composite Card */}
                    <div style={{ perspective: '1000px', display: 'flex', justifyContent: 'center' }}>
                        <div
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '420px',
                                height: '540px',
                                borderRadius: '22px',
                                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                                transformStyle: 'preserve-3d',
                                transition: tilt.active ? 'none' : 'transform 0.5s ease',
                                boxShadow: `0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px ${selectedBeast.elementColor}33`,
                                border: '2px solid rgba(212, 175, 55, 0.55)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                background: '#07050b',
                            }}
                        >
                            {/* In-Game Authentic Backdrop */}
                            <img
                                src={selectedBeast.backdrop}
                                alt="Game Background"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: 'brightness(0.55) contrast(1.15)',
                                    transform: 'scale(1.05)',
                                }}
                            />

                            {/* Radial Glow matching character element */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: `radial-gradient(circle at 50% 55%, ${selectedBeast.elementColor}35 0%, rgba(0,0,0,0.6) 75%)`,
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* Authentic Character Sprite (No Watermarks, High-Res Transparent) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: '40px 10px 90px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 2,
                                }}
                            >
                                <img
                                    src={selectedBeast.sprite}
                                    alt={selectedBeast.name}
                                    style={{
                                        maxHeight: '100%',
                                        maxWidth: '100%',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.9)) drop-shadow(0 0 15px rgba(212, 175, 55, 0.3))',
                                    }}
                                />
                            </div>

                            {/* Holographic Specular Glare */}
                            {tilt.active && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 65%)`,
                                        pointerEvents: 'none',
                                        mixBlendMode: 'overlay',
                                        zIndex: 3,
                                    }}
                                />
                            )}

                            {/* Top Badges (Rarity & Roar) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '18px',
                                    left: '18px',
                                    right: '18px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    zIndex: 4,
                                }}
                            >
                                <div
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(10, 8, 14, 0.85)',
                                        border: `1.5px solid ${selectedBeast.elementColor}`,
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        color: selectedBeast.elementColor,
                                        letterSpacing: '1px',
                                    }}
                                >
                                    {selectedBeast.rarity}
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRoar();
                                    }}
                                    title="Боевой рык зверя"
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: 'rgba(10, 8, 14, 0.85)',
                                        border: '1.5px solid rgba(212, 175, 55, 0.7)',
                                        color: '#f3e8d2',
                                        fontSize: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
                                        transform: roaring ? 'scale(1.2)' : 'scale(1)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    🔊
                                </button>
                            </div>

                            {/* Bottom Card Title Overlay */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '22px',
                                    background: 'linear-gradient(to top, rgba(6, 4, 10, 0.98) 0%, rgba(6, 4, 10, 0.8) 60%, transparent 100%)',
                                    zIndex: 4,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-block',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: selectedBeast.elementColor,
                                        marginBottom: '4px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    {selectedBeast.element} • {selectedBeast.role}
                                </div>
                                <h3
                                    style={{
                                        margin: '0 0 2px 0',
                                        fontFamily: "'Philosopher', serif",
                                        fontSize: '26px',
                                        color: '#FFE07D',
                                        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    {selectedBeast.name}
                                </h3>
                                <p style={{ margin: 0, fontSize: '12px', color: '#c4b5a2', fontStyle: 'italic' }}>
                                    {selectedBeast.title}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Full Dossier (Stats, Skills, Lore, CTA) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Quote Box */}
                        <div
                            style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                background: 'rgba(25, 20, 32, 0.8)',
                                borderLeft: `4px solid ${selectedBeast.elementColor}`,
                                fontStyle: 'italic',
                                color: '#e8dcce',
                                fontSize: '14px',
                                lineHeight: 1.6,
                            }}
                        >
                            {selectedBeast.quote}
                        </div>

                        {/* Lore narrative */}
                        <div
                            style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                background: 'rgba(18, 14, 24, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#b9ac9a',
                                fontSize: '13px',
                                lineHeight: 1.7,
                            }}
                        >
                            <span style={{ color: '#d4af37', fontWeight: 700 }}>История Героя: </span>
                            {selectedBeast.lore}
                        </div>

                        {/* Tactical Stats Radar Bars */}
                        <div
                            style={{
                                background: 'rgba(18, 14, 24, 0.85)',
                                border: '1.5px solid rgba(212, 175, 55, 0.3)',
                                borderRadius: '16px',
                                padding: '20px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#d4af37', fontWeight: 800 }}>
                                    Боевые Характеристики
                                </span>
                                <span style={{ fontSize: '12px', color: selectedBeast.elementColor, fontWeight: 700 }}>
                                    {selectedBeast.role}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { label: 'Здоровье (HP)', val: selectedBeast.stats.hp, max: 1200, color: '#10b981' },
                                    { label: 'Атака (ATK)', val: selectedBeast.stats.attack, max: 50, color: '#ef4444' },
                                    { label: 'Броня (DEF)', val: selectedBeast.stats.defense, max: 20, color: '#3b82f6' },
                                    { label: 'Скорость (SPD)', val: selectedBeast.stats.speed, max: 2.5, color: '#a855f7' },
                                    { label: 'Крит (CRIT %)', val: selectedBeast.stats.critChance, max: 20, color: '#f59e0b' },
                                ].map((stat) => {
                                    const percent = Math.min(100, Math.round((stat.val / stat.max) * 100));
                                    return (
                                        <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ width: '120px', fontSize: '12px', color: '#c4b8a7' }}>{stat.label}</span>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: '7px',
                                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                                    style={{
                                                        height: '100%',
                                                        backgroundColor: stat.color,
                                                        borderRadius: '4px',
                                                        boxShadow: `0 0 8px ${stat.color}88`,
                                                    }}
                                                />
                                            </div>
                                            <span style={{ width: '45px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                                                {stat.val}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Signature Skills */}
                        <div>
                            <h4
                                style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    color: '#d4af37',
                                    fontWeight: 700,
                                }}
                            >
                                Способности & Боевые Руны
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedBeast.skills.map((skill) => (
                                    <div
                                        key={skill.name}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            background: 'rgba(20, 16, 26, 0.7)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <span style={{ fontSize: '20px', lineHeight: 1 }}>{skill.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f3e8d2' }}>
                                                    {skill.name}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{skill.cooldown}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#a69a89', marginTop: '3px', lineHeight: 1.4 }}>
                                                {skill.desc}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Button: Вступить в бой за этого героя */}
                        <button
                            onClick={handlePlayWithBeast}
                            style={{
                                marginTop: '8px',
                                width: '100%',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                                color: '#1a1005',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '1.5px',
                                cursor: 'pointer',
                                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <span>⚔️</span> Вступить в бой за {selectedBeast.name}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
