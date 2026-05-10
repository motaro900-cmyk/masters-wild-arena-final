import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { GameApp } from './GameApp';
import { GameHUD } from './ui/components/GameHUD';
import { AppConfig } from './configs/AppConfig';
import { useGameStore } from './store/useGameStore';
import { ShopScene } from './ui/components/hud/ShopScene';
import { BattlePassScene } from './ui/components/hud/BattlePassScene';
import { HeroScene } from './ui/components/hud/HeroScene';
import { AnimatePresence } from 'framer-motion';
import { FpsCounter } from './ui/components/hud/FpsCounter';
import { initVK, getVkUserInfo } from './utils/VKBridge';

// ─── КОМПОНЕНТЫ ──────────────────────────────────────────────────────────────

const SafeGameLayout = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => {
    const [scale, setScale] = React.useState(1);
    const [showFps, setShowFps] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            const gw = AppConfig.GAME_WIDTH;
            const gh = AppConfig.GAME_HEIGHT;
            const s = Math.min(sw / gw, sh / gh);
            setScale(s);
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'F8') setShowFps(prev => !prev);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKey);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKey);
        };
    }, []);

    return (
        <div style={{
            width: '100vw', height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#000', overflow: 'hidden'
        }}>
            <div style={{
                width: `${AppConfig.GAME_WIDTH}px`, height: `${AppConfig.GAME_HEIGHT}px`,
                transform: `scale(${scale})`, transformOrigin: 'center center',
                position: 'relative', flexShrink: 0,
                backgroundColor: '#0c0c0c', boxShadow: '0 0 100px rgba(0,0,0,0.5)'
            }}>
                <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }} />
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
                    <GameHUD />
                </div>
                {showFps && <FpsCounter />}
                <SceneSwitcher />
            </div>
        </div>
    );
};

const SceneSwitcher = () => {
    const activeScreen = useGameStore(state => state.activeScreen);
    return (
        <AnimatePresence>
            {activeScreen === 'HEROES' && <div key="scene-heroes" style={{ position: 'absolute', inset: 0, zIndex: 400 }}><HeroScene /></div>}
            {activeScreen === 'SHOP' && <div key="scene-shop" style={{ position: 'absolute', inset: 0, zIndex: 500 }}><ShopScene /></div>}
            {activeScreen === 'BATTLE_PASS' && <div key="scene-bp" style={{ position: 'absolute', inset: 0, zIndex: 600 }}><BattlePassScene onClose={() => useGameStore.getState().setScreen('MAIN_MENU')} /></div>}
        </AnimatePresence>
    );
};

const Root = () => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const initialized = React.useRef(false);

    React.useEffect(() => {
        if (initialized.current || !containerRef.current) return;
        initialized.current = true;

        const initApp = async () => {
            const vkAvailable = await initVK();
            if (vkAvailable) {
                const user = await getVkUserInfo();
                if (user) useGameStore.getState().setVkUser(user);
            }

            const game = new GameApp();
            await game.init(containerRef.current);

            const state = useGameStore.getState();
            if (Date.now() - state.lastDailyRefresh > 86_400_000 || state.dailyQuests.length === 0) {
                state.refreshDailyQuests();
            }
        };

        initApp().catch(err => console.error('Game Init Error:', err));
    }, []);

    return <SafeGameLayout containerRef={containerRef} />;
};

// ─── ТОЧКА ВХОДА ─────────────────────────────────────────────────────────────

const rootEl = document.getElementById('root');
if (rootEl) {
    ReactDOM.createRoot(rootEl).render(<Root />);
}