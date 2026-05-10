import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AssetsMap } from '../../configs/AssetsMap';

// HUD Components
import { PlayerProfile } from './hud/PlayerProfile';
import { BattlePassBar } from './hud/BattlePassBar';
import { ResourceBar } from './hud/ResourceBar';
import { LeftSidebar } from './hud/LeftSidebar';
import { DailyTaskPanel } from './hud/DailyTaskPanel';
import { ChatPanel } from './hud/ChatPanel';
import { ActionButtons } from './hud/ActionButtons';
import { DailyGiftBanner } from './hud/DailyGiftBanner';
import { HeroScene } from './hud/HeroScene';
import { BattleScene } from './hud/BattleScene';

// Window Components
import { BaseWindow } from './hud/BaseWindow';
// import { ShopWindow } from './hud/ShopWindow'; // УДАЛЕНО: используем ShopScene
import { FriendsWindow } from './hud/FriendsWindow';
import { MailWindow } from './hud/MailWindow';
import { SettingsWindow } from './hud/SettingsWindow';
import { ProfileWindow } from './hud/ProfileWindow';
import { DailyGiftWindow } from './hud/DailyGiftWindow';
import { RankingWindow } from './hud/RankingWindow';
import { ClanWindow } from './hud/ClanWindow';
import { RanksListWindow } from './hud/RanksListWindow';
import { InventoryPanel } from './hud/InventoryPanel';
import { ALL_SHOP_ITEMS } from '../../configs/ShopConfig';

