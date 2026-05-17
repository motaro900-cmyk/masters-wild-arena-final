import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
import { showInviteBox, sendGameRequest } from '../../../utils/VKBridge';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../configs/AssetsMap';
import { syncService } from '../../../services/SyncService';

interface FriendsWindowProps {
    onClose: () => void;
}

/**
 * FriendsWindow (v2.2) — Интеграция с VK и Стором.
 */
export const FriendsWindow: React.FC<FriendsWindowProps> = () => {
    const {
        uiTheme,
        friends,
        friendRequests,
        removeFriend,
        acceptFriendRequest,
        declineFriendRequest,
        sendGift,
        collectAllGifts,
    } = useGameStore();
    const isLight = uiTheme === 'LIGHT';

    const [activeTab, setActiveTab] = useState<'ALL' | 'ONLINE' | 'REQUESTS' | 'REWARDS' | 'WORLD'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundPlayer, setFoundPlayer] = useState<any | null>(null);
    const [worldPlayers, setWorldPlayers] = useState<any[]>([]);
    const [isLoadingWorld, setIsLoadingWorld] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 7;

    const totalPages = Math.ceil(worldPlayers.length / playersPerPage);
    const paginatedPlayers = worldPlayers.slice((currentPage - 1) * playersPerPage, currentPage * playersPerPage);

    const fetchWorldPlayers = async () => {
        setIsLoadingWorld(true);
        try {
            // Запрашиваем 100 последних игроков, чтобы отфильтровать тех, кто реально в сети
            const players = await syncService.getGlobalPlayers(100);
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            const onlinePlayers = players.filter((p) => {
                if (!p.lastSeen) return false;
                // Преобразуем Firebase Timestamp в миллисекунды
                const lastSeenTime = p.lastSeen.toMillis ? p.lastSeen.toMillis() : p.lastSeen;
                return now - lastSeenTime < fiveMinutes;
            });

            setWorldPlayers(onlinePlayers);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingWorld(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'WORLD') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchWorldPlayers();
        }
    }, [activeTab]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setFoundPlayer(null);
        try {
            const player = await syncService.searchPlayerById(searchQuery);
            setFoundPlayer(player);
        } catch (e) {
            console.error('Search error:', e);
        } finally {
            setIsSearching(false);
        }
    };

    // Цветовая палитра темы
    const colors = {
        text: isLight ? '#4a3219' : '#e8d8a8',
        accent: isLight ? '#8b4513' : '#f0c040',
        cardBg: isLight ? 'rgba(0,0,0,0.05)' : 'linear-gradient(90deg, rgba(30,20,10,0.8), rgba(15,10,5,0.8))',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.15)',
        inputBg: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)',
    };

    const filteredFriends = (activeTab === 'REQUESTS' ? friendRequests : friends).filter((f: any) => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.id.includes(searchQuery);
        if (activeTab === 'ONLINE') return matchesSearch && f.online;
        return matchesSearch;
    });

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                padding: '10px 25px',
                display: 'flex',
                flexDirection: 'column',
                color: colors.text,
                fontFamily: "'Nunito', sans-serif",
            }}
        >
            {/* ПОИСК И ВКЛАДКИ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span
                            style={{
                                position: 'absolute',
                                left: 15,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: 0.4,
                                fontSize: 16,
                            }}
                        >
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="ПОИСК ПО ИМЕНИ ИЛИ ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
                            style={{
                                width: '100%',
                                padding: '14px 45px 14px 45px',
                                background: colors.inputBg,
                                border: `2px solid ${searchQuery ? colors.accent + '44' : colors.border}`,
                                borderRadius: 14,
                                color: colors.text,
                                fontSize: 13,
                                fontWeight: 800,
                                outline: 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: 15,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: colors.text,
                                    opacity: 0.5,
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    fontWeight: 900,
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, background: colors.accent, color: '#000' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (!searchQuery) showInviteBox();
                            else handleSearch();
                        }}
                        style={{
                            width: '52px',
                            height: '52px',
                            background: colors.cardBg,
                            border: `2px solid ${colors.border}`,
                            borderRadius: 14,
                            cursor: 'pointer',
                            fontSize: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.accent,
                            transition: '0.2s',
                        }}
                    >
                        {searchQuery.toUpperCase().startsWith('MW-') ? '➕' : '+'}
                    </motion.button>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                    {[
                        { id: 'ALL', label: 'ВСЕ ДРУЗЬЯ', count: friends.length },
                        { id: 'ONLINE', label: 'ДРУЗЬЯ В СЕТИ', count: friends.filter((f: any) => f.online).length },
                        { id: 'WORLD', label: 'МИР', count: worldPlayers.length },
                        { id: 'REQUESTS', label: 'ЗАПРОСЫ', count: friendRequests.length, badge: true },
                        { id: 'REWARDS', label: 'БОНУСЫ', count: 0 },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                borderRadius: 10,
                                cursor: 'pointer',
                                transition: '0.3s',
                                background: activeTab === tab.id ? colors.accent : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${activeTab === tab.id ? colors.accent : colors.border}`,
                                color: activeTab === tab.id ? '#000' : colors.text,
                                fontFamily: "'Cinzel', serif",
                                fontSize: 10,
                                fontWeight: 900,
                                position: 'relative',
                            }}
                        >
                            {tab.label}
                            {tab.badge && tab.count > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    style={{
                                        position: 'absolute',
                                        top: -5,
                                        right: -5,
                                        background: '#ff4444',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        width: 18,
                                        height: 18,
                                        fontSize: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 900,
                                        border: '2px solid #1a1510',
                                    }}
                                >
                                    {tab.count}
                                </motion.div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* QUICK ACTIONS */}
            {activeTab !== 'REQUESTS' && activeTab !== 'REWARDS' && friends.length > 0 && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={collectAllGifts}
                    style={{
                        marginBottom: 15,
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(180deg, #f0c040, #c87820)',
                        border: 'none',
                        borderRadius: 10,
                        color: '#000',
                        fontWeight: 900,
                        cursor: 'pointer',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxShadow: '0 4px 15px rgba(240,192,64,0.2)',
                    }}
                >
                    🎁 Собрать и отправить всё
                </motion.button>
            )}

            {/* СПИСОК ДРУЗЕЙ ИЛИ БОНУСЫ */}
            {/* СПИСОК ДРУЗЕЙ ИЛИ БОНУСЫ */}
            <div
                className="custom-scrollbar"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '5px',
                    maxHeight: '550px', // Prevent window stretching
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}
            >
                {activeTab === 'REWARDS' ? (
                    // ... [Rewards Content remains same] ...
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
                            whileTap={{ scale: 0.95 }}
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
                                {!useGameStore.getState().claimedSocialRewards?.includes('favorites') && (
                                    <button
                                        onClick={async () => {
                                            const { addToFavorites } = await import('../../../utils/VKBridge');
                                            const ok = await addToFavorites();
                                            if (ok) (useGameStore.getState() as any).claimFavoriteReward();
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
                                        />
                                        )
                                    </button>
                                )}
                                {!useGameStore.getState().claimedSocialRewards?.includes('group') && (
                                    <button
                                        onClick={async () => {
                                            const { joinGroup } = await import('../../../utils/VKBridge');
                                            const ok = await joinGroup();
                                            if (ok) {
                                                setTimeout(
                                                    () => (useGameStore.getState() as any).checkSocialRewards(),
                                                    3000,
                                                );
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
                                        />
                                        )
                                    </button>
                                )}
                            </div>
                            {useGameStore.getState().claimedSocialRewards?.includes('group') &&
                                useGameStore.getState().claimedSocialRewards?.includes('favorites') && (
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
                ) : activeTab === 'WORLD' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: '400px' }}>
                        {isLoadingWorld ? (
                            <div
                                style={{ textAlign: 'center', padding: '40px', color: colors.accent, fontWeight: 800 }}
                            >
                                ЗАГРУЗКА ИГРОКОВ...
                            </div>
                        ) : (
                            <>
                                {paginatedPlayers.map((p: any) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{
                                            background: colors.cardBg,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: 12,
                                            padding: '10px 15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
                                    >
                                        <div
                                            style={{
                                                position: 'relative',
                                                width: 45,
                                                height: 45,
                                                background: '#1a1008',
                                                borderRadius: 8,
                                                border: `2px solid ${colors.border}`,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundImage: `url(${resolveAssetPath(`/assets/images/avatars/${p.avatar || 'панда.webp'}`)})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                }}
                                            />
                                            {/* Зеленый индикатор ОНЛАЙН */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 2,
                                                    right: 2,
                                                    width: 10,
                                                    height: 10,
                                                    background: '#22c55e',
                                                    borderRadius: '50%',
                                                    border: '1.5px solid #1a1008',
                                                    boxShadow: '0 0 5px rgba(34,197,94,0.8)',
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontFamily: "'Cinzel', serif",
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: '#fff',
                                                }}
                                            >
                                                {p.name ? p.name.split(' ')[0] : 'Мастер'}
                                            </div>
                                            <div style={{ fontSize: 9, opacity: 0.6 }}>
                                                ID: {p.id} • LVL {p.level || 1}
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={async () => {
                                                const me = useGameStore.getState();
                                                const senderData = {
                                                    id: me.playerId,
                                                    name: me.name || 'Мастер',
                                                    avatar: me.avatar,
                                                    level: me.level,
                                                };
                                                const ok = await syncService.sendFriendRequest(p.id, senderData);
                                                if (ok) alert('Запрос отправлен!');
                                            }}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                background: colors.accent,
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                color: '#000',
                                                fontWeight: 900,
                                            }}
                                        >
                                            +
                                        </motion.button>
                                    </motion.div>
                                ))}

                                {/* PAGINATION CONTROLS */}
                                {totalPages > 1 && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 15,
                                            marginTop: '15px',
                                            padding: '10px 0',
                                        }}
                                    >
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage((prev) => prev - 1)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${colors.border}`,
                                                color: colors.accent,
                                                padding: '5px 12px',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                opacity: currentPage === 1 ? 0.3 : 1,
                                                fontSize: 11,
                                                fontWeight: 900,
                                            }}
                                        >
                                            НАЗАД
                                        </button>
                                        <span style={{ fontSize: 12, color: '#fff', opacity: 0.8, fontWeight: 700 }}>
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage((prev) => prev + 1)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${colors.border}`,
                                                color: colors.accent,
                                                padding: '5px 12px',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                opacity: currentPage === totalPages ? 0.3 : 1,
                                                fontSize: 11,
                                                fontWeight: 900,
                                            }}
                                        >
                                            ВПЕРЕД
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : filteredFriends.length > 0 ||
                  (searchQuery.length >= 4 && searchQuery.toUpperCase().startsWith('MW-')) ? (
                    <>
                        {/* LOCAL RESULTS */}
                        {filteredFriends.map((f: any) => (
                            <div
                                key={f.id}
                                style={{
                                    background: colors.cardBg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: 12,
                                    padding: '12px 15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 15,
                                    transition: '0.2s',
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <div
                                        style={{
                                            width: 55,
                                            height: 55,
                                            background: isLight ? '#d2b48c' : '#1a1008',
                                            borderRadius: 10,
                                            border: `2px solid ${colors.border}`,
                                            overflow: 'hidden',
                                            padding: 2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: 6,
                                                overflow: 'hidden',
                                                backgroundImage: `url(${resolveAssetPath(`/assets/images/avatars/${f.avatar}`)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                    </div>
                                    {f.online && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: -2,
                                                right: -2,
                                                width: 14,
                                                height: 14,
                                                background: '#22c55e',
                                                borderRadius: '50%',
                                                border: `2px solid ${isLight ? '#f5e6c8' : '#0f0a05'}`,
                                                boxShadow: '0 0 10px rgba(34,197,94,0.5)',
                                            }}
                                        />
                                    )}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: isLight ? '#5d4037' : '#fff',
                                            }}
                                        >
                                            {f.name ? f.name.split(' ')[0] : 'Мастер'}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 900,
                                                background: isLight ? 'rgba(139,69,19,0.1)' : 'rgba(240,192,64,0.1)',
                                                color: colors.accent,
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                border: `1px solid ${colors.border}`,
                                            }}
                                        >
                                            LVL {f.level}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            opacity: 0.5,
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                        }}
                                    >
                                        {f.online ? (
                                            <span style={{ color: '#22c55e' }}>● В СЕТИ</span>
                                        ) : (
                                            <span>БЫЛ(А) {f.lastSeen || 'НЕДАВНО'}</span>
                                        )}
                                        • ID: {f.id}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    {activeTab === 'REQUESTS' ? (
                                        <>
                                            <button
                                                onClick={() => acceptFriendRequest(f.id)}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    background: '#22c55e',
                                                    border: 'none',
                                                    borderRadius: 10,
                                                    cursor: 'pointer',
                                                    fontSize: 18,
                                                    color: '#fff',
                                                }}
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => declineFriendRequest(f.id)}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${colors.border}`,
                                                    borderRadius: 10,
                                                    cursor: 'pointer',
                                                    fontSize: 18,
                                                    color: '#ff4444',
                                                }}
                                            >
                                                ×
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    sendGift(f.id);
                                                    // Если это пользователь ВК, отправляем ему еще и сообщение в ЛС
                                                    if (f.id.startsWith('vk-') || f.vkId) {
                                                        sendGameRequest(
                                                            f.vkId || f.id.replace('vk-', ''),
                                                            'Я отправил тебе подарок в Masters of the Wild! Заходи скорее!',
                                                        );
                                                    }
                                                }}
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    background: f.giftSent
                                                        ? 'rgba(255,255,255,0.05)'
                                                        : 'rgba(240,192,64,0.1)',
                                                    border: `1px solid ${f.giftSent ? colors.border : colors.accent}`,
                                                    borderRadius: 12,
                                                    cursor: f.giftSent ? 'default' : 'pointer',
                                                    fontSize: 20,
                                                    color: f.giftSent ? 'rgba(255,255,255,0.2)' : colors.accent,
                                                    opacity: f.giftSent ? 0.5 : 1,
                                                }}
                                            >
                                                🎁
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${colors.border}`,
                                                    borderRadius: 12,
                                                    cursor: 'pointer',
                                                    fontSize: 20,
                                                    color: colors.text,
                                                }}
                                            >
                                                ⚔️
                                            </motion.button>
                                            <button
                                                onClick={() => removeFriend(f.id)}
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: 18,
                                                    color: '#ff4444',
                                                    opacity: 0.4,
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* GLOBAL SEARCH RESULTS */}
                        {foundPlayer && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'rgba(240,192,64,0.05)',
                                    border: `2px solid ${colors.accent}`,
                                    borderRadius: 12,
                                    padding: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 15,
                                    marginTop: 10,
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <div
                                        style={{
                                            width: 55,
                                            height: 55,
                                            background: '#1a1008',
                                            borderRadius: 10,
                                            border: `2px solid ${colors.accent}`,
                                            overflow: 'hidden',
                                            padding: 2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: 6,
                                                overflow: 'hidden',
                                                backgroundImage: `url(${resolveAssetPath(`/assets/images/avatars/${foundPlayer.avatar || 'панда.webp'}`)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: colors.accent,
                                            }}
                                        >
                                            {foundPlayer.name ? foundPlayer.name.split(' ')[0] : 'Мастер'}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 900,
                                                background: 'rgba(240,192,64,0.1)',
                                                color: colors.accent,
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                border: `1px solid ${colors.border}`,
                                            }}
                                        >
                                            LVL {foundPlayer.level || 1}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 700 }}>
                                        ID: {foundPlayer.id}
                                    </div>
                                    <div style={{ fontSize: 9, color: colors.accent, marginTop: 4, fontWeight: 900 }}>
                                        РЕЗУЛЬТАТ ПОИСКА
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        const me = useGameStore.getState();
                                        const senderData = {
                                            id: me.playerId,
                                            name: me.name || 'Мастер',
                                            avatar: me.avatar,
                                            level: me.level,
                                        };
                                        const ok = await syncService.sendFriendRequest(foundPlayer.id, senderData);
                                        if (ok) {
                                            alert('Запрос в друзья отправлен!');
                                            setFoundPlayer(null);
                                            setSearchQuery('');
                                        } else {
                                            alert('Ошибка при отправке запроса');
                                        }
                                    }}
                                    style={{
                                        padding: '10px 15px',
                                        background: colors.accent,
                                        border: 'none',
                                        borderRadius: 8,
                                        color: '#000',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        fontSize: 10,
                                        fontFamily: "'Cinzel', serif",
                                    }}
                                >
                                    ДОБАВИТЬ
                                </motion.button>
                            </motion.div>
                        )}

                        {isSearching && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '20px',
                                    color: colors.accent,
                                    fontSize: '12px',
                                    fontWeight: 800,
                                }}
                            >
                                ПОИСК ИГРОКА...
                            </div>
                        )}

                        {!isSearching && !foundPlayer && searchQuery.length >= 3 && filteredFriends.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5, fontSize: '12px' }}>
                                НИЧЕГО НЕ НАЙДЕНО
                            </div>
                        )}
                    </>
                ) : (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                                filter: [
                                    'drop-shadow(0 0 10px rgba(240,192,64,0.1))',
                                    'drop-shadow(0 0 25px rgba(240,192,64,0.4))',
                                ],
                            }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            style={{ marginBottom: 15 }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_FRIENDS}
                                style={{ width: 100, height: 100, objectFit: 'contain' }}
                                alt="friends"
                            />
                        </motion.div>
                        <div
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: 22,
                                color: colors.accent,
                                marginBottom: 8,
                                letterSpacing: '2px',
                                fontWeight: 900,
                            }}
                        >
                            ВАШИ СОЮЗНИКИ ЖДУТ
                        </div>
                        <p
                            style={{
                                fontSize: 14,
                                opacity: 0.8,
                                marginBottom: 25,
                                lineHeight: '1.5',
                                maxWidth: '80%',
                                fontWeight: 600,
                            }}
                        >
                            Вместе выживать в дикой природе легче! Приглашайте друзей и получайте ценные дары.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(240,192,64,0.5)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => showInviteBox()}
                            style={{
                                padding: '18px 50px',
                                background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                border: `1px solid #ffcc00`,
                                borderRadius: 14,
                                color: '#1a1008',
                                fontWeight: 950,
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                                fontSize: 15,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                                letterSpacing: '1px',
                            }}
                        >
                            ПРИГЛАСИТЬ ДРУЗЕЙ
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
};
