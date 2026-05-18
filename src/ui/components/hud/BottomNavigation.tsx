import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';

interface NavItem {
    id: string;
    label: string;
    icon: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'MAIN_MENU', label: 'ГЛАВНАЯ', icon: '🏰' },
    { id: 'HEROES', label: 'ГЕРОИ', icon: '🛡️' },
    { id: 'INVENTORY', label: 'РЮКЗАК', icon: '🎒' },
    { id: 'CLAN', label: 'КЛАН', icon: '👥' },
    { id: 'SHOP', label: 'МАГАЗИН', icon: '💰' },
];

export const BottomNavigation: React.FC<{ onNavigate: (id: string) => void }> = ({ onNavigate }) => {
    const activeScreen = useGameStore((state) => state.activeScreen);

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70px',
                background: 'linear-gradient(180deg, rgba(20, 15, 10, 0.95) 0%, rgba(10, 5, 0, 1) 100%)',
                borderTop: '2px solid rgba(240, 192, 64, 0.3)',
                boxShadow: '0 -5px 20px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 10px',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)', // Safe area for iOS
                zIndex: 50,
                pointerEvents: 'auto',
            }}
        >
            {NAV_ITEMS.map((item) => {
                const isActive = activeScreen === item.id || (item.id === 'MAIN_MENU' && activeScreen === 'MAIN_MENU');

                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            onNavigate(item.id);
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            flex: 1,
                            height: '100%',
                            transition: 'all 0.2s ease',
                            opacity: isActive ? 1 : 0.6,
                        }}
                    >
                        <span style={{ fontSize: '24px', filter: isActive ? 'drop-shadow(0 0 5px #f0c040)' : 'none' }}>
                            {item.icon}
                        </span>
                        <span
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: '10px',
                                fontWeight: 800,
                                color: isActive ? '#f0c040' : '#c8a870',
                                letterSpacing: '1px',
                                textShadow: '0 1px 2px rgba(0,0,0,1)',
                            }}
                        >
                            {item.label}
                        </span>

                        {isActive && (
                            <div
                                style={{
                                    width: '20px',
                                    height: '2px',
                                    background: '#f0c040',
                                    boxShadow: '0 0 5px #f0c040',
                                    marginTop: '2px',
                                    borderRadius: '1px',
                                }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