export const GameHUD: React.FC = () => {
    const activeScreen = useGameStore(state => state.activeScreen);
    const [activeWindow, setActiveWindow] = useState<string | null>(null);
    const goToShop = useGameStore(state => state.goToShop);

    // Скрываем HUD в бою, в магазине, в героях или на экранах загрузки
    
    // Show ONLY ResourceBar when in Shop or Heroes
    const isFullScreenScene = activeScreen === 'SHOP' || activeScreen === 'HEROES';
    
    if (activeScreen === 'BATTLE') return <BattleScene />;
    if (activeScreen !== 'MAIN_MENU' && activeScreen !== 'ARENA' && !isFullScreenScene) return null;

    return (
        <div style={{ 
            width: '1920px', 
            height: '1080px', 
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            overflow: 'hidden'
        }}>
            {/* 1. PLAYER PROFILE */}
            {!isFullScreenScene && (
                <div className="absolute top-[20px] left-[10px] hud-interactive">
                    <PlayerProfile 
                        onOpenProfile={() => setActiveWindow('PROFILE')}
                        onOpenRanks={() => setActiveWindow('RANKS_LIST')} 
                    />
                </div>
            )}

            {/* 2. BATTLE PASS BAR */}
            {!isFullScreenScene && (
                <div className="absolute top-[20px] left-1/2 -translate-x-1/2 hud-interactive">
                    <BattlePassBar />
                </div>
            )}

            {/* 3. RESOURCES (Always visible in Shop/Heroes) */}
            <div className="absolute top-[25px] right-[25px] hud-interactive">
                <ResourceBar onOpenShop={(tab) => {
                    goToShop(tab === 'RESOURCES' ? 'BANK' : 'ALCHEMY');
                }} />
            </div>

            {/* 4. SIDEBARS & PANELS */}
            {!isFullScreenScene && (
                <>
                    <div className="absolute top-[480px] left-[-10px] -translate-y-1/2 hud-interactive">
                        <LeftSidebar onOpenWindow={(id) => {
                            if (id === 'STORE') useGameStore.getState().goToShop();
                            else if (id === 'HEROES') useGameStore.getState().goToHeroes('LIST');
                            else setActiveWindow(id);
                        }} />
                    </div>

                    <div className="absolute top-[160px] right-[25px] flex flex-col gap-3 items-end hud-interactive">
                        <DailyGiftBanner onClick={() => setActiveWindow('GIFT')} />
                        <DailyTaskPanel />
                    </div>

                    <div className="absolute bottom-[30px] left-[-5px] hud-interactive">
                        <ChatPanel />
                    </div>
                    
                    <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 hud-interactive">
                        <ActionButtons onStartBattle={() => useGameStore.getState().goToArena()} />
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
                        }}
                    >
                {[
                  { id: 'FRIENDS', sprite: AssetsMap.UI.ICON_FRIENDS },
                  { id: 'MAIL', sprite: AssetsMap.UI.ICON_MAIL },
                  { id: 'SETTINGS', sprite: AssetsMap.UI.ICON_SETTINGS }
                ].map(win => (
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
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15) translateY(-5px)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
                    />
                ))}
                    </div>
                </>
            )}

            {/* --- МОДАЛЬНЫЕ ОКНА --- */}
            {activeWindow && (
              <div className="absolute inset-0 z-[100] pointer-events-none bg-black/60 backdrop-blur-sm">
                <div className="absolute top-[540px] left-[960px] -translate-x-1/2 -translate-y-1/2 hud-interactive">
                  {/* МАГАЗИН ТЕПЕРЬ ПОЛНОЭКРАННЫЙ (ShopScene.tsx) */}
                  {activeWindow === 'FRIENDS' && (
                      <BaseWindow title="ДРУЗЬЯ" isOpen={true} onClose={() => setActiveWindow(null)} width="800px">
                          <FriendsWindow onClose={() => setActiveWindow(null)} />
                      </BaseWindow>
                  )}
                  {activeWindow === 'MAIL' && (
                      <BaseWindow title="ПОЧТА" isOpen={true} onClose={() => setActiveWindow(null)} width="900px">
                          <MailWindow onClose={() => setActiveWindow(null)} />
                      </BaseWindow>
                  )}
                  {activeWindow === 'SETTINGS' && (
                      <BaseWindow title="НАСТРОЙКИ" isOpen={true} onClose={() => setActiveWindow(null)} width="650px">
                          <SettingsWindow onClose={() => setActiveWindow(null)} />
                      </BaseWindow>
                  )}
                  {activeWindow === 'PROFILE' && (
                      <ProfileWindow onClose={() => setActiveWindow(null)} />
                  )}
                  {activeWindow === 'GIFT' && (
                      <BaseWindow title="ЕЖЕДНЕВНЫЙ ПОДАРОК" isOpen={true} onClose={() => setActiveWindow(null)} width="600px">
                          <DailyGiftWindow onClose={() => setActiveWindow(null)} />
                      </BaseWindow>
                  )}
                  {activeWindow === 'RANKING' && (
                      <BaseWindow title="МИРОВОЙ РЕЙТИНГ" isOpen={true} onClose={() => setActiveWindow(null)} width="900px">
                          <RankingWindow />
                      </BaseWindow>
                  )}
                  {activeWindow === 'CLAN' && (
                      <BaseWindow title="ИНФОРМАЦИЯ О КЛАНЕ" isOpen={true} onClose={() => setActiveWindow(null)} width="1000px">
                          <ClanWindow />
                      </BaseWindow>
                  )}
                  {activeWindow === 'RANKS_LIST' && (
                      <BaseWindow title="ПУТЬ МАСТЕРА" isOpen={true} onClose={() => setActiveWindow(null)} width="850px">
                          <RanksListWindow />
                      </BaseWindow>
                  )}
                  {activeWindow === 'INVENTORY' && (
                      <BaseWindow title="ИНВЕНТАРЬ" isOpen={true} onClose={() => setActiveWindow(null)} width="1100px">
                          <div style={{ padding: '30px', display: 'flex', justifyContent: 'center' }}>
                            <InventoryPanel 
                                onItemClick={(id) => {
                                    // Обработка клика теперь внутри компонента для выделения
                                }}
                                isEquipped={(id) => {
                                    const { equippedWeaponId, equippedHelmId, equippedArmorId, equippedShieldId } = useGameStore.getState();
                                    return id === equippedWeaponId || id === equippedHelmId || id === equippedArmorId || id === equippedShieldId;
                                }}
                            />
                          </div>
                      </BaseWindow>
                  )}
                </div>
              </div>
            )}
        </div>
    );
};
