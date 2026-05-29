import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { audioService } from '../../../../services/AudioService';
import { RewardItem } from './BattlePassShared';

interface RewardCardProps {
    item: RewardItem;
    isPremiumCard?: boolean;
    isUnlocked: boolean;
    isClaimed: boolean;
    onClaim: () => void;
    onPreview: (item: RewardItem) => void;
    isMilestone?: boolean;
}

export const RewardCard: React.FC<RewardCardProps> = ({
    item,
    isPremiumCard,
    isUnlocked,
    isClaimed,
    onClaim,
    onPreview,
    isMilestone,
}) => {
    return (
        <motion.div
            onClick={() => {
                onPreview(item);
                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
            }}
            className={isUnlocked && !isClaimed ? 'bp-card-hover' : ''}
            animate={
                isUnlocked && !isClaimed
                    ? {
                          boxShadow: isPremiumCard
                              ? [
                                    '0 0 8px rgba(185,28,28,0.2)',
                                    '0 0 20px rgba(220,38,38,0.5)',
                                    '0 0 8px rgba(185,28,28,0.2)',
                                ]
                              : [
                                    '0 0 8px rgba(240,192,64,0.2)',
                                    '0 0 20px rgba(240,192,64,0.5)',
                                    '0 0 8px rgba(240,192,64,0.2)',
                                ],
                          borderColor: isPremiumCard
                              ? ['#991b1b', '#ffd700', '#991b1b']
                              : ['#5c4033', '#f0c040', '#5c4033'],
                      }
                    : undefined
            }
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{
                width: isMilestone ? '250px' : '200px',
                height: '240px',
                background: isPremiumCard
                    ? isUnlocked
                        ? 'radial-gradient(circle at center, #420d0d 0%, #170404 100%)'
                        : 'radial-gradient(circle at center, #2b0808 0%, #0f0202 100%)'
                    : isUnlocked
                      ? 'radial-gradient(circle at center, #2e1c11 0%, #140c07 100%)'
                      : 'radial-gradient(circle at center, #1c110a 0%, #0c0704 100%)',
                borderRadius: '12px',
                border: isMilestone
                    ? `3px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`
                    : `2px solid ${isPremiumCard ? '#991b1b' : '#5c4033'}`,
                padding: '20px 15px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                cursor: isUnlocked && !isClaimed ? 'pointer' : 'default',
                transition: 'all 0.25s ease',
            }}
        >
            {/* ГИЛЬДИРОВАННЫЕ УГОЛКИ ДЛЯ МИЛЬСТОУН КАРТ */}
            {isMilestone && (
                <>
                    <div
                        style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            width: '10px',
                            height: '10px',
                            borderTop: `2px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`,
                            borderLeft: `2px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`,
                            pointerEvents: 'none',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '10px',
                            height: '10px',
                            borderTop: `2px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`,
                            borderRight: `2px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`,
                            pointerEvents: 'none',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            width: '10px',
                            height: '10px',
                            borderBottom: `2px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`,
                            borderLeft: `2px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`,
                            pointerEvents: 'none',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            width: '10px',
                            height: '10px',
                            borderBottom: `2px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`,
                            borderRight: `2px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`,
                            pointerEvents: 'none',
                        }}
                    />
                </>
            )}

            {/* СВЕЧЕНИЕ/БЛИК ПРИ НАВЕДЕНИИ */}
            {isUnlocked && !isClaimed && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.18) 50%, transparent 55%)',
                        backgroundSize: '250% 250%',
                        transition: 'background-position 0.6s ease',
                        backgroundPosition: '200% 200%',
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}
                    className="bp-shine-effect"
                />
            )}

            <div style={{ textAlign: 'center', zIndex: 1, width: '100%' }}>
                <div
                    style={{
                        fontSize: isMilestone ? '15px' : '13px',
                        fontWeight: 900,
                        color: isPremiumCard ? '#f0c040' : '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: "'Cinzel', serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {item.name}
                </div>
                <div
                    style={{
                        fontSize: '9px',
                        color: isPremiumCard ? '#fca5a5' : '#c8a870',
                        marginTop: '3px',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        fontWeight: 900,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    }}
                >
                    {item.type}
                </div>
            </div>

            <div
                style={{
                    width: isMilestone ? '100px' : '80px',
                    height: isMilestone ? '100px' : '80px',
                    filter: isUnlocked ? 'drop-shadow(0 5px 15px rgba(0,0,0,0.6))' : 'brightness(0.3) blur(2px)',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                }}
            >
                {item.icon.startsWith('sprite-') ? (
                    <div className={item.icon} style={{ width: '100%', height: '100%', backgroundSize: '300% 100%' }} />
                ) : (
                    <span style={{ fontSize: isMilestone ? '80px' : '60px' }}>{item.icon}</span>
                )}
            </div>

            <div style={{ zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <AnimatePresence>
                    {isUnlocked && !isClaimed && (
                        <motion.button
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClaim();
                            }}
                            style={{
                                width: '100%',
                                padding: '8px 0',
                                background: isPremiumCard
                                    ? 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)'
                                    : 'linear-gradient(180deg, #ffffff 0%, #a3a3a3 100%)',
                                border: '1px solid rgba(255,255,255,0.4)',
                                borderRadius: '4px',
                                color: '#1a0d00',
                                fontWeight: 900,
                                fontSize: '12px',
                                fontFamily: "'Cinzel', serif",
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            }}
                        >
                            ЗАБРАТЬ
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {isClaimed && (
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: -12 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(2px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            width: '75px',
                            height: '75px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, #b91c1c 0%, #5b0707 100%)',
                            border: '3px dashed #ef4444',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: '11px',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1px',
                            transform: 'rotate(-5deg)',
                        }}
                    >
                        ПОЛУЧЕНО
                    </div>
                </motion.div>
            )}

            {!isUnlocked && !isClaimed && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'brightness(0.6) contrast(0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 8,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            fontSize: '32px',
                            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.8))',
                            marginBottom: '6px',
                        }}
                    >
                        🔒
                    </div>
                    {isPremiumCard && (
                        <div
                            style={{
                                fontSize: '10px',
                                color: '#f0c040',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                background: '#2e080c',
                                border: '1px solid #f0c040',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                textShadow: '0 1px 2px #000',
                            }}
                        >
                            ПРЕМИУМ
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
