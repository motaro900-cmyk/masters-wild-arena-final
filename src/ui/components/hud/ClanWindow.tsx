import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRankInfo } from '../../../configs/RankSystem';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';

interface ClanMember {
    name: string;
    role: 'LEADER' | 'OFFICER' | 'MEMBER';
    trophies: number;
    lastSeen: string;
    isOnline: boolean;
    avatar: string;
    contribution: number; // Вклад за неделю
}

interface ClanData {
    id: string;
    name: string;
    motto: string;
    level: number;
    membersCount: number;
    maxMembers: number;
    totalTrophies: number;
    emblem: string;
    minTrophies: number;
    type: 'OPEN' | 'INVITE' | 'CLOSED';
    onlineCount: number;
    xp: number;
    maxXp: number;
}

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

const MOCK_CLANS: ClanData[] = [];



const SHOP_ITEMS: ShopItem[] = [
    { id: 'c_chest_1', name: 'КЛАНОВЫЙ СУНДУК', description: 'Случайные ресурсы и осколки героев.', price: 500, icon: '📦', rarity: 'RARE' },
    { id: 'c_shards_1', name: 'ОСКОЛКИ ГЕРОЯ (x5)', description: '5 случайных осколков эпического героя.', price: 200, icon: '💎', rarity: 'EPIC' },
    { id: 'c_gold_1', name: 'СУМКА ЗОЛОТА', description: 'Мгновенно дает 5,000 золота.', price: 300, icon: '💰', rarity: 'COMMON' },
];

const EMBLEMS = ['🦁', '🐻', '🦅', '🐺', '🦊', '🐯', '🐍', '🐲'];

