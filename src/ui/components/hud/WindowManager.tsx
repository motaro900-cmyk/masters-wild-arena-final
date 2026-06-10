import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';

// Window Components
import { FriendsWindow } from './FriendsWindow';
import { MailWindow } from './MailWindow';
import { SettingsWindow } from './SettingsWindow';
import { ProfileCustomizeWindow } from './ProfileCustomizeWindow';
import { DailyGiftWindow } from './DailyGiftWindow';
import { RankingWindow } from './RankingWindow';
import { ClanWindow } from './ClanWindow';
import { RanksListWindow } from './RanksListWindow';
import { InventoryPanel } from './InventoryPanel';
import { VIPWindow } from './VIPWindow';
import { BestiaryWindow } from './BestiaryWindow';
import { ServerTime } from './ServerTime';
import { BaseWindow } from './BaseWindow';

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
            </div>
        </div>
    );
};
