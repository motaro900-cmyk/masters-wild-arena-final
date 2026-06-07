import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { audioService } from '../../../../services/AudioService';
import { calculateItemPower } from '../../../../game/configs/ItemsConfig';
import { RARITY_COLORS, rarityTranslation } from '../../../../configs/RarityConfig';

interface ChestOpeningOverlayProps {
    isOpening: boolean;
    showRewardCard: boolean;
    openingResult: any;
    showFlash: boolean;
    onClose: () => void;
}

export const ChestOpeningOverlay: React.FC<ChestOpeningOverlayProps> = ({
    isOpening,
    showRewardCard,
    openingResult,
    showFlash,
    onClose,
}) => {
    if (!isOpening) return null;

    const renderRewardCard = (result: any) => {
        if (result.type === 'GOLD') {
            return (
                <div
                    style={{
                        background: 'rgba(20, 15, 5, 0.95)',
                        border: '3px solid #f0c040',
                        boxShadow: '0 0 30px rgba(240, 192, 64, 0.4)',
                        borderRadius: '16px',
                        padding: '30px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            width: '120px',
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{
                                position: 'absolute',
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(240,192,64,0.4) 0%, transparent 70%)',
                                zIndex: 0,
                            }}
                        />
                        <img
                            src={AssetsMap.UI.ICON_GOLD_FULL}
                            style={{ width: '90px', height: '90px', objectFit: 'contain', zIndex: 1 }}
                            alt="Золото"
                        />
                    </div>
                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                        <div
                            style={{
                                color: '#f0c040',
                                fontSize: '32px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                textShadow: '0 2px 10px rgba(240, 192, 64, 0.3)',
                            }}
                        >
                            +{result.amount.toLocaleString()}
                        </div>
                        <div
                            style={{
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '11px',
                                fontWeight: 800,
                                marginTop: '4px',
                            }}
                        >
                            ЗОЛОТЫХ МОНЕТ
                        </div>
                    </div>
                </div>
            );
        }

        const data = result.item;
        if (!data) return null;

        const rarity = RARITY_COLORS[data.rarity || 'COMMON'] || RARITY_COLORS.COMMON;
        const currentLevel = result.level || 1;

        const getStatMultiplier = (lvl: number) => {
            if (lvl === 1) return 1.0;
            if (lvl === 2) return 1.15;
            if (lvl === 3) return 1.35;
            return 1.0;
        };

        const isUpgrade = result.type === 'UPGRADE';
        const prevLvl = isUpgrade ? currentLevel - 1 : 1;
        const newLvl = currentLevel;

        const prevMult = getStatMultiplier(prevLvl);
        const newMult = getStatMultiplier(newLvl);

        const renderStatImprovement = (label: string, baseVal: number, icon: string, color: string) => {
            const prevVal = Math.round(baseVal * prevMult);
            const newVal = Math.round(baseVal * newMult);

            return (
                <div
                    key={label}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        fontSize: '13px',
                        padding: '4px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{icon}</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isUpgrade && (
                            <span style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                                +{prevVal}
                            </span>
                        )}
                        {isUpgrade && <span style={{ color: '#10b981' }}>➔</span>}
                        <span style={{ color: color, fontWeight: 900 }}>+{newVal}</span>
                    </div>
                </div>
            );
        };

        const renderSpeedImprovement = (label: string, baseVal: number, icon: string, color: string) => {
            const prevVal = (baseVal * prevMult).toFixed(1);
            const newVal = (baseVal * newMult).toFixed(1);

            return (
                <div
                    key={label}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        fontSize: '13px',
                        padding: '4px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{icon}</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isUpgrade && (
                            <span style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                                +{prevVal}
                            </span>
                        )}
                        {isUpgrade && <span style={{ color: '#10b981' }}>➔</span>}
                        <span style={{ color: color, fontWeight: 900 }}>+{newVal}</span>
                    </div>
                </div>
            );
        };

        const prevPower = Math.round(calculateItemPower(data) * prevMult);
        const newPower = Math.round(calculateItemPower(data) * newMult);

        return (
            <div
                style={{
                    background: rarity.bg,
                    border: `3px solid ${rarity.border}`,
                    boxShadow: `0 0 35px ${rarity.glow}`,
                    borderRadius: '16px',
                    padding: '24px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px',
                    position: 'relative',
                }}
            >
                {/* Level Badge */}
                <div
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(0,0,0,0.6)',
                        border: `1px solid ${rarity.border}`,
                        borderRadius: '6px',
                        padding: '4px 10px',
                        color: '#f0c040',
                        fontSize: '11px',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                    }}
                >
                    {isUpgrade ? `L${prevLvl} ➔ L${newLvl}` : `L${newLvl}`}
                </div>

                {/* Rarity label */}
                <div
                    style={{
                        color: rarity.color,
                        fontSize: '11px',
                        fontWeight: 900,
                        letterSpacing: '2px',
                        fontFamily: "'Cinzel', serif",
                        textTransform: 'uppercase',
                        marginTop: '10px',
                    }}
                >
                    {rarityTranslation[data.rarity] || data.rarity}
                </div>

                {/* Item Image */}
                <div
                    style={{
                        width: '130px',
                        height: '130px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {data.spriteClass ? (
                            <div className={data.spriteClass} style={{ width: '100px', height: '100px' }} />
                        ) : (
                            <img
                                src={data.image}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: `drop-shadow(0 0 15px ${rarity.border})`,
                                }}
                                alt={data.name}
                            />
                        )}
                    </motion.div>
                </div>

                {/* Item Name */}
                <div
                    style={{
                        color: '#fff',
                        fontSize: '20px',
                        fontWeight: 950,
                        fontFamily: "'Cinzel', serif",
                        textAlign: 'center',
                        textTransform: 'uppercase',
                    }}
                >
                    {data.name}
                </div>

                {/* Stats Container */}
                <div
                    style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                    }}
                >
                    {data.attackBonus && renderStatImprovement('СИЛА АТАКИ', data.attackBonus, '⚔️', '#f97316')}
                    {data.defenseBonus && renderStatImprovement('ЗАЩИТА', data.defenseBonus, '🛡️', '#3b82f6')}
                    {data.hpBonus && renderStatImprovement('ЗДОРОВЬЕ', data.hpBonus, '❤️', '#ef4444')}
                    {(data.critChance || data.critBonus) &&
                        renderStatImprovement(
                            'КРИТ. ШАНС',
                            Math.round((data.critChance || data.critBonus) * 100),
                            '🎯',
                            '#a855f7',
                        )}
                    {(data.attackSpeed || data.speedBonus) &&
                        renderSpeedImprovement('СКОРОСТЬ', data.attackSpeed || data.speedBonus, '⚡', '#fcd34d')}
                </div>

                {/* Power difference */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: 900,
                        color: '#f0c040',
                        fontFamily: "'Cinzel', serif",
                    }}
                >
                    <span>МОЩЬ:</span>
                    {isUpgrade ? (
                        <>
                            <span style={{ color: 'rgba(240,192,64,0.5)', textDecoration: 'line-through' }}>
                                {prevPower}
                            </span>
                            <span style={{ color: '#10b981' }}>➔</span>
                            <span>{newPower}</span>
                        </>
                    ) : (
                        <span>{newPower}</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(10, 7, 5, 0.92)',
                backdropFilter: 'blur(12px)',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Вращающиеся золотые лучи */}
            <motion.div
                style={{
                    position: 'absolute',
                    width: '900px',
                    height: '900px',
                    background:
                        'repeating-conic-gradient(from 0deg, rgba(240, 192, 64, 0.12) 0deg 15deg, transparent 15deg 30deg)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
            />

            {/* Дополнительные лучи в обратную сторону */}
            <motion.div
                style={{
                    position: 'absolute',
                    width: '800px',
                    height: '800px',
                    background:
                        'repeating-conic-gradient(from 0deg, rgba(168, 85, 247, 0.08) 0deg 20deg, transparent 20deg 40deg)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            />

            {/* Стадия 1: Сундук трясется и готовится открыться */}
            {!showRewardCard && (
                <motion.div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        position: 'relative',
                    }}
                    animate={{
                        scale: [1, 1.05, 1.02, 1.1, 1.05, 1.2, 1.1, 1.3, 1.15, 1.4, 0.8, 0],
                        rotate: [0, -4, 4, -6, 6, -10, 10, -12, 12, -15, 15, 0],
                    }}
                    transition={{
                        duration: 1.5,
                        ease: 'easeInOut',
                    }}
                >
                    {/* Свечение за сундуком */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            width: '250px',
                            height: '250px',
                            borderRadius: '50%',
                            background:
                                'radial-gradient(circle, rgba(240,192,64,0.5) 0%, rgba(168,85,247,0.2) 55%, transparent 70%)',
                            zIndex: -1,
                            filter: 'blur(10px)',
                        }}
                        animate={{
                            scale: [1, 1.3, 1.1, 1.6, 1.2, 2.0, 1.4, 2.5, 0],
                        }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                    <img
                        src={AssetsMap.UI.ICON_SEASON_CHEST}
                        style={{
                            width: '200px',
                            height: '200px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 30px rgba(240, 192, 64, 0.6))',
                        }}
                        alt="Сезонный Сундук"
                    />
                    <h2
                        style={{
                            marginTop: '25px',
                            color: '#f0c040',
                            fontSize: '22px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '4px',
                            textShadow: '0 0 15px rgba(240, 192, 64, 0.6)',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                        }}
                    >
                        Открытие сундука...
                    </h2>
                </motion.div>
            )}

            {/* Световая вспышка (Flashbang) */}
            {showFlash && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#ffffff',
                        zIndex: 100000,
                        pointerEvents: 'none',
                        opacity: 1,
                    }}
                />
            )}

            {/* Стадия 2: Презентация награды */}
            {showRewardCard && openingResult && (
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    style={{
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                        maxWidth: '400px',
                        width: '90%',
                    }}
                >
                    {/* Заголовок награды */}
                    <div style={{ textAlign: 'center' }}>
                        <motion.h1
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                color:
                                    openingResult.type === 'GOLD'
                                        ? '#f0c040'
                                        : openingResult.type === 'UPGRADE'
                                          ? '#10b981'
                                          : RARITY_COLORS[openingResult.item?.rarity || 'COMMON']?.color || '#fff',
                                fontSize: '28px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '3px',
                                textShadow: '0 0 20px rgba(0,0,0,0.8)',
                                margin: '0 0 8px 0',
                                textTransform: 'uppercase',
                            }}
                        >
                            {openingResult.type === 'GOLD' && 'Золотая компенсация'}
                            {openingResult.type === 'UPGRADE' && 'Улучшение снаряжения'}
                            {openingResult.type === 'NEW' && 'Новая экипировка'}
                        </motion.h1>
                        <p
                            style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '12px',
                                margin: 0,
                                lineHeight: 1.4,
                            }}
                        >
                            {openingResult.type === 'GOLD' &&
                                'Все предметы арсенала улучшены до максимума! Вы получили компенсацию.'}
                            {openingResult.type === 'UPGRADE' &&
                                'Все доступные предметы разблокированы! Повышен уровень одной из вещей.'}
                            {openingResult.type === 'NEW' && 'Вы получили новый уникальный предмет из магазина!'}
                        </p>
                    </div>

                    {/* Карточка */}
                    {renderRewardCard(openingResult)}

                    {/* Кнопка Забрать */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            onClose();
                        }}
                        style={{
                            marginTop: '10px',
                            background: 'linear-gradient(135deg, #f0c040 0%, #b8860b 100%)',
                            border: '2px solid #fff',
                            color: '#000',
                            padding: '12px 40px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 900,
                            letterSpacing: '2px',
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif",
                            boxShadow: '0 0 20px rgba(240,192,64,0.4), 0 10px 20px rgba(0,0,0,0.5)',
                        }}
                    >
                        ЗАБРАТЬ
                    </motion.button>
                </motion.div>
            )}
        </div>
    );
};
