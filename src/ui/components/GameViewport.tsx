import React, { useEffect, useState } from 'react';
import { GameHUD } from './GameHUD';
import { useUIStore } from '../../store/useUIStore';
import { useDebugStore } from '@store/useDebugStore';
import { safeGetItem } from '../../utils/SafeStorage';
import { AssetsMap } from '../../configs/AssetsMap';
import { useGameStore } from '../../store/useGameStore';

export const GameViewport: React.FC = () => {
    const [scale, setScale] = useState(1);
    const isEditMode = useUIStore((state) => state.isEditMode);

    // Загрузка сохраненного Layout при старте
    useEffect(() => {
        const loadLayout = async () => {
            let layoutData: any[] | null = null;
            try {
                // Пытаемся загрузить JSON конфигурацию (Vite соберет ее в бандл)
                const module = await import('../../data/layoutConfig.json');
                layoutData = module.default || module;
            } catch {
                console.warn('layoutConfig.json не найден, проверяем localStorage...');
                const saved = safeGetItem('HUD_SAVED_LAYOUT');
                if (saved) {
                    try {
                        layoutData = JSON.parse(saved);
                    } catch {
                        // Ignore parse errors
                    }
                }
            }

            if (layoutData && Array.isArray(layoutData)) {
                // 1. Восстанавливаем Pixi элементы (Спрайты, Тексты, Префабы)
                useDebugStore.setState({ elements: layoutData });

                // 2. Восстанавливаем React UI элементы (Виджеты HUD)
                const uiElements = layoutData.filter((el: any) => el.type === 'ui-widget');
                if (uiElements.length > 0) {
                    const uiStoreState = useUIStore.getState() as any;
                    const newElementsMap = { ...uiStoreState.elements };
                    uiElements.forEach((el: any) => {
                        newElementsMap[el.id] = { ...(newElementsMap[el.id] || {}), ...el };
                    });
                    if (uiStoreState.setElements) uiStoreState.setElements(newElementsMap);
                }
            }
        };
        loadLayout();
    }, []);

    // Строгий расчет масштаба для 1920x1080 (Letterboxing)
    useEffect(() => {
        const handleResize = () => {
            const scaleX = window.innerWidth / 1920;
            const scaleY = window.innerHeight / 1080;
            setScale(Math.min(scaleX, scaleY));
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Вызов при старте

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Глобальный хоткей для входа в редактор (F2)
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2' && import.meta.env.DEV) {
                useUIStore.getState().toggleEditMode();
                const debugStore = useDebugStore.getState() as any;
                if (debugStore.toggleEditorMode) {
                    debugStore.toggleEditorMode();
                } else if (debugStore.isEditorMode !== undefined) {
                    useDebugStore.setState((s: any) => ({ isEditorMode: !s.isEditorMode }));
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <div className="w-screen h-screen bg-[#05050a] flex items-center justify-center overflow-hidden font-sans select-none">
            {/* Контейнер строго 1920x1080 */}
            <div
                id="game-wrapper"
                className="relative w-[1920px] h-[1080px] shrink-0 origin-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)]"
                style={{ transform: `scale(${scale})` }}
            >
                {/* === СЛОЙ 0: PIXIJS CANVAS === */}
                <div id="game-container" className="absolute inset-0 z-[0] bg-[#05050a]">
                    <img
                        src={
                            useGameStore.getState().isMobile
                                ? AssetsMap.BACKGROUNDS.MAIN_MENU_MOBILE
                                : AssetsMap.BACKGROUNDS.MAIN_MENU
                        }
                        className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
                        alt="Pixi bg"
                    />
                    {/* Сюда инжектируется <canvas> из PixiApp.ts */}
                </div>

                {/* === СЛОЙ 1: REACT DOM HUD === */}
                <GameHUD />

                {/* === СЛОЙ 2: EDIT MODE GRID === */}
                {isEditMode && (
                    <div className="absolute inset-0 z-[100] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]">
                        <div
                            className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-6 py-2 font-black text-xl rounded-b-xl shadow-[0_4px_10px_rgba(0,255,255,0.4)] pointer-events-auto cursor-pointer"
                            onClick={() => {
                                (useUIStore.getState() as any).toggleEditMode();
                                useDebugStore.setState(() => ({ isEditorMode: false }));
                            }}
                        >
                            {' '}
                            РЕДАКТОР UI (Выход - F2){' '}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
