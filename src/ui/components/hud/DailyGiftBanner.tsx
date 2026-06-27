import React, { useEffect } from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';
import { useGameStore } from '../../../store/useGameStore';

/**
 * DailyGiftBanner (v4.6) — Проверяет доступность подарка.
 */
export const DailyGiftBanner: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const canClaim = useGameStore((state) => state.canClaimDailyGift);
    const setCanClaim = useGameStore((state) => state.setCanClaimDailyGift);
    const lastDailyGiftClaimedTime = useGameStore((state) => state.lastDailyGiftClaimedTime);
    const lastWheelSpinTime = useGameStore((state) => state.lastWheelSpinTime);

    useEffect(() => {
        const checkStatus = () => {
            const store = useGameStore.getState();
            const now = Date.now();

            // 1. Calendar check
            let calendarAvailable = true;
            if (store.lastDailyGiftClaimedTime) {
                const lastClaimDate = new Date(store.lastDailyGiftClaimedTime);
                const nowDate = new Date(now);
                const isSameDay =
                    nowDate.getDate() === lastClaimDate.getDate() &&
                    nowDate.getMonth() === lastClaimDate.getMonth() &&
                    nowDate.getFullYear() === lastClaimDate.getFullYear();
                calendarAvailable = !isSameDay;
            }

            // 2. Wheel check
            let wheelAvailable = true;
            if (store.lastWheelSpinTime) {
                const diffMs = now - store.lastWheelSpinTime;
                wheelAvailable = diffMs >= 24 * 3600 * 1000;
            }

            const eitherAvailable = calendarAvailable || wheelAvailable;
            setCanClaim(eitherAvailable);
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, [setCanClaim, lastDailyGiftClaimedTime, lastWheelSpinTime]);

    return (
        <div
            onClick={onClick}
            style={{
                backgroundImage: `url(${AssetsMap.UI.ICON_GIFT})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                width: 420,
                height: 105,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 115,
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
                        fontSize: 21,
                        fontWeight: 900,
                        color: '#f0c040',
                        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                        lineHeight: '1.1',
                        whiteSpace: 'nowrap',
                    }}
                >
                    ЕЖЕДНЕВНЫЕ
                    <br />
                    НАГРАДЫ
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
