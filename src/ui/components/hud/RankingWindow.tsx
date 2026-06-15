import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
import { getRankInfo } from '../../../configs/RankSystem';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { resolveAvatarPath } from '../../../configs/ProfileCustomization';

interface LeaderboardEntry {
    id: string;
    rank: number;
    name: string;
    level: number;
    trophies: number;
    avatar: string;
    change: 'up' | 'down' | 'stable';
    isMe?: boolean;
    vipLevel?: number;
}

// Список лидеров формируется динамически в компоненте

export const RankingWindow: React.FC = () => {
    const rating = useGameStore(state => state.rating);
const vkUser = useGameStore(state => state.vkUser);
const playerAvatar = useGameStore(state => state.avatar);
const playerName = useGameStore(state => state.name);
    const [activeTab, setActiveTab] = React.useState<'GLOBAL' | 'CLAN' | 'FRIENDS'>('GLOBAL');

    const [showRewards, setShowRewards] = React.useState(false);
    const [globalLeaders, setGlobalLeaders] = React.useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

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

    const myLeaderboardEntry = globalLeaders.find((l) => l.isMe);
    const myRank = myLeaderboardEntry ? `#${myLeaderboardEntry.rank}` : '50+';

    React.useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const timer = setTimeout(() => setIsLoading(true), 0);

        const setupSubscription = async () => {
            try {
                const { syncService } = await import('../../../services/SyncService');
                unsubscribe = syncService.subscribeToGlobalLeaders(50, (players) => {
                    const mappedLeaders: LeaderboardEntry[] = players.map((p, index) => {
                        const nameVal = p.имя || p.name || 'Мастер';
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

    // Сезон I: РАССВЕТ ДИКОГО ЛЕСА — 1–15 июня 2026
    const SEASON_END = new Date('2026-06-15T23:59:59');
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
                height: '620px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                padding: '10px',
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
                            color: activeTab === tab ? '#000' : '#c8a870',
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
                            color: '#c8a870',
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
                        whileHover={{ scale: 1.12, rotate: 4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowRewards(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            width: '56px',
                            height: '56px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'visible',
                            padding: 0,
                            flexShrink: 0,
                        }}
                        title="Награды сезона"
                    >
                        <img
                            src={AssetsMap.UI.ICON_SEASON_RATE}
                            alt="season rewards"
                            style={{
                                width: '56px',
                                height: '56px',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 12px rgba(240,192,64,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.7))',
                            }}
                        />
                    </motion.button>
                </div>
            </div>

            {/* ТАБЛИЦА ЛИДЕРОВ */}
            <motion.div
                ref={scrollRef}
                className="leaderboard-scroll"
                drag={isMobile ? "x" : undefined}
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
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '100px 20px',
                            color: '#c8a870',
                            fontWeight: 800,
                            fontFamily: "'Cinzel', serif",
                            fontSize: '16px',
                        }}
                    >
                        ВЫ НЕ СОСТОИТЕ В КЛАНЕ
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '10px' }}>
                            Вступите в клан, чтобы видеть рейтинг соклановцев!
                        </div>
                    </div>
                ) : activeTab === 'FRIENDS' ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '100px 20px',
                            color: '#c8a870',
                            fontWeight: 800,
                            fontFamily: "'Cinzel', serif",
                            fontSize: '16px',
                        }}
                    >
                        У ВАС НЕТ ДРУЗЕЙ В ИГРЕ
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '10px' }}>
                            Пригласите друзей, чтобы соревноваться с ними!
                        </div>
                    </div>
                ) : (
                    globalLeaders.map((player) => (
                        <LeaderItem key={player.rank} player={player} onClick={() => {
                            const setInspect = useGameStore.getState().setInspectPlayerId;
                            if (setInspect) setInspect(player.id);
                        }} />
                    ))
                )}
            </motion.div>

            {/* Apple Disclaimer */}
            <div style={{
                textAlign: 'center',
                fontSize: '9px',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'Inter', sans-serif",
                margin: '6px 0 2px 0',
                lineHeight: 1.3,
                flexShrink: 0,
            }}>
                Apple Inc. не является спонсором и не имеет отношения к внутриигровым конкурсам и активностям. Apple is not a sponsor nor is involved in the activity in any manner.
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
            <AnimatePresence>
                {showRewards && (
                    <div
                        onClick={() => setShowRewards(false)}
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
                            cursor: 'pointer',
                        }}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '520px',
                                background: 'radial-gradient(circle at center, #231c15 0%, #120e0a 100%)',
                                border: '2px solid #f0c040',
                                borderRadius: '24px',
                                padding: '30px',
                                boxShadow: '0 15px 50px rgba(0,0,0,0.9), inset 0 0 30px rgba(240,192,64,0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <h3
                                style={{
                                    color: '#f0c040',
                                    fontSize: '28px',
                                    textAlign: 'center',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 900,
                                    letterSpacing: '2px',
                                    textShadow: '0 0 15px rgba(240,192,64,0.6)',
                                    marginBottom: '10px',
                                }}
                            >
                                🏆 НАГРАДЫ СЕЗОНА
                            </h3>

                            {/* SEASON TIMER */}
                            <div
                                style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(240,192,64,0.2)',
                                    borderRadius: '14px',
                                    padding: '12px 18px',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)',
                                }}
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{ flexShrink: 0 }}
                                >
                                    <path
                                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
                                        fill="#f0c040"
                                    />
                                </svg>
                                <span
                                    style={{
                                        color: '#d1d5db',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    КОНЕЦ СЕЗОНА: <span style={{ color: '#4ade80' }}>{getRemainingTime()}</span>
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {[
                                    {
                                        rank: 'Топ 1-3',
                                        medal: '🥇',
                                        borderColor: '#fbbf24',
                                        glowColor: 'rgba(251, 191, 36, 0.12)',
                                        textColor: '#fbbf24',
                                        items: [
                                            { amount: '500', icon: AssetsMap.UI.ICON_ALMAZ_FULL, alt: 'Алмазы' },
                                            { amount: '1', icon: AssetsMap.UI.ICON_SEASON_CHEST, alt: 'Сундук Сезона' },
                                            { amount: '25 000', icon: AssetsMap.UI.ICON_GOLD_FULL, alt: 'Золото' },
                                        ],
                                    },
                                    {
                                        rank: 'Топ 4-10',
                                        medal: '🥈',
                                        borderColor: '#9ca3af',
                                        glowColor: 'rgba(156, 163, 175, 0.1)',
                                        textColor: '#d1d5db',
                                        items: [
                                            { amount: '250', icon: AssetsMap.UI.ICON_ALMAZ_FULL, alt: 'Алмазы' },
                                            { amount: '10 000', icon: AssetsMap.UI.ICON_GOLD_FULL, alt: 'Золото' },
                                        ],
                                    },
                                    {
                                        rank: 'Топ 11-100',
                                        medal: '🥉',
                                        borderColor: '#b45309',
                                        glowColor: 'rgba(180, 83, 9, 0.08)',
                                        textColor: '#e28743',
                                        items: [
                                            { amount: '100', icon: AssetsMap.UI.ICON_ALMAZ_FULL, alt: 'Алмазы' },
                                            { amount: '3 000', icon: AssetsMap.UI.ICON_GOLD_FULL, alt: 'Золото' },
                                        ],
                                    },
                                ].map((r, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px 20px',
                                            background: `linear-gradient(90deg, ${r.glowColor}, rgba(0,0,0,0.5))`,
                                            borderRadius: '16px',
                                            border: `1px solid ${r.borderColor}44`,
                                            boxShadow: `0 4px 15px rgba(0,0,0,0.3), inset 0 0 10px ${r.glowColor}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span
                                                style={{
                                                    fontSize: '28px',
                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                                }}
                                            >
                                                {r.medal}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '18px',
                                                    fontWeight: 800,
                                                    color: r.textColor,
                                                    fontFamily: "'Cinzel', serif",
                                                }}
                                            >
                                                {r.rank}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            {r.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <span
                                                        style={{ fontSize: '15px', fontWeight: 900, color: '#4ade80' }}
                                                    >
                                                        {item.amount}
                                                    </span>
                                                    <img
                                                        src={resolveAssetPath(item.icon)}
                                                        style={{
                                                            width: '22px',
                                                            height: '22px',
                                                            objectFit: 'contain',
                                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                                        }}
                                                        alt={item.alt}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginTop: '20px',
                                    color: '#9ca3af',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                }}
                            >
                                <span>ℹ️</span>
                                <span>Награды будут отправлены на почту по окончании сезона</span>
                            </div>

                            <button
                                onClick={() => setShowRewards(false)}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '16px',
                                    background: 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)',
                                    border: '1px solid #fde68a',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(251,191,36,0.3)',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                    transition: 'transform 0.1s',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '1px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                ПОНЯТНО
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LeaderItem: React.FC<{ player: LeaderboardEntry; onClick: () => void }> = ({ player, onClick }) => {
    const isTop3 = player.rank <= 3;
    const rankColor =
        player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : '#c8a870';

    return (
        <motion.div
            whileHover={{ x: 5, backgroundColor: 'rgba(240,192,64,0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                background:
                    player.rank === 1
                        ? 'linear-gradient(90deg, rgba(240,192,64,0.15) 0%, rgba(240,192,64,0.05) 100%)'
                        : player.isMe
                          ? 'rgba(240,192,64,0.1)'
                          : 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: player.isMe ? '1px solid #f0c040' : '1px solid rgba(240,192,64,0.1)',
                transition: 'all 0.2s ease',
                position: 'relative',
                cursor: 'pointer',
            }}
        >
            {/* СПЕЦ-ЭФФЕКТ ДЛЯ ТОП-1 */}
            {player.rank === 1 && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '10px',
                        boxShadow: 'inset 0 0 20px rgba(240,192,64,0.2)',
                        pointerEvents: 'none',
                    }}
                />
            )}
            {/* МЕСТО И ДИНАМИКА */}
            <div
                style={{
                    width: '70px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {isTop3 && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center' }}>
                        {player.rank === 1 ? (
                            <img
                                src={AssetsMap.UI.ICON_CROWN}
                                alt="crown"
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 5px rgba(240,192,64,0.8))',
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: '16px' }}>{player.rank === 2 ? '🥈' : '🥉'}</span>
                        )}
                    </div>
                )}
                <div
                    style={{
                        fontSize: isTop3 ? '24px' : '18px',
                        fontWeight: 900,
                        color: rankColor,
                        textShadow: isTop3 ? `0 0 10px ${rankColor}aa` : 'none',
                    }}
                >
                    #{player.rank}
                </div>
                {player.change !== 'stable' && (
                    <span
                        style={{
                            fontSize: '10px',
                            color: player.change === 'up' ? '#4ade80' : '#f87171',
                            fontWeight: 800,
                        }}
                    >
                        {player.change === 'up' ? '▲' : '▼'}
                    </span>
                )}
            </div>

            {/* АВАТАР */}
            <div
                style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: `2px solid ${player.isMe ? '#f0c040' : '#444'}`,
                    marginRight: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: isTop3 ? `0 0 15px ${rankColor}33` : 'none',
                    overflow: 'hidden',
                }}
            >
                {player.avatar.includes('sprite') ? (
                    <div className={player.avatar.replace('sprite:', '')} style={{ transform: 'scale(0.8)' }} />
                ) : (
                    <img
                        src={player.avatar}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt="avatar"
                    />
                )}
            </div>

            {/* ИМЯ И УРОВЕНЬ */}
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        color: player.isMe ? '#f0c040' : '#fff',
                        fontWeight: 700,
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <span>{player.name}</span>
                    {player.vipLevel !== undefined && player.vipLevel > 0 && (
                        <div
                            style={{
                                backgroundImage: `url(${resolveAssetPath(AssetsMap.UI.VIP_PLAQUE)})`,
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                width: '45px',
                                height: '18px',
                                color: '#fff',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                fontSize: '9px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                flexShrink: 0,
                            }}
                        >
                            VIP
                        </div>
                    )}
                    {player.isMe && <span style={{ fontSize: '12px', opacity: 0.7 }}>(ВЫ)</span>}
                </div>
                <div style={{ color: '#c8a870', fontSize: '12px' }}>Уровень {player.level}</div>
            </div>

            {/* ЛИГА */}
            <div
                style={{
                    padding: '6px 16px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '18px',
                    fontSize: '13px',
                    fontWeight: 900,
                    color: getRankInfo(player.trophies).color,
                    border: `1.5px solid ${getRankInfo(player.trophies).color}66`,
                    marginRight: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: `inset 0 0 12px ${getRankInfo(player.trophies).glow}, 0 2px 6px rgba(0,0,0,0.3)`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
            >
                <img
                    src={getRankInfo(player.trophies).icon}
                    alt="rank"
                    style={{
                        width: '22px',
                        height: '22px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
                    }}
                />
                {getRankInfo(player.trophies).name}
            </div>

            {/* КУБКИ */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '130px',
                    justifyContent: 'flex-end',
                }}
            >
                <span
                    style={{
                        color: '#fff',
                        fontSize: '22px',
                        fontWeight: 900,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    {player.trophies.toLocaleString().replace(',', ' ')}
                </span>
                <img
                    src={AssetsMap.UI.TROPHY_PREMIUM}
                    alt="trophy"
                    style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6)) drop-shadow(0 0 4px rgba(240,192,64,0.15))',
                    }}
                />
            </div>
        </motion.div>
    );
};

export default RankingWindow;
