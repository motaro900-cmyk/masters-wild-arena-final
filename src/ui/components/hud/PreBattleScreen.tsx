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
                {Math.round(playerVal).toLocaleString()}
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
                {Math.round(enemyVal).toLocaleString()}
            </div>
        </div>
    );
};

import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { AssetsMap } from '../../../configs/AssetsMap';

const getRarityColor = (rarity: string) => {
    switch (rarity?.toUpperCase()) {
        case 'MYTHIC': return '#ef4444';
        case 'LEGENDARY': return '#f59e0b';
        case 'EPIC': return '#a855f7';
        case 'RARE': return '#3b82f6';
        case 'UNCOMMON': return '#10b981';
        default: return '#78716c';
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

const CircularGearLayout: React.FC<{ equipment: Record<string, string | null> }> = ({ equipment }) => {
    const topRow = ['HELMETS', 'WEAPONS', 'ARMOR', 'SHIELDS'];
    const botRow = ['SHOULDERS', 'PANTS', 'BOOTS'];

    const renderSlot = (slotId: string) => {
        const s = slots.find(sl => sl.id === slotId);
        const itemId = equipment[slotId];
        const item = itemId ? (ITEMS_DATABASE as any)[itemId] : null;
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
                key={slotId}
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
                        alt={item.name}
                        style={{ width: '78%', height: '78%', objectFit: 'contain' }}
                    />
                ) : (
                    <div style={{ opacity: 0.3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        {blueprintSrc && (
                            <img src={blueprintSrc} style={{ width: '55%', height: '45%', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.5)) grayscale(0.5)' }} alt="" />
                        )}
                        <span style={{ fontSize: '8px', fontWeight: 900, marginTop: '2px', color: '#f0c040', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            {s?.label}
                        </span>
                    </div>
                )}

                {item && (
                    <div style={{ position: 'absolute', bottom: '-6px', background: color, padding: '1px 5px', borderRadius: '4px', fontSize: '7px', fontWeight: 900, color: '#000', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
                        {RARITY_RU[item.rarity] || item.rarity}
                    </div>
                )}

                {hovered && item && (
                    <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,10,5,0.98)', border: `1.5px solid ${color}`, borderRadius: '10px', padding: '10px 14px', width: '180px', zIndex: 9999, fontSize: '12px', color: '#fff', boxShadow: '0 12px 24px rgba(0,0,0,0.95)', pointerEvents: 'none', textAlign: 'center', fontFamily: "'Montserrat', sans-serif" }}>
                        <div style={{ color, fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>{item.name}</div>
                        <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>{RARITY_RU[item.rarity] || item.rarity} • {s?.label}</div>
                        {item.hpBonus && <div style={{ color: '#22c55e', fontSize: '11px' }}>+{item.hpBonus} Здоровье</div>}
                        {item.attackBonus && <div style={{ color: '#ef4444', fontSize: '11px' }}>+{item.attackBonus} Атака</div>}
                        {item.defenseBonus && <div style={{ color: '#3b82f6', fontSize: '11px' }}>+{item.defenseBonus} Защита</div>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', paddingTop: '8px' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {topRow.map(renderSlot)}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {botRow.map(renderSlot)}
            </div>
        </div>
    );
};

interface PreBattleScreenProps {
    playerName: string;
    playerImage: string;
    playerLevel: number;
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
    onStart: () => void;
    onCancel: () => void;
}

export const PreBattleScreen: React.FC<PreBattleScreenProps> = ({
    playerName,
    playerImage,
    playerLevel,
    playerStats,
    enemyName,
    enemyImage,
    enemyIcon,
    enemyStats,
    onStart,
    onCancel,
}) => {
    const { rating, heroEquipment, selectedHeroId } = useGameStore();
    const playerRank = getRankInfo(rating);

    const playerEq = heroEquipment[selectedHeroId] || {};
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

    // Вычисляем «силу» для шанса победы
    const playerPower =
        playerStats.hp * 0.4 + playerStats.attack * 2 + playerStats.defense * 1.5 + playerStats.speed * 10;
    const enemyPower = enemyStats.hp * 0.4 + enemyStats.attack * 2 + enemyStats.defense * 1.5 + enemyStats.speed * 10;
    const rawWinChance = (playerPower / (playerPower + enemyPower)) * 100;
    // Округляем до 5%
    const winChance = Math.round(rawWinChance / 5) * 5;

    const winChanceLabel = winChance >= 70 ? 'Уверенная победа' : winChance >= 45 ? 'Равный бой' : 'Высокий риск';

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

                        <div style={{ position: 'relative', width: '220px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        <div style={{ color: '#fef3c7', fontSize: '14px', fontWeight: 'bold' }}>
                            Уровень {playerLevel} • {playerRank.name}
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

                        <div style={{ position: 'relative', width: '220px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {enemyImage ? (
                                <img
                                    src={enemyImage}
                                    alt={enemyName}
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        objectFit: 'contain',
                                        transform: 'scaleX(-1)',
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
                        <CircularGearLayout equipment={enemyEq} />

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
                        <div style={{ color: '#fef3c7', fontSize: '14px', fontWeight: 'bold' }}>
                            Противник • НОВИЧОК
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
                    <StatCompareRow
                        label="СКОРОСТЬ"
                        playerVal={Math.round(playerStats.speed)}
                        enemyVal={Math.round(enemyStats.speed)}
                    />
                </div>

                {/* Шанс победы (Прогноз) */}
                <div
                    style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '10px 40px',
                        borderRadius: '16px',
                        marginBottom: '20px',
                        textAlign: 'center',
                        border: '1px solid rgba(240, 192, 64, 0.2)',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                    }}
                >
                    <div
                        style={{
                            color: '#fef3c7',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            letterSpacing: '1px',
                        }}
                    >
                        ПРОГНОЗ
                    </div>
                    <div
                        style={{
                            color: '#fbbf24',
                            fontSize: '20px',
                            fontWeight: 900,
                            fontFamily: "'Montserrat', sans-serif",
                        }}
                    >
                        {winChanceLabel} ~{winChance}%
                    </div>
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
                        }}
                    >
                        НАЗАД
                    </button>
                    <button
                        onClick={onStart}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(245, 158, 11, 0.4)';
                        }}
                        style={{
                            padding: '12px 30px',
                            background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                            border: '2px solid #fcd34d',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 10px 20px rgba(245, 158, 11, 0.4)',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        НАЧАТЬ БОЙ
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
