import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ClanMember, ClanData, CurrencyIcon, TabButton, EMBLEMS, ActionButton, ShopItem } from './Clan/ClanShared';
import { ClanBrowseTab } from './Clan/ClanBrowseTab';
import { ClanCreateTab } from './Clan/ClanCreateTab';
import { ClanLobbyTab } from './Clan/ClanLobbyTab';
import { ClanMembersTab } from './Clan/ClanMembersTab';
import { ClanStoreTab } from './Clan/ClanStoreTab';

export const ClanWindow: React.FC = () => {
    const {
        clanId,
        clanData,
        joinClan,
        leaveClan,
        uiTheme,
        rating,
        vkUser,
        avatar: playerAvatar,
        gold,
        addGold,
        clanCoins,
        addClanCoins,
    } = useGameStore();

    const isLight = uiTheme === 'LIGHT';

    const [view, setView] = useState<'BROWSE' | 'CREATE' | 'DASHBOARD'>(clanId ? 'DASHBOARD' : 'BROWSE');
    const [dashboardTab, setDashboardTab] = useState<'LOBBY' | 'MEMBERS' | 'STORE'>('LOBBY');

    const [members, setMembers] = useState<ClanMember[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (clanId) {
                setMembers([
                    {
                        name: vkUser?.first_name || 'Воин',
                        role: 'LEADER',
                        trophies: rating,
                        lastSeen: 'Online',
                        isOnline: true,
                        avatar: playerAvatar || '🐺',
                        contribution: 0,
                    },
                ]);
            } else {
                setMembers([]);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [clanId, vkUser, rating, playerAvatar]);

    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    // Create/Edit state placeholder
    const [createdClanName, setCreatedClanName] = useState('');
    const [createdClanMotto, setCreatedClanMotto] = useState('');
    const [selectedEmblem, setSelectedEmblem] = useState(EMBLEMS[0]);

    // Dashboard settings / stats
    const [isEditingClan, setIsEditingClan] = useState(false);
    const [clanLevelData, setClanLevelData] = useState({ level: 1, xp: 250, maxXp: 1000 });

    const colors = {
        text: isLight ? '#4a3219' : '#e8d8a8',
        accent: isLight ? '#8b4513' : '#f0c040',
        card: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.15)',
        danger: '#ef4444',
        success: '#4ade80',
    };

    const handleJoin = (clan: ClanData) => {
        if (rating < clan.minTrophies) return;
        if (clan.type === 'CLOSED') return;
        joinClan(clan.id, clan);
        setView('DASHBOARD');
    };

    const handleLeave = () => {
        useGameStore.getState().showConfirm('Вы действительно хотите покинуть клан?', () => {
            leaveClan();
            setView('BROWSE');
        });
    };

    const handleCreateClan = (name: string, motto: string, emblem: string) => {
        const state = useGameStore.getState();

        if (state.crystals < 200) {
            setError('Недостаточно алмазов!');
            return;
        }

        const newClan: ClanData = {
            id: Date.now().toString(),
            name: name.toUpperCase(),
            motto: motto || 'Мы — мастера дикой природы!',
            level: 1,
            membersCount: 1,
            maxMembers: 50,
            totalTrophies: rating,
            emblem: emblem,
            minTrophies: 0,
            type: 'OPEN',
            onlineCount: 1,
            xp: 0,
            maxXp: 1000,
        };

        setCreatedClanName(name);
        setCreatedClanMotto(motto);
        setSelectedEmblem(emblem);

        // Deduct crystals
        state.addCrystals(-200);
        joinClan(newClan.id, newClan);
        setShowSuccess(true);
    };

    const handleDonate = () => {
        if (gold < 1000) return setError('Недостаточно золота для вклада (нужно 1000)!');
        addGold(-1000);
        addClanCoins(100);

        setClanLevelData((prev) => {
            const newXp = prev.xp + 50;
            if (newXp >= prev.maxXp) {
                return { level: prev.level + 1, xp: newXp - prev.maxXp, maxXp: (prev.level + 1) * 1000 };
            }
            return { ...prev, xp: newXp };
        });
        setError(null);
    };

    const handleBuyItem = (item: ShopItem) => {
        if (clanCoins < item.price) return setError('Недостаточно клановых монет!');
        addClanCoins(-item.price);
        setError(null);
        useGameStore.getState().showAlert(`Куплено: ${item.name}!`);
    };

    const handleKickMember = (memberName: string) => {
        setMembers((prev) => prev.filter((m) => m.name !== memberName));
    };

    return (
        <div
            style={{
                width: '100%',
                height: '650px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                padding: '10px',
                position: 'relative',
                color: colors.text,
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${colors.border}`,
                    paddingBottom: '15px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: '24px', color: colors.accent }}>
                        {view === 'BROWSE'
                            ? 'ПОИСК КЛАНОВ'
                            : view === 'CREATE'
                              ? 'ОСНОВАНИЕ КЛАНА'
                              : `КЛАН: ${clanData?.name || createdClanName}`}
                    </h2>
                    {view === 'DASHBOARD' && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div
                                style={{
                                    background: colors.card,
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    color: colors.accent,
                                    border: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <CurrencyIcon type="GOLD" size={16} />
                                <span style={{ marginLeft: '5px' }}>{clanCoins} монеты</span>
                            </div>
                        </div>
                    )}
                </div>
                {view === 'DASHBOARD' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <TabButton
                            active={dashboardTab === 'LOBBY'}
                            onClick={() => setDashboardTab('LOBBY')}
                            label="ШТАБ"
                            colors={colors}
                        />
                        <TabButton
                            active={dashboardTab === 'MEMBERS'}
                            onClick={() => setDashboardTab('MEMBERS')}
                            label="СОСТАВ"
                            colors={colors}
                        />
                        <TabButton
                            active={dashboardTab === 'STORE'}
                            onClick={() => setDashboardTab('STORE')}
                            label="МАГАЗИН"
                            colors={colors}
                        />
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === 'BROWSE' && (
                    <ClanBrowseTab
                        colors={colors}
                        playerTrophies={rating}
                        onJoin={handleJoin}
                        onCreateClick={() => {
                            setError(null);
                            setView('CREATE');
                        }}
                    />
                )}

                {view === 'CREATE' && (
                    <ClanCreateTab
                        colors={colors}
                        error={error}
                        setError={setError}
                        onCancel={() => setView('BROWSE')}
                        onCreate={handleCreateClan}
                    />
                )}

                {view === 'DASHBOARD' && dashboardTab === 'LOBBY' && (
                    <ClanLobbyTab
                        colors={colors}
                        clanData={clanData}
                        newClanName={createdClanName}
                        newClanMotto={createdClanMotto}
                        selectedEmblem={selectedEmblem}
                        clanLevelData={clanLevelData}
                        members={members}
                        rating={rating}
                        onDonate={handleDonate}
                        onEditClan={() => setIsEditingClan(true)}
                        onLeave={handleLeave}
                    />
                )}

                {view === 'DASHBOARD' && dashboardTab === 'MEMBERS' && (
                    <ClanMembersTab
                        colors={colors}
                        members={members}
                        isLight={isLight}
                        onKickMember={handleKickMember}
                    />
                )}

                {view === 'DASHBOARD' && dashboardTab === 'STORE' && (
                    <ClanStoreTab colors={colors} onBuyItem={handleBuyItem} />
                )}
            </AnimatePresence>

            {/* CLAN SETTINGS MODAL */}
            <AnimatePresence>
                {isEditingClan && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.85)',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                width: '450px',
                                background: isLight ? '#f5f0e1' : '#1a1510',
                                border: `2px solid ${colors.accent}`,
                                borderRadius: '24px',
                                padding: '40px',
                            }}
                        >
                            <h3
                                style={{
                                    color: colors.accent,
                                    fontSize: '24px',
                                    marginBottom: '30px',
                                    fontFamily: "'Cinzel', serif",
                                    textAlign: 'center',
                                }}
                            >
                                Управление Кланом
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            opacity: 0.6,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Эмблема
                                    </label>
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: '10px',
                                            marginTop: '10px',
                                        }}
                                    >
                                        {EMBLEMS.map((e) => (
                                            <button
                                                key={e}
                                                onClick={() => setSelectedEmblem(e)}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    background:
                                                        selectedEmblem === e ? colors.accent : 'rgba(255,255,255,0.05)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '24px',
                                                }}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <ActionButton
                                    label="СОХРАНИТЬ ИЗМЕНЕНИЯ"
                                    color={colors.accent}
                                    onClick={() => setIsEditingClan(false)}
                                />
                                <ActionButton
                                    label="ЗАКРЫТЬ"
                                    color={colors.text}
                                    onClick={() => setIsEditingClan(false)}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SUCCESS CELEBRATION POPUP */}
            <AnimatePresence>
                {showSuccess && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.9)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(15px)',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '30px',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                style={{
                                    filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.5))',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <div
                                    className={`sprite-clan clan-${selectedEmblem}`}
                                    style={{ transform: 'scale(3)' }}
                                />
                            </motion.div>

                            <div>
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        color: colors.accent,
                                        fontSize: '42px',
                                        margin: 0,
                                        textTransform: 'uppercase',
                                        letterSpacing: '4px',
                                    }}
                                >
                                    Клан Основан!
                                </motion.h2>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    style={{ color: '#fff', fontSize: '18px', opacity: 0.8, marginTop: '10px' }}
                                >
                                    Да начнется великая история клана{' '}
                                    <span style={{ color: colors.accent, fontWeight: 900 }}>
                                        {createdClanName.toUpperCase()}
                                    </span>
                                </motion.p>
                            </div>

                            <motion.button
                                promo-code-animation-fix=""
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => {
                                    setShowSuccess(false);
                                    setView('DASHBOARD');
                                }}
                                style={{
                                    padding: '20px 60px',
                                    background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                    border: 'none',
                                    borderRadius: '40px',
                                    color: '#000',
                                    fontWeight: 900,
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 30px rgba(240,192,64,0.4)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                В Штаб Клана
                            </motion.button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
