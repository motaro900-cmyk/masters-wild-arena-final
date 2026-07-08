import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { getRankInfo } from '../../../configs/RankSystem';

interface StatCompareRowProps {
    label: string;
    playerVal: number;
    enemyVal: number;
}

const StatCompareRow: React.FC<StatCompareRowProps> = ({ label, playerVal, enemyVal }) => {
    const maxVal = Math.max(playerVal, enemyVal) * 1.2 || 1;
    const pPct = Math.min(100, Math.max(0, (playerVal / maxVal) * 100));
    const ePct = Math.min(100, Math.max(0, (enemyVal / maxVal) * 100));
    const pColor = playerVal >= enemyVal ? '#22c55e' : '#a8a29e';
    const eColor = enemyVal >= playerVal ? '#ef4444' : '#a8a29e';

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '15px', marginBottom: '14px' }}>
            {/* Значение игрока */}
            <div
                style={{
                    width: '50px',
                    textAlign: 'right',
                    color: pColor,
                    fontWeight: 'bold',
                    fontSize: '18px',
                    fontFamily: 'Russo One, sans-serif',
                }}
            >
                {label === 'СКОРОСТЬ' ? playerVal.toFixed(1) : Math.round(playerVal).toLocaleString()}
            </div>

            {/* Шкала игрока */}
            <div
                style={{
                    flex: 1,
                    height: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                }}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    style={{
                        height: '100%',
                        background: pColor,
                        borderRadius: '4px',
                    }}
                />
            </div>

            {/* Название характеристики */}
            <div
                style={{
                    width: '120px',
                    textAlign: 'center',
                    color: '#fef3c7',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    fontFamily: "'Montserrat', sans-serif",
                    letterSpacing: '1px',
                }}
            >
                {label}
            </div>

            {/* Шкала врага */}
            <div
                style={{
                    flex: 1,
                    height: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                }}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ePct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    style={{
                        height: '100%',
                        background: eColor,
                        borderRadius: '4px',
                    }}
                />
            </div>

            {/* Значение врага */}
            <div
                style={{
                    width: '50px',
                    textAlign: 'left',
                    color: eColor,
                    fontWeight: 'bold',
                    fontSize: '18px',
                    fontFamily: 'Russo One, sans-serif',
                }}
            >
                {label === 'СКОРОСТЬ' ? enemyVal.toFixed(1) : Math.round(enemyVal).toLocaleString()}
            </div>
        </div>
    );
};

import { ITEMS_DATABASE, calculateItemPower } from '../../../game/configs/ItemsConfig';
import { AssetsMap } from '../../../configs/AssetsMap';

const getRarityColor = (rarity: string) => {
    switch (rarity?.toUpperCase()) {
        case 'MYTHIC':
            return '#ef4444';
        case 'LEGENDARY':
            return '#f59e0b';
        case 'EPIC':
            return '#a855f7';
        case 'RARE':
            return '#3b82f6';
        case 'UNCOMMON':
            return '#10b981';
        default:
            return '#78716c';
    }
};

const RARITY_RU: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    UNCOMMON: 'НЕОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
};

const slots = [
    { id: 'HELMETS', label: 'ШЛЕМ', gridArea: '1 / 2' },
    { id: 'SHOULDERS', label: 'ПЛЕЧИ', gridArea: '2 / 1' },
    { id: 'ARMOR', label: 'ДОСПЕХ', gridArea: '2 / 2' },
    { id: 'WEAPONS', label: 'ОРУЖИЕ', gridArea: '3 / 1' },
    { id: 'PANTS', label: 'ПОНОЖИ', gridArea: '3 / 2' },
    { id: 'SHIELDS', label: 'ЩИТ', gridArea: '3 / 3' },
    { id: 'BOOTS', label: 'САПОГИ', gridArea: '4 / 2' },
] as const;

