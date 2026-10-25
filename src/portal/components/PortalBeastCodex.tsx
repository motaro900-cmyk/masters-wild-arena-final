/**
 * PORTAL BEAST CODEX (Интерактивный Бестиарий Портала)
 * 5 Легендарных Зверей с 3D Parallax эффектом наклона карточки,
 * тактическим радаром характеристик, демонстрацией навыков и рыком зверя.
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { useGameStore } from '../../store/useGameStore';

export interface IPortalBeast {
    id: string;
    name: string;
    title: string;
    avatar: string;
    splashArt: string;
    element: string;
    elementColor: string;
    role: string;
    stats: {
        attack: number;
        defense: number;
        speed: number;
        magic: number;
        durability: number;
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
        title: 'Защитник Севера & Повелитель Льда',
        avatar: '/assets/images/avatars/panda.webp',
        splashArt: '/assets/promo/frost_panda_aaa_master.jpg',
        element: 'Холод & Лед',
        elementColor: '#60a5fa',
        role: 'Несокрушимый Танк',
        stats: { attack: 78, defense: 96, speed: 64, magic: 82, durability: 98 },
        skills: [
            { name: 'Ледяной Разлом', icon: '❄️', cooldown: '8 сек', desc: 'Сотрясает землю волной абсолютного нуля, сковывая врагов в ледяные глыбы.' },
            { name: 'Бамбуковый Щит', icon: '🛡️', cooldown: '12 сек', desc: 'Окутывает союзников непробиваемым куполом ци, отражая 40% урона обратно.' },
            { name: 'Гнев Вьюги', icon: '🌪️', cooldown: '24 сек', desc: 'Ультимативная метель, наносящая периодический морозный урон всей линии фронта.' },
        ],
        lore: 'Фэн Лун медитировал на заснеженных пиках Куньлуня более трехсот лет. Он постиг истинное спокойствие льда: пока разум хладнокровен, ни один удар не способен сломить дух.',
        quote: '«Тверже скалы, холоднее ледника. Мой щит — щит моих братьев!»',
    },
    {
        id: 'lion',
        name: 'Аурелиус',
        title: 'Паладин Солнца & Владыка Прайда',
        avatar: '/assets/images/avatars/lion.webp',
        splashArt: '/assets/promo/lion_knight_aaa_master.jpg',
        element: 'Солнечный Свет',
        elementColor: '#fbbf24',
        role: 'Универсальный Лидер',
        stats: { attack: 92, defense: 88, speed: 76, magic: 75, durability: 90 },
        skills: [
            { name: 'Клинок Рассвета', icon: '⚔️', cooldown: '6 сек', desc: 'Освященный рубящий выпад, пробивающий любую броню вспышкой солнечного огня.' },
            { name: 'Рев Света', icon: '🦁', cooldown: '15 сек', desc: 'Боевой рык, вселяющий ужас во врагов и дарующий союзникам +35% к силе атаки.' },
            { name: 'Солнечный Суд', icon: '☀️', cooldown: '22 сек', desc: 'Нисходящий луч праведного пламени, испепеляющий темные сущности.' },
        ],
        lore: 'Потомок древней династии Золотых Грив. Носит латы, выкованные из солнечного метеорита в жерле священного вулкана Золотых Земель.',
        quote: '«Свет не просит прощения у тьмы. В атаку, сыны Солнца!»',
    },
    {
        id: 'tiger',
        name: 'Варкан',
        title: 'Кровавый Берсерк & Повелитель Джунглей',
        avatar: '/assets/images/avatars/tiger.webp',
        splashArt: '/assets/promo/tiger_berserker_aaa_master.jpg',
        element: 'Первобытная Ярость',
        elementColor: '#f97316',
        role: 'Взрывной Урон (DPS)',
        stats: { attack: 99, defense: 68, speed: 91, magic: 55, durability: 79 },
        skills: [
            { name: 'Когтистый Вихрь', icon: '🩸', cooldown: '5 сек', desc: 'Серия молниеносных рассечений с эффектом глубокого кровотечения.' },
            { name: 'Жажда Битвы', icon: '🔥', cooldown: '10 сек', desc: 'Каждая потерянная единица HP конвертируется в +1.5% к критическому шансу.' },
            { name: 'Опустошающий Прыжок', icon: '🐾', cooldown: '18 сек', desc: 'Врывается в тыл врага, мгновенно оглушая и нанося сокрушительный крит.' },
        ],
        lore: 'Варкан не признает переговоров. Выросший в глухих чащах Багровых Лесов, он живет по закону клыка и когтя, где выживает лишь сильнейший хищник.',
        quote: '«Вся их броня — лишь консервная банка для моих когтей!»',
    },
    {
        id: 'panther',
        name: 'Рикки',
        title: 'Теневой Клинок & Ночной Призрак',
        avatar: '/assets/images/avatars/panther.webp',
        splashArt: '/assets/promo/frost_panda_aaa_master.jpg',
        element: 'Астральная Тень',
        elementColor: '#a855f7',
        role: 'Скрытный Ассасин',
        stats: { attack: 94, defense: 60, speed: 98, magic: 70, durability: 65 },
        skills: [
            { name: 'Теневой Шаг', icon: '🌑', cooldown: '7 сек', desc: 'Исчезает из поля зрения и появляется за спиной самого опасного мага противника.' },
            { name: 'Ядовитый Веер', icon: '🗡️', cooldown: '11 сек', desc: 'Метает отравленные сюрикены, снижающие скорость передвижения и силу цели.' },
            { name: 'Танец Затмения', icon: '✨', cooldown: '20 сек', desc: 'Серия ударов из теней, делающая Рикки неуязвимым во время применения.' },
        ],
        lore: 'Бывший мастер гильдии Невидимых Когтей. Ее шаги беззвучны, а силуэт сливается с лунным светом. Никто не видел ее лица до удара.',
        quote: '«Ты услышишь свист лезвия лишь за мгновение до вечного сна.»',
    },
    {
        id: 'bear',
        name: 'Громм',
        title: 'Железный Молот & Землетрясец',
        avatar: '/assets/images/avatars/bear.webp',
        splashArt: '/assets/promo/tiger_berserker_aaa_master.jpg',
        element: 'Скала & Гром',
        elementColor: '#eab308',
        role: 'Массивный Брузер',
        stats: { attack: 86, defense: 92, speed: 52, magic: 65, durability: 95 },
        skills: [
            { name: 'Удар Тектоники', icon: '🔨', cooldown: '8 сек', desc: 'Мощный удар кулаком о землю, раскалывающий строй врага и сбивающий с ног.' },
            { name: 'Каменная Кожа', icon: '🪨', cooldown: '14 сек', desc: 'Уплотняет шкуру до прочности гранита, поглощая до 3000 единиц любого урона.' },
            { name: 'Первобытный Раскол', icon: '💥', cooldown: '25 сек', desc: 'Поднимает каменные шипы по всей арене, нанося массовый физический урон.' },
        ],
        lore: 'Древний хранитель Медвежьего Ущелья. Говорят, что когда Громм вступает в бой, само сердце континента начинает биться быстрее.',
        quote: '«Земля подо мной дрожит, и враги мои падут прахом!»',
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

        const maxTilt = 12;
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
                padding: '100px 24px',
                backgroundColor: '#09070e',
                borderTop: '1px solid rgba(200, 168, 112, 0.15)',
                borderBottom: '1px solid rgba(200, 168, 112, 0.15)',
                overflow: 'hidden',
            }}
        >
            {/* Background ambient runes */}
            <div
                style={{
                    position: 'absolute',
                    top: '20%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    background: `radial-gradient(circle, ${selectedBeast.elementColor}15 0%, rgba(0,0,0,0) 70%)`,
                    pointerEvents: 'none',
                    filter: 'blur(90px)',
                    transition: 'background 0.8s ease',
                }}
            />

            <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                {/* Section Header */}
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 16px',
                            borderRadius: '30px',
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            color: '#d4af37',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            marginBottom: '14px',
                        }}
                    >
                        <span>📜</span> КОДЕКС ЗВЕРЕЙ ДИКИХ ЗЕМЕЛЬ
                    </div>
                    <h2
                        style={{
                            margin: '0 0 16px 0',
                            fontFamily: "'Philosopher', 'Cinzel', serif",
                            fontSize: 'clamp(28px, 4vw, 44px)',
                            color: '#f9f5ea',
                            textShadow: '0 4px 14px rgba(0,0,0,0.8)',
                        }}
                    >
                        Легендарные Воины Природы
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
                        Каждый зверь наделен уникальным элементом, набором тактических навыков и древним происхождением. 
                        Выберите своего защитника перед выходом на арену.
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
                                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(20, 15, 25, 0.95) 100%)'
                                        : 'rgba(20, 16, 26, 0.7)',
                                    border: isSelected
                                        ? '1.5px solid #d4af37'
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
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
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '8px',
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

                {/* Main Beast Showcase (2 Columns: 3D Holographic Card + Detail Intel) */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '36px',
                        alignItems: 'center',
                    }}
                >
                    {/* Left: 3D Parallax Card */}
                    <div style={{ perspective: '1000px', display: 'flex', justifyContent: 'center' }}>
                        <div
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '420px',
                                height: '520px',
                                borderRadius: '20px',
                                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                                transformStyle: 'preserve-3d',
                                transition: tilt.active ? 'none' : 'transform 0.5s ease',
                                boxShadow: `0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px ${selectedBeast.elementColor}33`,
                                border: '2px solid rgba(212, 175, 55, 0.5)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                            }}
                        >
                            {/* Beast Master Artwork */}
                            <img
                                src={selectedBeast.splashArt}
                                alt={selectedBeast.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: 'contrast(1.05) brightness(0.95)',
                                    transform: 'scale(1.04)',
                                }}
                            />

                            {/* Holographic Specular Glare */}
                            {tilt.active && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 65%)`,
                                        pointerEvents: 'none',
                                        mixBlendMode: 'overlay',
                                    }}
                                />
                            )}

                            {/* Bottom Card Overlay Badge */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '24px',
                                    background: 'linear-gradient(to top, rgba(5, 4, 8, 0.98) 0%, rgba(5, 4, 8, 0.7) 60%, transparent 100%)',
                                    color: '#fff',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-block',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: `${selectedBeast.elementColor}22`,
                                        border: `1px solid ${selectedBeast.elementColor}88`,
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: selectedBeast.elementColor,
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    {selectedBeast.element}
                                </div>
                                <h3
                                    style={{
                                        margin: '0 0 4px 0',
                                        fontFamily: "'Philosopher', serif",
                                        fontSize: '28px',
                                        color: '#FFE07D',
                                        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    {selectedBeast.name}
                                </h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#c4b5a2', fontStyle: 'italic' }}>
                                    {selectedBeast.title}
                                </p>
                            </div>

                            {/* Top Roar Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRoar();
                                }}
                                title="Услышать боевой зов"
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    background: 'rgba(10, 8, 14, 0.8)',
                                    border: '1.5px solid rgba(212, 175, 55, 0.6)',
                                    color: '#f3e8d2',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                                    transform: roaring ? 'scale(1.2)' : 'scale(1)',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                🔊
                            </button>
                        </div>
                    </div>

                    {/* Right: Detailed Dossier & Skills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Quote Box */}
                        <div
                            style={{
                                padding: '16px 20px',
                                borderRadius: '12px',
                                background: 'rgba(25, 20, 32, 0.7)',
                                borderLeft: `4px solid ${selectedBeast.elementColor}`,
                                fontStyle: 'italic',
                                color: '#e8dcce',
                                fontSize: '14px',
                                lineHeight: 1.6,
                            }}
                        >
                            {selectedBeast.quote}
                        </div>

                        {/* Lore summary */}
                        <p style={{ margin: 0, color: '#b9ac9a', fontSize: '14px', lineHeight: 1.7 }}>
                            {selectedBeast.lore}
                        </p>

                        {/* Tactical Stats */}
                        <div
                            style={{
                                background: 'rgba(15, 12, 20, 0.8)',
                                border: '1px solid rgba(212, 175, 55, 0.25)',
                                borderRadius: '14px',
                                padding: '18px',
                            }}
                        >
                            <h4
                                style={{
                                    margin: '0 0 14px 0',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    color: '#d4af37',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span>Боевые Параметры</span>
                                <span style={{ color: selectedBeast.elementColor }}>{selectedBeast.role}</span>
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { label: 'Атака', val: selectedBeast.stats.attack, color: '#ef4444' },
                                    { label: 'Защита', val: selectedBeast.stats.defense, color: '#3b82f6' },
                                    { label: 'Скорость', val: selectedBeast.stats.speed, color: '#10b981' },
                                    { label: 'Магия / Ци', val: selectedBeast.stats.magic, color: '#a855f7' },
                                    { label: 'Живучесть', val: selectedBeast.stats.durability, color: '#eab308' },
                                ].map((stat) => (
                                    <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ width: '85px', fontSize: '12px', color: '#c4b8a7' }}>{stat.label}</span>
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
                                                animate={{ width: `${stat.val}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                                style={{
                                                    height: '100%',
                                                    backgroundColor: stat.color,
                                                    borderRadius: '4px',
                                                    boxShadow: `0 0 8px ${stat.color}88`,
                                                }}
                                            />
                                        </div>
                                        <span style={{ width: '32px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                                            {stat.val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Unique Skills Accordion / Badges */}
                        <div>
                            <h4
                                style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    color: '#d4af37',
                                }}
                            >
                                Особые Навыки и Способности
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedBeast.skills.map((skill) => (
                                    <div
                                        key={skill.name}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            background: 'rgba(20, 16, 26, 0.6)',
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

                        {/* CTA Button: Вступить в бой этим зверем */}
                        <button
                            onClick={handlePlayWithBeast}
                            style={{
                                marginTop: '10px',
                                width: '100%',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                                color: '#1a1005',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: 800,
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
