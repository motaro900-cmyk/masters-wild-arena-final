import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';

// Window Components
const FriendsWindow = React.lazy(() => import('./FriendsWindow'));
const MailWindow = React.lazy(() => import('./MailWindow'));
const SettingsWindow = React.lazy(() => import('./SettingsWindow'));
const ProfileCustomizeWindow = React.lazy(() => import('./ProfileCustomizeWindow'));
const DailyGiftWindow = React.lazy(() => import('./DailyGiftWindow'));
const RankingWindow = React.lazy(() => import('./RankingWindow'));
const ClanWindow = React.lazy(() => import('./ClanWindow'));
const RanksListWindow = React.lazy(() => import('./RanksListWindow'));
const InventoryPanel = React.lazy(() => import('./InventoryPanel'));
const VIPWindow = React.lazy(() => import('./VIPWindow'));
const BestiaryWindow = React.lazy(() => import('./BestiaryWindow'));
const ServerTime = React.lazy(() => import('./ServerTime').then(m => ({ default: m.ServerTime })));
import { BaseWindow } from './BaseWindow';

export const WindowLoadingSpinner: React.FC = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999,
                color: '#f5d37a',
                fontFamily: "'Cinzel', 'Philosopher', serif",
                gap: '15px',
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid rgba(245, 211, 122, 0.1)',
                    borderTop: '5px solid #f5d37a',
                    borderRadius: '50%',
                    animation: 'window-spin 1s linear infinite',
                }}
            />
            <style>{`
                @keyframes window-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <div
                style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                }}
            >
                Загрузка...
            </div>
        </div>
    );
};

interface WindowManagerProps {
    activeWindow: string | null;
    setActiveWindow: (win: string | null) => void;
    setShowAdmin: (val: boolean) => void;
}

export const WindowManager: React.FC<WindowManagerProps> = ({
    activeWindow,
    setActiveWindow,
    setShowAdmin,
}) => {
    if (!activeWindow) return null;

    return (
        <div
            className="absolute inset-0 z-[100] pointer-events-auto bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveWindow(null)}
        >
            <div
                className="absolute top-[515px] left-[960px] -translate-x-1/2 -translate-y-1/2 hud-interactive"
                onClick={(e) => e.stopPropagation()}
            >
                <React.Suspense fallback={<WindowLoadingSpinner />}>
                    {activeWindow === 'FRIENDS' && (
                    <BaseWindow
                        title="ДРУЗЬЯ"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="980px"
                        height="800px"
                    >
                        <FriendsWindow onClose={() => setActiveWindow(null)} />
                    </BaseWindow>
                )}
                {activeWindow === 'MAIL' && (
                    <BaseWindow title="ПОЧТА" isOpen={true} onClose={() => setActiveWindow(null)} width="1150px" height="800px">
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
                        width="900px"
                        height="780px"
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
                        width="1220px"
                        height="800px"
                    >
                        <div style={{ padding: '30px', display: 'flex', justifyContent: 'center', height: '100%', boxSizing: 'border-box' }}>
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
                </React.Suspense>
            </div>
        </div>
    );
};

export default WindowManager;
