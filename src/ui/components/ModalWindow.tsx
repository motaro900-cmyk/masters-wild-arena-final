import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useGameStore } from '../../store/useGameStore';
import { motion } from 'framer-motion';

interface ModalWindowProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export const ModalWindow: React.FC<ModalWindowProps> = ({ title, onClose, children }) => {
    const isMobile = useGameStore((state: any) => state.isMobile);
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
                className="flex flex-col w-[640px] max-w-[95vw] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
                style={{
                    border: '3px solid transparent',
                    backgroundImage:
                        'linear-gradient(#16110d, #16110d), linear-gradient(180deg, #d4b483 0%, #5e4125 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '24px',
                }}
            >
                {/* Заголовок */}
                <div className="bg-gradient-to-b from-[#2a1f16] to-[#16110d] border-b-2 border-[#5e4125] flex justify-between items-center px-8 py-4 relative">
                    <h2 className="text-[#facc15] font-black text-2xl tracking-widest uppercase drop-shadow-md">
                        {title}
                    </h2>
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={handleClose}
                        className="cursor-pointer flex items-center justify-center"
                        style={{
                            padding: isMobile ? '20px' : '8px',
                            margin: isMobile ? '-20px' : '-8px',
                        }}
                    >
                        <div
                            className="w-10 h-10 bg-[#3a2818] hover:bg-[#dc2626] border-2 border-[#78350f] hover:border-white rounded-full flex items-center justify-center text-white font-black text-xl transition-colors pointer-events-none"
                        >
                            ✕
                        </div>
                    </motion.div>
                </div>

                {/* Контент */}
                <div className="relative">{children}</div>
            </div>
        </div>
    );
};
