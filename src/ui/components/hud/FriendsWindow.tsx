import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { showInviteBox } from '../../../utils/VKBridge';
import { AssetsMap } from '../../../configs/AssetsMap';
import { useFriendsWindow } from './FriendsWindow/useFriendsWindow';
import { FriendRow } from './FriendsWindow/FriendRow';
import { FoundPlayerCard } from './FriendsWindow/FoundPlayerCard';
import { WorldPlayersTab } from './FriendsWindow/WorldPlayersTab';
import { RewardsTab } from './FriendsWindow/RewardsTab';
import { useGameStore } from '../../../store/useGameStore';

interface FriendsWindowProps {
    onClose: () => void;
}

export const FriendsWindow: React.FC<FriendsWindowProps> = () => {
    const {
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        isSearching,
        foundPlayer,
        setFoundPlayer,
        worldPlayers,
        isLoadingWorld,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedWorldPlayers,
        colors,
        isLight,
        filteredFriends,
        friends,
        friendRequests,
        claimedSocialRewards,

        removeFriend,
        acceptFriendRequest,
        declineFriendRequest,
        sendGift,
        collectAllGifts,
        claimGroupReward,
        claimFavoriteReward,
        handleSearch,
        handleSendFriendRequest,
    } = useFriendsWindow();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkLayout = () => {
            setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    const TABS = ['ALL', 'ONLINE', 'WORLD', 'REQUESTS', 'REWARDS'] as const;

    const handleAddFoundPlayer = async () => {
        if (!foundPlayer) return;
        const ok = await handleSendFriendRequest(foundPlayer.id);
        if (ok) {
            useGameStore.getState().showAlert('Запрос в друзья отправлен!');
            setFoundPlayer(null);
            setSearchQuery('');
        } else {
            useGameStore.getState().showAlert('Ошибка при отправке запроса');
        }
    };

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
                        whileTap={{ scale: 0.92 }}
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
                    whileTap={{ scale: 0.92 }}
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
            <motion.div
                className="custom-scrollbar"
                drag={isMobile ? "x" : undefined}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                    if (!isMobile) return;
                    const swipeThreshold = 50;
                    const currentIndex = TABS.indexOf(activeTab as any);
                    if (info.offset.x < -swipeThreshold) {
                        if (currentIndex < TABS.length - 1) {
                            setActiveTab(TABS[currentIndex + 1] as any);
                        }
                    } else if (info.offset.x > swipeThreshold) {
                        if (currentIndex > 0) {
                            setActiveTab(TABS[currentIndex - 1] as any);
                        }
                    }
                }}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '5px',
                    maxHeight: '630px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    touchAction: isMobile ? 'pan-y' : 'auto',
                }}
            >
                {activeTab === 'REWARDS' ? (
                    <RewardsTab
                        colors={colors}
                        claimedSocialRewards={claimedSocialRewards}
                        claimFavoriteReward={claimFavoriteReward}
                        claimGroupReward={claimGroupReward}
                    />
                ) : activeTab === 'WORLD' ? (
                    <WorldPlayersTab
                        isLoadingWorld={isLoadingWorld}
                        colors={colors}
                        paginatedWorldPlayers={paginatedWorldPlayers}
                        totalPages={totalPages}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        handleSendFriendRequest={handleSendFriendRequest}
                    />
                ) : filteredFriends.length > 0 || searchQuery.trim().length > 0 || isSearching || foundPlayer ? (
                    <>
                        {/* LOCAL RESULTS */}
                        {filteredFriends.map((f: any) => (
                            <FriendRow
                                key={f.id}
                                friend={f}
                                activeTab={activeTab}
                                isLight={isLight}
                                colors={colors}
                                acceptFriendRequest={acceptFriendRequest}
                                declineFriendRequest={declineFriendRequest}
                                sendGift={sendGift}
                                removeFriend={removeFriend}
                            />
                        ))}

                        {/* GLOBAL SEARCH RESULTS */}
                        {foundPlayer && (
                            <FoundPlayerCard foundPlayer={foundPlayer} colors={colors} onAdd={handleAddFoundPlayer} />
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
                            whileTap={{ scale: 0.92 }}
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
            </motion.div>
        </div>
    );
};

export default FriendsWindow;
