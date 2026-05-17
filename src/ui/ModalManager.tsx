import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useGameStore } from '../store/useGameStore';
import { BeastsScreen } from './BeastsScreen';
import { createPortal } from 'react-dom';

// Реестр экранов для легкой расширяемости (добавляйте сюда новые окна)
const SCREEN_REGISTRY: Record<string, React.FC> = {
    beasts: BeastsScreen,
};

export const ModalManager: React.FC = () => {
    const [mounted, setMounted] = useState(false);

    // Получаем текущий экран из Zustand
    const activeScreen = useGameStore((state: any) => state.activeScreen);

    const overlayRef = useRef<HTMLDivElement>(null);
    const safeZoneRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Устанавливаем флаг монтирования для безопасного использования Portal (защита от гидратации)
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // ЗАДАЧА 2: ИЗОЛЯЦИЯ СКЕЙЛА (SafeZone logic)
    useEffect(() => {
        const updateScale = () => {
            if (safeZoneRef.current) {
                // Базовое разрешение 1920x1080 (16:9) как у остальной игры
                const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
                safeZoneRef.current.style.transform = `scale(${scale})`;
                // ШАГ 3: ФИКС ХИТБОКСОВ (ЖЕСТКО ЗАДАЕМ TRANSFORM-ORIGIN В JS)
                safeZoneRef.current.style.transformOrigin = 'center center';
            }
        };

        if (activeScreen) {
            updateScale();
            window.addEventListener('resize', updateScale);
        }

        return () => window.removeEventListener('resize', updateScale);
    }, [activeScreen]);

    // Анимация GSAP при открытии
    useGSAP(() => {
        if (activeScreen && overlayRef.current && contentRef.current) {
            gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
            gsap.fromTo(
                contentRef.current,
                { scale: 0.9, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' },
            );
        }
    }, [activeScreen]);

    // Проверка на монтирование и наличие активного экрана
    // ВАЖНО: Делаем возврат null только после того, как все хуки (useGSAP, useEffect) были вызваны
    if (!mounted || !activeScreen) return null;

    const ActiveComponent = SCREEN_REGISTRY[activeScreen];
    if (!ActiveComponent) return null;

    // Рендерим модалку через Портал напрямую в body, чтобы пробить любой stacking context
    return createPortal(
        // ЗАДАЧА 1: ПРОЗРАЧНЫЙ КОРЕНЬ ПОРТАЛА (Именно none!)
        <div className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center">
            {/* Затемняющий фон (тоже пропускает клики, не блокирует пустые зоны) */}
            <div ref={overlayRef} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

            {/* ЗАДАЧА 2: ИЗОЛЯЦИЯ СКЕЙЛА (SafeZone) */}
            <div
                ref={safeZoneRef}
                className="relative w-[1920px] h-[1080px] flex items-center justify-center pointer-events-none"
                style={{ transformOrigin: 'center center' }}
            >
                {/* Анимируемый GSAP контейнер (ограничиваем размер окна относительно 1920x1080) */}
                <div
                    ref={contentRef}
                    className="relative w-[1600px] h-[900px] p-8 flex items-center justify-center pointer-events-none"
                >
                    {/* Внутри компонента уже будет pointer-events-auto */}
                    <ActiveComponent />
                </div>
            </div>
        </div>,
        document.body,
    );
};
