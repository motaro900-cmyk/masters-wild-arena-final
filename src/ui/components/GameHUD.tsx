import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AssetsMap } from '../../configs/AssetsMap';
import { useLayoutProfile } from '../../hooks/useLayoutProfile';
import { BottomNavigation } from './hud/BottomNavigation';

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
import { AncientsSanctuaryWindow } from './hud/AncientsSanctuaryWindow';
import { BaseWindow } from './hud/BaseWindow';
import { FriendsWindow } from './hud/FriendsWindow';
import { MailWindow } from './hud/MailWindow';
import { SettingsWindow } from './hud/SettingsWindow';
import { DailyGiftWindow } from './hud/DailyGiftWindow';
import { RankingWindow } from './hud/RankingWindow';
import { ClanWindow } from './hud/ClanWindow';
import { RanksListWindow } from './hud/RanksListWindow';
import { InventoryPanel } from './hud/InventoryPanel';
import { AdminPanel } from './hud/AdminPanel';
import { VIPWindow } from './hud/VIPWindow';
import { UnderDevelopmentModal } from './hud/SharedUI';
import { BestiaryWindow } from './hud/BestiaryWindow';
import { MatchmakingOverlay } from './hud/MatchmakingOverlay';

import { safeGetItem, safeSetItem } from '../../utils/SafeStorage';

export const GameHUD: React.FC = () => {
    const profile = useLayoutProfile();
    const activeScreen = useGameStore((state) => state.activeScreen);
    const vipLevel = useGameStore((state) => state.vipLevel);
    const [activeWindow, setActiveWindow] = useState<string | null>(null);
    const [showAdmin, setShowAdmin] = useState(false);
    const [devModal, setDevModal] = useState({ isOpen: false, title: '' });
    const goToShop = useGameStore((state) => state.goToShop);
    const [prevScreen, setPrevScreen] = useState(activeScreen);

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

        // Синхронизируем vipLevel и maxEnergy в сторе
        const expectedVipLevel = isActive ? 1 : 0;
        const expectedMaxEnergy = isActive ? 60 : 50;

        const currentMaxEnergy = useGameStore.getState().maxEnergy;
        if (vipLevel !== expectedVipLevel || currentMaxEnergy !== expectedMaxEnergy) {
            setTimeout(() => {
                useGameStore.setState({
                    vipLevel: expectedVipLevel,
                    maxEnergy: expectedMaxEnergy,
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
                const currentMail = useGameStore.getState().mail;
                useGameStore.setState({
                    mail: [newMail, ...currentMail],
                });
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
        activeScreen === 'FORGE';

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
                <div className="absolute top-[30px] left-[5px] hud-interactive">
                    <ProfileHub />
                </div>
            )}

            {/* 2. BATTLE PASS BAR */}
            {!isFullScreenScene && (
                <div className="absolute top-[20px] left-1/2 -translate-x-1/2 hud-interactive">
                    <BattlePassBar />
                </div>
            )}

            {/* 3. RESOURCES */}
            {activeScreen !== 'BATTLE' && (
                <div className="absolute top-[20px] right-[25px] hud-interactive">
                    <ResourceBar
                        onOpenShop={(tab) => {
                            goToShop(tab === 'RESOURCES' ? 'BANK' : 'ALCHEMY');
                        }}
                    />
                </div>
            )}

            {/* 4. SIDEBARS & PANELS */}
            {!isFullScreenScene && (
                <>
                    {profile !== 'MOBILE' && (
                        <div className="absolute top-[455px] left-[-10px] -translate-y-1/2 hud-interactive">
                            <LeftSidebar
                                onOpenWindow={(id) => {
                                    if (id === 'STORE') useGameStore.getState().goToShop();
                                    else if (id === 'HEROES') useGameStore.getState().goToHeroes('LIST');
                                    else setActiveWindow(id);
                                }}
                            />
                        </div>
                    )}

                    <div className="absolute top-[160px] right-[25px] flex flex-col gap-3 items-end hud-interactive">
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

                    <div className="absolute bottom-[15px] left-[5px] hud-interactive">
                        <ChatPanel />
                    </div>

                    <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 hud-interactive">
                        <ActionButtons
                            onStartBattle={() => setActiveWindow('RANKED_LOBBY')}
                            onWarmup={() => useGameStore.getState().setScreen('BATTLE')}
                            onOpenRanks={() => setActiveWindow('RANKS_LIST')}
                        />
                    </div>

                    {/* STANDALONE CITY BUTTON (100px further right) */}
                    <button
                        className="absolute bottom-[10px] left-[calc(50%+400px)] hud-interactive"
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
                                    transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15) translateY(-5px)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
                            />
                        ))}
                    </div>
                </>
            )}

            {profile === 'MOBILE' && !isFullScreenScene && (
                <BottomNavigation
                    onNavigate={(id) => {
                        if (id === 'SHOP') useGameStore.getState().goToShop();
                        else if (id === 'HEROES') useGameStore.getState().goToHeroes('LIST');
                        else if (id === 'MAIN_MENU') useGameStore.getState().goToMainMenu();
                        else setActiveWindow(id);
                    }}
                />
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
                        {activeWindow === 'SANCTUARY' && (
                            <BaseWindow
                                title="ОБИТЕЛЬ ДРЕВНИХ"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="800px"
                            >
                                <AncientsSanctuaryWindow />
                            </BaseWindow>
                        )}
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
                        {activeWindow === 'GIFT' && (
                            <BaseWindow
                                title="ЕЖЕДНЕВНЫЙ ПОДАРОК"
                                isOpen={true}
                                onClose={() => setActiveWindow(null)}
                                width="600px"
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
                                    <InventoryPanel onItemClick={() => {}} />
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
            {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

            {activeWindow === 'RANKED_LOBBY' && (
                <MatchmakingOverlay
                    onCancel={() => setActiveWindow(null)}
                    onFound={(enemyId) => {
                        setActiveWindow(null);

                        // Use the selected mob from matchmaking
                        useGameStore.setState({ selectedEnemyId: enemyId || 'wolf_scout', battleMode: 'RANKED' });

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
        </div>
    );
};