const GearSlot: React.FC<{
    slotId: string;
    item: any;
    label: string;
}> = ({ slotId, item, label }) => {
    const color = item ? getRarityColor(item.rarity) : 'rgba(255,255,255,0.05)';
    const [hovered, setHovered] = React.useState(false);

    let blueprintSrc = '';
    if (slotId === 'HELMETS') blueprintSrc = AssetsMap.UI.BLUEPRINT_HELMET;
    else if (slotId === 'ARMOR') blueprintSrc = AssetsMap.UI.BLUEPRINT_ARMOR;
    else if (slotId === 'WEAPONS') blueprintSrc = AssetsMap.UI.BLUEPRINT_WEAPON;
    else if (slotId === 'SHIELDS') blueprintSrc = AssetsMap.UI.BLUEPRINT_SHIELD;
    else if (slotId === 'SHOULDERS') blueprintSrc = AssetsMap.UI.BLUEPRINT_SHOULDERS;
    else if (slotId === 'PANTS') blueprintSrc = AssetsMap.UI.BLUEPRINT_PANTS;
    else if (slotId === 'BOOTS') blueprintSrc = AssetsMap.UI.BLUEPRINT_BOOTS;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                background: item ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)',
                border: `2px solid ${item ? color : 'rgba(240, 192, 64, 0.18)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: item ? `0 0 14px ${color}44, 0 4px 8px rgba(0,0,0,0.5)` : 'none',
                cursor: item ? 'help' : 'default',
                flexShrink: 0,
                transition: 'all 0.2s ease-in-out',
            }}
        >
            {item ? (
                <img
                    src={item.image || item.icon}
                    onError={(e) => {
                        const currentSrc = e.currentTarget.src;
                        if (currentSrc.endsWith('.webp')) {
                            e.currentTarget.src = currentSrc
                                .replace(/_mobile\.webp$/i, '.png')
                                .replace(/\.webp$/i, '.png');
                        }
                    }}
                    alt={item.name}
                    style={{ width: '78%', height: '78%', objectFit: 'contain' }}
                />
            ) : (
                <div
                    style={{
                        opacity: 0.3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {blueprintSrc && (
                        <img
                            src={blueprintSrc}
                            style={{
                                width: '55%',
                                height: '45%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.5)) grayscale(0.5)',
                            }}
                            alt=""
                        />
                    )}
                    <span
                        style={{
                            fontSize: '8px',
                            fontWeight: 900,
                            marginTop: '2px',
                            color: '#f0c040',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {label}
                    </span>
                </div>
            )}

            {item && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-6px',
                        background: color,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '7px',
                        fontWeight: 900,
                        color: '#000',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {RARITY_RU[item.rarity] || item.rarity}
                </div>
            )}

            {hovered && item && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '110%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(15,10,5,0.98)',
                        border: `1.5px solid ${color}`,
                        borderRadius: '10px',
                        padding: '10px 14px',
                        width: '180px',
                        zIndex: 9999,
                        fontSize: '12px',
                        color: '#fff',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.95)',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        fontFamily: "'Montserrat', sans-serif",
                    }}
                >
                    <div style={{ color, fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>{item.name}</div>
                    <div
                        style={{
                            fontSize: '10px',
                            opacity: 0.6,
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                        }}
                    >
                        {RARITY_RU[item.rarity] || item.rarity} • {label}
                    </div>
                    {item.hpBonus && <div style={{ color: '#22c55e', fontSize: '11px' }}>+{item.hpBonus} Здоровье</div>}
                    {item.attackBonus && (
                        <div style={{ color: '#ef4444', fontSize: '11px' }}>+{item.attackBonus} Атака</div>
                    )}
                    {item.defenseBonus && (
                        <div style={{ color: '#3b82f6', fontSize: '11px' }}>+{item.defenseBonus} Защита</div>
                    )}
                </div>
            )}
        </div>
    );
};

const CircularGearLayout: React.FC<{ equipment: Record<string, string | null> }> = ({ equipment }) => {
    const topRow = ['HELMETS', 'WEAPONS', 'ARMOR', 'SHIELDS'];
    const botRow = ['SHOULDERS', 'PANTS', 'BOOTS'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', paddingTop: '8px' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {topRow.map((slotId) => {
                    const s = slots.find((sl) => sl.id === slotId);
                    const itemId = equipment[slotId];
                    const item = itemId ? (ITEMS_DATABASE as any)[itemId] : null;
                    return <GearSlot key={slotId} slotId={slotId} item={item} label={s?.label || ''} />;
                })}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {botRow.map((slotId) => {
                    const s = slots.find((sl) => sl.id === slotId);
                    const itemId = equipment[slotId];
                    const item = itemId ? (ITEMS_DATABASE as any)[itemId] : null;
                    return <GearSlot key={slotId} slotId={slotId} item={item} label={s?.label || ''} />;
                })}
            </div>
        </div>
    );
};

interface PreBattleScreenProps {
    playerName: string;
    playerImage: string;
    playerLevel: number;
    heroLevel?: number;
    playerStats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    enemyName: string;
    enemyImage: string;
    enemyIcon: string;
    enemyStats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    enemyLevel?: number;
    onStart: () => void;
    onCancel: () => void;
    battleMode?: string;
}

export const PreBattleScreen: React.FC<PreBattleScreenProps> = ({
    playerName,
    playerImage,
    playerLevel: _playerLevel,
    heroLevel = 1,
    playerStats,
    enemyName,
    enemyImage,
    enemyIcon,
    enemyStats,
    enemyLevel = 1,
    onStart,
    onCancel,
    battleMode,
}) => {
    const { rating, heroEquipment, selectedHeroId } = useGameStore();
    const playerRank = getRankInfo(rating);
    const [isStarting, setIsStarting] = React.useState(false);
    const startTimeoutRef = React.useRef<any>(null);

    React.useEffect(() => {
        return () => {
            if (startTimeoutRef.current) {
                clearTimeout(startTimeoutRef.current);
            }
        };
    }, []);

    const playerEq = heroEquipment[selectedHeroId] || {};

    const playerGearPower = React.useMemo(() => {
        let total = 0;
        Object.values(playerEq).forEach((itemId: any) => {
            if (!itemId) return;
            let templateId = itemId;
            if (!ITEMS_DATABASE[itemId]) {
                const match = Object.keys(ITEMS_DATABASE)
                    .filter((key) => itemId.startsWith(key + '_'))
                    .sort((a, b) => b.length - a.length)[0];
                templateId = match || itemId;
            }
            const item = (ITEMS_DATABASE as any)[templateId];
            if (item) total += calculateItemPower(item);
        });
        return total;
    }, [playerEq]);

    const enemyEq: Record<string, string | null> = React.useMemo(() => {
        return {
            HELMETS: 'h1',
            SHOULDERS: 'sh_nature_spirit',
            ARMOR: 'starter_armor',
            WEAPONS: 'sword_katana_mythic',
            PANTS: 'pants_mercenary',
            SHIELDS: 'starter_shield',
            BOOTS: 'boots_wanderer',
        };
    }, []);

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(30, 20, 10, 0.96) 0%, rgba(12, 6, 2, 0.99) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4500,
                pointerEvents: 'auto',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'backOut' }}
                style={{
                    background: 'linear-gradient(135deg, rgba(26, 17, 8, 0.85) 0%, rgba(10, 5, 2, 0.95) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '2px solid rgba(240, 192, 64, 0.4)',
                    borderRadius: '24px',
                    padding: '25px 40px',
                    width: '1200px',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(240, 192, 64, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Заголовок */}
                <div
                    style={{
                        fontSize: '28px',
                        color: '#fbbf24',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        marginBottom: '20px',
                        letterSpacing: '2px',
                        textShadow: '0 2px 10px rgba(251, 191, 36, 0.4)',
                    }}
                >
                    СРАВНЕНИЕ БОЙЦОВ
                </div>

                {/* Блок бойцов */}
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'space-between',
                        marginBottom: '25px',
                    }}
                >
                    {/* ИГРОК */}
                    <motion.div
                        initial={{ x: -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '42%',
                        }}
                    >
                        <div
                            style={{
                                color: '#fef3c7',
                                fontSize: '20px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                marginBottom: '10px',
                            }}
                        >
                            ВЫ
                        </div>

                        <div
                            style={{
                                position: 'relative',
                                width: '220px',
                                height: '210px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <img
                                src={playerImage}
                                alt={playerName}
                                style={{
                                    width: '200px',
                                    height: '200px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                                }}
                            />
                        </div>

                        {/* Equipment rows below character */}
                        <CircularGearLayout equipment={playerEq} />

                        {/* ОБЩАЯ МОЩЬ (PLAYER) */}
                        <div
                            style={{
                                marginTop: '10px',
                                background: 'rgba(10, 8, 5, 0.85)',
                                border: '1.5px solid rgba(240, 192, 64, 0.35)',
                                borderRadius: '12px',
                                padding: '4px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '180px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 900,
                                    color: '#b5a695',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    fontFamily: "'Montserrat', sans-serif",
                                    marginBottom: '2px',
                                }}
                            >
                                ОБЩАЯ МОЩЬ
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#fcd34d',
                                        fontFamily: "'Russo One', sans-serif",
                                    }}
                                >
                                    {playerGearPower}
                                </span>
                                {playerGearPower === 0 && (
                                    <span
                                        style={{
                                            fontSize: '9px',
                                            color: '#f97316',
                                            fontWeight: 'bold',
                                            fontFamily: "'Montserrat', sans-serif",
                                            marginLeft: '4px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Надень снаряжение!
                                    </span>
                                )}
                                <img
                                    src={AssetsMap.UI.ICON_POWER}
                                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                    alt="power"
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                color: '#10b981',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                marginTop: '10px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                        >
                            {playerName}
                        </div>
                        <div
                            style={{
                                color: '#fef3c7',
                                fontSize: '13px',
                                fontWeight: 600,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                marginTop: '4px',
                            }}
                        >
                            <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 'bold' }}>
                                Ранг: {playerRank.name}
                            </span>
                            <span
                                style={{
                                    fontSize: '15px',
                                    color: '#fbbf24',
                                    fontWeight: 900,
                                    textShadow: '0 0 10px rgba(251,191,36,0.4)',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                Уровень: {heroLevel}
                            </span>
                        </div>
                    </motion.div>

                    {/* VS */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '16%',
                        }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{
                                fontSize: '48px',
                                color: '#f59e0b',
                                fontFamily: "'Russo One', sans-serif",
                                fontStyle: 'italic',
                                textShadow: '0 4px 10px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.5)',
                            }}
                        >
                            VS
                        </motion.div>
                    </div>

                    {/* ВРАГ */}
                    <motion.div
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '42%',
                        }}
                    >
                        <div
                            style={{
                                color: '#fef3c7',
                                fontSize: '20px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                marginBottom: '10px',
                            }}
                        >
                            ВРАГ
                        </div>

                        <div
                            style={{
                                position: 'relative',
                                width: '220px',
                                height: '210px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {enemyImage ? (
                                <img
                                    src={enemyImage}
                                    alt={enemyName}
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        objectFit: 'contain',
                                        transform: battleMode === 'PVE' ? 'none' : 'scaleX(-1)',
                                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <span style={{ fontSize: '64px' }}>{enemyIcon}</span>
                            )}
                        </div>

                        {/* Equipment rows below enemy character */}
                        {battleMode !== 'PVE' && <CircularGearLayout equipment={enemyEq} />}

                        <div
                            style={{
                                color: '#ef4444',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                marginTop: '10px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                        >
                            {enemyName}
                        </div>
                        <div
                            style={{
                                color: '#fef3c7',
                                fontSize: '13px',
                                fontWeight: 600,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                marginTop: '4px',
                            }}
                        >
                            <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 'bold' }}>
                                Противник • {battleMode === 'PVE' ? 'Орда' : 'Арена'}
                            </span>
                            <span
                                style={{
                                    fontSize: '15px',
                                    color: '#f87171',
                                    fontWeight: 900,
                                    textShadow: '0 0 10px rgba(248,113,113,0.4)',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                Уровень: {enemyLevel}
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Сравнение статов */}
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '25px',
                    }}
                >
                    <StatCompareRow label="ЗДОРОВЬЕ" playerVal={playerStats.hp} enemyVal={enemyStats.hp} />
                    <StatCompareRow label="АТАКА" playerVal={playerStats.attack} enemyVal={enemyStats.attack} />
                    <StatCompareRow label="ЗАЩИТА" playerVal={playerStats.defense} enemyVal={enemyStats.defense} />
                    <StatCompareRow label="СКОРОСТЬ" playerVal={playerStats.speed} enemyVal={enemyStats.speed} />
                </div>

                {/* Кнопки */}
                <div
                    style={{
                        display: 'flex',
                        gap: '20px',
                        width: '100%',
                        justifyContent: 'center',
                    }}
                >
                    <button
                        onClick={onCancel}
                        disabled={false}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                        style={{
                            padding: '12px 30px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fef3c7',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: "'Cinzel', serif",
                            opacity: 1,
                        }}
                    >
                        НАЗАД
                    </button>
                    <button
                        onClick={() => {
                            if (isStarting) return;
                            const state = useGameStore.getState();
                            if (state.energy < 10 && battleMode !== 'WARMUP') {
                                state.showAlert('Недостаточно энергии');
                                return;
                            }
                            setIsStarting(true);
                            if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
                            startTimeoutRef.current = setTimeout(() => {
                                setIsStarting(false);
                                state.showAlert('Ошибка загрузки боя. Попробуйте еще раз.');
                            }, 8000);
                            try {
                                onStart();
                            } catch (err) {
                                setIsStarting(false);
                                if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
                                state.showAlert('Не удалось начать бой');
                            }
                        }}
                        disabled={isStarting}
                        onMouseEnter={(e) => {
                            if (isStarting) return;
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            if (isStarting) return;
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(245, 158, 11, 0.4)';
                        }}
                        style={{
                            padding: '12px 30px',
                            background: isStarting
                                ? 'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)'
                                : 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                            border: isStarting ? '2px solid #4b5563' : '2px solid #fcd34d',
                            borderRadius: '12px',
                            color: isStarting ? '#9ca3af' : '#fff',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: isStarting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isStarting ? 'none' : '0 10px 20px rgba(245, 158, 11, 0.4)',
                            fontFamily: "'Cinzel', serif",
                            opacity: isStarting ? 0.7 : 1,
                        }}
                    >
                        {isStarting ? 'ЗАГРУЗКА...' : 'НАЧАТЬ БОЙ'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
