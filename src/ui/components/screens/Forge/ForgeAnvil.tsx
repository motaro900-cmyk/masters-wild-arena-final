import React from 'react';
import { motion } from 'framer-motion';
import { styles, getStatTheme } from './ForgeStyles';

interface ForgeAnvilProps {
    itemData: any;
    currentLevel: number;
    isUpgrading: boolean;
    sparkPositions: Array<{ x: number; y: number }>;
    itemReforgeMultiplier: number;
    isMaxLevel: boolean;
    getStatsList: () => Array<{ label: string; val: number; icon: string }>;
    getStatMultiplier: (lvl: number) => number;
}

export const ForgeAnvil: React.FC<ForgeAnvilProps> = ({
    itemData,
    currentLevel,
    isUpgrading,
    sparkPositions,
    itemReforgeMultiplier,
    isMaxLevel,
    getStatsList,
    getStatMultiplier,
}) => {
    return (
        <div style={styles.anvilArea}>
            {/* Эффект искр при ковке */}
            {isUpgrading && (
                <div style={styles.glowOverlay}>
                    {sparkPositions.map((spark, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: '50%', y: '50%', scale: 0 }}
                            animate={{
                                x: `${spark.x}%`,
                                y: `${spark.y}%`,
                                scale: [0, 1.5, 0],
                                opacity: [1, 1, 0],
                            }}
                            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.04 }}
                            style={styles.spark}
                        />
                    ))}
                </div>
            )}

            {/* Дорога уровней (L1 -> L10) */}
            {itemData && (
                <div style={styles.levelRoadContainer}>
                    <div style={styles.levelRoadLine} />
                    {currentLevel > 1 && (
                        <div
                            style={{
                                ...styles.levelRoadLine,
                                background: 'linear-gradient(90deg, #60a5fa, #f0c040)',
                                width: `calc(${((currentLevel - 1) / 9) * 100}% - ${((currentLevel - 1) / 9) * 40}px)`,
                                right: 'auto',
                                boxShadow: '0 0 10px rgba(96,165,250,0.6)',
                            }}
                        />
                    )}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
                        const isCurrent = currentLevel === lvl;
                        const isPassed = lvl < currentLevel;
                        const isLocked = lvl > currentLevel;

                        const borderColor = isCurrent ? '#60a5fa' : isPassed ? '#f0c040' : 'rgba(255,255,255,0.2)';
                        const bg = isCurrent
                            ? 'linear-gradient(135deg, #0f172a, #1e293b)'
                            : isPassed
                              ? 'linear-gradient(135deg, #20150a, #3c2410)'
                              : 'rgba(10,8,7,0.85)';

                        const glowBoxShadow = isCurrent
                            ? '0 0 25px rgba(96,165,250,0.85), inset 0 0 10px rgba(96,165,250,0.5)'
                            : isPassed
                              ? '0 0 15px rgba(240,192,64,0.3)'
                              : 'none';

                        const diamondElement = (
                            <div
                                style={{
                                    ...styles.levelDiamond,
                                    border: `2px solid ${borderColor}`,
                                    background: bg,
                                    boxShadow: glowBoxShadow,
                                }}
                            >
                                {isLocked ? (
                                    <div
                                        style={{
                                            transform: 'rotate(-45deg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '13px',
                                            color: '#f0c040',
                                        }}
                                    >
                                        🔒
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            ...styles.levelDiamondText,
                                            color: isCurrent ? '#60a5fa' : '#fff',
                                        }}
                                    >
                                        L{lvl}
                                    </div>
                                )}
                            </div>
                        );

                        return (
                            <div key={lvl} style={styles.levelDotWrapper}>
                                {isCurrent ? (
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.04, 1],
                                            filter: [
                                                'drop-shadow(0 0 2px rgba(96,165,250,0.3))',
                                                'drop-shadow(0 0 8px rgba(96,165,250,0.7))',
                                                'drop-shadow(0 0 2px rgba(96,165,250,0.3))',
                                            ],
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {diamondElement}
                                    </motion.div>
                                ) : (
                                    diamondElement
                                )}
                                <div
                                    style={{
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '10px',
                                    }}
                                >
                                    {isCurrent && <span style={styles.currentIndicatorLabel}>ТЕКУЩИЙ УРОВЕНЬ</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Характеристики на наковальне */}
            {itemData && (
                <div style={styles.statsBadgesRow}>
                    {getStatsList().map((st, i) => {
                        const currentVal = Math.round(st.val * getStatMultiplier(currentLevel) * itemReforgeMultiplier);
                        const nextVal = Math.round(
                            st.val * getStatMultiplier(currentLevel + 1) * itemReforgeMultiplier,
                        );
                        const diff = nextVal - currentVal;
                        const theme = getStatTheme(st.label);

                        return (
                            <div
                                key={i}
                                style={{
                                    ...styles.statBadgeCard,
                                    border: theme.border,
                                    background: theme.bg,
                                    boxShadow: theme.shadow,
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{st.icon}</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ ...styles.statBadgeLabel, color: theme.textColor }}>
                                        {st.label.toUpperCase()}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={styles.statBadgeVal}>+{currentVal}</span>
                                        {!isMaxLevel && <span style={styles.statBadgeDiff}>+{diff}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Подпись снизу */}
            <div style={styles.bottomNote}>
                ℹ️ Каждый уровень улучшает базовые характеристики предмета и открывает новые возможности.
            </div>
        </div>
    );
};
