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
const ServerTime = lazyWithRetry(() => import('./ServerTime').then(m => ({ default: m.ServerTime })));
import { BaseWindow } from './BaseWindow';
import { WindowLoadingSpinner } from './WindowLoadingSpinner';

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
                className="absolute top-[508px] left-[960px] hud-interactive"
                style={{ transform: 'translate3d(-50%, -50%, 0)', willChange: 'transform' }}
                onClick={(e) => e.stopPropagation()}
            >
                <React.Suspense fallback={<WindowLoadingSpinner />}>
                    {activeWindow === 'FRIENDS' && (
                    <BaseWindow
                        title="ДРУЗЬЯ"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="1200px"
                        height="900px"
                    >
                        <FriendsWindow onClose={() => setActiveWindow(null)} />
                    </BaseWindow>
                )}
                {activeWindow === 'MAIL' && (
                    <BaseWindow title="ПОЧТА" isOpen={true} onClose={() => setActiveWindow(null)} width="1380px" height="900px">
                        <MailWindow onClose={() => setActiveWindow(null)} />
                    </BaseWindow>
                )}
                {activeWindow === 'VIP' && (
                    <BaseWindow
                        title="VIP СТАТУС"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="1000px"
                        height="900px"
                    >
                        <VIPWindow onClose={() => setActiveWindow(null)} />
                    </BaseWindow>
                )}
                {activeWindow === 'SETTINGS' && (
                    <BaseWindow
                        title="НАСТРОЙКИ"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="1080px"
                        height="880px"
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
                        width="1320px"
                        height="860px"
                    >
                        <ProfileCustomizeWindow onClose={() => setActiveWindow(null)} />
                    </BaseWindow>
                )}
                {activeWindow === 'GIFT' && (
                    <BaseWindow
                        title="КАЛЕНДАРЬ НАГРАД"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="1100px"
                        height="900px"
                    >
                        <DailyGiftWindow onClose={() => setActiveWindow(null)} />
                    </BaseWindow>
                )}
                {activeWindow === 'RANKING' && (
                    <BaseWindow
                        title="РЕЙТИНГ"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="1100px"
                        height="900px"
                    >
                        <RankingWindow />
                    </BaseWindow>
                )}
                {activeWindow === 'CLAN' && (
                    <BaseWindow
                        title="ИНФОРМАЦИЯ О КЛАНЕ"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="1200px"
                        height="900px"
                    >
                        <ClanWindow />
                    </BaseWindow>
                )}
                {activeWindow === 'RANKS_LIST' && (
                    <BaseWindow
                        title="ПУТЬ МАСТЕРА"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="1050px"
                        height="880px"
                    >
                        <RanksListWindow />
                    </BaseWindow>
                )}
                {activeWindow === 'INVENTORY' && (
                    <BaseWindow
                        title="ИНВЕНТАРЬ"
                        isOpen={true}
                        onClose={() => setActiveWindow(null)}
                        width="1450px"
                        height="900px"
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
                        width="1150px"
                        height="900px"
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
