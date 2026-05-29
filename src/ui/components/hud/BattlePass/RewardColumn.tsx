import React from 'react';
import { Reward, RewardItem } from './BattlePassShared';
import { RewardCard } from './RewardCard';

interface RewardColumnProps {
    reward: Reward;
    isUnlocked: boolean;
    isPremium: boolean;
    claimedRewards: string[];
    onClaim: (item: RewardItem) => void;
    onPreview: (item: RewardItem) => void;
    isMilestone?: boolean;
}

export const RewardColumn: React.FC<RewardColumnProps> = ({
    reward,
    isUnlocked,
    isPremium,
    claimedRewards,
    onClaim,
    onPreview,
    isMilestone,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0px',
                minWidth: isMilestone ? '250px' : '200px',
                position: 'relative',
                zIndex: isMilestone ? 5 : 1,
            }}
        >
            {/* ПРЕМИУМ ДОРОЖКА (СВЕРХУ) */}
            <RewardCard
                item={reward.premium}
                isPremiumCard
                isUnlocked={isUnlocked && isPremium}
                isClaimed={claimedRewards.includes(reward.premium.id)}
                onClaim={() => onClaim(reward.premium)}
                onPreview={onPreview}
                isMilestone={isMilestone}
            />

            {/* УРОВЕНЬ ПОСЕРЕДИНЕ (СТАЛЬНАЯ ЦЕПЬ И ЩИТ) */}
            <div
                style={{
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Стальная цепь с металлическим блеском */}
                <div
                    style={{
                        position: 'absolute',
                        left: '-20px',
                        right: '-20px',
                        height: '6px',
                        background: 'linear-gradient(90deg, #333 0%, #1a1a1a 50%, #333 100%)',
                        borderTop: '1px solid #555',
                        borderBottom: '1px solid #111',
                        zIndex: 0,
                    }}
                />

                {/* Щит-уровень */}
                <div
                    style={{
                        width: isMilestone ? '52px' : '42px',
                        height: isMilestone ? '52px' : '42px',
                        borderRadius: '50%',
                        background: isUnlocked
                            ? 'radial-gradient(circle, #f0c040 0%, #8a640f 100%)'
                            : 'radial-gradient(circle, #4a4a4a 0%, #222222 100%)',
                        border: isUnlocked ? '3px solid #ffd700' : '3px solid #555',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 950,
                        color: isUnlocked ? '#1a0d00' : '#888',
                        fontSize: isMilestone ? '20px' : '16px',
                        fontFamily: "'Cinzel', serif",
                        boxShadow: isUnlocked
                            ? '0 0 15px rgba(240,192,64,0.4), inset 0 0 8px rgba(0,0,0,0.8)'
                            : 'inset 0 0 8px rgba(0,0,0,0.8)',
                        transition: 'all 0.3s',
                    }}
                >
                    {reward.level}
                </div>
            </div>

            {/* БЕСПЛАТНАЯ ДОРОЖКА (СНИЗУ) */}
            <RewardCard
                item={reward.free}
                isUnlocked={isUnlocked}
                isClaimed={claimedRewards.includes(reward.free.id)}
                onClaim={() => onClaim(reward.free)}
                onPreview={onPreview}
                isMilestone={isMilestone}
            />
        </div>
    );
};
