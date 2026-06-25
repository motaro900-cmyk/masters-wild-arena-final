import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface PetFoodSelectorProps {
    gold: number;
    crystals: number;
    onFeedItem: (type: 'meat' | 'berry' | 'crystal') => void;
    onBack: () => void;
    disabled?: boolean;
}

export const PetFoodSelector: React.FC<PetFoodSelectorProps> = ({ gold, crystals, onFeedItem, onBack, disabled }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                background: 'rgba(10, 8, 6, 0.75)',
                padding: '20px',
                borderRadius: '20px',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
            }}
        >
            {/* Header with Balances */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                    style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        color: '#a7f3d0',
                        letterSpacing: '1px',
                    }}
                >
                    ВЫБЕРИТЕ КОРМ:
                </span>
                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '13px',
                        fontWeight: 800,
                        alignItems: 'center',
                    }}
                >
                    <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <img
                            src="/assets/images/ui/icons/Gold.webp"
                            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                            alt="gold"
                        />
                        {gold.toLocaleString()}
                    </span>
                    <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <img
                            src="/assets/images/ui/icons/almaz.webp"
                            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                            alt="crystal"
                        />
                        {crystals.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Row of 3 Food Options */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {/* Meat Option */}
                <motion.div
                    whileHover={disabled ? {} : { scale: 1.04, borderColor: '#10b981' }}
                    onClick={disabled ? undefined : () => onFeedItem('meat')}
                    style={{
                        flex: 1,
                        background: 'rgba(20, 15, 12, 0.85)',
                        border: '2px solid rgba(196, 139, 59, 0.2)',
                        borderRadius: '16px',
                        padding: '10px 4px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.45 : 1,
                        pointerEvents: disabled ? 'none' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        textAlign: 'center',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>🥩</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Мясо</span>
                    <span style={{ fontSize: '10px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        +30 🍗 +15 ❤️ | +12
                        <img src={AssetsMap.UI.ICON_XP} style={{ width: '10px', height: '10px', objectFit: 'contain' }} alt="xp" />
                    </span>
                    <div
                        style={{
                            fontSize: '11px',
                            fontWeight: 900,
                            color: '#fbbf24',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                        }}
                    >
                        1 500{' '}
                        <img
                            src="/assets/images/ui/icons/Gold.webp"
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                            alt="g"
                        />
                    </div>
                </motion.div>

                {/* Berry Option */}
                <motion.div
                    whileHover={disabled ? {} : { scale: 1.04, borderColor: '#10b981' }}
                    onClick={disabled ? undefined : () => onFeedItem('berry')}
                    style={{
                        flex: 1,
                        background: 'rgba(20, 15, 12, 0.85)',
                        border: '2px solid rgba(196, 139, 59, 0.2)',
                        borderRadius: '16px',
                        padding: '10px 4px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.45 : 1,
                        pointerEvents: disabled ? 'none' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        textAlign: 'center',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>🫐</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Черника</span>
                    <span style={{ fontSize: '10px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        +40 🍗 +25 ❤️ | +22
                        <img src={AssetsMap.UI.ICON_XP} style={{ width: '10px', height: '10px', objectFit: 'contain' }} alt="xp" />
                    </span>
                    <div
                        style={{
                            fontSize: '11px',
                            fontWeight: 900,
                            color: '#fbbf24',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                        }}
                    >
                        2 500{' '}
                        <img
                            src="/assets/images/ui/icons/Gold.webp"
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                            alt="g"
                        />
                    </div>
                </motion.div>

                {/* Phoenix Feast Option */}
                <motion.div
                    whileHover={disabled ? {} : { scale: 1.04, borderColor: '#f97316' }}
                    onClick={disabled ? undefined : () => onFeedItem('crystal')}
                    style={{
                        flex: 1,
                        background: 'linear-gradient(160deg, rgba(30, 15, 5, 0.9) 0%, rgba(50, 20, 5, 0.85) 100%)',
                        border: '2px solid rgba(251, 146, 60, 0.4)',
                        borderRadius: '16px',
                        padding: '10px 4px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.45 : 1,
                        pointerEvents: disabled ? 'none' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        textAlign: 'center',
                        boxShadow: '0 0 12px rgba(251,146,60,0.15)',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>🥘</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fed7aa' }}>Жаркое Феникса</span>
                    <span style={{ fontSize: '10px', color: '#fdba74', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        +65 🍗 +55 ❤️ | +40
                        <img src={AssetsMap.UI.ICON_XP} style={{ width: '10px', height: '10px', objectFit: 'contain' }} alt="xp" />
                    </span>
                    <div
                        style={{
                            fontSize: '11px',
                            fontWeight: 900,
                            color: '#fb923c',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                        }}
                    >
                        20{' '}
                        <img
                            src="/assets/images/ui/icons/almaz.webp"
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                            alt="gem"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Back text */}
            <button
                onClick={onBack}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    textDecoration: 'underline',
                }}
            >
                Вернуться к действиям
            </button>
        </motion.div>
    );
};
