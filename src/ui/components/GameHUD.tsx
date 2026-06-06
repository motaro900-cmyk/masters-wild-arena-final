import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AssetsMap } from '../../configs/AssetsMap';
import { motion, AnimatePresence } from 'framer-motion';

// HUD Components
import { BattlePassBar } from './hud/BattlePassBar';
import { ResourceBar } from './hud/ResourceBar';
import { LeftSidebar } from './hud/LeftSidebar';
import { DailyTaskPanel } from './hud/DailyTaskPanel';
import { ChatPanel } from './hud/ChatPanel';
import { ActionButtons } from './hud/ActionButtons';
import { DailyGiftBanner } from './hud/DailyGiftBanner';
import { ProfileHub } from './hud/ProfileHub';
import { ServerTime } from './hud/ServerTime';

// Window Components
import { BaseWindow } from './hud/BaseWindow';
import { FriendsWindow } from './hud/FriendsWindow';
import { MailWindow } from './hud/MailWindow';
import { SettingsWindow } from './hud/SettingsWindow';
import { ProfileCustomizeWindow } from './hud/ProfileCustomizeWindow';
import { DailyGiftWindow } from './hud/DailyGiftWindow';
import { RankingWindow } from './hud/RankingWindow';
import { ClanWindow } from './hud/ClanWindow';
import { RanksListWindow } from './hud/RanksListWindow';
import { InventoryPanel } from './hud/InventoryPanel';
import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';
import { VIPWindow } from './hud/VIPWindow';
const AdminPanel = React.lazy(() => import('./hud/AdminPanel').then((m) => ({ default: m.AdminPanel })));
import { UnderDevelopmentModal } from './hud/SharedUI';
import { BestiaryWindow } from './hud/BestiaryWindow';
import { MatchmakingOverlay } from './hud/MatchmakingOverlay';
import { safeGetItem, safeSetItem } from '../../utils/SafeStorage';
import { LevelUpOverlay } from './hud/LevelUpOverlay';

