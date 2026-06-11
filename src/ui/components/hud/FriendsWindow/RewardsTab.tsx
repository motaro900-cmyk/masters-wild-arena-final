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
    return (
        <div
            style={{
                textAlign: 'center',
                padding: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
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
                }}
            >
                НАГРАДЫ ЗА ДРУЗЕЙ
            </div>
            <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 25, fontWeight: 600 }}>
                Приглашайте друзей в игру и получайте ценные призы!
            </p>

            <div
                style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 15,
                    padding: '25px 20px',
                    border: `1px solid ${colors.border}`,
                    marginBottom: 30,
                    display: 'flex',
                    justifyContent: 'space-around',
                    position: 'relative',
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
                                background: 'rgba(0,0,0,0.6)',
                                padding: '2px 8px',
                                borderRadius: 10,
                                marginBottom: 5,
                            }}
                        >
                            {step.count} ДРУГ
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
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                alt="reward"
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: -5,
                                    right: -5,
                                    background: '#000',
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 900,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    border: `1px solid ${colors.accent}`,
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
                        background: colors.border,
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
                    border: `1px solid #ffcc00`,
                    borderRadius: 12,
                    color: '#1a1008',
                    fontWeight: 950,
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 14,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                    letterSpacing: '1px',
                    marginBottom: 30,
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
                        letterSpacing: '1px',
                        fontWeight: 900,
                    }}
                >
                    СОЦИАЛЬНЫЕ БОНУСЫ
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {!claimedSocialRewards?.includes('favorites') && (
                        <button
                            onClick={async () => {
                                const { addToFavorites } = await import('../../../../utils/VKBridge');
                                const ok = await addToFavorites();
                                if (ok) {
                                    claimFavoriteReward(true);
                                    useGameStore
                                        .getState()
                                        .showAlert('Награда за добавление в избранное: 50 кристаллов! 💎');
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '15px',
                                background: 'rgba(240,192,64,0.1)',
                                border: `2px solid ${colors.accent}`,
                                borderRadius: 12,
                                color: colors.accent,
                                fontSize: 11,
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: 'inset 0 1px 1px rgba(240,192,64,0.2)',
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
                                        .showAlert('Награда за вступление в группу: 50 кристаллов! 💎');
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '15px',
                                background: 'rgba(0,119,255,0.1)',
                                border: `2px solid #0077ff`,
                                borderRadius: 12,
                                color: '#0077ff',
                                fontSize: 11,
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: 'inset 0 1px 1px rgba(0,119,255,0.2)',
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
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 800,
                            color: colors.accent,
                            opacity: 0.6,
                        }}
                    >
                        ✅ ВСЕ СОЦИАЛЬНЫЕ НАГРАДЫ ПОЛУЧЕНЫ
                    </div>
                )}
            </div>
        </div>
    );
};
