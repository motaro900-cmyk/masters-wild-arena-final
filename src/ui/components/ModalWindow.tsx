import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface ModalWindowProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export const ModalWindow: React.FC<ModalWindowProps> = ({ title, onClose, children }) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Анимация появления
        gsap.from(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.out' });
        gsap.from(windowRef.current, { scale: 0.9, opacity: 0, duration: 0.3, ease: 'back.out(1.5)' });
    }, []);

    const handleClose = () => {
        // Анимация исчезновения перед демонтированием компонента
        gsap.to(windowRef.current, { scale: 0.95, opacity: 0, duration: 0.2, ease: 'power2.in' });
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: onClose });
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleClose}
            className="absolute inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center pointer-events-auto select-none"
        >
            <div
                ref={windowRef}
                onClick={(e) => e.stopPropagation()} // Блокируем закрытие при клике на само окно
                className="flex flex-col bg-[#16110d] border-[3px] border-[#8b5cf6] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.9)] w-[640px] max-w-[95vw] overflow-hidden"
                style={{
                    borderColor: '#8b5cf6',
                    borderImageSource: 'linear-gradient(180deg, #d4b483 0%, #5e4125 100%)',
                    borderImageSlice: 1,
                }}
            >
                {/* Заголовок */}
                <div className="bg-gradient-to-b from-[#2a1f16] to-[#16110d] border-b-2 border-[#5e4125] flex justify-between items-center px-8 py-4 relative">
                    <h2 className="text-[#facc15] font-black text-2xl tracking-widest uppercase drop-shadow-md">
                        {title}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 bg-[#3a2818] hover:bg-[#dc2626] border-2 border-[#78350f] hover:border-white rounded-full flex items-center justify-center text-white font-black text-xl transition-colors active:scale-90"
                    >
                        ✕
                    </button>
                </div>

                {/* Контент */}
                <div className="relative">{children}</div>
            </div>
        </div>
    );
};
