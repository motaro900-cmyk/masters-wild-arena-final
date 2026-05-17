import React, { useRef } from 'react';
import gsap from 'gsap';

interface JuicyButtonProps {
    icon: React.ReactNode | string;
    label: string;
    notificationCount?: number;
    onClick: () => void;
    className?: string;
}

export const JuicyButton: React.FC<JuicyButtonProps> = ({
    icon,
    label,
    notificationCount = 0,
    onClick,
    className = '',
}) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const handleMouseEnter = () => {
        gsap.to(btnRef.current, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
        gsap.to(btnRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    const handlePointerDown = () => {
        gsap.to(btnRef.current, { scale: 0.9, duration: 0.1, ease: 'power2.out' });
    };

    const handlePointerUp = () => {
        gsap.to(btnRef.current, { scale: 1.05, duration: 0.3, ease: 'back.out(2)' });
        onClick();
    };

    return (
        <button
            ref={btnRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handleMouseLeave}
            className={`relative pointer-events-auto flex flex-col items-center justify-center w-[80px] h-[80px] bg-gradient-to-b from-[#2a221b] to-[#120e0b] border-2 border-[#5e4125] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.6)] group select-none ${className}`}
        >
            {notificationCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-[#dc2626] border-2 border-[#120e0b] text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md z-10">
                    {notificationCount > 99 ? '99+' : notificationCount}
                </div>
            )}
            <div className="text-3xl drop-shadow-md mb-1 transition-transform group-hover:scale-110 duration-300">
                {icon}
            </div>
            <span className="text-[#d4b483] font-black text-[9px] tracking-widest uppercase group-hover:text-white transition-colors">
                {label}
            </span>
        </button>
    );
};
