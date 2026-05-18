import React, { useEffect } from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';
import { useGameStore } from '../../../store/useGameStore';
import { safeGetItem } from '../../../utils/SafeStorage';

/**
 * DailyGiftBanner (v4.6) — Проверяет доступность подарка.
 */
export const DailyGiftBanner: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const canClaim = useGameStore((state) => state.canClaimDailyGift);
    const setCanClaim = useGameStore((state) => state.setCanClaimDailyGift);

    useEffect(() => {
        const checkStatus = () => {
            const lastClaim = safeGetItem('lastGiftClaim');
            if (!lastClaim) {
                setCanClaim(true);
                return;
            }

            const now = new Date();
            const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
            const mskNow = new Date(utcNow + 3 * 3600000);

            const lastClaimDate = new Date(parseInt(lastClaim));
            const utcLast = lastClaimDate.getTime() + lastClaimDate.getTimezoneOffset() * 60000;
            const mskLast = new Date(utcLast + 3 * 3600000);

            const isSameDay =
                mskNow.getDate() === mskLast.getDate() &&
                mskNow.getMonth() === mskLast.getMonth() &&
                mskNow.getFullYear() === mskLast.getFullYear();

            setCanClaim(!isSameDay);
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, [setCanClaim]);

    return (
        <div
            onClick={onClick}
            style={{
                backgroundImage: `url(${AssetsMap.UI.ICON_GIFT})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                width: 360,
                height: 90,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 70,
                pointerEvents: 'auto',
                transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                <span
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#f0c040',
                        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                        lineHeight: '1.1',
                        whiteSpace: 'nowrap',
                    }}
                >
                    ЕЖЕДНЕВНЫЙ
                    <br />
                    ПОДАРОК
                </span>
            </div>

            {/* Красный индикатор */}
            {canClaim && (
                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 16,
                        width: 24,
                        height: 24,
                        background: 'radial-gradient(circle, #f03030, #a01010)',
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 14,
                        fontWeight: 900,
                        color: 'white',
                        boxShadow: '0 0 10px rgba(240,48,48,0.5)',
                    }}
                >
                    !
                </div>
            )}
        </div>
    );
};