export const GameHUD: React.FC = () => {
    const activeScreen = useGameStore((state) => state.activeScreen);
    const showSummonOverlay = useGameStore((state) => state.showSummonOverlay);
    const mails = useGameStore((state) => state.mail) || [];
    const unreadMailCount = mails.filter((m: any) => m.tab === 'INBOX' && !m.isRead).length;
    const vipLevel = useGameStore((state) => state.vipLevel);
    const isMobile = useGameStore((state) => state.isMobile);
    const [activeWindow, setActiveWindow] = useState<string | null>(null);
    const [showAdmin, setShowAdmin] = useState(false);
    const [devModal, setDevModal] = useState({ isOpen: false, title: '' });
    const goToShop = useGameStore((state) => state.goToShop);
    const [prevScreen, setPrevScreen] = useState(activeScreen);

    const [hudScale, setHudScale] = useState(1);
    const showFps = useGameStore((state) => state.showFps);
    const [fpsValue, setFpsValue] = useState(0);
    const fpsRafRef = useRef<number>(0);

    useEffect(() => {
        if (!showFps) return;
        let frameCount = 0;
        let lastTime = performance.now();

        const tick = () => {
            frameCount++;
            const now = performance.now();
            if (now - lastTime >= 500) {
                setFpsValue(Math.round((frameCount * 1000) / (now - lastTime)));
                frameCount = 0;
                lastTime = now;
            }
            fpsRafRef.current = requestAnimationFrame(tick);
        };
        fpsRafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(fpsRafRef.current);
    }, [showFps]);

    React.useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            if (isMobile) {
                setHudScale(1);
            } else if (width < 1280) {
                setHudScale(Math.max(0.5, width / 1280));
            } else {
                setHudScale(1);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    // Автоматически закрываем любые окна при смене основного экрана (Pattern: Adjusting state during render)
    if (activeScreen !== prevScreen) {
        setPrevScreen(activeScreen);
        setActiveWindow(null);
    }

    // Ежедневный VIP-подарок на почту и синхронизация VIP-статуса
    React.useEffect(() => {
        const endTimeStr = safeGetItem('vipEndTime');
        const now = Date.now();
        const isActive = endTimeStr ? parseInt(endTimeStr) > now : false;

        // Синхронизируем vipLevel в сторе
        const expectedVipLevel = isActive ? 1 : 0;

        if (vipLevel !== expectedVipLevel) {
            setTimeout(() => {
                useGameStore.setState({
                    vipLevel: expectedVipLevel,
                });
            }, 0);
        }

        if (!isActive) return;

        // Определяем московскую дату
        const msk = new Date(now + (new Date().getTimezoneOffset() + 180) * 60000);
        const mskDateStr = `${msk.getFullYear()}-${(msk.getMonth() + 1).toString().padStart(2, '0')}-${msk.getDate().toString().padStart(2, '0')}`;

        const lastClaim = safeGetItem('lastVipMailClaimDate');
        if (lastClaim !== mskDateStr) {
            // Генерируем случайные дары
            const rand = Math.random();
            let rewards = [];
            if (rand < 0.33) {
                rewards = [
                    { type: 'GOLD', amount: 500 },
                    { type: 'CRYSTALS', amount: 10 },
                    { type: 'ENERGY', amount: 5 },
                ];
            } else if (rand < 0.66) {
                rewards = [
                    { type: 'GOLD', amount: 800 },
                    { type: 'CRYSTALS', amount: 5 },
                    { type: 'ENERGY', amount: 10 },
                ];
            } else {
                rewards = [
                    { type: 'GOLD', amount: 300 },
                    { type: 'CRYSTALS', amount: 15 },
                    { type: 'ENERGY', amount: 8 },
                ];
            }

            const newMail = {
                id: `vip_daily_${mskDateStr}_${Date.now()}`,
                from: 'КОРОЛЕВСКАЯ СЛУЖБА',
                subject: 'ЕЖЕДНЕВНЫЙ VIP ПОДАРОК!',
                body: 'Славься, наш благородный покровитель! \n\nКаждый день твоего VIP-статуса Королевская Служба доставляет тебе лучшие дары из сокровищницы. \n\nСпасибо за твою поддержку! Желаем легких побед и славных свершений на просторах Masters of the Wild!',
                date: 'СЕГОДНЯ',
                isRead: false,
                isStarred: false,
                tab: 'INBOX',
                rewards: rewards,
            };

            // Добавляем во входящие
            setTimeout(() => {
                const store = useGameStore.getState();
                if (store.addMail) {
                    store.addMail(newMail);
                } else {
                    useGameStore.setState({
                        mail: [newMail, ...(store.mail || [])],
                    });
                }
                safeSetItem('lastVipMailClaimDate', mskDateStr);
            }, 100);
        }
    }, [vipLevel]);

    // Expose to window for external screen communication (like CityScreen)
    React.useEffect(() => {
        (window as any).setActiveHUDWindow = (win: string | null) => setActiveWindow(win);
    }, []);

    const isFullScreenScene =
        activeScreen === 'SHOP' ||
        activeScreen === 'HEROES' ||
        activeScreen === 'CITY' ||
        activeScreen === 'BATTLE' ||
        activeScreen === 'FORGE' ||
        activeScreen === 'SANCTUARY';

    if (activeScreen === 'INTRO') return null;
    if (activeScreen !== 'MAIN_MENU' && !isFullScreenScene) return null;

    return (
        <div
            className="game-hud-root"
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
        >
            {/* 1. PLAYER PROFILE HUB */}
            {!isFullScreenScene && (
                <div
                    className="tutorial-profile-hub absolute top-[30px] left-[5px] hud-interactive w-[340px] md:w-[465px]"
                    style={{ transform: `scale(${hudScale})`, transformOrigin: 'top left' }}
                >
                    <ProfileHub />
                </div>
            )}

            {/* 2. BATTLE PASS BAR */}
            {!isFullScreenScene && (
                <div
                    className="absolute top-[20px] left-1/2 -translate-x-1/2 hud-interactive"
                    style={isMobile ? { transform: `scale(${hudScale})`, transformOrigin: 'top center' } : {}}
                >
                    <BattlePassBar />
                </div>
            )}

            {/* 3. RESOURCES */}
            {activeScreen !== 'BATTLE' &&
                activeScreen !== 'HEROES' &&
                activeScreen !== 'SHOP' &&
                activeScreen !== 'FORGE' &&
                activeScreen !== 'SANCTUARY' &&
                !showSummonOverlay && (
                    <div
                        className="tutorial-resource-bar absolute top-[20px] right-[25px] hud-interactive flex flex-col items-end gap-1"
                        style={isMobile ? { transform: `scale(${hudScale})`, transformOrigin: 'top right' } : {}}
                    >
                        <ResourceBar
                            onOpenShop={(tab) => {
                                if (tab === 'GOLD' || tab === 'GEMS' || tab === 'ENERGY') {
                                    goToShop('BANK', tab);
                                } else {
                                    goToShop('ALCHEMY');
                                }
                            }}
                        />
                        {showFps && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(0,0,0,0.55)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '8px',
                                    padding: '3px 10px',
                                    pointerEvents: 'none',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '9px',
                                        opacity: 0.5,
                                        color: '#fff',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    FPS
                                </span>
                                <span
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        fontFamily: 'monospace',
                                        minWidth: '30px',
                                        textAlign: 'center',
                                        color: fpsValue < 25 ? '#ff4444' : fpsValue < 50 ? '#ffcc00' : '#44ff44',
                                        transition: 'color 0.3s',
                                    }}
                                >
                                    {fpsValue}
                                </span>
                            </div>
                        )}
                    </div>
                )}

            {/* 4. SIDEBARS & PANELS */}
            {!isFullScreenScene && (
                <>
                    <div
                        className="absolute top-[455px] left-[-10px] hud-interactive"
                        style={{
                            transform: `translateY(-50%) scale(${hudScale})`,
                            transformOrigin: 'left center',
                        }}
                    >
                        <LeftSidebar
                            onOpenWindow={(id) => {
                                if (id === 'STORE') useGameStore.getState().goToShop();
                                else if (id === 'HEROES') useGameStore.getState().goToHeroes('LIST');
                                else setActiveWindow(id);
                            }}
                        />
                    </div>

                    <div
                        className="absolute top-[160px] right-[25px] flex flex-col gap-3 items-end hud-interactive w-[260px] md:w-[400px]"
                        style={{ transform: `scale(${hudScale})`, transformOrigin: 'top right' }}
                    >
                        <DailyGiftBanner onClick={() => setActiveWindow('GIFT')} />
                        <DailyTaskPanel />
                    </div>

                    {/* CITY PORTAL HOTSPOT (Castle in the background) */}
                    <div
                        className="absolute top-[200px] right-[450px] hud-interactive"
                        style={{
                            width: '350px',
                            height: '400px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'auto',
                            borderRadius: '50%',
                        }}
                        onClick={() => useGameStore.getState().goToCity()}
                    >
                        {/* Invisible area with hover effect */}
                        <div
                            className="city-portal-hover"
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '10px',
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                            }}
                        >
                            <div
                                style={{
                                    padding: '8px 20px',
                                    background: 'rgba(20, 15, 10, 0.8)',
                                    border: '2px solid #f0c040',
                                    borderRadius: '10px',
                                    color: '#f0c040',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    textShadow: '0 2px 10px rgba(0,0,0,1)',
                                    boxShadow: '0 0 20px rgba(240,192,64,0.4)',
                                }}
                            >
                                В ГОРОД
                            </div>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '3px solid #f0c040',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 2s linear infinite',
                                }}
                            />
                        </div>
                        <style>{`
                            .hud-interactive:hover .city-portal-hover {
                                opacity: 1;
                            }
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>

                    <div
                        className="absolute bottom-[15px] left-[5px] hud-interactive"
                        style={{ transform: `scale(${hudScale})`, transformOrigin: 'bottom left' }}
                    >
                        <ChatPanel />
                    </div>

                    <div
                        className="tutorial-battle-btn absolute bottom-[30px] left-1/2 -translate-x-1/2 hud-interactive"
                        style={isMobile ? { transform: `scale(${hudScale})`, transformOrigin: 'bottom center' } : {}}
                    >
                        <ActionButtons
                            onStartBattle={() => setActiveWindow('RANKED_LOBBY')}
                            onWarmup={() => useGameStore.getState().setScreen('BATTLE')}
                            onOpenRanks={() => setActiveWindow('RANKS_LIST')}
                        />
                    </div>

                    {/* STANDALONE CITY BUTTON (100px further right) */}
                    <div
                        className="absolute bottom-[10px] left-[calc(50%+400px)] hud-interactive"
                        style={isMobile ? { transform: `scale(${hudScale})`, transformOrigin: 'bottom center' } : {}}
                    >
                        <button
                            onClick={() => useGameStore.getState().goToCity()}
                            style={{
                                width: '200px',
                                height: '240px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '15px',
                                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                pointerEvents: 'auto',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.08) translateY(-10px)';
                                const img = e.currentTarget.querySelector('img');
                                if (img) img.style.filter = 'drop-shadow(0 0 35px rgba(240,192,64,0.7))';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                const img = e.currentTarget.querySelector('img');
                                if (img) img.style.filter = 'drop-shadow(0 0 15px rgba(240,192,64,0.4))';
                            }}
                        >
                            <img
                                src="/assets/images/ui/icon_city.png"
                                style={{
                                    width: '180px',
                                    height: '180px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 15px rgba(240,192,64,0.4))',
                                    transition: 'all 0.3s ease',
                                }}
                                alt="City"
                            />
                            <div
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    color: '#f0c040',
                                    letterSpacing: '4px',
                                    textShadow: '0 3px 12px rgba(0,0,0,1)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                В ГОРОД
                            </div>
                        </button>
                    </div>

                    <div
                        className="absolute bottom-[40px] right-[25px] hud-interactive"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '12px 18px',
                            background: 'rgba(15, 10, 5, 0.75)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(240, 192, 64, 0.25)',
                            borderRadius: '20px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                            ...(isMobile ? { transform: `scale(${hudScale})`, transformOrigin: 'bottom right' } : {}),
                        }}
                    >
                        {[
                            { id: 'FRIENDS', sprite: AssetsMap.UI.ICON_FRIENDS },
                            { id: 'MAIL', sprite: AssetsMap.UI.ICON_MAIL },
                            { id: 'SETTINGS', sprite: AssetsMap.UI.ICON_SETTINGS },
                        ].map((win) => (
                            <button
                                key={win.id}
                                onClick={() => setActiveWindow(win.id)}
                                style={{
                                    width: 70,
                                    height: 70,
                                    backgroundImage: `url(${win.sprite})`,
                                    backgroundSize: '100% 100%',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15) translateY(-5px)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
                            >
                                {win.id === 'MAIL' && unreadMailCount > 0 && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: -2,
                                            right: -2,
                                            minWidth: '20px',
                                            height: '20px',
                                            background: '#ef4444',
                                            color: '#fff',
                                            fontSize: '11px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 900,
                                            border: '2.5px solid #0f0a05',
                                            padding: '0 4px',
                                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                                        }}
                                    >
                                        {unreadMailCount}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* --- МОДАЛЬНЫЕ ОКНА --- */}
            {activeWindow && (
                <div
                    className="absolute inset-0 z-[100] pointer-events-auto bg-black/60 backdrop-blur-sm"
                    onClick={() => setActiveWindow(null)}
                >
                    <div
                        className="absolute top-[515px] left-[960px] -translate-x-1/2 -translate-y-1/2 hud-interactive"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {activeWindow === 'FRIENDS' && (
                            <BaseWindow
                                title="ДРУЗЬЯ"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="860px"
                            >
                                <FriendsWindow onClose={() => setActiveWindow(null)} />
                            </BaseWindow>
                        )}
                        {activeWindow === 'MAIL' && (
                            <BaseWindow title="ПОЧТА" isOpen={true} onClose={() => setActiveWindow(null)} width="900px">
                                <MailWindow onClose={() => setActiveWindow(null)} />
                            </BaseWindow>
                        )}
                        {activeWindow === 'VIP' && (
                            <BaseWindow
                                title="VIP СТАТУС"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="800px"
                            >
                                <VIPWindow onClose={() => setActiveWindow(null)} />
                            </BaseWindow>
                        )}
                        {activeWindow === 'SETTINGS' && (
                            <BaseWindow
                                title="НАСТРОЙКИ"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="650px"
                                headerExtra={
                                    <div style={{ marginLeft: '30px' }}>
                                        <ServerTime />
                                    </div>
                                }
                            >
                                <SettingsWindow
                                    onClose={() => setActiveWindow(null)}
                                    onOpenAdmin={() => {
                                        setActiveWindow(null);
                                        setShowAdmin(true);
                                    }}
                                />
                            </BaseWindow>
                        )}
                        {activeWindow === 'PROFILE_CUSTOMIZE' && (
                            <BaseWindow
                                title="НАСТРОЙКА ПРОФИЛЯ"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="1100px"
                                height="740px"
                            >
                                <ProfileCustomizeWindow onClose={() => setActiveWindow(null)} />
                            </BaseWindow>
                        )}
                        {activeWindow === 'GIFT' && (
                            <BaseWindow
                                title="КАЛЕНДАРЬ НАГРАД"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="900px"
                            >
                                <DailyGiftWindow onClose={() => setActiveWindow(null)} />
                            </BaseWindow>
                        )}
                        {activeWindow === 'RANKING' && (
                            <BaseWindow
                                title="РЕЙТИНГ"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="900px"
                            >
                                <RankingWindow />
                            </BaseWindow>
                        )}
                        {activeWindow === 'CLAN' && (
                            <BaseWindow
                                title="ИНФОРМАЦИЯ О КЛАНЕ"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="1000px"
                            >
                                <ClanWindow />
                            </BaseWindow>
                        )}
                        {activeWindow === 'RANKS_LIST' && (
                            <BaseWindow
                                title="ПУТЬ МАСТЕРА"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="850px"
                            >
                                <RanksListWindow />
                            </BaseWindow>
                        )}
                        {activeWindow === 'INVENTORY' && (
                            <BaseWindow
                                title="ИНВЕНТАРЬ"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="1100px"
                            >
                                <div style={{ padding: '30px', display: 'flex', justifyContent: 'center' }}>
                                    <InventoryPanel
                                        onItemClick={(itemId) => {
                                            const store = useGameStore.getState() as any;
                                            const storeItem = store.inventory.find(
                                                (i: any) => i.instanceId === itemId || i.id === itemId,
                                            );
                                            const templateId = storeItem ? storeItem.id : itemId;
                                            const item = ITEMS_DATABASE[templateId];
                                            if (!item) return;
                                            if (item.mainTab === 'ARSENAL') {
                                                const currentHero = store.selectedHeroId || 'panda';
                                                const equippedHero = store.getHeroByItemId(itemId);
                                                if (equippedHero === currentHero) {
                                                    store.unequipItem(itemId);
                                                } else {
                                                    store.equipItem(itemId);
                                                }
                                            } else if (
                                                item &&
                                                item.mainTab === 'ALCHEMY' &&
                                                item.subTab !== 'RESOURCES'
                                            ) {
                                                if (itemId === 'protection_stone') return;

                                                let effectDesc = '';
                                                if (itemId === 'hp_potion_1')
                                                    effectDesc = '+10% к макс. здоровью на 1 час';
                                                if (itemId === 'hp_potion_2')
                                                    effectDesc = '+20% к макс. здоровью на 1 час';
                                                if (itemId === 'hp_potion_3')
                                                    effectDesc = '+35% к макс. здоровью на 1 час';
                                                if (itemId === 'mana_potion_1')
                                                    effectDesc = '+15% к скорости атаки на 1 час';
                                                if (itemId === 'exp_potion_small') effectDesc = '+2 000 опыта';
                                                if (itemId === 'exp_potion_medium') effectDesc = '+10 000 опыта';
                                                if (itemId === 'exp_potion_large') effectDesc = '+50 000 опыта';

                                                useGameStore
                                                    .getState()
                                                    .showConfirm(
                                                        `Выпить "${item.name}"?\nЭффект: ${effectDesc}`,
                                                        () => {
                                                            useGameStore.getState().useConsumable(itemId);
                                                        },
                                                    );
                                            }
                                        }}
                                    />
                                </div>
                            </BaseWindow>
                        )}
                        {activeWindow === 'BESTIARY' && (
                            <BaseWindow
                                title="ЗВЕРИНЕЦ"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="950px"
                            >
                                <BestiaryWindow />
                            </BaseWindow>
                        )}
                    </div>
                </div>
            )}
            {/* --- ADMIN PANEL (GLOBAL OVERLAY) --- */}
            {showAdmin && (
                <React.Suspense fallback={null}>
                    <AdminPanel onClose={() => setShowAdmin(false)} />
                </React.Suspense>
            )}

            {activeWindow === 'RANKED_LOBBY' && (
                <MatchmakingOverlay
                    onCancel={() => setActiveWindow(null)}
                    onFound={(opp) => {
                        setActiveWindow(null);

                        // Use the selected mob from matchmaking
                        useGameStore.setState({
                            selectedEnemyId: opp.id,
                            battleMode: 'RANKED',
                            activeRankedOpponent: opp,
                        });

                        import('../../services/SyncService').then(({ syncService }) => {
                            syncService.logPlayerAction(`Начал рейтинговый бой против: ${opp.name}`);
                        });

                        // Switch screen to battle!
                        useGameStore.getState().setScreen('BATTLE');
                    }}
                />
            )}

            <UnderDevelopmentModal
                isOpen={devModal.isOpen}
                title={devModal.title}
                onClose={() => setDevModal({ ...devModal, isOpen: false })}
            />

            <LevelUpOverlay />
            <ConfirmDialog />
        </div>
    );
};

const ConfirmDialog: React.FC = () => {
    const { activeConfirm } = useGameStore();

    if (!activeConfirm) return null;

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(28, 18, 12, 0.95) 0%, rgba(12, 6, 4, 0.99) 100%)',
                        border: '1px solid rgba(240, 192, 64, 0.3)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(240, 192, 64, 0.1)',
                        borderRadius: '16px',
                        padding: '28px',
                        width: '380px',
                        textAlign: 'center',
                        fontFamily: "'Philosopher', 'Nunito', sans-serif",
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
                    <div
                        style={{
                            color: '#eedfa0',
                            fontSize: '15.5px',
                            fontWeight: 700,
                            lineHeight: '1.5',
                            marginBottom: '24px',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {activeConfirm.message}
                    </div>
                    <div style={{ display: 'flex', gap: '14px' }}>
                        <button
                            onClick={activeConfirm.onCancel}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '13px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            ОТМЕНА
                        </button>
                        <button
                            onClick={activeConfirm.onConfirm}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                background: 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#1a0f00',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '13px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(240, 192, 64, 0.2)',
                                transition: 'all 0.2s',
                            }}
                        >
                            ПОДТВЕРДИТЬ
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
