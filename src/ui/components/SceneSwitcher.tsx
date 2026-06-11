import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { lazyWithRetry } from '../../utils/LazyWithRetry';
// Ленивая загрузка экранов и сцен для оптимизации размера бандла (Шаг 11)
const ShopScene = lazyWithRetry(() => import('./hud/ShopScene').then((m) => ({ default: m.ShopScene })));
const BattlePassScene = lazyWithRetry(() =>
    import('./hud/BattlePassScene').then((m) => ({ default: m.BattlePassScene })),
);
const HeroScene = lazyWithRetry(() => import('./hud/HeroScene/index').then((m) => ({ default: m.HeroScene })));
const IntroScreen = lazyWithRetry(() => import('./screens/IntroScreen').then((m) => ({ default: m.IntroScreen })));
const CityScreen = lazyWithRetry(() => import('./screens/CityScreen').then((m) => ({ default: m.CityScreen })));
const ForgeScreen = lazyWithRetry(() => import('./screens/ForgeScreen').then((m) => ({ default: m.ForgeScreen })));
const BattleScene = lazyWithRetry(() => import('./hud/BattleScene').then((m) => ({ default: m.BattleScene })));
const AncientsSanctuaryScreen = lazyWithRetry(() =>
    import('./screens/AncientsSanctuaryScreen').then((m) => ({ default: m.AncientsSanctuaryScreen })),
);

export const SceneSwitcher = () => {
    const activeScreen = useGameStore((state) => state.activeScreen);
    const profileStatus = useGameStore((state) => state.profileStatus);

    if (profileStatus !== 'loaded') {
        return null;
    }

    return (
        <>
            {activeScreen === 'INTRO' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 11000 }}>
                    <IntroScreen
                        onComplete={() => {
                            useGameStore.setState({ activeScreen: 'MAIN_MENU', showIntro: false });
                        }}
                    />
                </div>
            )}
            {activeScreen === 'CITY' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 9000 }}>
                    <CityScreen />
                </div>
            )}
            <AnimatePresence>
                {activeScreen === 'HEROES' && (
                    <div key="scene-heroes" style={{ position: 'absolute', inset: 0, zIndex: 10000 }}>
                        <HeroScene />
                    </div>
                )}
                {activeScreen === 'SHOP' && (
                    <div key="scene-shop" style={{ position: 'absolute', inset: 0, zIndex: 10100 }}>
                        <ShopScene />
                    </div>
                )}
                {activeScreen === 'BATTLE_PASS' && (
                    <div key="scene-bp" style={{ position: 'absolute', inset: 0, zIndex: 10200 }}>
                        <BattlePassScene onClose={() => useGameStore.getState().setScreen('MAIN_MENU')} />
                    </div>
                )}
                {activeScreen === 'BATTLE' && (
                    <div key="scene-battle" style={{ position: 'absolute', inset: 0, zIndex: 12000 }}>
                        <BattleScene />
                    </div>
                )}
                {activeScreen === 'FORGE' && (
                    <div key="scene-forge" style={{ position: 'absolute', inset: 0, zIndex: 9500 }}>
                        <ForgeScreen />
                    </div>
                )}
                {activeScreen === 'SANCTUARY' && (
                    <div key="scene-sanctuary" style={{ position: 'absolute', inset: 0, zIndex: 9100 }}>
                        <AncientsSanctuaryScreen />
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
