/**
 * PORTAL NEWS & CHRONICLES COMPONENT
 * Секция новостей, патчей и турниров в стиле Steam Community & Battle.net News Hub.
 */
import React from 'react';

interface PortalNewsProps {
    onLaunchGame: () => void;
}

export const PortalNews: React.FC<PortalNewsProps> = ({ onLaunchGame }) => {
    const newsList = [
        {
            id: 1,
            badge: 'ПАТЧ 1.2.4',
            badgeColor: '#38bdf8',
            date: '25 октября 2026',
            title: '«Пробуждение Титанов»: Древняя Кузница и Баланс Арены',
            desc: 'Масштабное обновление боевой системы: запущена система перековки реликвий до +15, скорректированы критические формулы урона и активирована поддержка 60 FPS на всех мобильных браузерах.',
            tag: 'Обновление баланса',
            action: '⚔️ ИСПЫТАТЬ В БОЮ',
        },
        {
            id: 2,
            badge: 'СЕЗОН 4',
            badgeColor: '#f59e0b',
            date: 'До конца: 12 дней 08 ч',
            title: 'Рейтинговый Сезон «Битва за Ледяной Пик»',
            desc: 'Покоряйте Чертоги Славы в дуэлях 1v1. Воины из топ-100 получат эксклюзивный титул «Владыка Ледников», золотую анимационную рамку профиля и до 5,000 💎 Кристаллов.',
            tag: 'Турнир сезона',
            action: '🏆 В ЗАЛ СЛАВЫ',
        },
        {
            id: 3,
            badge: 'ИВЕНТ ВЫХОДНЫХ',
            badgeColor: '#10b981',
            date: '25 – 27 октября',
            title: '«Дни Первобытного Изобилия» (+100% к наградам)',
            desc: 'Удвоенное выпадение золота и древней энергии во всех боях на Арене и в Подземельях. Отличная возможность улучшить легендарные доспехи и повысить VIP-ранг.',
            tag: 'Особое событие',
            action: '🎁 ЗАБРАТЬ БОНУС',
        },
    ];

    const handleAction = (idx: number) => {
        if (idx === 1) {
            document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
        } else if (idx === 2) {
            document.getElementById('rewards')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            onLaunchGame();
        }
    };

    return (
        <section
            id="news"
            style={{
                position: 'relative',
                padding: '90px 24px',
                backgroundColor: '#08060c',
                borderTop: '1px solid rgba(212, 175, 55, 0.15)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
                overflow: 'hidden',
            }}
        >
            <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
                        <span>📰</span> ХРОНИКИ И ПАТЧИ ДИКОЗЕМЬЯ
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
                        Вестник Арены & Турниры
                    </h2>
                    <p
                        style={{
                            margin: '0 auto',
                            maxWidth: '640px',
                            fontSize: '15px',
                            color: '#a39886',
                            lineHeight: 1.6,
                        }}
                    >
                        Свежие обновления игрового баланса, расписание турниров и сезонных наград.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '24px',
                    }}
                >
                    {newsList.map((item, idx) => (
                        <div
                            key={item.id}
                            style={{
                                background: 'linear-gradient(135deg, rgba(20, 16, 28, 0.8) 0%, rgba(12, 9, 18, 0.95) 100%)',
                                border: '1px solid rgba(212, 175, 55, 0.25)',
                                borderRadius: '16px',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '14px',
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: `${item.badgeColor}22`,
                                            border: `1px solid ${item.badgeColor}66`,
                                            color: item.badgeColor,
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#8c7e6f' }}>{item.date}</span>
                                </div>
                                <h3
                                    style={{
                                        margin: '0 0 10px 0',
                                        fontFamily: "'Philosopher', serif",
                                        fontSize: '19px',
                                        color: '#f3e8d2',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {item.title}
                                </h3>
                                <p style={{ margin: 0, fontSize: '13.5px', color: '#b5a898', lineHeight: 1.6 }}>
                                    {item.desc}
                                </p>
                            </div>
                            <div
                                style={{
                                    marginTop: '20px',
                                    paddingTop: '14px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span style={{ fontSize: '11px', color: '#8c7e6f', textTransform: 'uppercase' }}>
                                    {item.tag}
                                </span>
                                <button
                                    onClick={() => handleAction(idx)}
                                    style={{
                                        padding: '7px 16px',
                                        borderRadius: '6px',
                                        background: 'rgba(212, 175, 55, 0.15)',
                                        border: '1px solid rgba(212, 175, 55, 0.4)',
                                        color: '#FFE07D',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {item.action}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
