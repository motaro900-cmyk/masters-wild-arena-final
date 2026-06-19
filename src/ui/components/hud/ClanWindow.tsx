import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { ClanEmblemIcon } from '../GameIcons';
import { ClanMember, ClanData, CurrencyIcon, TabButton, EMBLEMS, ActionButton, ShopItem } from './Clan/ClanShared';
import { ClanBrowseTab } from './Clan/ClanBrowseTab';
import { ClanCreateTab } from './Clan/ClanCreateTab';
import { ClanLobbyTab } from './Clan/ClanLobbyTab';
import { ClanMembersTab } from './Clan/ClanMembersTab';
import { ClanStoreTab } from './Clan/ClanStoreTab';
import { ClanBankTab } from './Clan/ClanBankTab';
import { MOCK_CLANS, DEFAULT_MOCK_MEMBERS } from './Clan/ClanMockData';
import { syncService } from '../../../services/SyncService';

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
        frame: playerFrame,
        gold,
        addGold,
        crystals,
        addCrystals,
        clanCoins,
        addClanCoins,
        level,
        name: playerName,
    } = useGameStore(
        useShallow((state) => ({
            clanId: state.clanId,
            clanData: state.clanData,
            joinClan: state.joinClan,
            leaveClan: state.leaveClan,
            uiTheme: state.uiTheme,
            rating: state.rating,
            vkUser: state.vkUser,
            avatar: state.avatar,
            frame: state.frame,
            gold: state.gold,
            addGold: state.addGold,
            crystals: state.crystals,
            addCrystals: state.addCrystals,
            clanCoins: state.clanCoins,
            addClanCoins: state.addClanCoins,
            level: state.level,
            name: state.name,
        }))
    );

    const isLight = uiTheme === 'LIGHT';

    const [view, setView] = useState<'BROWSE' | 'CREATE' | 'DASHBOARD'>(clanId ? 'DASHBOARD' : 'BROWSE');
    const [dashboardTab, setDashboardTab] = useState<'LOBBY' | 'MEMBERS' | 'STORE' | 'BANK'>('LOBBY');

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkLayout = () => {
            setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    const [members, setMembers] = useState<ClanMember[]>([]);
    const [playerContribution, setPlayerContribution] = useState(0);
    const [appliedClans, setAppliedClans] = useState<string[]>([]);

    useEffect(() => {
        if (clanId) {
            const mockClan = MOCK_CLANS.find(c => c.id === clanId);
            const activeClanData = clanData || mockClan;
            if (activeClanData) {
                setClanLevelData({
                    level: activeClanData.level || 1,
                    xp: activeClanData.xp || 0,
                    maxXp: activeClanData.maxXp || 1000
                });
            } else {
                setClanLevelData({ level: 1, xp: 0, maxXp: 1000 });
            }
        } else {
            setClanLevelData({ level: 1, xp: 0, maxXp: 1000 });
        }
        setPlayerContribution(0);
    }, [clanId, clanData]);

    useEffect(() => {
        if (clanId && clanData && dashboardTab === 'BANK') {
            const now = Date.now();
            const lastTime = clanData.lastInterestTime || now;
            // Limit calculation to a maximum of 24 hours to prevent extreme scaling if player is away for months
            const elapsedHours = Math.min(24, (now - lastTime) / (1000 * 60 * 60));
            if (elapsedHours > 0.01) { // Calculate interest if more than 36 seconds passed
                const goldBank = clanData.goldBank !== undefined ? clanData.goldBank : 5000;
                const crystalsBank = clanData.crystalsBank !== undefined ? clanData.crystalsBank : 250;
                const bankLevel = clanData.bankLevel || 1;
                
                const goldRate = 0.001 + (bankLevel - 1) * 0.001; // 0.1% to 0.5% per hour
                const crystalsRate = 0.0005 * bankLevel; // 0.05% to 0.25% per hour
                
                const goldGrown = Math.floor(goldBank * goldRate * elapsedHours);
                const crystalsGrown = Math.floor(crystalsBank * crystalsRate * elapsedHours);
                
                if (goldGrown > 0 || crystalsGrown > 0) {
                    const prevTransactions = clanData.bankTransactions || [];
                    const newTransactions = [...prevTransactions];
                    
                    if (goldGrown > 0) {
                        newTransactions.unshift({
                            id: `interest_gold_${Date.now()}`,
                            type: 'DEPOSIT',
                            currency: 'GOLD',
                            author: 'Проценты Казны',
                            amount: goldGrown,
                            time: 'только что'
                        });
                    }
                    
                    if (crystalsGrown > 0) {
                        newTransactions.unshift({
                            id: `interest_cry_${Date.now()}`,
                            type: 'DEPOSIT',
                            currency: 'ALMAZ',
                            author: 'Проценты Казны',
                            amount: crystalsGrown,
                            time: 'только что'
                        });
                    }
                    
                    const updated = {
                        ...clanData,
                        goldBank: goldBank + goldGrown,
                        crystalsBank: crystalsBank + crystalsGrown,
                        lastInterestTime: now,
                        bankTransactions: newTransactions.slice(0, 30)
                    };
                    
                    useGameStore.setState({ clanData: updated });
                    syncService.debouncedSync();
                } else {
                    // Just update timestamp to avoid building up elapsed time without growing
                    const updated = {
                        ...clanData,
                        lastInterestTime: now
                    };
                    useGameStore.setState({ clanData: updated });
                }
            }
        }
    }, [clanId, dashboardTab]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (clanId) {
                const currentUserName = playerName && playerName !== 'Мастер'
                    ? playerName
                    : (vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : 'Воин');

                const playerMember: ClanMember = {
                    name: currentUserName,
                    role: clanId.startsWith('clan_') ? 'MEMBER' : 'LEADER',
                    trophies: rating,
                    lastSeen: 'В сети',
                    isOnline: true,
                    avatar: playerAvatar || '🐺',
                    frame: playerFrame || 'none',
                    contribution: playerContribution,
                    level: level || 1,
                };

                if (clanId.startsWith('clan_')) {
                    const clan = MOCK_CLANS.find(c => c.id === clanId);
                    const clanLeaderName = clan ? `${clan.name.split(' ')[0]}Глава` : 'Глава Клана';
                    setMembers([
                        {
                            name: clanLeaderName,
                            role: 'LEADER',
                            trophies: clan ? Math.floor(clan.totalTrophies / 10) : 3000,
                            lastSeen: 'В сети',
                            isOnline: true,
                            avatar: 'sprite:sprite-avatar avatar-pos-1',
                            contribution: 500,
                            level: clan ? clan.level * 2 + 5 : 20,
                        },
                        ...DEFAULT_MOCK_MEMBERS,
                        playerMember,
                    ]);
                } else {
                    setMembers([
                        playerMember,
                    ]);
                }
            } else {
                setMembers([]);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [clanId]); // RUN ONLY WHEN clanId CHANGES TO PERSIST MEMBERS ACTIONS

    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    // Create/Edit state placeholder
    const [createdClanName, setCreatedClanName] = useState('');
    const [createdClanMotto, setCreatedClanMotto] = useState('');
    const [selectedEmblem, setSelectedEmblem] = useState(EMBLEMS[0]);

    // Dashboard settings / stats
    const [isEditingClan, setIsEditingClan] = useState(false);
    const [editedMotto, setEditedMotto] = useState('');
    const [clanLevelData, setClanLevelData] = useState({ level: 1, xp: 0, maxXp: 1000 });

    const colors = {
        text: isLight ? '#4a3219' : '#f7ebd3',
        accent: isLight ? '#8b4513' : '#f0c040',
        card: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(20, 12, 6, 0.75)',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.25)',
        danger: '#ef4444',
        success: '#4ade80',
    };

    const handleApply = (clan: ClanData) => {
        if (appliedClans.includes(clan.id)) return;
        setAppliedClans((prev) => [...prev, clan.id]);
        useGameStore.getState().showAlert(`Заявка отправлена офицерам клана ${clan.name}!`);
    };

    const handleJoin = (clan: ClanData) => {
        if (rating < clan.minTrophies) return;
        if (clan.type === 'CLOSED') return;
        if (clan.type === 'INVITE') {
            handleApply(clan);
            return;
        }
        joinClan(clan.id, clan);
        setView('DASHBOARD');
    };

    const handleLeave = () => {
        const name = useGameStore.getState().name;
        const vkUser = useGameStore.getState().vkUser;
        const currentUserName = name && name !== 'Мастер' 
            ? name 
            : (vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : 'Воин');
        const playerMember = members.find((m) => m.name === currentUserName);
        const isLeader = playerMember ? playerMember.role === 'LEADER' : (!clanId?.startsWith('clan_'));

        const confirmText = isLeader 
            ? 'Вы действительно хотите распустить свой клан? Это действие нельзя будет отменить, и клан будет полностью удален.'
            : 'Вы действительно хотите покинуть клан?';

        useGameStore.getState().showConfirm(confirmText, () => {
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
            name: name.trim(),
            motto: motto ? motto.trim() : '',
            level: 1,
            membersCount: 1,
            maxMembers: 10,
            totalTrophies: rating,
            emblem: emblem,
            minTrophies: 0,
            type: 'OPEN',
            onlineCount: 1,
            xp: 0,
            maxXp: 1000,
        };

        setCreatedClanName(name.trim());
        setCreatedClanMotto(motto ? motto.trim() : '');
        setSelectedEmblem(emblem);

        // Deduct crystals
        state.addCrystals(-200);
        joinClan(newClan.id, newClan);
        setShowSuccess(true);
    };

    const handleSaveChanges = () => {
        const store = useGameStore.getState();
        const currentClan = store.clanData;
        if (!currentClan) return;

        const updatedClan = {
            ...currentClan,
            emblem: selectedEmblem,
            motto: editedMotto.trim(),
        };
        useGameStore.setState({ clanData: updatedClan });
        syncService.debouncedSync();
        setIsEditingClan(false);
    };

    const handleDonate = (amount: number, currency: 'GOLD' | 'ALMAZ') => {
        const store = useGameStore.getState();
        const currentClanData = store.clanData || (clanId ? MOCK_CLANS.find(c => c.id === clanId) : null);
        if (!currentClanData) return;

        const currentUserName = playerName && playerName !== 'Мастер'
            ? playerName
            : (vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : 'Воин');

        let coinsEarned = 0;
        let nextLevel = clanLevelData.level;
        let nextXp = clanLevelData.xp;
        let nextMaxXp = clanLevelData.maxXp;

        const updatedClanData = { ...currentClanData };

        if (currency === 'GOLD') {
            if (gold < amount) return setError(`Недостаточно золота для вклада (нужно ${amount})!`);
            addGold(-amount);
            coinsEarned = Math.floor(amount / 10);
            nextXp += Math.floor(amount / 20);
            const prevBank = currentClanData.goldBank !== undefined ? currentClanData.goldBank : 5000;
            updatedClanData.goldBank = prevBank + amount;
        } else {
            if (crystals < amount) return setError(`Недостаточно алмазов для вклада (нужно ${amount})!`);
            addCrystals(-amount);
            coinsEarned = amount * 2;
            nextXp += amount; // 1 crystal = 1 XP
            const prevCrystals = currentClanData.crystalsBank !== undefined ? currentClanData.crystalsBank : 250;
            updatedClanData.crystalsBank = prevCrystals + amount;
        }

        if (nextXp >= nextMaxXp) {
            nextLevel = clanLevelData.level + 1;
            nextXp = nextXp - nextMaxXp;
            nextMaxXp = nextLevel * 1000;
        }

        setClanLevelData({ level: nextLevel, xp: nextXp, maxXp: nextMaxXp });

        const prevTransactions = currentClanData.bankTransactions || [];
        const newTx = {
            id: Date.now().toString(),
            type: 'DEPOSIT',
            currency: currency,
            author: currentUserName,
            amount: amount,
            time: 'только что'
        };

        updatedClanData.level = nextLevel;
        updatedClanData.xp = nextXp;
        updatedClanData.maxXp = nextMaxXp;
        updatedClanData.bankTransactions = [newTx, ...prevTransactions].slice(0, 30);

        useGameStore.setState({ clanData: updatedClanData });
        addClanCoins(coinsEarned);

        setPlayerContribution((prev) => {
            const nextContribution = prev + coinsEarned;
            setMembers((mList) =>
                mList.map((m) => (m.name === currentUserName ? { ...m, contribution: nextContribution } : m))
            );
            return nextContribution;
        });

        setError(null);
        syncService.debouncedSync();
    };

    const handleWithdraw = (amount: number, currency: 'GOLD' | 'ALMAZ') => {
        const store = useGameStore.getState();
        const currentClanData = store.clanData || (clanId ? MOCK_CLANS.find(c => c.id === clanId) : null);
        if (!currentClanData) return;

        const currentUserName = playerName && playerName !== 'Мастер'
            ? playerName
            : (vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : 'Воин');

        const updatedClanData = { ...currentClanData };
        const prevTransactions = currentClanData.bankTransactions || [];

        if (currency === 'GOLD') {
            const currentBank = currentClanData.goldBank !== undefined ? currentClanData.goldBank : 5000;
            if (currentBank < amount) {
                return setError(`В банке клана недостаточно золота (доступно ${currentBank})!`);
            }
            updatedClanData.goldBank = currentBank - amount;
            addGold(amount);
        } else {
            const currentCrystals = currentClanData.crystalsBank !== undefined ? currentClanData.crystalsBank : 250;
            if (currentCrystals < amount) {
                return setError(`В банке клана недостаточно алмазов (доступно ${currentCrystals})!`);
            }
            updatedClanData.crystalsBank = currentCrystals - amount;
            addCrystals(amount);
        }

        const newTx = {
            id: Date.now().toString(),
            type: 'WITHDRAW',
            currency: currency,
            author: currentUserName,
            amount: amount,
            time: 'только что'
        };

        updatedClanData.bankTransactions = [newTx, ...prevTransactions].slice(0, 30);

        useGameStore.setState({ clanData: updatedClanData });
        setError(null);
        useGameStore.getState().showAlert(`Успешно снято ${amount} ${currency === 'GOLD' ? 'золота' : 'алмазов'} из казны клана!`);
        syncService.debouncedSync();
    };

    const handleUpgradeBank = () => {
        const store = useGameStore.getState();
        const currentClanData = store.clanData || (clanId ? MOCK_CLANS.find(c => c.id === clanId) : null);
        if (!currentClanData) return;

        const currentLevel = currentClanData.bankLevel || 1;
        if (currentLevel >= 5) {
            return setError('Казна уже максимального уровня!');
        }

        const requiredClanLevel = currentLevel + 1;
        if (clanLevelData.level < requiredClanLevel) {
            return setError(`Для улучшения казны до уровня ${requiredClanLevel} требуется уровень клана: ${requiredClanLevel}!`);
        }

        const cost = currentLevel * 10000;
        const currentBankGold = currentClanData.goldBank !== undefined ? currentClanData.goldBank : 5000;

        if (currentBankGold < cost) {
            return setError(`В казне недостаточно золота для улучшения (нужно ${cost}, доступно ${currentBankGold})!`);
        }

        const currentUserName = playerName && playerName !== 'Мастер'
            ? playerName
            : (vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : 'Воин');

        const prevTransactions = currentClanData.bankTransactions || [];
        const newTx = {
            id: Date.now().toString(),
            type: 'UPGRADE',
            currency: 'GOLD',
            author: currentUserName,
            amount: cost,
            time: 'только что'
        };

        const updated = {
            ...currentClanData,
            bankLevel: currentLevel + 1,
            goldBank: currentBankGold - cost,
            bankTransactions: [newTx, ...prevTransactions].slice(0, 30)
        };

        useGameStore.setState({ clanData: updated });
        useGameStore.getState().showAlert(`Казна успешно улучшена до уровня ${currentLevel + 1}!`);
        setError(null);
        syncService.debouncedSync();
    };

    const handleToggleOfficersWithdraw = (enabled: boolean) => {
        const store = useGameStore.getState();
        const currentClanData = store.clanData || (clanId ? MOCK_CLANS.find(c => c.id === clanId) : null);
        if (!currentClanData) return;

        const updated = {
            ...currentClanData,
            officersCanWithdraw: enabled
        };
        useGameStore.setState({ clanData: updated });
        syncService.debouncedSync();
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

    const handlePromoteMember = (memberName: string) => {
        setMembers((prev) =>
            prev.map((m) => (m.name === memberName ? { ...m, role: 'OFFICER' } : m))
        );
    };

    const handleDemoteMember = (memberName: string) => {
        setMembers((prev) =>
            prev.map((m) => (m.name === memberName ? { ...m, role: 'MEMBER' } : m))
        );
    };

    const handleTransferLeadership = (memberName: string) => {
        const currentUserName = playerName && playerName !== 'Мастер'
            ? playerName
            : (vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : 'Воин');
        
        setMembers((prev) =>
            prev.map((m) => {
                if (m.name === memberName) {
                    return { ...m, role: 'LEADER' };
                }
                if (m.name === currentUserName) {
                    return { ...m, role: 'OFFICER' };
                }
                return m;
            })
        );
        useGameStore.getState().showAlert(`Вы передали руководство клана игроку ${memberName}!`);
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                padding: '24px',
                boxSizing: 'border-box',
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
                              : (clanData?.name || createdClanName)}
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
                            active={dashboardTab === 'BANK'}
                            onClick={() => setDashboardTab('BANK')}
                            label="КАЗНА"
                            colors={colors}
                        />
                        {/* 
                        <TabButton
                            active={dashboardTab === 'STORE'}
                            onClick={() => setDashboardTab('STORE')}
                            label="МАГАЗИН"
                            colors={colors}
                        />
                        */}
                    </div>
                )}
            </div>

            <motion.div
                drag={isMobile && view === 'DASHBOARD' ? "x" : undefined}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                    if (!isMobile || view !== 'DASHBOARD') return;
                    const TABS = ['LOBBY', 'MEMBERS', 'BANK'] as const;
                    const swipeThreshold = 50;
                    const currentIndex = TABS.indexOf(dashboardTab as any);
                    if (info.offset.x < -swipeThreshold) {
                        if (currentIndex < TABS.length - 1) {
                            setDashboardTab(TABS[currentIndex + 1]);
                        }
                    } else if (info.offset.x > swipeThreshold) {
                        if (currentIndex > 0) {
                            setDashboardTab(TABS[currentIndex - 1]);
                        }
                    }
                }}
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    touchAction: isMobile && view === 'DASHBOARD' ? 'pan-y' : 'auto',
                    minHeight: 0,
                }}
            >
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
                            appliedClans={appliedClans}
                            onApply={handleApply}
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
                            onEditClan={() => {
                                const currentClan = clanData;
                                setSelectedEmblem(currentClan?.emblem || EMBLEMS[0]);
                                setEditedMotto(currentClan?.motto || '');
                                setIsEditingClan(true);
                            }}
                            onLeave={handleLeave}
                        />
                    )}

                    {view === 'DASHBOARD' && dashboardTab === 'BANK' && (
                        <ClanBankTab
                            colors={colors}
                            clanData={clanData}
                            clanLevelData={clanLevelData}
                            members={members}
                            gold={gold}
                            crystals={crystals}
                            playerRole={(() => {
                                const currentUserName = playerName && playerName !== 'Мастер'
                                    ? playerName
                                    : (vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : 'Воин');
                                const playerMember = members.find((m) => m.name === currentUserName);
                                return playerMember ? playerMember.role : (clanId?.startsWith('clan_') ? 'MEMBER' : 'LEADER');
                            })()}
                            onDonate={handleDonate}
                            onWithdraw={handleWithdraw}
                            onUpgradeBank={handleUpgradeBank}
                            onToggleOfficersWithdraw={handleToggleOfficersWithdraw}
                            error={error}
                            setError={setError}
                        />
                    )}

                    {view === 'DASHBOARD' && dashboardTab === 'MEMBERS' && (
                        <ClanMembersTab
                            colors={colors}
                            members={members}
                            isLight={isLight}
                            onKickMember={handleKickMember}
                            onPromoteMember={handlePromoteMember}
                            onDemoteMember={handleDemoteMember}
                            onTransferLeadership={handleTransferLeadership}
                        />
                    )}

                    {view === 'DASHBOARD' && dashboardTab === 'STORE' && (
                        <ClanStoreTab colors={colors} onBuyItem={handleBuyItem} />
                    )}
                </AnimatePresence>
            </motion.div>

            {/* CLAN SETTINGS MODAL */}
            <AnimatePresence>
                {isEditingClan && (
                    <div
                        onClick={() => setIsEditingClan(false)}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.88)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(12px)',
                            cursor: 'pointer',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.93, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.93, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '460px',
                                background: isLight ? '#f5f0e1' : 'linear-gradient(135deg, #221810 0%, #0f0a06 100%)',
                                border: `2px solid ${colors.accent}`,
                                borderRadius: '24px',
                                padding: '36px',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                            }}
                        >
                            <h3
                                style={{
                                    color: colors.accent,
                                    fontSize: '26px',
                                    marginBottom: '28px',
                                    fontFamily: "'Cinzel', serif",
                                    textAlign: 'center',
                                    fontWeight: 900,
                                    letterSpacing: '1px',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                }}
                            >
                                Управление Кланом
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Motto input */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 900,
                                            color: colors.accent,
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            opacity: 0.8,
                                        }}
                                    >
                                        Девиз клана
                                    </label>
                                    <input
                                        type="text"
                                        value={editedMotto}
                                        onChange={(e) => setEditedMotto(e.target.value)}
                                        placeholder="Введите девиз или описание клана..."
                                        maxLength={80}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'rgba(0,0,0,0.4)',
                                            border: `1.5px solid ${colors.border}`,
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    />
                                </div>

                                {/* Emblem Selection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 900,
                                            color: colors.accent,
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            opacity: 0.8,
                                        }}
                                    >
                                        Эмблема клана
                                    </label>
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: '12px',
                                            marginTop: '4px',
                                        }}
                                    >
                                        {EMBLEMS.map((e) => {
                                            const emojiMap: Record<string, string> = {
                                                lion: '🦁',
                                                bear: '🐻',
                                                eagle: '🦅',
                                                wolf: '🐺',
                                                fox: '🦊',
                                                tiger: '🐯',
                                                dragon: '🐉',
                                                owl: '🦉',
                                            };
                                            const isSelected = selectedEmblem === e;
                                            return (
                                                <motion.button
                                                    key={e}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedEmblem(e)}
                                                    style={{
                                                        aspectRatio: '1',
                                                        background: isSelected 
                                                            ? 'radial-gradient(circle, rgba(240,192,64,0.3) 0%, rgba(200,149,42,0.1) 100%)' 
                                                            : 'rgba(0,0,0,0.3)',
                                                        border: isSelected 
                                                            ? `2px solid ${colors.accent}` 
                                                            : `1.5px solid rgba(255,255,255,0.1)`,
                                                        borderRadius: '50%',
                                                        cursor: 'pointer',
                                                        fontSize: '28px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: isSelected ? '0 0 15px rgba(240,192,64,0.4)' : 'none',
                                                        transition: 'border-color 0.2s, background-color 0.2s',
                                                    }}
                                                >
                                                    {emojiMap[e] || '🛡️'}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                                    <ActionButton
                                        label="СОХРАНИТЬ ИЗМЕНЕНИЯ"
                                        color={colors.accent}
                                        onClick={handleSaveChanges}
                                    />
                                    <ActionButton
                                        label="ОТМЕНА"
                                        color="rgba(255,255,255,0.3)"
                                        onClick={() => setIsEditingClan(false)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SUCCESS CELEBRATION POPUP */}
            <AnimatePresence>
                {showSuccess && (
                    <div
                        onClick={() => {
                            setShowSuccess(false);
                            setView('DASHBOARD');
                        }}
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
                            cursor: 'pointer',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '30px',
                                position: 'relative',
                                padding: '40px',
                                cursor: 'default',
                            }}
                        >
                            {/* Кнопка закрытия (крестик) */}
                            <button
                                onClick={() => {
                                    setShowSuccess(false);
                                    setView('DASHBOARD');
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '-10px',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1.5px solid rgba(251, 191, 36, 0.4)',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    color: '#fbbf24',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 0 10px rgba(251, 191, 36, 0.1)',
                                }}
                            >
                                ✖
                            </button>

                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                style={{
                                    filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.5))',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <ClanEmblemIcon emblem={selectedEmblem} size={160} />
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

export default ClanWindow;
