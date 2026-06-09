import React from 'react';
import { motion } from 'framer-motion';
import { ShopItem } from '../../../../configs/ShopConfig';
import { getRarityColor } from './shopHelpers';

interface PurchaseConfirmOverlayProps {
    item: ShopItem;
    dailyAdWatchesCount: number;
    onCancel: () => void;
    onConfirm: (currency: 'gold' | 'gem' | 'votes' | 'ad') => void;
}

export const PurchaseConfirmOverlay: React.FC<PurchaseConfirmOverlayProps> = ({
    item,
    dailyAdWatchesCount,
    onCancel,
    onConfirm,
}) => {
    const rarityColor = getRarityColor(item.rarity);
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
                    width: '600px',
                    background: 'rgba(20,18,18,0.98)',
                    borderRadius: '24px',
                    border: `2.5px solid ${rarityColor}`,
                    boxShadow: `0 0 50px ${rarityColor}33, inset 0 0 30px rgba(0,0,0,0.8)`,
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
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
                        <img
                            src={item.image}
                            style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'contain',
                                filter: `drop-shadow(0 0 10px ${rarityColor})`,
                            }}
                            alt=""
                        />
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

                <div style={{ display: 'flex', gap: '20px', width: '100%', marginTop: '10px' }}>
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
                            onClick={() => onConfirm('gold')}
                            style={{
                                flex: 1.5,
                                height: '50px',
                                background: 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#1a0f00',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            КУПИТЬ
                        </button>
                    )}

                    {item.priceGem !== undefined && (
                        <button
                            onClick={() => onConfirm('gem')}
                            style={{
                                flex: 1.5,
                                height: '50px',
                                background: 'linear-gradient(180deg, #00ffff 0%, #008888 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            КУПИТЬ
                        </button>
                    )}

                    {item.priceVotes !== undefined && (
                        <button
                            onClick={() => onConfirm('votes')}
                            style={{
                                flex: 1.5,
                                height: '50px',
                                background: 'linear-gradient(180deg, #5de2ff 0%, #0066ff 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            КУПИТЬ
                        </button>
                    )}

                    {item.isAd && (
                        <button
                            onClick={() => onConfirm('ad')}
                            disabled={dailyAdWatchesCount >= 2}
                            style={{
                                flex: 1.5,
                                height: '50px',
                                background: 'linear-gradient(180deg, #4ade80 0%, #166534 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            СМОТРЕТЬ РЕКЛАМУ
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
