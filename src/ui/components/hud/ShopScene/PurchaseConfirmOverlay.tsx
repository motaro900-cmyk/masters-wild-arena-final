import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShopItem } from '../../../../configs/ShopConfig';
import { getRarityColor } from './shopHelpers';
import { useGameStore } from '../../../../store/useGameStore';

const getVotesPlural = (n: number) => {
    const abs = Math.abs(n) % 100;
    const r = abs % 10;
    if (abs >= 11 && abs <= 19) return 'голосов';
    if (r === 1) return 'голос';
    if (r >= 2 && r <= 4) return 'голоса';
    return 'голосов';
};

interface PurchaseConfirmOverlayProps {
    item: ShopItem;
    dailyAdWatchesCount: number;
    onCancel: () => void;
    onConfirm: (currency: 'gold' | 'gem' | 'votes' | 'ad') => void | Promise<void>;
}

export const PurchaseConfirmOverlay: React.FC<PurchaseConfirmOverlayProps> = ({
    item,
    dailyAdWatchesCount,
    onCancel,
    onConfirm,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const rarityColor = getRarityColor(item.rarity);
    const [imageLoaded, setImageLoaded] = useState(false);
    const isMobile = useGameStore((state) => state.isMobile);

    React.useEffect(() => {
        setImageLoaded(false);
    }, [item.id, item.image]);

    const handleConfirm = async (currency: 'gold' | 'gem' | 'votes' | 'ad') => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            await onConfirm(currency);
        } catch (err) {
            setIsProcessing(false);
            throw err;
        }
    };
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 3000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 'min(600px, 92vw)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: 'rgba(20,18,18,0.98)',
                    borderRadius: '24px',
                    border: `2.5px solid ${rarityColor}`,
                    boxShadow: `0 0 50px ${rarityColor}33, inset 0 0 30px rgba(0,0,0,0.8)`,
                    padding: isMobile ? '24px 16px' : '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: isMobile ? '12px' : '20px',
                }}
            >
                <span
                    style={{
                        fontSize: '11px',
                        color: rarityColor,
                        fontWeight: 900,
                        letterSpacing: '2px',
                        fontFamily: "'Cinzel', serif",
                    }}
                >
                    ПОДТВЕРЖДЕНИЕ ПОКУПКИ
                </span>
                <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                    {item.spriteClass ? (
                        <div
                            className={item.spriteClass}
                            style={{
                                width: '120px',
                                height: '120px',
                                filter: `drop-shadow(0 0 10px ${rarityColor})`,
                            }}
                        />
                    ) : (
                        <>
                            {!imageLoaded && <div className="skeleton-placeholder" />}
                            <img
                                src={item.image}
                                onLoad={() => setImageLoaded(true)}
                                onError={(e) => {
                                    const currentSrc = e.currentTarget.src;
                                    if (currentSrc.endsWith('.webp')) {
                                        e.currentTarget.src = currentSrc.replace(/_mobile\.webp$/i, '.png').replace(/\.webp$/i, '.png');
                                    }
                                }}
                                className={`image-fade-in ${imageLoaded ? 'loaded' : ''}`}
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    objectFit: 'contain',
                                    filter: `drop-shadow(0 0 10px ${rarityColor})`,
                                }}
                                alt=""
                            />
                        </>
                    )}
                </div>
                <h3
                    style={{
                        margin: 0,
                        color: '#fff',
                        fontFamily: "'Cinzel', 'Philosopher', serif",
                        fontSize: '24px',
                    }}
                >
                    {item.name}
                </h3>
                <p
                    style={{
                        color: 'rgba(255,255,255,0.6)',
                        textAlign: 'center',
                        fontSize: '14px',
                        margin: '0 0 10px 0',
                        lineHeight: '1.4',
                    }}
                >
                    {item.id === 'starter_pack'
                        ? 'Вы уверены, что хотите приобрести Стартовый Пакет? 200 алмазов и 3 дня VIP будут немедленно активированы.'
                        : item.subTab === 'ENERGY'
                          ? 'Вы уверены, что хотите приобрести этот предмет? Энергия будет немедленно добавлена к вашему запасу (может превысить максимум).'
                          : item.subTab === 'GEMS'
                            ? 'Вы уверены, что хотите приобрести этот предмет? Алмазы будут немедленно добавлены на ваш счет.'
                            : item.subTab === 'GOLD'
                              ? 'Вы уверены, что хотите приобрести этот предмет? Золото будет немедленно добавлено на ваш счет.'
                              : item.mainTab === 'SKINS'
                                ? 'Вы уверены, что хотите приобрести этот облик? Он станет доступен в меню кастомизации героя.'
                                : item.mainTab === 'ALCHEMY'
                                  ? 'Вы уверены, что хотите приобрести этот предмет? Он будет немедленно добавлен в ваш инвентарь.'
                                  : 'Вы уверены, что хотите приобрести этот предмет? Характеристики будут немедленно добавлены к вашей силе.'}
                </p>

                <div style={{ display: 'flex', gap: isMobile ? '10px' : '20px', width: '100%', marginTop: '10px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            height: '50px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        ОТМЕНА
                    </button>

                    {item.priceGold !== undefined && (
                        <button
                            onClick={() => handleConfirm('gold')}
                            disabled={isProcessing}
                            style={{
                                flex: 1.5,
                                height: '50px',
                                background: isProcessing
                                    ? 'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)'
                                    : 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: isProcessing ? '#9ca3af' : '#1a0f00',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: isProcessing ? 0.6 : 1,
                            }}
                        >
                            {isProcessing ? '...' : 'КУПИТЬ'}
                        </button>
                    )}

                    {item.priceGem !== undefined && (
                        <button
                            onClick={() => handleConfirm('gem')}
                            disabled={isProcessing}
                            style={{
                                flex: 1.5,
                                height: '50px',
                                background: isProcessing
                                    ? 'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)'
                                    : 'linear-gradient(180deg, #00ffff 0%, #008888 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: isProcessing ? '#9ca3af' : '#000',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: isProcessing ? 0.6 : 1,
                            }}
                        >
                            {isProcessing ? '...' : 'КУПИТЬ'}
                        </button>
                    )}

                    {item.priceVotes !== undefined && (
                        <button
                            onClick={() => handleConfirm('votes')}
                            disabled={isProcessing}
                            style={{
                                flex: 1.5,
                                height: '58px',
                                background: isProcessing
                                    ? 'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)'
                                    : 'linear-gradient(180deg, #2787f5 0%, #1263c7 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: isProcessing ? '#9ca3af' : '#fff',
                                fontWeight: 900,
                                fontSize: isMobile ? '13px' : '15px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                opacity: isProcessing ? 0.6 : 1,
                                boxShadow: isProcessing ? 'none' : '0 4px 15px rgba(39,135,245,0.4)',
                                transition: 'all 0.2s',
                                letterSpacing: '0.05em',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {isProcessing ? (
                                <span style={{ fontSize: '22px', animation: 'spin 1s linear infinite' }}>⏳</span>
                            ) : (
                                <>
                                    <span style={{ fontSize: isMobile ? '11px' : '12px', opacity: 0.85, letterSpacing: '0.1em' }}>
                                        ОПЛАТИТЬ ЧЕРЕЗ VK
                                    </span>
                                    <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900 }}>
                                        💙 {item.priceVotes} {getVotesPlural(item.priceVotes)}
                                    </span>
                                </>
                            )}
                        </button>
                    )}

                    {item.isAd && (
                        <button
                            onClick={() => handleConfirm('ad')}
                            disabled={isProcessing || dailyAdWatchesCount >= 2}
                            style={{
                                flex: 1.5,
                                height: '50px',
                                background: isProcessing || dailyAdWatchesCount >= 2
                                    ? 'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)'
                                    : 'linear-gradient(180deg, #4ade80 0%, #166534 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: isProcessing || dailyAdWatchesCount >= 2 ? '#9ca3af' : '#fff',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: isProcessing || dailyAdWatchesCount >= 2 ? 'not-allowed' : 'pointer',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: isProcessing || dailyAdWatchesCount >= 2 ? 0.6 : 1,
                            }}
                        >
                            {isProcessing ? '...' : 'СМОТРЕТЬ РЕКЛАМУ'}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
