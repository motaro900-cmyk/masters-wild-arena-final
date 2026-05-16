import React, { useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { resolveAssetPath } from '../../utils/assetPath';

const CONFIG = {
    ASSETS: {
        SPRITES: resolveAssetPath('/assets/image-Photoroom.jpg'),
    },
};

export const SideMenu: React.FC<{ activeTab: number; setActiveTab: (v: number) => void }> = ({
    activeTab,
    setActiveTab,
}) => {
    const goToInventory = useGameStore((state) => state.goToInventory);
    const container = useRef(null);

    const menuConfig = [
        { pos: 0, label: 'ЗВЕРИ', action: () => console.log('Звери') },
        { pos: 25, label: 'ИНВЕНТАРЬ', action: goToInventory },
        { pos: 50, label: 'МАГАЗИН', action: () => console.log('Магазин') },
        { pos: 75, label: 'КЛАНЫ', action: () => console.log('Кланы') },
        { pos: 100, label: 'РЕЙТИНГ', action: () => console.log('Рейтинг') },
    ];

    useGSAP(
        () => {
            gsap.to('.online-indicator', {
                opacity: 0.5,
                duration: 1,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut',
            });

            gsap.from('.side-menu-item', {
                x: -100,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: 'back.out(1.2)',
            });
        },
        { scope: container },
    );

    return (
        <div ref={container} className="absolute left-4 top-[180px] flex flex-col z-50 pointer-events-none">
            <div className="mb-2.5 ml-4 flex items-center gap-2 pointer-events-auto">
                <div className="online-indicator w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_6px_#22c55e]" />
                <span className="text-[8px] font-black text-green-500 uppercase italic tracking-widest leading-none">
                    3 ОНЛАЙН
                </span>
            </div>
            {menuConfig.map((item, idx) => (
                <button
                    key={idx}
                    onClick={() => {
                        setActiveTab(idx);
                        item.action();
                    }}
                    className={`side-menu-item relative w-[210px] h-[64px] mb-1.5 origin-left rounded-xl pointer-events-auto
             ${
                 activeTab === idx
                     ? 'scale-110 brightness-110 z-10 drop-shadow-2xl'
                     : 'brightness-[0.7] saturate-[0.8] hover:brightness-100'
             }
           `}
                    style={{
                        backgroundImage: `url('${CONFIG.ASSETS.SPRITES}')`,
                        backgroundSize: '100% 500%',
                        backgroundPosition: `center ${item.pos}%`,
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: 'transparent',
                        border: 'none',
                    }}
                >
                    {activeTab === idx && (
                        <div className="absolute inset-0.5 border-2 border-amber-400/30 rounded-lg mix-blend-screen" />
                    )}
                </button>
            ))}
        </div>
    );
};
