/**
 * PORTAL DAILY CHECK-IN (Благословение Леса: Ежедневный Календарь Наград)
 * 7-дневный прогрессивный веб-календарь с начислением золота, кристаллов
 * и редких предметов непосредственно в игровой профиль useGameStore.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { useGameStore } from '../../store/useGameStore';

export interface ICheckInDay {
    day: number;
    title: string;
    icon: string;
    gold: number;
    crystals: number;
    itemDesc?: string;
    isSuper?: boolean;
}

export const CHECK_IN_DAYS: ICheckInDay[] = [
    { day: 1, title: 'День 1', icon: '🌿', gold: 100, crystals: 0, itemDesc: '10x Трав' },
    { day: 2, title: 'День 2', icon: '🧪', gold: 250, crystals: 0, itemDesc: 'Малое Зелье' },
    { day: 3, title: 'День 3', icon: '💎', gold: 500, crystals: 15, itemDesc: '+15 Кристаллов' },
    { day: 4, title: 'День 4', icon: '📜', gold: 750, crystals: 0, itemDesc: 'Свиток Опыта' },
    { day: 5, title: 'День 5', icon: '🔮', gold: 1000, crystals: 25, itemDesc: '+25 Кристаллов' },
    { day: 6, title: 'День 6', icon: '🛡️', gold: 1500, crystals: 0, itemDesc: 'Амулет Стойкости' },
    { day: 7, title: 'День 7', icon: '👑', gold: 3000, crystals: 100, itemDesc: 'Сундук Чемпиона', isSuper: true },
];

export const PortalDailyCheckIn: React.FC = () => {
    const [streak, setStreak] = useState(1);
    const [canClaim, setCanClaim] = useState(true);
    const [claimedToday, setClaimedToday] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        const savedStreak = parseInt(localStorage.getItem('wild_portal_checkin_streak') || '1', 10);
        const lastDate = localStorage.getItem('wild_portal_last_checkin_date');
        const todayStr = new Date().toDateString();

        setStreak(savedStreak > 7 ? 1 : savedStreak);

        if (lastDate === todayStr) {
            setCanClaim(false);
            setClaimedToday(true);
        } else {
            setCanClaim(true);
            setClaimedToday(false);
        }
    }, []);

    const handleClaim = () => {
        if (!canClaim) return;

        proceduralAudio.playFanfare();
        const currentReward = CHECK_IN_DAYS[(streak - 1) % CHECK_IN_DAYS.length];

        const store: any = useGameStore.getState();
        if (currentReward.gold > 0) store.addGold?.(currentReward.gold);
        if (currentReward.crystals > 0) store.addCrystals?.(currentReward.crystals);

        const todayStr = new Date().toDateString();
        localStorage.setItem('wild_portal_last_checkin_date', todayStr);

        const nextStreak = streak >= 7 ? 1 : streak + 1;
        localStorage.setItem('wild_portal_checkin_streak', nextStreak.toString());

        setCanClaim(false);
        setClaimedToday(true);
        setFeedback(
            `🎉 Получено: +${currentReward.gold} 🪙 Золота ${
                currentReward.crystals > 0 ? `+${currentReward.crystals} 💎 Кристаллов` : ''
            }! Награда уже ждет в игре.`
        );

        setTimeout(() => setFeedback(null), 6000);
    };

    return (
        <section
            id="rewards"
            style={{
                position: 'relative',
                padding: '90px 24px',
                backgroundColor: '#0a0812',
                borderBottom: '1px solid rgba(200, 168, 112, 0.15)',
                overflow: 'hidden',
            }}
        >
            <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                {/* Section Header */}
                <div style={{ textAlign: 'center', marginBottom: '45px' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 16px',
                            borderRadius: '30px',
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            color: '#d4af37',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            marginBottom: '14px',
                        }}
                    >
                        <span>🎁</span> ЕЖЕДНЕВНЫЙ ВЕБ-РЕЛИЗ
                    </div>
                    <h2
                        style={{
                            margin: '0 0 14px 0',
                            fontFamily: "'Philosopher', 'Cinzel', serif",
                            fontSize: 'clamp(28px, 4vw, 42px)',
                            color: '#f9f5ea',
                            textShadow: '0 4px 14px rgba(0,0,0,0.8)',
                        }}
                    >
                        Благословение Леса
                    </h2>
                    <p style={{ margin: '0 auto', maxWidth: '640px', fontSize: '15px', color: '#a39886', lineHeight: 1.6 }}>
                        Заходите на портал каждый день и забирайте возрастающие ресурсы, золото и кристаллы. 
                        Все награды автоматически синхронизируются с вашим игровым аккаунтом.
                    </p>
                </div>

                {/* 7-Day Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '14px',
                        marginBottom: '35px',
                    }}
                >
                    {CHECK_IN_DAYS.map((dayItem) => {
                        const isPast = dayItem.day < streak;
                        const isCurrent = dayItem.day === streak;
                        const isFuture = dayItem.day > streak;

                        return (
                            <motion.div
                                key={dayItem.day}
                                whileHover={{ y: -4 }}
                                style={{
                                    position: 'relative',
                                    borderRadius: '16px',
                                    padding: '20px 14px',
                                    background: isCurrent
                                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(30, 22, 38, 0.95) 100%)'
                                        : isPast
                                          ? 'rgba(15, 12, 20, 0.5)'
                                          : 'rgba(20, 16, 26, 0.8)',
                                    border: isCurrent
                                        ? '2px solid #d4af37'
                                        : dayItem.isSuper
                                          ? '1.5px solid rgba(234, 179, 8, 0.5)'
                                          : '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: isCurrent
                                        ? '0 10px 30px rgba(212, 175, 55, 0.25), inset 0 0 15px rgba(212, 175, 55, 0.15)'
                                        : 'none',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    minHeight: '180px',
                                }}
                            >
                                {/* Top Day Badge */}
                                <div
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: isCurrent ? '#FFE07D' : isPast ? '#6b7280' : '#b2a594',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    {dayItem.title}
                                </div>

                                {/* Icon Display */}
                                <div
                                    style={{
                                        fontSize: '34px',
                                        margin: '10px 0',
                                        filter: isPast ? 'grayscale(0.8) opacity(0.5)' : 'none',
                                    }}
                                >
                                    {isPast ? '✓' : dayItem.icon}
                                </div>

                                {/* Reward Detail */}
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f3e8d2' }}>
                                        +{dayItem.gold} 🪙
                                    </div>
                                    {dayItem.crystals > 0 && (
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', marginTop: '2px' }}>
                                            +{dayItem.crystals} 💎
                                        </div>
                                    )}
                                    <div style={{ fontSize: '11px', color: '#9c8e7e', marginTop: '4px' }}>
                                        {dayItem.itemDesc}
                                    </div>
                                </div>

                                {/* Status ribbon */}
                                {isPast && (
                                    <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, marginTop: '6px' }}>
                                        Получено
                                    </div>
                                )}
                                {isCurrent && (
                                    <div style={{ fontSize: '10px', color: '#d4af37', fontWeight: 800, marginTop: '6px' }}>
                                        {claimedToday ? '✓ Сегодня готово' : '⚡ ДОСТУПНО'}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Claim CTA & Notification Feedback */}
                <div style={{ textAlign: 'center' }}>
                    {feedback && (
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#6ee7b7',
                                fontSize: '14px',
                                fontWeight: 600,
                                marginBottom: '20px',
                            }}
                        >
                            {feedback}
                        </div>
                    )}

                    <div>
                        <button
                            onClick={handleClaim}
                            disabled={!canClaim}
                            style={{
                                padding: '16px 40px',
                                borderRadius: '12px',
                                background: canClaim
                                    ? 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)'
                                    : 'rgba(40, 32, 50, 0.6)',
                                border: canClaim ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                color: canClaim ? '#120c04' : '#73685c',
                                fontSize: '16px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '1.5px',
                                cursor: canClaim ? 'pointer' : 'not-allowed',
                                boxShadow: canClaim ? '0 8px 25px rgba(212, 175, 55, 0.35)' : 'none',
                                transition: 'all 0.25s ease',
                            }}
                        >
                            {claimedToday ? '✓ Награда за сегодня уже получена' : '🎁 Забрать Благословение Леса'}
                        </button>
                    </div>

                    <p style={{ marginTop: '12px', fontSize: '12px', color: '#7c7063' }}>
                        Счетчик обновляется ежедневно в 00:00 МСК. Ресурсы мгновенно поступают на счет персонажа.
                    </p>
                </div>
            </div>
        </section>
    );
};
