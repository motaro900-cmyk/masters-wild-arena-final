import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
import { getRankInfo } from '../../../configs/RankSystem';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { resolveAvatarPath } from '../../../configs/ProfileCustomization';
import { MOCK_CLANS, DEFAULT_MOCK_MEMBERS } from './Clan/ClanMockData';

// Import subcomponents
import { LeaderItem, type LeaderboardEntry } from './Ranking/LeaderItem';
import { SeasonRewardsModal } from './Ranking/SeasonRewardsModal';

export const RankingWindow: React.FC = () => {
    const rating = useGameStore((state) => state.rating);
    const vkUser = useGameStore((state) => state.vkUser);
    const playerAvatar = useGameStore((state) => state.avatar);
    const playerName = useGameStore((state) => state.name);
    const playerId = useGameStore((state) => state.playerId);
    const friends = useGameStore((state) => state.friends) || [];
    const heroes = useGameStore((state) => state.heroes) || {};
    const selectedHeroId = useGameStore((state) => state.selectedHeroId) || 'panda';
    const playerLevel = heroes[selectedHeroId]?.level || 1;
    const playerVipLevel = useGameStore((state) => state.vipLevel) || 0;
    const clanId = useGameStore((state) => state.clanId);

    const [activeTab, setActiveTab] = React.useState<'GLOBAL' | 'CLAN' | 'FRIENDS'>('GLOBAL');

    const [showRewards, setShowRewards] = React.useState(false);
    const [globalLeaders, setGlobalLeaders] = React.useState<LeaderboardEntry[]>([]);
    const [friendsLeaders, setFriendsLeaders] = React.useState<LeaderboardEntry[]>([]);
    const [clanLeaders, setClanLeaders] = React.useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    // Effect for friends leaderboard loading and synchronization
    React.useEffect(() => {
        if (activeTab !== 'FRIENDS') return;

        // Build list based on locally stored friend data + the player themselves
        const buildFriendsLeaders = (currentFriends: any[]) => {
            const meEntry: LeaderboardEntry = {
                id: playerId,
                rank: 1,
                name: (playerName || 'Мастер').split(' ')[0],
                level: playerLevel,
                trophies: rating,
                avatar: resolveAvatarPath(vkUser?.photo_200 || vkUser?.photo || playerAvatar),
                change: 'stable',
                isMe: true,
                vipLevel: playerVipLevel,
            };

            const friendsEntries: LeaderboardEntry[] = currentFriends.map((f: any) => {
                const nameVal = f.name || 'Мастер';
                const firstName = nameVal.split(' ')[0];
                return {
                    id: f.id,
                    rank: 0,
                    name: firstName,
                    level: f.level || 1,
                    trophies: f.rating ?? f.trophies ?? 0,
                    avatar: resolveAvatarPath(f.avatar),
                    change: 'stable',
                    isMe: false,
                    vipLevel: f.vipLevel || 0,
                };
            });

            return [meEntry, ...friendsEntries]
                .sort((a, b) => b.trophies - a.trophies)
                .map((entry, index) => ({
                    ...entry,
                    rank: index + 1,
                }));
        };

        setFriendsLeaders(buildFriendsLeaders(friends));

        if (friends.length === 0) return;

        // Fetch up-to-date ratings/levels of friends in background from database
        let isMounted = true;
        const fetchLatestFriendsData = async () => {
            try {
                const { syncService } = await import('../../../services/SyncService');
                const friendIds = friends.map((f: any) => f.id);
                const resolved = await syncService.resolveFriendProfiles(friendIds);
                if (!isMounted) return;

                if (resolved && resolved.length > 0) {
                    const mergedFriends = friends.map((oldFriend: any) => {
                        const rf = resolved.find((r: any) => r.id === oldFriend.id);
                        if (!rf) return oldFriend;
                        return {
                            ...oldFriend,
                            ...rf,
                        };
                    });

                    useGameStore.setState({ friends: mergedFriends });
                    setFriendsLeaders(buildFriendsLeaders(mergedFriends));
                }
            } catch (e) {
                console.error('[RankingWindow] Failed to update friends ratings:', e);
            }
        };

        fetchLatestFriendsData();

        return () => {
            isMounted = false;
        };
    }, [activeTab, friends, rating, playerAvatar, playerName, playerId, playerLevel, playerVipLevel, vkUser]);

    // Effect for clan leaderboard
    React.useEffect(() => {
        if (activeTab !== 'CLAN' || !clanId) {
            setClanLeaders([]);
            return;
        }

        const currentUserName =
            playerName && playerName !== 'Мастер'
                ? playerName
                : vkUser?.firstName
                  ? `${vkUser.firstName} ${vkUser.lastName}`
                  : 'Воин';

        const playerMember: LeaderboardEntry = {
            id: playerId || 'me',
            rank: 0,
            name: currentUserName,
            level: playerLevel,
            trophies: rating,
            avatar: resolveAvatarPath(vkUser?.photo_200 || vkUser?.photo || playerAvatar),
            change: 'stable',
            isMe: true,
            vipLevel: playerVipLevel,
        };

        let membersList: any[] = [];
        if (clanId.startsWith('clan_')) {
            const clan = MOCK_CLANS.find((c) => c.id === clanId);
            const clanLeaderName = clan ? `${clan.name.split(' ')[0]}Глава` : 'Глава Клана';
            const clanLeaderEntry = {
                id: 'clan_leader',
                name: clanLeaderName,
                level: clan ? clan.level * 2 + 5 : 20,
                trophies: clan ? Math.floor(clan.totalTrophies / 10) : 3000,
                avatar: 'sprite:sprite-avatar avatar-pos-1',
                contribution: 500,
            };
            membersList = [clanLeaderEntry, ...DEFAULT_MOCK_MEMBERS, playerMember];
        } else {
            membersList = [playerMember];
        }

        const mapped: LeaderboardEntry[] = membersList.map((m: any, idx: number) => {
            const isMe = m.id === playerId || m.name === currentUserName;
            return {
                id: m.id || `clan_member_${idx}`,
                rank: 0,
                name: m.name,
                level: m.level || 1,
                trophies: m.trophies || 0,
                avatar: resolveAvatarPath(m.avatar),
                change: 'stable' as const,
                isMe,
                vipLevel: isMe ? playerVipLevel : 0,
            };
        });

        // Sort by trophies descending
        const sorted = mapped
            .sort((a, b) => b.trophies - a.trophies)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
            }));

        setClanLeaders(sorted);
    }, [activeTab, clanId, rating, playerAvatar, playerName, playerId, playerLevel, playerVipLevel, vkUser]);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        const checkLayout = () => {
            setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    const TABS = ['GLOBAL', 'CLAN', 'FRIENDS'] as const;

    const activeLeaders =
        activeTab === 'GLOBAL' ? globalLeaders : activeTab === 'FRIENDS' ? friendsLeaders : clanLeaders;

    const myLeaderboardEntry = activeLeaders.find((l) => l.isMe);
    const myRank = myLeaderboardEntry ? `#${myLeaderboardEntry.rank}` : '50+';

    React.useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const timer = setTimeout(() => setIsLoading(true), 0);

        const setupSubscription = async () => {
            try {
                const { syncService } = await import('../../../services/SyncService');
                unsubscribe = syncService.subscribeToGlobalLeaders(50, (players) => {
                    const mappedLeaders: LeaderboardEntry[] = players.map((p, index) => {
                        const nameVal = p.name || p.имя || 'Мастер';
                        const firstName = nameVal.split(' ')[0];

                        return {
                            id: p.id,
                            rank: index + 1,
                            name: firstName,
                            level: p.уровень ?? p.level ?? p.лев ?? 1,
                            trophies: p.рейтинг ?? p.rating ?? 0,
                            avatar: resolveAvatarPath(p.фото ?? p.photo ?? p.avatar),
                            change: 'stable',
                            isMe: p.id === useGameStore.getState().playerId || String(p.vkId) === String(vkUser?.id),
                            vipLevel: p.vipLevel || 0,
                            isVipActive: p.isVipActive || false,
                        };
                    });
                    setGlobalLeaders(mappedLeaders);
                    setIsLoading(false);
                });
            } catch (e) {
                console.error('Failed to subscribe to leaders:', e);
                setIsLoading(false);
            }
        };

        setupSubscription();

        return () => {
            clearTimeout(timer);
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [vkUser]);

    // Сезон I: РАССВЕТ ДИКОГО ЛЕСА — до 31 августа 2026
    const SEASON_END = new Date('2026-08-31T23:59:59');
    const getRemainingTime = () => {
        const now = new Date();
        const diff = SEASON_END.getTime() - now.getTime();

        if (diff <= 0) return 'ЗАВЕРШЁН';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${days}д : ${hours}ч : ${mins}м`;
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                padding: '24px',
                boxSizing: 'border-box',
            }}
        >
            {/* ТАБЫ */}
            <div
                style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '5px',
                }}
            >
                {['GLOBAL', 'CLAN', 'FRIENDS'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            setActiveTab(tab as any);
                        }}
                        style={{
                            padding: '10px 25px',
                            background:
                                activeTab === tab
                                    ? 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)'
                                    : 'rgba(255,255,255,0.05)',
                            border: activeTab === tab ? 'none' : '1px solid rgba(240,192,64,0.3)',
                            borderRadius: '8px',
                            color: activeTab === tab ? '#000' : '#dfc08a',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase',
                        }}
                    >
                        {tab === 'GLOBAL' ? 'Глобальный' : tab === 'CLAN' ? 'Клан' : 'Друзья'}
                    </button>
                ))}
            </div>

            {/* SEASON INFO & REWARDS */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    background: 'linear-gradient(90deg, rgba(240,192,64,0.1), rgba(0,0,0,0))',
                    borderRadius: '12px',
                    border: '1px solid rgba(240,192,64,0.2)',
                    position: 'relative',
                }}
            >
                <div>
                    <div
                        style={{
                            color: '#dfc08a',
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}
                    >
                        Текущий Сезон
                    </div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
                        СЕЗОН I · РАССВЕТ ДИКОГО ЛЕСА
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#f0c040', fontWeight: 800, fontSize: '14px' }}>{getRemainingTime()}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>ДО КОНЦА СЕЗОНА</div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowRewards(true)}
                        style={{
                            background:
                                'linear-gradient(180deg, rgba(240, 192, 64, 0.18) 0%, rgba(240, 192, 64, 0.05) 100%)',
                            border: '1px solid rgba(240, 192, 64, 0.45)',
                            borderRadius: '12px',
                            padding: '6px 12px 6px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            fontFamily: "'Outfit', 'Cinzel', sans-serif",
                            overflow: 'visible',
                            flexShrink: 0,
                        }}
                        title="Награды сезона"
                    >
                        <span
                            style={{
                                color: '#FFE07D',
                                fontSize: '11px',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                textAlign: 'right',
                                lineHeight: 1.3,
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            }}
                        >
                            Награды
                            <br />
                            сезона
                        </span>
                        <img
                            src={AssetsMap.UI.ICON_SEASON_RATE}
                            alt="season rewards"
                            style={{
                                width: '38px',
                                height: '38px',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.6))',
                            }}
                        />
                    </motion.button>
                </div>
            </div>

            {/* ТАБЛИЦА ЛИДЕРОВ */}
            <motion.div
                ref={scrollRef}
                className="leaderboard-scroll"
                drag={isMobile ? 'x' : undefined}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                    if (!isMobile) return;
                    const swipeThreshold = 50;
                    const currentIndex = TABS.indexOf(activeTab);
                    if (info.offset.x < -swipeThreshold) {
                        if (currentIndex < TABS.length - 1) {
                            setActiveTab(TABS[currentIndex + 1]);
                        }
                    } else if (info.offset.x > swipeThreshold) {
                        if (currentIndex > 0) {
                            setActiveTab(TABS[currentIndex - 1]);
                        }
                    }
                }}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingRight: '10px',
                    touchAction: isMobile ? 'pan-y' : 'auto',
                }}
            >
                {isLoading ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '100px',
                            color: '#f0c040',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        ЗАГРУЗКА ЛИДЕРОВ...
                    </div>
                ) : activeTab === 'CLAN' ? (
                    clanId ? (
                        clanLeaders.map((player) => (
                            <LeaderItem
                                key={player.rank}
                                player={player}
                                onClick={() => {
                                    const setInspect = useGameStore.getState().setInspectPlayerId;
                                    if (
                                        setInspect &&
                                        player.id !== 'clan_leader' &&
                                        !player.id.startsWith('mock_member_')
                                    ) {
                                        setInspect(player.id);
                                    }
                                }}
                            />
                        ))
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '100px 20px',
                                color: '#dfc08a',
                                fontWeight: 800,
                                fontFamily: "'Cinzel', serif",
                                fontSize: '16px',
                            }}
                        >
                            ВЫ НЕ СОСТОИТЕ В КЛАНЕ
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>
                                Вступите в клан, чтобы видеть рейтинг соклановцев!
                            </div>
                        </div>
                    )
                ) : activeTab === 'FRIENDS' ? (
                    friendsLeaders.length <= 1 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '100px 20px',
                                color: '#dfc08a',
                                fontWeight: 800,
                                fontFamily: "'Cinzel', serif",
                                fontSize: '16px',
                            }}
                        >
                            У ВАС НЕТ ДРУЗЕЙ В ИГРЕ
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>
                                Пригласите друзей, чтобы соревноваться с ними!
                            </div>
                        </div>
                    ) : (
                        friendsLeaders.map((player) => (
                            <LeaderItem
                                key={player.rank}
                                player={player}
                                onClick={() => {
                                    const setInspect = useGameStore.getState().setInspectPlayerId;
                                    if (setInspect) setInspect(player.id);
                                }}
                            />
                        ))
                    )
                ) : (
                    globalLeaders.map((player) => (
                        <LeaderItem
                            key={player.rank}
                            player={player}
                            onClick={() => {
                                const setInspect = useGameStore.getState().setInspectPlayerId;
                                if (setInspect) setInspect(player.id);
                            }}
                        />
                    ))
                )}
            </motion.div>

            {/* Apple Disclaimer */}
            <div
                style={{
                    textAlign: 'center',
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.3)',
                    fontFamily: "'Inter', sans-serif",
                    margin: '6px 0 2px 0',
                    lineHeight: 1.3,
                    flexShrink: 0,
                }}
            >
                Apple Inc. не является спонсором и не имеет отношения к внутриигровым конкурсам и активностям. Apple is
                not a sponsor nor is involved in the activity in any manner.
            </div>

            {/* ВАША ПОЗИЦИЯ (ALWAYS VISIBLE FOOTER) */}
            <div
                style={{
                    padding: '12px 25px',
                    background: 'linear-gradient(180deg, rgba(30,20,10,0.95) 0%, rgba(15,10,5,0.98) 100%)',
                    borderRadius: '16px',
                    border: '1px solid #f0c040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    zIndex: 10,
                    marginTop: '5px',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ color: '#f0c040', fontSize: '20px', fontWeight: 900 }}>{myRank}</span>
                        {myLeaderboardEntry?.rank === 1 && (
                            <img
                                src={AssetsMap.UI.ICON_CROWN}
                                alt="crown"
                                style={{
                                    position: 'absolute',
                                    top: -14,
                                    left: -12,
                                    width: '22px',
                                    height: '22px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 5px rgba(240,192,64,0.7))',
                                }}
                            />
                        )}
                    </div>
                    <div
                        style={{
                            width: '45px',
                            height: '45px',
                            background: '#333',
                            borderRadius: '12px',
                            border: '2px solid #f0c040',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <img
                            src={resolveAvatarPath(vkUser?.photo_200 || vkUser?.photo || playerAvatar)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt="avatar"
                        />
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>
                            {playerName || vkUser?.first_name || 'Мастер'}{' '}
                            <span style={{ fontSize: '10px', opacity: 0.5 }}>(ВЫ)</span>
                        </div>
                        <div
                            style={{
                                color: getRankInfo(rating).color,
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <img
                                src={getRankInfo(rating).icon}
                                alt="rank"
                                style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                            />
                            {getRankInfo(rating).name}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#fff', fontSize: '24px', fontWeight: 900 }}>
                            {rating.toLocaleString().replace(',', ' ')}
                        </span>
                        <img
                            src={resolveAssetPath('/assets/images/ui/trophy_premium.webp')}
                            alt="trophy"
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                    </div>
                </div>
            </div>

            {/* REWARDS MODAL */}
            <SeasonRewardsModal
                showRewards={showRewards}
                setShowRewards={setShowRewards}
                getRemainingTime={getRemainingTime}
            />
        </div>
    );
};

export default RankingWindow;