const CurrencyIcon: React.FC<{ type: 'GOLD' | 'ALMAZ', size?: number }> = ({ type, size = 20 }) => (
    <img 
        src={resolveAssetPath(type === 'ALMAZ' ? '/assets/images/ui/icons/almaz.png' : '/assets/images/ui/icons/Gold.png')} 
        style={{ width: size, height: size, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block', marginLeft: '4px' }}
        alt={type}
    />
);

export const ClanWindow: React.FC = () => {
    const { clanId, clanData, joinClan, leaveClan, uiTheme, rating, vkUser, avatar: playerAvatar, gold, addGold, clanCoins, addClanCoins } = useGameStore();
    const isLight = uiTheme === 'LIGHT';

    const [view, setView] = useState<'BROWSE' | 'CREATE' | 'DASHBOARD'>(clanId ? 'DASHBOARD' : 'BROWSE');
    const [dashboardTab, setDashboardTab] = useState<'LOBBY' | 'MEMBERS' | 'STORE'>('LOBBY');

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'TROPHIES' | 'LEVEL' | 'MEMBERS'>('TROPHIES');

    const [selectedMember, setSelectedMember] = useState<ClanMember | null>(null);
    
    const [members, setMembers] = useState<ClanMember[]>([]);

    React.useEffect(() => {
        if (clanId) {
            setMembers([{
                name: vkUser?.first_name || 'Воин',
                role: 'LEADER',
                trophies: rating,
                lastSeen: 'Online',
                isOnline: true,
                avatar: playerAvatar || '🐺',
                contribution: 0
            }]);
        } else {
            setMembers([]);
        }
    }, [clanId, vkUser, rating, playerAvatar]);

    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);

    // Create Clan State
    const [newClanName, setNewClanName] = useState('');
    const [newClanMotto, setNewClanMotto] = useState('');
    const [selectedEmblem, setSelectedEmblem] = useState(EMBLEMS[0]);

    // Dashboard dynamic state
    const [clanMOTD, setClanMOTD] = useState("Внимание, Мастера! Завтра в 20:00 стартует Клановая Осада.");
    const [isEditingMOTD, setIsEditingMOTD] = useState(false);
    const [isEditingClan, setIsEditingClan] = useState(false);
    const [clanLevelData, setClanLevelData] = useState({ level: 1, xp: 250, maxXp: 1000 });

    const colors = {
        text: isLight ? '#4a3219' : '#e8d8a8',
        accent: isLight ? '#8b4513' : '#f0c040',
        card: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.15)',
        danger: '#ef4444',
        success: '#4ade80'
    };

    const filteredClans = useMemo(() => {
        return MOCK_CLANS
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                if (sortBy === 'TROPHIES') return b.totalTrophies - a.totalTrophies;
                if (sortBy === 'LEVEL') return b.level - a.level;
                if (sortBy === 'MEMBERS') return b.membersCount - a.membersCount;
                return 0;
            });
    }, [searchQuery, sortBy]);

    const handleJoin = (clan: ClanData) => {
        if (rating < clan.minTrophies) return;
        if (clan.type === 'CLOSED') return;
        joinClan(clan.id, clan);
        setView('DASHBOARD');
    };

    const handleLeave = () => {
        if (window.confirm('Вы действительно хотите покинуть клан?')) {
            leaveClan();
            setView('BROWSE');
        }
    };

    const handleCreateClan = () => {
        if (!newClanName.trim()) {
            setError('Введите название клана!');
            return;
        }

        const state = useGameStore.getState();

        if (state.crystals < 200) {
            setError('Недостаточно алмазов!');
            return;
        }

        const newClan: ClanData = {
            id: Date.now().toString(),
            name: newClanName.toUpperCase(),
            motto: newClanMotto || 'Мы — мастера дикой природы!',
            level: 1,
            membersCount: 1,
            maxMembers: 50,
            totalTrophies: rating,
            emblem: selectedEmblem,
            minTrophies: 0,
            type: 'OPEN',
            onlineCount: 1,
            xp: 0,
            maxXp: 1000
        };

        // Списываем алмазы
        state.addCrystals(-200);
        joinClan(newClan.id, newClan);
        setShowSuccess(true);
    };

    const handleDonate = () => {
        if (gold < 1000) return setError('Недостаточно золота для вклада (нужно 1000)!');
        addGold(-1000);
        addClanCoins(100);
        
        // Прокачка уровня
        setClanLevelData(prev => {
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
        alert(`Куплено: ${item.name}!`);
    };

    return (
        <div style={{
            width: '100%',
            height: '650px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '10px',
            position: 'relative',
            color: colors.text
        }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: '24px', color: colors.accent }}>
                        {view === 'BROWSE' ? 'ПОИСК КЛАНОВ' : view === 'CREATE' ? 'ОСНОВАНИЕ КЛАНА' : `КЛАН: ${clanData?.name || newClanName}`}
                    </h2>
                    {view === 'DASHBOARD' && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ background: colors.card, padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 800, color: colors.accent, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center' }}>
                                <CurrencyIcon type="GOLD" size={16} />
                                <span style={{ marginLeft: '5px' }}>{clanCoins} монеты</span>
                            </div>
                        </div>
                    )}
                </div>
                {view === 'DASHBOARD' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <TabButton active={dashboardTab === 'LOBBY'} onClick={() => setDashboardTab('LOBBY')} label="ШТАБ" colors={colors} />
                        <TabButton active={dashboardTab === 'MEMBERS'} onClick={() => setDashboardTab('MEMBERS')} label="СОСТАВ" colors={colors} />
                        <TabButton active={dashboardTab === 'STORE'} onClick={() => setDashboardTab('STORE')} label="МАГАЗИН" colors={colors} />
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === 'BROWSE' && (
                    <motion.div
                        key="browse"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{
                                flex: 1,
                                background: colors.card,
                                borderRadius: '12px',
                                border: `1px solid ${colors.border}`,
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                            }}>
                                <span style={{ fontSize: '20px', opacity: 0.5 }}>🔍</span>
                                <input
                                    placeholder="Поиск по названию..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ background: 'none', border: 'none', color: colors.text, outline: 'none', width: '100%', fontSize: '16px' }}
                                />
                            </div>

                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                style={{
                                    padding: '12px',
                                    background: colors.card,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '12px',
                                    color: colors.text,
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="TROPHIES">По трофеям</option>
                                <option value="LEVEL">По уровню</option>
                                <option value="MEMBERS">По участникам</option>
                            </select>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setView('CREATE')}
                                style={{
                                    padding: '15px 30px',
                                    background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#000',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    boxShadow: '0 5px 15px rgba(240,192,64,0.3)',
                                    textTransform: 'uppercase',
                                    fontSize: '14px'
                                }}
                            >
                                Создать
                            </motion.button>
                        </div>

                        <div className="leaderboard-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '10px' }}>
                            {filteredClans.map(clan => (
                                <ClanCard
                                    key={clan.id}
                                    clan={clan}
                                    onJoin={() => handleJoin(clan)}
                                    colors={colors}
                                    playerTrophies={rating}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {view === 'CREATE' && (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px', padding: '40px', background: colors.card, borderRadius: '20px', border: `1px solid ${colors.border}` }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontFamily: "'Cinzel', serif", color: colors.accent, fontSize: '32px', margin: 0 }}>Основание Клана</h2>
                            <p style={{ opacity: 0.7, marginTop: '5px' }}>Создайте свой союз и ведите его к славе!</p>
                        </div>

                        <div style={{ display: 'flex', gap: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ width: '150px', height: '150px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: `2px solid ${colors.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>
                                    {selectedEmblem}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                    {EMBLEMS.map(e => (
                                        <button
                                            key={e}
                                            onClick={() => setSelectedEmblem(e)}
                                            style={{
                                                width: '32px', height: '32px', padding: 0, background: selectedEmblem === e ? colors.accent : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '20px'
                                            }}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Название клана</label>
                                    <input
                                        value={newClanName}
                                        onChange={e => {
                                            setNewClanName(e.target.value);
                                            if (error) setError(null);
                                        }}
                                        placeholder="Введите легендарное имя..."
                                        maxLength={20}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '15px', color: '#fff', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Девиз клана</label>
                                    <textarea
                                        value={newClanMotto}
                                        onChange={e => {
                                            setNewClanMotto(e.target.value);
                                            if (error) setError(null);
                                        }}
                                        placeholder="Какая ваша цель?"
                                        maxLength={60}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '15px', color: '#fff', outline: 'none', resize: 'none', height: '80px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0 }} 
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}
                                    >
                                        ⚠️ {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <button
                                    onClick={() => setView('BROWSE')}
                                    style={{ flex: 1, padding: '15px', background: 'none', border: `1px solid ${colors.border}`, color: colors.text, borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    ОТМЕНА
                                </button>
                                <button
                                    onClick={handleCreateClan}
                                    style={{ flex: 2, padding: '15px', background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)', border: 'none', color: '#000', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 5px 15px rgba(240,192,64,0.3)' }}
                                >
                                    ОСНОВАТЬ КЛАН (200 <CurrencyIcon type="ALMAZ" />)
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'DASHBOARD' && dashboardTab === 'LOBBY' && (
                    <motion.div
                        key="lobby"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '30px',
                            padding: '25px',
                            background: 'linear-gradient(90deg, rgba(240,192,64,0.15) 0%, rgba(0,0,0,0.4) 100%)',
                            borderRadius: '15px',
                            border: `1px solid ${colors.border}`,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ width: '100px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', background: 'rgba(0,0,0,0.3)', borderRadius: '15px', border: `2px solid ${colors.accent}` }}>
                                {clanData?.emblem || '🦁'}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <h2 style={{ margin: 0, color: colors.accent, fontFamily: "'Cinzel', serif", fontSize: '32px' }}>{clanData?.name || newClanName || 'ЗОЛОТЫЕ ЛЬВЫ'}</h2>
                                    <span style={{ padding: '4px 10px', background: colors.accent, color: '#000', borderRadius: '4px', fontSize: '12px', fontWeight: 900 }}>LVL {clanLevelData.level}</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', marginTop: '10px', position: 'relative', overflow: 'hidden', width: '250px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ width: `${(clanLevelData.xp / clanLevelData.maxXp) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #f0c040, #fffae0)', boxShadow: '0 0 10px rgba(240,192,64,0.5)' }} />
                                    <span style={{ position: 'absolute', width: '100%', textAlign: 'center', fontSize: '8px', top: 0, fontWeight: 900, color: '#fff', textShadow: '1px 1px 2px #000' }}>{clanLevelData.xp} / {clanLevelData.maxXp} XP</span>
                                </div>
                                <p style={{ color: colors.text, margin: '15px 0', fontSize: '14px', fontStyle: 'italic', opacity: 0.8 }}>
                                    "{clanData?.motto || newClanMotto || 'Сила в единстве, ярость в бою.'}"
                                </p>

                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <StatBlock label="ОНЛАЙН" value={`${clanData?.onlineCount || 1}/${members.length}`} />
                                    <StatBlock label="ТРОФЕИ КЛАНА" value={clanData?.totalTrophies?.toLocaleString() || rating.toLocaleString() || "0"} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    onClick={handleDonate}
                                    style={{ padding: '12px 24px', background: 'linear-gradient(180deg, #4ade80 0%, #166534 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    ВКЛАД (1000 <CurrencyIcon type="GOLD" size={16} />)
                                </motion.button>
                                <button
                                    onClick={() => setIsEditingClan(true)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, color: colors.accent, padding: '6px 15px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    ⚙️ НАСТРОЙКИ
                                </button>
                                <button
                                    onClick={handleLeave}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: 0.7 }}
                                >
                                    ПОКИНУТЬ КЛАН
                                </button>
                            </div>
                        </div>

                        {/* CHAT / MOTD SECTION */}
                        <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1, background: colors.card, borderRadius: '15px', border: `1px solid ${colors.border}`, padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: colors.accent, textTransform: 'uppercase' }}>Сообщение дня</div>
                                    <button onClick={() => setIsEditingMOTD(!isEditingMOTD)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>📝</button>
                                </div>
                                
                                {isEditingMOTD ? (
                                    <textarea 
                                        autoFocus
                                        value={clanMOTD}
                                        onChange={(e) => setClanMOTD(e.target.value)}
                                        onBlur={() => setIsEditingMOTD(false)}
                                        style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${colors.accent}`, borderRadius: '10px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', flex: 1, fontStyle: 'italic' }}
                                    />
                                ) : (
                                    <div style={{ color: colors.text, fontStyle: 'italic', opacity: 0.9, lineHeight: '1.6' }}>
                                        {clanMOTD}
                                    </div>
                                )}
                            </div>
                            <div style={{ width: '300px', background: colors.card, borderRadius: '15px', border: `1px solid ${colors.border}`, padding: '20px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: colors.accent, marginBottom: '15px', textTransform: 'uppercase' }}>Бонусы уровня</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <PerkItem icon="💰" label="+5% Золота за бой" locked={(clanData?.level || 1) < 2} />
                                    <PerkItem icon="❤️" label="+2% HP зверей" locked={(clanData?.level || 1) < 3} />
                                    <PerkItem icon="⚡" label="-10% время сундуков" locked />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'DASHBOARD' && dashboardTab === 'MEMBERS' && (
                    <motion.div
                        key="members"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                        <div style={{ display: 'flex', padding: '0 20px', color: colors.accent, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>
                            <span style={{ width: '60px' }}>Аватар</span>
                            <span style={{ flex: 1 }}>Участник</span>
                            <span style={{ width: '120px', textAlign: 'center' }}>Вклад (нед.)</span>
                            <span style={{ width: '120px', textAlign: 'center' }}>Статус</span>
                            <span style={{ width: '100px', textAlign: 'right' }}>Трофеи</span>
                        </div>

                        <div className="leaderboard-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                            {members.map((member, i) => (
                                <MemberRow
                                    key={i}
                                    member={member}
                                    onClick={() => member.name !== 'Motar' && setSelectedMember(member)}
                                    colors={colors}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {view === 'DASHBOARD' && dashboardTab === 'STORE' && (
                    <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', overflowY: 'auto', paddingRight: '10px' }}>
                        {SHOP_ITEMS.map(item => (
                            <div key={item.id} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '15px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ width: '60px', height: '60px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>{item.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 900, color: colors.accent }}>{item.name}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>{item.description}</div>
                                    <button onClick={() => handleBuyItem(item)} style={{ marginTop: '10px', padding: '6px 15px', background: colors.accent, color: '#000', border: 'none', borderRadius: '4px', fontWeight: 900, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                                        {item.price} <CurrencyIcon type="GOLD" size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CLAN SETTINGS MODAL */}
            <AnimatePresence>
                {isEditingClan && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: '450px', background: isLight ? '#f5f0e1' : '#1a1510', border: `2px solid ${colors.accent}`, borderRadius: '24px', padding: '40px' }}>
                            <h3 style={{ color: colors.accent, fontSize: '24px', marginBottom: '30px', fontFamily: "'Cinzel', serif", textAlign: 'center' }}>Управление Кланом</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Эмблема</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
                                        {EMBLEMS.map(e => (
                                            <button key={e} onClick={() => setSelectedEmblem(e)} style={{ width: '40px', height: '40px', background: selectedEmblem === e ? colors.accent : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '24px' }}>{e}</button>
                                        ))}
                                    </div>
                                </div>
                                <ActionButton label="СОХРАНИТЬ ИЗМЕНЕНИЯ" color={colors.accent} onClick={() => setIsEditingClan(false)} />
                                <ActionButton label="ЗАКРЫТЬ" color={colors.text} onClick={() => setIsEditingClan(false)} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {selectedMember && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)'
                }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '400px', background: isLight ? '#f5f0e1' : '#1a1510', border: `2px solid ${colors.accent}`, borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
                        <h3 style={{ color: colors.accent, fontSize: '28px', marginBottom: '5px', fontFamily: "'Cinzel', serif" }}>{selectedMember.name}</h3>
                        <p style={{ color: colors.text, marginBottom: '30px', opacity: 0.7 }}>Управление участником</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <ActionButton label="ИСКЛЮЧИТЬ ИЗ КЛАНА" color="#ef4444" onClick={() => { setMembers(prev => prev.filter(m => m.name !== selectedMember.name)); setSelectedMember(null); }} />
                            <ActionButton label="ОТМЕНА" color={colors.text} onClick={() => setSelectedMember(null)} />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* SUCCESS CELEBRATION POPUP */}
            <AnimatePresence>
                {showSuccess && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(15px)' }}>
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
                        >
                            <motion.div 
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} 
                                transition={{ repeat: Infinity, duration: 4 }}
                                style={{ fontSize: '120px', filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.5))' }}
                            >
                                {selectedEmblem}
                            </motion.div>
                            
                            <div>
                                <motion.h2 
                                    initial={{ y: 20, opacity: 0 }} 
                                    animate={{ y: 0, opacity: 1 }} 
                                    transition={{ delay: 0.3 }}
                                    style={{ fontFamily: "'Cinzel', serif", color: colors.accent, fontSize: '42px', margin: 0, textTransform: 'uppercase', letterSpacing: '4px' }}
                                >
                                    Клан Основан!
                                </motion.h2>
                                <motion.p 
                                    initial={{ y: 20, opacity: 0 }} 
                                    animate={{ y: 0, opacity: 1 }} 
                                    transition={{ delay: 0.5 }}
                                    style={{ color: '#fff', fontSize: '18px', opacity: 0.8, marginTop: '10px' }}
                                >
                                    Да начнется великая история клана <span style={{ color: colors.accent, fontWeight: 900 }}>{newClanName.toUpperCase()}</span>
                                </motion.p>
                            </div>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setShowSuccess(false);
                                    setView('DASHBOARD');
                                }}
                                style={{ padding: '20px 60px', background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)', border: 'none', borderRadius: '40px', color: '#000', fontWeight: 900, fontSize: '18px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(240,192,64,0.4)', textTransform: 'uppercase' }}
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

const TabButton: React.FC<{ active: boolean, label: string, onClick: () => void, colors: any }> = ({ active, label, onClick, colors }) => (
    <button
        onClick={onClick}
        style={{
            padding: '8px 16px',
            background: active ? colors.accent : 'transparent',
            border: `1px solid ${active ? colors.accent : colors.border}`,
            color: active ? '#000' : colors.text,
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        }}
    >
        {label}
    </button>
);

const ClanCard: React.FC<{ clan: ClanData, onJoin: () => void, colors: any, playerTrophies: number }> = ({ clan, onJoin, colors, playerTrophies }) => {
    const canJoin = playerTrophies >= clan.minTrophies && clan.type !== 'CLOSED';

    return (
        <motion.div
            whileHover={{ x: 5, backgroundColor: 'rgba(240,192,64,0.08)' }}
            style={{
                padding: '20px',
                background: colors.card,
                borderRadius: '15px',
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}
        >
            <div style={{ width: '60px', height: '60px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: `1px solid ${colors.accent}44` }}>
                {clan.emblem}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: colors.accent, fontFamily: "'Cinzel', serif" }}>{clan.name}</div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', opacity: 0.7 }}>LVL {clan.level}</span>
                </div>
                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>{clan.motto}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: colors.success }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.success }} />
                        Онлайн: {clan.onlineCount}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.5 }}>•</div>
                    <div style={{ fontSize: '11px', color: playerTrophies >= clan.minTrophies ? colors.text : colors.danger, fontWeight: 700 }}>
                        🏆 Мин: {clan.minTrophies}
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '30px', textAlign: 'center' }}>
                <StatItem label="Участники" value={`${clan.membersCount}/${clan.maxMembers}`} />
                <StatItem label="Трофеи" value={(clan.totalTrophies / 1000).toFixed(1) + 'K'} />
            </div>
            <button
                onClick={canJoin ? onJoin : undefined}
                style={{
                    padding: '10px 20px',
                    background: canJoin ? 'rgba(240,192,64,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${canJoin ? colors.accent : colors.border}`,
                    color: canJoin ? colors.accent : colors.border,
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: canJoin ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}
            >
                {!canJoin && <span>🔒</span>}
                {clan.type === 'INVITE' ? 'Заявка' : clan.type === 'CLOSED' ? 'Закрыт' : 'Вступить'}
            </button>
        </motion.div>
    );
};

const StatItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '16px', fontWeight: 900 }}>{value}</div>
    </div>
);

const StatBlock: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 800 }}>{label}</div>
        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900 }}>{value}</div>
    </div>
);

const PerkItem: React.FC<{ icon: string, label: string, locked?: boolean }> = ({ icon, label, locked }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', opacity: locked ? 0.4 : 1 }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{label}</span>
        {locked && <span style={{ fontSize: '12px' }}>🔒</span>}
    </div>
);

const MemberRow: React.FC<{ member: ClanMember, onClick: () => void, colors: any }> = ({ member, onClick, colors }) => (
    <motion.div
        whileHover={{ backgroundColor: 'rgba(240,192,64,0.08)' }}
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', padding: '12px 20px', background: colors.card, borderRadius: '12px', border: `1px solid ${colors.border}`, cursor: 'pointer'
        }}
    >
        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginRight: '15px' }}>
            {member.avatar}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>{member.name}</div>
            <div style={{ color: getRankInfo(member.trophies).color, fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{getRankInfo(member.trophies).icon}</span>
                {getRankInfo(member.trophies).name} • {member.role}
            </div>
        </div>
        <div style={{ width: '120px', textAlign: 'center', color: colors.accent, fontWeight: 800 }}>
            {member.contribution}
        </div>
        <div style={{ width: '120px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: member.isOnline ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)', color: member.isOnline ? '#4ade80' : '#888', border: `1px solid ${member.isOnline ? '#4ade8044' : '#ffffff22'}` }}>
                {member.lastSeen}
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px', justifyContent: 'flex-end' }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>{member.trophies.toLocaleString()}</span>
            <span style={{ fontSize: '14px' }}>🏆</span>
        </div>
    </motion.div>
);

const ActionButton: React.FC<{ label: string, color: string, onClick: () => void }> = ({ label, color, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.02, backgroundColor: color, color: '#fff' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}`, borderRadius: '12px', color: color, fontWeight: 900, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}
    >
        {label}
    </motion.button>
);
