import React from 'react';
import { motion } from 'framer-motion';
import { SKINS_DB } from '../../../../configs/SkinsConfig';
import { ITEMS_DATABASE } from '../../../../game/configs/ItemsConfig';

import { getRewardImage } from './BattlePassShared';

export const RewardPreviewModal: React.FC<{ item: any; onClose: () => void }> = ({ item, onClose }) => {
    if (!item) return null;

    let typeText = 'ПРЕДМЕТ';
    let description = 'Неизвестная награда.';

    const skinConfig = item.type === 'SKIN' ? SKINS_DB.find((s) => s.id === item.id) : null;

    let mappedItemId = item.id;
    if (item.id === 'potion_strength') mappedItemId = 'hp_potion_3';
    else if (item.id === 'potion_strength_great') mappedItemId = 'hp_potion_3';
    else if (item.id === 'potion_healing') mappedItemId = 'hp_potion_1';
    else if (item.id === 'potion_defense') mappedItemId = 'hp_potion_2';

    const dbItem = ITEMS_DATABASE[mappedItemId];

    if (item.type === 'WEAPON') {
        typeText = 'ОРУЖИЕ';
        description =
            dbItem?.desc ||
            'Эксклюзивное и могущественное снаряжение. Сразу же экипируется на ваших героев для увеличения их боевой мощи в бою.';
    } else if (item.type === 'SKIN') {
        typeText = 'ОБЛИК';
        description =
            skinConfig?.description ||
            'Уникальный косметический облик. Выделитесь на поле боя среди соперников и союзников с новым стилем.';
    } else if (item.type === 'CHEST') {
        typeText = 'СУНДУК';
        description =
            'Содержит ценную экипировку и свитки. Можно открыть в инвентаре для получения случайного снаряжения.';
    } else if (item.type === 'GOLD') {
        typeText = 'ЗОЛОТО';
        description =
            'Основная валюта. Используется для прокачки способностей героев, улучшения экипировки и покупки товаров в лавке.';
    } else if (item.type === 'GEMS') {
        typeText = 'АЛМАЗЫ';
        description =
            'Премиальная валюта. Позволяет приобретать редчайших героев, открывать золотые сундуки и разблокировать Премиум Боевой Пропуск.';
    } else if (item.type === 'ITEM') {
        typeText = 'ПРЕДМЕТ / ЗЕЛЬЕ';
        description =
            dbItem?.desc ||
            'Полезный расходный материал для усиления характеристик персонажей или создания ценных артефактов.';
    }

    const imgUrl = getRewardImage(item);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(15px)',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '450px',
                    background: 'radial-gradient(circle at center, #2e1c11 0%, #150f0c 100%)',
                    borderRadius: '16px',
                    border: '3px solid #b8860b',
                    padding: '35px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 30px rgba(184,134,11,0.2)',
                }}
            >
                <div>
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 900,
                            color: '#f0c040',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                        }}
                    >
                        ДЕТАЛИ НАГРАДЫ
                    </span>
                    <h3
                        style={{
                            fontSize: '28px',
                            color: '#fff',
                            fontFamily: "'Cinzel', serif",
                            margin: '5px 0 0 0',
                            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                        }}
                    >
                        {item.name}
                    </h3>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 900,
                            color: 'rgba(255,255,255,0.4)',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1px',
                        }}
                    >
                        [{typeText}]
                    </span>
                </div>

                {/* РЕНДЕР ИКОНКИ / ЭМОДЗИ / ИЗОБРАЖЕНИЯ */}
                <div
                    style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '2px solid rgba(240,192,64,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '60px',
                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.6)',
                        margin: '10px 0',
                    }}
                >
                    {imgUrl ? (
                        <img
                            src={imgUrl}
                            alt={item.name}
                            style={{
                                width: item.type === 'GOLD' || item.type === 'GEMS' ? '65%' : '85%',
                                height: item.type === 'GOLD' || item.type === 'GEMS' ? '65%' : '85%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                            }}
                        />
                    ) : item.icon.startsWith('sprite-') ? (
                        <img
                            src="/assets/images/ui/gift_premium.png"
                            alt="Gift"
                            style={{
                                width: '85%',
                                height: '85%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                            }}
                        />
                    ) : (
                        item.icon
                    )}
                </div>

                <p
                    style={{
                        fontSize: '14px',
                        color: '#c8a870',
                        lineHeight: '1.6',
                        margin: '0 0 10px 0',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                    }}
                >
                    {description}
                </p>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                        padding: '12px 35px',
                        background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
                        border: '2px solid #ffffff',
                        borderRadius: '8px',
                        color: '#1a0d00',
                        fontWeight: 900,
                        fontSize: '14px',
                        fontFamily: "'Cinzel', serif",
                        cursor: 'pointer',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.4)',
                        letterSpacing: '1px',
                    }}
                >
                    ЗАКРЫТЬ
                </motion.button>
            </motion.div>
        </motion.div>
    );
};
