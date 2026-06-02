import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobData {
    id: string;
    name: string;
    image: string;
    icon: string;
    isBoss: boolean;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
}

interface MobStatsCardProps {
    selectedMob: MobData;
    selectedFloor: number;
}

interface RewardItem {
    id: string;
    name: string;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    rarityLabel: string;
    desc: string;
    image: string;
    color: string;
    glow: string;
}

export const MobStatsCard: React.FC<MobStatsCardProps> = ({ selectedMob, selectedFloor }) => {
    const recommendedPower = selectedFloor * 1700;
    const [hoveredReward, setHoveredReward] = useState<RewardItem | null>(null);

    const customRewards: RewardItem[] = [
        {
            id: 'coal',
            name: 'Уголь',
            rarity: 'COMMON',
            rarityLabel: 'Обычное',
            desc: 'Простой уголь для растопки горнила кузницы.',
            image: '/assets/images/resources/coal.webp',
            color: '#9ca3af',
            glow: 'rgba(156, 163, 175, 0.25)',
        },
        {
            id: 'steel_bar',
            name: 'Стальной слиток',
            rarity: 'RARE',
            rarityLabel: 'Редкое',
            desc: 'Прочный стальной слиток для ковки брони и оружия.',
            image: '/assets/images/resources/steel_bar.webp',
            color: '#3b82f6',
            glow: 'rgba(59, 130, 246, 0.45)',
        },
        {
            id: 'runic_shard',
            name: 'Рунический осколок',
            rarity: 'EPIC',
            rarityLabel: 'Эпическое',
            desc: 'Магический осколок руны, концентрирующий чистую энергию.',
            image: '/assets/images/resources/runic_shard.webp',
            color: '#a855f7',
            glow: 'rgba(168, 85, 247, 0.55)',
        },
        // Динамический показ редкого ресурса этажа
        (() => {
            if (selectedFloor <= 5) {
                return {
                    id: 'ancient_compass',
                    name: 'Древний компас',
                    rarity: 'RARE',
                    rarityLabel: 'Редкое',
                    desc: 'Указывает путь к скрытым сокровищам древней обители.',
                    image: '/assets/images/resources/ancient_compass.webp',
                    color: '#3b82f6',
                    glow: 'rgba(59, 130, 246, 0.45)',
                };
            } else if (selectedFloor <= 10) {
                return {
                    id: 'astral_crystal',
                    name: 'Астральный кристалл',
                    rarity: 'RARE',
                    rarityLabel: 'Редкое',
                    desc: 'Кристалл, вобравший в себя мерцание далеких звезд.',
                    image: '/assets/images/resources/astral_crystal.webp',
                    color: '#3b82f6',
                    glow: 'rgba(59, 130, 246, 0.45)',
                };
            } else if (selectedFloor <= 15) {
                return {
                    id: 'void_sphere',
                    name: 'Сфера бездны',
                    rarity: 'EPIC',
                    rarityLabel: 'Эпическое',
                    desc: 'Сфера из чистой пустоты, притягивающая окружающую материю.',
                    image: '/assets/images/resources/void_sphere.webp',
                    color: '#a855f7',
                    glow: 'rgba(168, 85, 247, 0.55)',
                };
            } else if (selectedFloor <= 20) {
                return {
                    id: 'golden_sprout',
                    name: 'Золотой росток',
                    rarity: 'EPIC',
                    rarityLabel: 'Эпическое',
                    desc: 'Обладает невероятной жизненной силой священного дерева.',
                    image: '/assets/images/resources/golden_sprout.webp',
                    color: '#a855f7',
                    glow: 'rgba(168, 85, 247, 0.55)',
                };
            } else if (selectedFloor <= 25) {
                return {
                    id: 'dragon_scale',
                    name: 'Чешуя дракона',
                    rarity: 'LEGENDARY',
                    rarityLabel: 'Легендарное',
                    desc: 'Прочная чешуя древнего дракона, поглощающая удары.',
                    image: '/assets/images/resources/dragon_scale.webp',
                    color: '#f59e0b',
                    glow: 'rgba(245, 158, 11, 0.65)',
                };
            } else {
                return {
                    id: 'lava_heart',
                    name: 'Сердце лавы',
                    rarity: 'LEGENDARY',
                    rarityLabel: 'Легендарное',
                    desc: 'Пульсирующее ядро огненного голема, источающее жар.',
                    image: '/assets/images/resources/lava_heart.webp',
                    color: '#f59e0b',
                    glow: 'rgba(245, 158, 11, 0.65)',
                };
            }
        })(),
    ];

    return (
        <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(196, 139, 59, 0.15)',
                borderRadius: '6px',
                padding: '24px 28px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                cursor: 'default',
                fontFamily: "'Russo One', sans-serif",
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <span
                    style={{
                        fontSize: '11px',
                        color: '#b8860b',
                        letterSpacing: '1px',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 700,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                    }}
                >
                    ХАРАКТЕРИСТИКИ СТРАЖА
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        {
                            label: 'ЗДОРОВЬЕ',
                            value: selectedMob.hp,
                            max: 20000,
                            color: '#e11d48',
                            rawVal: selectedMob.hp,
                        },
                        {
                            label: 'СИЛА АТАКИ',
                            value: selectedMob.attack,
                            max: 1000,
                            color: '#f59e0b',
                            rawVal: selectedMob.attack,
                        },
                        {
                            label: 'ЗАЩИТА',
                            value: selectedMob.defense,
                            max: 500,
                            color: '#3b82f6',
                            rawVal: selectedMob.defense,
                        },
                        {
                            label: 'СКОРОСТЬ',
                            value: selectedMob.speed,
                            max: 3,
                            color: '#eab308',
                            rawVal: selectedMob.speed.toFixed(1),
                        },
                    ].map((stat) => {
                        const pct = Math.min(100, (stat.value / stat.max) * 100);
                        return (
                            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        fontSize: '12px',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: '#9ca3af',
                                            fontWeight: 700,
                                            fontSize: '10px',
                                            letterSpacing: '0.5px',
                                            fontFamily: "'Cinzel', serif",
                                        }}
                                    >
                                        {stat.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '15px',
                                            fontWeight: 900,
                                            color: '#fff',
                                            fontFamily: "'Russo One', sans-serif",
                                        }}
                                    >
                                        {stat.rawVal}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: '6px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '1px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(0,0,0,0.5)',
                                    }}
                                >
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        style={{
                                            height: '100%',
                                            background: stat.color,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ height: '1px', background: 'rgba(196, 139, 59, 0.12)' }} />

                {/* Возможные награды */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span
                        style={{
                            fontSize: '11px',
                            color: '#b8860b',
                            letterSpacing: '1px',
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 700,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                        }}
                    >
                        ВОЗМОЖНЫЕ НАГРАДЫ
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {customRewards.map((item) => (
                            <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.08 }}
                                onHoverStart={() => setHoveredReward(item)}
                                onHoverEnd={() => setHoveredReward(null)}
                                style={{
                                    aspectRatio: '1',
                                    borderRadius: '6px',
                                    background: 'rgba(10, 8, 20, 0.65)',
                                    border:
                                        hoveredReward?.id === item.id
                                            ? `2px solid ${item.color}`
                                            : '1px solid rgba(196, 139, 59, 0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    boxShadow:
                                        hoveredReward?.id === item.id
                                            ? `0 0 15px ${item.glow}`
                                            : 'inset 0 0 6px rgba(0,0,0,0.5)',
                                    transition: 'border 0.2s ease, box-shadow 0.2s ease',
                                }}
                            >
                                <img
                                    src={item.image}
                                    style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                                    alt={item.name}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Панель интерактивного описания награды (Tooltip) */}
                    <div
                        style={{
                            minHeight: '64px',
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(196, 139, 59, 0.1)',
                            borderRadius: '4px',
                            padding: '8px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            boxSizing: 'border-box',
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {hoveredReward ? (
                                <motion.div
                                    key={hoveredReward.id}
                                    initial={{ opacity: 0, y: 2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -2 }}
                                    transition={{ duration: 0.15 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: hoveredReward.color }}>
                                            {hoveredReward.name}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '9px',
                                                fontWeight: 700,
                                                color: hoveredReward.color,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                            }}
                                        >
                                            {hoveredReward.rarityLabel}
                                        </span>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '9.5px',
                                            color: '#d1d5db',
                                            lineHeight: '1.3',
                                            fontWeight: 400,
                                        }}
                                    >
                                        {hoveredReward.desc}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.55 }}
                                    style={{
                                        fontSize: '9.5px',
                                        color: '#fbbf24',
                                        textAlign: 'center',
                                        fontStyle: 'italic',
                                        letterSpacing: '0.3px',
                                        fontWeight: 400,
                                    }}
                                >
                                    Наведи курсор на награду для просмотра описания
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(196, 139, 59, 0.12)' }} />

                {/* Рекомендуемая мощь */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            fontWeight: 700,
                            letterSpacing: '1px',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        РЕКОМЕНДУЕМАЯ МОЩЬ
                    </span>
                    <span
                        style={{
                            fontSize: '20px',
                            color: '#fff',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <img
                            src="/assets/images/ui/mosh.png"
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                            alt="Power"
                        />
                        {recommendedPower.toLocaleString()}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};
