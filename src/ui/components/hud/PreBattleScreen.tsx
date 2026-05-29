import React from 'react';
import { motion } from 'framer-motion';

interface StatCompareRowProps {
    label: string;
    playerVal: number;
    enemyVal: number;
}

const StatCompareRow: React.FC<StatCompareRowProps> = ({ label, playerVal, enemyVal }) => {
    const total = playerVal + enemyVal;
    const playerPct = total > 0 ? (playerVal / total) * 100 : 50;
    const playerWins = playerVal >= enemyVal;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            {/* Значение игрока */}
            <div
                style={{
                    width: '80px',
                    textAlign: 'right',
                    color: playerWins ? '#4ade80' : '#fff',
                    fontWeight: playerWins ? 900 : 600,
                    fontSize: '18px',
                    fontFamily: 'Russo One, sans-serif',
                    textShadow: playerWins ? '0 0 12px rgba(74,222,128,0.6)' : 'none',
                }}
            >
                {playerVal.toLocaleString()}
            </div>

            {/* Шкала */}
            <div style={{ flex: 1, position: 'relative' }}>
                <div
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '11px',
                        textAlign: 'center',
                        marginBottom: '4px',
                        letterSpacing: '1px',
                        fontWeight: 700,
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        height: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative',
                    }}
                >
                    {/* Полоска игрока (слева) */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${playerPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            background: playerWins
                                ? 'linear-gradient(90deg, #10b981, #4ade80)'
                                : 'linear-gradient(90deg, #6366f1, #818cf8)',
                            borderRadius: '5px 0 0 5px',
                        }}
                    />
                    {/* Полоска врага (справа, красная) */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - playerPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            height: '100%',
                            background: !playerWins
                                ? 'linear-gradient(270deg, #ef4444, #f87171)'
                                : 'linear-gradient(270deg, #dc2626, #b91c1c)',
                            borderRadius: '0 5px 5px 0',
                        }}
                    />
                </div>
            </div>

            {/* Значение врага */}
            <div
                style={{
                    width: '80px',
                    textAlign: 'left',
                    color: !playerWins ? '#f87171' : '#fff',
                    fontWeight: !playerWins ? 900 : 600,
                    fontSize: '18px',
                    fontFamily: 'Russo One, sans-serif',
                    textShadow: !playerWins ? '0 0 12px rgba(248,113,113,0.6)' : 'none',
                }}
            >
                {enemyVal.toLocaleString()}
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
    // Вычисляем «силу» для шанса победы
    const playerPower =
        playerStats.hp * 0.4 + playerStats.attack * 2 + playerStats.defense * 1.5 + playerStats.speed * 10;
    const enemyPower = enemyStats.hp * 0.4 + enemyStats.attack * 2 + enemyStats.defense * 1.5 + enemyStats.speed * 10;
    const rawWinChance = (playerPower / (playerPower + enemyPower)) * 100;
    // Округляем до 5%
    const winChance = Math.round(rawWinChance / 5) * 5;

    const winChanceColor = winChance >= 70 ? '#4ade80' : winChance >= 45 ? '#fbbf24' : '#ef4444';
    const winChanceLabel = winChance >= 70 ? 'Уверенная победа' : winChance >= 45 ? 'Равный бой' : 'Высокий риск';

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(15,20,40,0.97) 0%, rgba(5,8,20,0.99) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4500,
                pointerEvents: 'auto',
            }}
        >
            {/* Декоративные линии сверху и снизу */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #c48b3b, #f0c040, #c48b3b, transparent)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #c48b3b, #f0c040, #c48b3b, transparent)',
                }}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'backOut' }}
                style={{
                    width: '900px',
                    background: 'rgba(10,14,30,0.95)',
                    border: '1px solid rgba(196,139,59,0.4)',
                    borderRadius: '24px',
                    padding: '48px 56px',
                    boxShadow: '0 0 80px rgba(0,0,0,0.8), inset 0 0 40px rgba(196,139,59,0.03)',
                }}
            >
                {/* Заголовок */}
                <div
                    style={{
                        textAlign: 'center',
                        color: '#f0c040',
                        fontSize: '14px',
                        letterSpacing: '4px',
                        fontWeight: 700,
                        marginBottom: '32px',
                        opacity: 0.7,
                    }}
                >
                    ⚔️ СРАВНЕНИЕ БОЙЦОВ ⚔️
                </div>

                {/* Блок бойцов */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '32px',
                    }}
                >
                    {/* ИГРОК */}
                    <motion.div
                        initial={{ x: -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        style={{ textAlign: 'center', width: '200px' }}
                    >
                        <div
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                border: '3px solid #4ade80',
                                boxShadow: '0 0 24px rgba(74,222,128,0.4)',
                                overflow: 'hidden',
                                margin: '0 auto 12px',
                                background: '#1a2040',
                            }}
                        >
                            <img
                                src={playerImage}
                                alt={playerName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div
                            style={{
                                color: '#4ade80',
                                fontSize: '20px',
                                fontWeight: 900,
                                fontFamily: 'Russo One, sans-serif',
                            }}
                        >
                            {playerName}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
                            Уровень {playerLevel}
                        </div>
                        <div
                            style={{
                                marginTop: '8px',
                                padding: '4px 12px',
                                background: 'rgba(74,222,128,0.15)',
                                border: '1px solid rgba(74,222,128,0.3)',
                                borderRadius: '20px',
                                color: '#4ade80',
                                fontSize: '12px',
                                fontWeight: 700,
                                display: 'inline-block',
                            }}
                        >
                            ВЫ
                        </div>
                    </motion.div>

                    {/* VS */}
                    <div style={{ textAlign: 'center', paddingTop: '30px' }}>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{
                                color: '#f0c040',
                                fontSize: '48px',
                                fontWeight: 900,
                                fontFamily: 'Russo One, sans-serif',
                                textShadow: '0 0 20px rgba(240,192,64,0.5)',
                                lineHeight: 1,
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
                        style={{ textAlign: 'center', width: '200px' }}
                    >
                        <div
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                border: '3px solid #ef4444',
                                boxShadow: '0 0 24px rgba(239,68,68,0.4)',
                                overflow: 'hidden',
                                margin: '0 auto 12px',
                                background: '#2a1020',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '64px',
                            }}
                        >
                            {enemyImage ? (
                                <img
                                    src={enemyImage}
                                    alt={enemyName}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)',
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <span>{enemyIcon}</span>
                            )}
                        </div>
                        <div
                            style={{
                                color: '#ef4444',
                                fontSize: '20px',
                                fontWeight: 900,
                                fontFamily: 'Russo One, sans-serif',
                            }}
                        >
                            {enemyName}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
                            Противник
                        </div>
                        <div
                            style={{
                                marginTop: '8px',
                                padding: '4px 12px',
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '20px',
                                color: '#ef4444',
                                fontSize: '12px',
                                fontWeight: 700,
                                display: 'inline-block',
                            }}
                        >
                            ВРАГ
                        </div>
                    </motion.div>
                </div>

                {/* Разделитель */}
                <div
                    style={{
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(196,139,59,0.4), transparent)',
                        marginBottom: '24px',
                    }}
                />

                {/* Сравнение статов */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <StatCompareRow label="ЗДОРОВЬЕ" playerVal={playerStats.hp} enemyVal={enemyStats.hp} />
                    <StatCompareRow label="АТАКА" playerVal={playerStats.attack} enemyVal={enemyStats.attack} />
                    <StatCompareRow label="ЗАЩИТА" playerVal={playerStats.defense} enemyVal={enemyStats.defense} />
                    <StatCompareRow
                        label="СКОРОСТЬ"
                        playerVal={Math.round(playerStats.speed)}
                        enemyVal={Math.round(enemyStats.speed)}
                    />
                </motion.div>

                {/* Шанс победы */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    style={{
                        margin: '24px 0',
                        padding: '16px 24px',
                        background: `rgba(${winChance >= 70 ? '74,222,128' : winChance >= 45 ? '251,191,36' : '239,68,68'},0.08)`,
                        border: `1px solid rgba(${winChance >= 70 ? '74,222,128' : winChance >= 45 ? '251,191,36' : '239,68,68'},0.3)`,
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div
                            style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '11px',
                                letterSpacing: '2px',
                                fontWeight: 700,
                            }}
                        >
                            ПРОГНОЗ
                        </div>
                        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>
                            {winChanceLabel}
                        </div>
                    </div>
                    <div
                        style={{
                            color: winChanceColor,
                            fontSize: '40px',
                            fontWeight: 900,
                            fontFamily: 'Russo One, sans-serif',
                            textShadow: `0 0 20px ${winChanceColor}66`,
                        }}
                    >
                        ~{winChance}%
                    </div>
                </motion.div>

                {/* Кнопки */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onCancel}
                        style={{
                            padding: '16px 40px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '12px',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'Russo One, sans-serif',
                            letterSpacing: '1px',
                        }}
                    >
                        НАЗАД
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(196,139,59,0.5)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onStart}
                        style={{
                            flex: 1,
                            padding: '16px 48px',
                            background: 'linear-gradient(135deg, #c48b3b 0%, #f0c040 50%, #c48b3b 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#1a0e00',
                            fontSize: '20px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontFamily: 'Russo One, sans-serif',
                            letterSpacing: '2px',
                            boxShadow: '0 8px 32px rgba(196,139,59,0.3)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        ⚔️ НАЧАТЬ БОЙ
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};
