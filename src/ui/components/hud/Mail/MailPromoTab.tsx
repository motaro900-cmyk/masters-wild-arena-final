import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';

const colors = {
    text: '#e8d8a8',
    accent: '#f0c040',
    card: 'rgba(255,255,255,0.03)',
    border: 'rgba(240,192,64,0.15)',
    danger: '#ef4444',
    success: '#22c55e',
    input: 'rgba(0,0,0,0.3)',
};

interface MailPromoTabProps {
    isMobile: boolean;
    activeTab: 'PROMO';
    setActiveTab: (tab: 'INBOX' | 'NEWS' | 'ARCHIVE' | 'SUPPORT' | 'PROMO') => void;
    promoInput: string;
    setPromoInput: (val: string) => void;
    promoStatus: { msg: string; type: 'SUCCESS' | 'ERROR' | 'IDLE' };
    handleRedeem: () => void;
    TABS: readonly string[];
}

export const MailPromoTab: React.FC<MailPromoTabProps> = ({
    isMobile,
    activeTab,
    setActiveTab,
    promoInput,
    setPromoInput,
    promoStatus,
    handleRedeem,
    TABS,
}) => {
    return (
        <motion.div
            key="promo"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            drag={isMobile ? "x" : undefined}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
                if (!isMobile) return;
                const swipeThreshold = 50;
                const currentIndex = TABS.indexOf(activeTab);
                if (info.offset.x < -swipeThreshold) {
                    if (currentIndex < TABS.length - 1) {
                        setActiveTab(TABS[currentIndex + 1] as any);
                    }
                } else if (info.offset.x > swipeThreshold) {
                    if (currentIndex > 0) {
                        setActiveTab(TABS[currentIndex - 1] as any);
                    }
                }
            }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '30px',
                padding: '60px 20px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '20px',
                border: `1px solid ${colors.border}`,
                touchAction: isMobile ? 'pan-y' : 'auto',
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 70, height: 70, margin: '0 auto 10px auto' }}>
                    <img
                        src={AssetsMap.UI.ICON_PROMO}
                        alt="promo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'contrast(1.15) brightness(1.1) drop-shadow(0 0 15px rgba(240,192,64,0.3))',
                        }}
                    />
                </div>
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '24px',
                        color: colors.accent,
                        marginBottom: '10px',
                        letterSpacing: '2px',
                    }}
                >
                    АКТИВАЦИЯ КОДА
                </h3>
                <p style={{ fontSize: '13px', opacity: 0.6, maxWidth: '350px' }}>
                    Введите секретный шифр, чтобы получить ценные дары от Духов Леса.
                </p>
            </div>

            <div
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                }}
            >
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="ПРОМОКОД"
                        style={{
                            width: '100%',
                            padding: '18px 25px',
                            background: 'rgba(0,0,0,0.4)',
                            border: `2px solid ${promoStatus.type === 'ERROR' ? colors.danger : promoStatus.type === 'SUCCESS' ? colors.success : colors.border}`,
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 900,
                            textAlign: 'center',
                            letterSpacing: '4px',
                            outline: 'none',
                            transition: '0.3s',
                        }}
                    />
                    <AnimatePresence>
                        {promoStatus.msg && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute',
                                    bottom: '-25px',
                                    left: 0,
                                    width: '100%',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    color:
                                        promoStatus.type === 'SUCCESS'
                                            ? colors.success
                                            : colors.danger,
                                }}
                            >
                                {promoStatus.msg}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleRedeem}
                    style={{
                        padding: '18px',
                        background: 'linear-gradient(180deg, #f0c040, #c87820)',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 900,
                        color: '#1a1008',
                        cursor: 'pointer',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '16px',
                        boxShadow: '0 6px 20px rgba(200, 120, 32, 0.4)',
                        marginTop: '10px',
                    }}
                >
                    АКТИВИРОВАТЬ
                </button>
            </div>

            <div style={{ fontSize: '11px', opacity: 0.4, fontStyle: 'italic' }}>
                Следите за новостями в группе, чтобы не пропустить новые коды!
            </div>
        </motion.div>
    );
};
export default MailPromoTab;
