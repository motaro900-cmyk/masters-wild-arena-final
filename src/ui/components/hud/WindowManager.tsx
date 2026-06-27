import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { lazyWithRetry } from '../../../utils/LazyWithRetry';

// Window Components
const FriendsWindow = lazyWithRetry(() => import('./FriendsWindow'));
const MailWindow = lazyWithRetry(() => import('./MailWindow'));
const SettingsWindow = lazyWithRetry(() => import('./SettingsWindow'));
const ProfileCustomizeWindow = lazyWithRetry(() => import('./ProfileCustomizeWindow'));
const DailyGiftWindow = lazyWithRetry(() => import('./DailyGiftWindow'));
const RankingWindow = lazyWithRetry(() => import('./RankingWindow'));
const ClanWindow = lazyWithRetry(() => import('./ClanWindow'));
const RanksListWindow = lazyWithRetry(() => import('./RanksListWindow'));
const InventoryPanel = lazyWithRetry(() => import('./InventoryPanel'));
const VIPWindow = lazyWithRetry(() => import('./VIPWindow'));
const BestiaryWindow = lazyWithRetry(() => import('./BestiaryWindow'));
const ServerTime = lazyWithRetry(() => import('./ServerTime').then((m) => ({ default: m.ServerTime })));
import { BaseWindow } from './BaseWindow';
import { WindowLoadingSpinner } from './WindowLoadingSpinner';

interface WindowManagerProps {
    activeWindow: string | null;
    setActiveWindow: (win: string | null) => void;
    setShowAdmin: (val: boolean) => void;
}

export const WindowManager: React.FC<WindowManagerProps> = ({ activeWindow, setActiveWindow, setShowAdmin }) => {
    const isMobile = useGameStore((state: any) => state.isMobile);

    if (!activeWindow) return null;

    // PC: 1280x850px (fits 1920x1080 perfectly)
    // Mobile: 980x700px (more compact, leaves margins on smaller phone displays)
    const windowWidth = isMobile ? '980px' : '1280px';
    const windowHeight = isMobile ? '700px' : '850px';

    return (
        <div
            className="pointer-events-auto"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 100,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onClick={() => setActiveWindow(null)}
        >
            <div className="hud-interactive" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                <React.Suspense fallback={<WindowLoadingSpinner />}>
                    {activeWindow === 'FRIENDS' && (
                        <BaseWindow
                            title="ДРУЗЬЯ"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <FriendsWindow onClose={() => setActiveWindow(null)} />
                        </BaseWindow>
                    )}
                    {activeWindow === 'MAIL' && (
                        <BaseWindow
                            title="ПОЧТА"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <MailWindow onClose={() => setActiveWindow(null)} />
                        </BaseWindow>
                    )}
                    {activeWindow === 'VIP' && (
                        <BaseWindow
                            title="VIP СТАТУС"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <VIPWindow onClose={() => setActiveWindow(null)} />
                        </BaseWindow>
                    )}
                    {activeWindow === 'SETTINGS' && (
                        <BaseWindow
                            title="НАСТРОЙКИ"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
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
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <ProfileCustomizeWindow onClose={() => setActiveWindow(null)} />
                        </BaseWindow>
                    )}
                    {activeWindow === 'GIFT' && (
                        <BaseWindow
                            title="ЕЖЕДНЕВНЫЕ НАГРАДЫ"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <DailyGiftWindow onClose={() => setActiveWindow(null)} />
                        </BaseWindow>
                    )}
                    {activeWindow === 'RANKING' && (
                        <BaseWindow
                            title="РЕЙТИНГ"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <RankingWindow />
                        </BaseWindow>
                    )}
                    {activeWindow === 'CLAN' && (
                        <BaseWindow
                            title="ИНФОРМАЦИЯ О КЛАНЕ"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <ClanWindow />
                        </BaseWindow>
                    )}
                    {activeWindow === 'RANKS_LIST' && (
                        <BaseWindow
                            title="ПУТЬ МАСТЕРА"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <RanksListWindow />
                        </BaseWindow>
                    )}
                    {activeWindow === 'INVENTORY' && (
                        <BaseWindow
                            title="ИНВЕНТАРЬ"
                            isOpen={true}
                            onClose={() => setActiveWindow(null)}
                            width={windowWidth}
                            height={windowHeight}
                        >
                            <div
                                style={{
                                    padding: '30px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    height: '100%',
                                    boxSizing: 'border-box',
                                }}
                            >
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
                                        } else if (item && item.mainTab === 'ALCHEMY' && item.subTab !== 'RESOURCES') {
                                            if (itemId === 'protection_stone') return;

                                            let effectDesc = '';
                                            if (itemId === 'hp_potion_1') effectDesc = '+10% к макс. здоровью на 1 час';
                                            if (itemId === 'hp_potion_2') effectDesc = '+20% к макс. здоровью на 1 час';
                                            if (itemId === 'hp_potion_3') effectDesc = '+35% к макс. здоровью на 1 час';
                                            if (itemId === 'mana_potion_1')
                                                effectDesc = '+15% к скорости атаки на 1 час';
                                            if (itemId === 'exp_potion_small') effectDesc = '+2 000 опыта';
                                            if (itemId === 'exp_potion_medium') effectDesc = '+10 000 опыта';
                                            if (itemId === 'exp_potion_large') effectDesc = '+50 000 опыта';

                                            useGameStore
                                                .getState()
                                                .showConfirm(`Выпить "${item.name}"?\nЭффект: ${effectDesc}`, () => {
                                                    useGameStore.getState().useConsumable(itemId);
                                                });
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
                            width={windowWidth}
                            height={windowHeight}
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
