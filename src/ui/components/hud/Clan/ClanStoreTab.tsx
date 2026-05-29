import React from 'react';
import { motion } from 'framer-motion';
import { SHOP_ITEMS, CurrencyIcon, ShopItem } from './ClanShared';

interface ClanStoreTabProps {
    colors: any;
    onBuyItem: (item: ShopItem) => void;
}

export const ClanStoreTab: React.FC<ClanStoreTabProps> = ({ colors, onBuyItem }) => {
    return (
        <motion.div
            key="store"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '15px',
                overflowY: 'auto',
                paddingRight: '10px',
            }}
        >
            {SHOP_ITEMS.map((item) => (
                <div
                    key={item.id}
                    style={{
                        background: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '15px',
                        padding: '20px',
                        display: 'flex',
                        gap: '20px',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '60px',
                            height: '60px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                        }}
                    >
                        {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: colors.accent }}>{item.name}</div>
                        <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>{item.description}</div>
                        <button
                            onClick={() => onBuyItem(item)}
                            style={{
                                marginTop: '10px',
                                padding: '6px 15px',
                                background: colors.accent,
                                color: '#000',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            {item.price} <CurrencyIcon type="GOLD" size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </motion.div>
    );
};
