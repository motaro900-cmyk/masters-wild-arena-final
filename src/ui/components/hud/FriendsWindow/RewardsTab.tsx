import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { showInviteBox } from '../../../../utils/VKBridge';
import { useGameStore } from '../../../../store/useGameStore';

interface RewardsTabProps {
    colors: any;
    claimedSocialRewards: string[] | undefined;
    claimFavoriteReward: (force?: boolean) => void;
    claimGroupReward: (force?: boolean) => void;
}

export const RewardsTab: React.FC<RewardsTabProps> = ({
    colors,
    claimedSocialRewards,
    claimFavoriteReward,
    claimGroupReward,
}) => {
    // Russian grammar helper for friend counts
    const getFriendLabel = (count: number): string => {
        if (count === 1) return '1 ДРУГ';
        if (count === 5) return '5 ДРУЗЕЙ';
        return '10 ДРУЗЕЙ';
    };

    return (
        <div
            style={{
                textAlign: 'center',
                padding: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 20,
                    color: colors.accent,
                    marginBottom: 8,
                    letterSpacing: '2px',
                    fontWeight: 900,
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                }}
            >
                НАГРАДЫ ЗА ДРУЗЕЙ
            </div>
            <p
                style={{
                    fontSize: 13,
                    opacity: 0.8,
                    marginBottom: 25,
                    fontWeight: 600,
                    color: '#fef3c7',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                }}
            >
                Приглашайте друзей в игру и получайте ценные призы!
            </p>

            <div
                style={{
                    width: '100%',
                    background:
                        'radial-gradient(circle at center, rgba(30, 20, 10, 0.5) 0%, rgba(10, 5, 2, 0.85) 100%)',
                    borderRadius: 15,
                    padding: '25px 20px',
                    border: '1.5px solid rgba(240, 192, 64, 0.35)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(240, 192, 64, 0.08)',
                    marginBottom: 30,
                    display: 'flex',
                    justifyContent: 'space-around',
                    position: 'relative',
                    boxSizing: 'border-box',
                }}
            >
                {[
                    { count: 1, reward: '500', icon: AssetsMap.UI.ICON_GOLD_FULL, label: 'Золото' },
                    { count: 5, reward: '50', icon: AssetsMap.UI.ICON_ALMAZ_FULL, label: 'Алмазы' },
                    { count: 10, reward: '2000', icon: AssetsMap.UI.ICON_XP, label: 'Опыт' },
                ].map((step, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 5,
                            zIndex: 1,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 900,
                                color: colors.accent,
                                background: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(240,192,64,0.2)',
                                padding: '2px 10px',
                                borderRadius: 10,
                                marginBottom: 5,
                                fontFamily: "'Cinzel', serif",
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            }}
                        >
                            {getFriendLabel(step.count)}
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                width: 50,
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <img
                                src={step.icon}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    transform: step.label === 'Опыт' ? 'scale(1.35)' : 'none',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                                }}
                                alt="reward"
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: -5,
                                    right: -5,
                                    background: 'linear-gradient(180deg, #2a1808 0%, #0c0602 100%)',
                                    color: '#ffd700',
                                    fontSize: 10,
                                    fontWeight: 950,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    border: '1.5px solid #fbbf24',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 5px rgba(251, 191, 36, 0.2)',
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                x{step.reward}
                            </div>
                        </div>
                    </div>
                ))}
                <div
                    style={{
                        position: 'absolute',
                        top: '55%',
                        left: '15%',
                        right: '15%',
                        height: 2,
                        background:
                            'linear-gradient(90deg, transparent 0%, rgba(240, 192, 64, 0.45) 50%, transparent 100%)',
                        zIndex: 0,
                    }}
                />
            </div>

            <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(240,192,64,0.5)' }}
                whileTap={{ scale: 0.92 }}
                onClick={() => showInviteBox()}
                style={{
                    padding: '16px 45px',
                    background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                    border: `1.5px solid #ffcc00`,
                    borderRadius: 12,
                    color: '#1a1008',
                    fontWeight: 950,
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 14,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                    letterSpacing: '1px',
                    marginBottom: 30,
                    transition: 'all 0.2s ease',
                }}
            >
                ПРИГЛАСИТЬ ЕЩЁ
            </motion.button>

            <div style={{ width: '100%', height: '1px', background: colors.border, marginBottom: 30 }} />

            <div style={{ textAlign: 'center', width: '100%' }}>
                <div
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: 16,
                        color: colors.accent,
                        marginBottom: 15,
                        letterSpacing: '1.5px',
                        fontWeight: 900,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    СОЦИАЛЬНЫЕ БОНУСЫ
                </div>
                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                    {!claimedSocialRewards?.includes('favorites') && (
                        <button
                            onClick={async () => {
                                const { addToFavorites } = await import('../../../../utils/VKBridge');
                                const ok = await addToFavorites();
                                if (ok) {
                                    claimFavoriteReward(true);
                                    useGameStore
                                        .getState()
                                        .showAlert('Награда за добавление в избранное: 50 кристаллов!');
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background:
                                    'linear-gradient(180deg, rgba(240, 192, 64, 0.12) 0%, rgba(240, 192, 64, 0.03) 100%)',
                                border: '2px solid rgba(240, 192, 64, 0.5)',
                                borderRadius: 12,
                                color: colors.accent,
                                fontSize: 11,
                                fontWeight: 950,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '0.5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 10px rgba(0,0,0,0.4)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            ⭐ В ИЗБРАННОЕ (+50{' '}
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                alt="almaz"
                            />
                            )
                        </button>
                    )}
                    {!claimedSocialRewards?.includes('group') && (
                        <button
                            onClick={async () => {
                                const { joinGroup } = await import('../../../../utils/VKBridge');
                                const ok = await joinGroup();
                                if (ok) {
                                    claimGroupReward(true);
                                    useGameStore
                                        .getState()
                                        .showAlert('Награда за вступление в группу: 50 кристаллов!');
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background:
                                    'linear-gradient(180deg, rgba(0, 119, 255, 0.12) 0%, rgba(0, 119, 255, 0.03) 100%)',
                                border: '2px solid rgba(0, 119, 255, 0.5)',
                                borderRadius: 12,
                                color: '#38bdf8',
                                fontSize: 11,
                                fontWeight: 950,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '0.5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 10px rgba(0,0,0,0.4)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            👥 НАША ГРУППА (+50{' '}
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                alt="almaz"
                            />
                            )
                        </button>
                    )}
                </div>
                {claimedSocialRewards?.includes('group') && claimedSocialRewards?.includes('favorites') && (
                    <div
                        style={{
                            padding: '15px',
                            background: 'rgba(255,255,255,0.05)',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 900,
                            color: colors.accent,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1px',
                            opacity: 0.7,
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                    >
                        ✅ ВСЕ СОЦИАЛЬНЫЕ НАГРАДЫ ПОЛУЧЕНЫ
                    </div>
                )}
            </div>
        </div>
    );
};
