import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { audioService } from '../../../../services/AudioService';
import { RewardItem, getRewardImage } from './BattlePassShared';

interface RewardCardProps {
    item: RewardItem;
    isPremiumCard?: boolean;
    isUnlocked: boolean;
    isClaimed: boolean;
    onClaim: () => void;
    onPreview: (item: RewardItem) => void;
    isMilestone?: boolean;
}

const getTypeNameRu = (type: string) => {
    switch (type) {
        case 'WEAPON':
            return 'ОРУЖИЕ';
        case 'GEMS':
        case 'GOLD':
            return 'ВАЛЮТА';
        case 'CHEST':
            return 'СУНДУК';
        case 'ITEM':
            return 'ПРЕДМЕТ';
        case 'SKIN':
            return 'ОБЛИК';
        case 'FRAME':
            return 'РАМКА';
        case 'AVATAR':
            return 'АВАТАР';
        case 'TITLE':
            return 'ТИТУЛ';
        case 'ENERGY':
            return 'ЭНЕРГИЯ';
        default:
            return type;
    }
};

export const RewardCard: React.FC<RewardCardProps> = ({
    item,
    isPremiumCard,
    isUnlocked,
    isClaimed,
    onClaim,
    onPreview,
    isMilestone,
}) => {
    const imgUrl = getRewardImage(item);

    return (
        <motion.div
            onClick={() => {
                onPreview(item);
                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
            }}
            whileHover={
                isUnlocked && !isClaimed
                    ? {
                          y: -6,
                          scale: 1.03,
                          boxShadow: isPremiumCard
                              ? '0 12px 30px rgba(255,215,0,0.3)'
                              : '0 12px 25px rgba(240,192,64,0.2)',
                      }
                    : { scale: 1.01 }
            }
            style={{
                width: isMilestone ? '250px' : '200px',
                height: '240px',
                background: isPremiumCard
                    ? isUnlocked
                        ? 'radial-gradient(circle at center, #3a1515 0%, #150505 100%)'
                        : 'radial-gradient(circle at center, #220b0b 0%, #0d0202 100%)'
                    : isUnlocked
                      ? 'radial-gradient(circle at center, #2e1c11 0%, #140c07 100%)'
                      : 'radial-gradient(circle at center, #1c110a 0%, #0c0704 100%)',
                borderRadius: '12px',
                border: isMilestone
                    ? `3px solid ${isPremiumCard ? '#ffd700' : '#c8a870'}`
                    : `2px solid ${isUnlocked ? (isPremiumCard ? '#ffd700' : '#f0c040') : isPremiumCard ? '#991b1b' : '#3d2314'}`,
                boxShadow:
                    isUnlocked && !isClaimed
                        ? isPremiumCard
                            ? '0 0 15px rgba(255,215,0,0.15)'
                            : '0 0 12px rgba(240,192,64,0.1)'
                        : 'none',
                padding: '20px 15px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                cursor: isUnlocked && !isClaimed ? 'pointer' : 'default',
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
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
                    {getTypeNameRu(item.type)}
                </div>
            </div>

            <div
                style={{
                    width: isMilestone ? '130px' : '110px',
                    height: isMilestone ? '130px' : '110px',
                    filter: isUnlocked
                        ? 'drop-shadow(0 5px 15px rgba(0,0,0,0.6))'
                        : 'drop-shadow(0 5px 15px rgba(0,0,0,0.3)) brightness(0.65)',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    position: 'relative',
                }}
            >
                {isMilestone && isUnlocked && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                        style={{
                            position: 'absolute',
                            width: '150px',
                            height: '150px',
                            background: `radial-gradient(circle, ${isPremiumCard ? 'rgba(255,215,0,0.22)' : 'rgba(240,192,64,0.15)'} 0%, transparent 70%)`,
                            zIndex: 0,
                            pointerEvents: 'none',
                        }}
                    />
                )}
                {imgUrl ? (
                    <img
                        src={imgUrl}
                        alt={item.name}
                        style={{
                            width: item.type === 'GOLD' || item.type === 'GEMS' || item.type === 'ENERGY' ? '45%' : '100%',
                            height: item.type === 'GOLD' || item.type === 'GEMS' || item.type === 'ENERGY' ? '45%' : '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
                        }}
                    />
                ) : item.icon.startsWith('sprite-') ? (
                    <div
                        className={item.icon}
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                ) : (
                    <span style={{ fontSize: isMilestone ? '100px' : '80px' }}>{item.icon}</span>
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
                <div
                    style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                        border: '2.5px solid #ffffff',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 12px rgba(34,197,94,0.6)',
                        zIndex: 10,
                        textShadow: 'none',
                    }}
                >
                    ✓
                </div>
            )}

            {!isUnlocked && !isClaimed && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 8,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, #2a1b14 0%, #150f0c 100%)',
                        border: '1.5px solid #b8860b',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.8), inset 0 0 4px rgba(255,255,255,0.1)',
                    }}
                >
                    <span style={{ fontSize: '13px', lineHeight: 1, marginTop: '-2px' }}>🔒</span>
                </div>
            )}
        </motion.div>
    );
};
