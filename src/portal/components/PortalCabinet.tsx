/**
 * PORTAL CABINET (Личный Кабинет Игрока)
 * Полноценный профиль игрока: персонаж, экипировка из 6 слотов,
 * баланс золота/кристаллов/энергии, боевая статистика и ежедневные квесты.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { HEROES_DB } from '../../configs/HeroesConfig';

interface PortalCabinetProps {
    isOpen: boolean;
    onClose: () => void;
    onLaunchGame: (heroId?: string) => void;
}

export const PortalCabinet: React.FC<PortalCabinetProps> = ({
    isOpen,
    onClose,
    onLaunchGame,
}) => {
    const store: any = useGameStore();
    const selectedHeroId = store.selectedHeroId || 'panda';
    const gold = store.gold ?? 2450;
    const diamonds = store.diamonds ?? store.crystals ?? 120;
    const energy = store.energy ?? 100;
    const maxEnergy = store.maxEnergy ?? 100;
    const rating = store.rating ?? 1480;
    const playerName = store.name || 'Дикий Мастер';
    const [nameEditing, setNameEditing] = useState(false);
    const [editNameVal, setEditNameVal] = useState(playerName);

    // Active hero data
    const activeHero = HEROES_DB.find((h) => h.id === selectedHeroId) || HEROES_DB[0];

    // Daily Quests State
    const [quests, setQuests] = useState([
        { id: 1, title: 'Одержать 3 победы на PvP Арене', current: 2, total: 3, rewardGold: 300, rewardCrystals: 10, claimed: false },
        { id: 2, title: 'Забрать ежедневное Благословение Леса', current: 1, total: 1, rewardGold: 200, rewardCrystals: 5, claimed: false },
        { id: 3, title: 'Улучшить предмет в Древней Кузнице', current: 0, total: 1, rewardGold: 500, rewardCrystals: 15, claimed: false },
    ]);

    const handleSaveName = () => {
        if (editNameVal.trim()) {
            store.setName?.(editNameVal.trim());
            useGameStore.setState({ name: editNameVal.trim() });
        }
        setNameEditing(false);
        proceduralAudio.playClick(1.0);
    };

    const handleClaimQuest = (questId: number) => {
        proceduralAudio.playFanfare();
        setQuests((prev) =>
            prev.map((q) => {
                if (q.id === questId && !q.claimed) {
                    store.addGold?.(q.rewardGold);
                    store.addCrystals?.(q.rewardCrystals);
                    return { ...q, claimed: true };
                }
                return q;
            })
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 20000,
                    backgroundColor: 'rgba(5, 4, 8, 0.92)',
                    backdropFilter: 'blur(16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    overflowY: 'auto',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '1050px',
                        maxHeight: '92vh',
                        background: 'linear-gradient(135deg, #16121f 0%, #0c0914 100%)',
                        border: '2px solid rgba(212, 175, 55, 0.45)',
                        borderRadius: '20px',
                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95), 0 0 45px rgba(212, 175, 55, 0.18)',
                        padding: '30px',
                        color: '#f5ede0',
                        overflowY: 'auto',
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => {
                            proceduralAudio.playClick(0.9);
                            onClose();
                        }}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            color: '#e2d4c0',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ✕
                    </button>

                    {/* Header: Title & Player ID */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <span style={{ fontSize: '28px' }}>👤</span>
                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    fontFamily: "'Philosopher', 'Cinzel', serif",
                                    fontSize: '26px',
                                    color: '#FFE07D',
                                }}
                            >
                                Личный Кабинет Воина
                            </h2>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#9c8e7e' }}>
                                Сервер S1: Wild Lands • ID: #WILD-89412
                            </p>
                        </div>
                    </div>

                    {/* Top Row: Profile Card & Live Balances */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '20px',
                            marginBottom: '25px',
                        }}
                    >
                        {/* Profile Info Card */}
                        <div
                            style={{
                                padding: '18px 22px',
                                borderRadius: '16px',
                                background: 'rgba(22, 17, 28, 0.8)',
                                border: '1.5px solid rgba(212, 175, 55, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '18px',
                            }}
                        >
                            <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                                <img
                                    src={activeHero.image}
                                    alt={activeHero.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '14px',
                                        objectFit: 'contain',
                                        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(10, 8, 14, 0.9) 80%)',
                                        border: '2px solid #d4af37',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        right: '-4px',
                                        background: '#d4af37',
                                        color: '#120d04',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                    }}
                                >
                                    VIP 3
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                {nameEditing ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={editNameVal}
                                            onChange={(e) => setEditNameVal(e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                background: '#09070e',
                                                border: '1px solid #d4af37',
                                                color: '#fff',
                                                fontSize: '14px',
                                                width: '120px',
                                            }}
                                        />
                                        <button
                                            onClick={handleSaveName}
                                            style={{
                                                padding: '4px 10px',
                                                background: '#d4af37',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            OK
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#f7f1e6' }}>
                                            {playerName}
                                        </span>
                                        <button
                                            onClick={() => setNameEditing(true)}
                                            style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                )}
                                <div style={{ fontSize: '12px', color: '#d4af37', marginTop: '2px' }}>
                                    {activeHero.name} ({activeHero.title})
                                </div>
                                <div style={{ fontSize: '11px', color: '#8c7e6f', marginTop: '4px' }}>
                                    Уровень: 80 • Статус: Онлайн
                                </div>
                            </div>
                        </div>

                        {/* Currency Balance Bar */}
                        <div
                            style={{
                                padding: '18px 22px',
                                borderRadius: '16px',
                                background: 'rgba(22, 17, 28, 0.8)',
                                border: '1.5px solid rgba(212, 175, 55, 0.25)',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '14px',
                                alignItems: 'center',
                            }}
                        >
                            {/* Gold */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>🪙</span>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#8c7e6f', textTransform: 'uppercase' }}>Золото</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffe599' }}>
                                        {gold.toLocaleString('ru-RU')}
                                    </div>
                                </div>
                            </div>

                            {/* Crystals */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>💎</span>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#8c7e6f', textTransform: 'uppercase' }}>Кристаллы</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#60a5fa' }}>
                                        {diamonds.toLocaleString('ru-RU')}
                                    </div>
                                </div>
                            </div>

                            {/* Energy */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>⚡</span>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#8c7e6f', textTransform: 'uppercase' }}>Энергия</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                                        {energy} / {maxEnergy}
                                    </div>
                                </div>
                            </div>

                            {/* PvP Trophies */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>🏆</span>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#8c7e6f', textTransform: 'uppercase' }}>Рейтинг PvP</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b' }}>
                                        {rating} pts
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: 6 Equipped Gear Slots & Tactical Radar */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '20px',
                            marginBottom: '25px',
                        }}
                    >
                        {/* 6 Gear Slots */}
                        <div
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'rgba(18, 14, 24, 0.85)',
                                border: '1px solid rgba(212, 175, 55, 0.25)',
                            }}
                        >
                            <h4
                                style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    color: '#d4af37',
                                }}
                            >
                                Снаряжение Персонажа (6 Слотов)
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                {[
                                    { slot: 'Оружие', icon: '⚔️', name: 'Меч Предков', tier: '+12' },
                                    { slot: 'Шлем', icon: '🪖', name: 'Корона Севера', tier: '+10' },
                                    { slot: 'Броня', icon: '🛡️', name: 'Панцирь Зубра', tier: '+11' },
                                    { slot: 'Поножи', icon: '👖', name: 'Поножи Ветра', tier: '+9' },
                                    { slot: 'Сапоги', icon: '🥾', name: 'Шаг Титана', tier: '+10' },
                                    { slot: 'Амулет', icon: '🔮', name: 'Око Дракона', tier: '+14' },
                                ].map((item) => (
                                    <div
                                        key={item.slot}
                                        style={{
                                            padding: '12px 8px',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(212, 175, 55, 0.35)',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
                                        }}
                                    >
                                        <span style={{ fontSize: '24px', marginBottom: '4px' }}>{item.icon}</span>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#f3e8d2' }}>
                                            {item.name}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, marginTop: '2px' }}>
                                            {item.tier}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Combat Statistics */}
                        <div
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'rgba(18, 14, 24, 0.85)',
                                border: '1px solid rgba(212, 175, 55, 0.25)',
                            }}
                        >
                            <h4
                                style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    color: '#d4af37',
                                }}
                            >
                                Боевая Сводка & Зал Подвигов
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#a69a89' }}>Всего сражений:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>148</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#a69a89' }}>Побед на арене:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>124 (83.7%)</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#a69a89' }}>Пройдено этажей Подземелья:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>Этаж 36</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', color: '#a69a89' }}>Серия побед подряд:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#eab308' }}>🔥 12 побед</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Daily Quests Deck */}
                    <div
                        style={{
                            padding: '20px',
                            borderRadius: '16px',
                            background: 'rgba(18, 14, 24, 0.85)',
                            border: '1px solid rgba(212, 175, 55, 0.25)',
                            marginBottom: '25px',
                        }}
                    >
                        <h4
                            style={{
                                margin: '0 0 16px 0',
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                color: '#d4af37',
                            }}
                        >
                            Ежедневные Задания (Забрать Награды)
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {quests.map((quest) => {
                                const isReady = quest.current >= quest.total && !quest.claimed;
                                return (
                                    <div
                                        key={quest.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            background: quest.claimed
                                                ? 'rgba(255, 255, 255, 0.02)'
                                                : isReady
                                                  ? 'rgba(212, 175, 55, 0.12)'
                                                  : 'rgba(255, 255, 255, 0.04)',
                                            border: isReady ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.06)',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: quest.claimed ? '#6b7280' : '#f3e8d2' }}>
                                                {quest.title}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#8c7e6f', marginTop: '2px' }}>
                                                Награда: +{quest.rewardGold} 🪙 {quest.rewardCrystals > 0 && `+${quest.rewardCrystals} 💎`} • Прогресс: {quest.current}/{quest.total}
                                            </div>
                                        </div>

                                        <button
                                            disabled={!isReady}
                                            onClick={() => handleClaimQuest(quest.id)}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '8px',
                                                background: quest.claimed
                                                    ? 'transparent'
                                                    : isReady
                                                      ? 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)'
                                                      : 'rgba(255, 255, 255, 0.05)',
                                                border: quest.claimed ? '1px solid #374151' : isReady ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                                color: quest.claimed ? '#6b7280' : isReady ? '#120d04' : '#6b7280',
                                                fontWeight: 800,
                                                fontSize: '11px',
                                                textTransform: 'uppercase',
                                                cursor: isReady ? 'pointer' : 'default',
                                            }}
                                        >
                                            {quest.claimed ? '✓ Получено' : isReady ? 'Забрать' : 'В процессе'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Deck: Вступить в бой */}
                    <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => {
                                proceduralAudio.playClick(1.0);
                                onClose();
                            }}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '12px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                color: '#e2d4c0',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Закрыть Кабинет
                        </button>

                        <button
                            onClick={() => {
                                proceduralAudio.playFanfare();
                                onClose();
                                onLaunchGame(selectedHeroId);
                            }}
                            style={{
                                padding: '14px 36px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                                border: 'none',
                                color: '#120d04',
                                fontSize: '14px',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <span>⚔️</span> Вступить в бой за {activeHero.name}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
