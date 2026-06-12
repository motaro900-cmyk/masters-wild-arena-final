import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { AvatarFrame } from './SharedUI';

interface TopBarProps {
    onOpenWindow: (name: string) => void;
    mode?: 'profile_only' | 'resources_only';
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenWindow, mode }) => {
    const avatar = useGameStore((state) => state.avatar);
    const title = useGameStore((state) => state.title);
    const level = useGameStore((state) => state.level);
    const crystals = useGameStore((state) => state.crystals);
    const gold = useGameStore((state) => state.gold);
    const energy = useGameStore((state) => state.energy);
    const maxEnergy = useGameStore((state) => state.maxEnergy);
    const exp = useGameStore((state) => state.exp);
    const vkUser = useGameStore((state) => state.vkUser);
    const name = useGameStore((state) => state.name);
    const frame = useGameStore((state) => state.frame);
    const graphicsQuality = useGameStore((state) => state.graphicsQuality);
    const textShadow = { textShadow: '0 2px 4px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.5)' };

    const isLow = graphicsQuality === 'LOW';

    if (mode === 'profile_only') {
        return (
            <div
                className="relative w-[450px] h-[150px] cursor-pointer group hover:scale-105 transition-transform"
                onClick={() => onOpenWindow('PROFILE')}
            >
                <img
                    src={AssetsMap.UI.PANEL_PROFILE}
                    className="w-full h-full object-contain"
                    style={{
                        filter: isLow ? 'none' : 'contrast(1.1) saturate(1.1) brightness(0.95)',
                    }}
                    alt=""
                />

                {/* АВАТАР - сдвигаем внутрь рамки */}
                <div className="absolute top-[28px] left-[42px] z-10">
                    <AvatarFrame
                        avatarFilename={avatar.replace('.png', '')}
                        frameFilename={(frame || 'harvest_wheat_frame.webp').replace(/\.(png|webp)$/, '')}
                        size={92}
                    />
                </div>

                <div className="absolute top-[35px] left-[155px] flex flex-col gap-0">
                    <h1
                        className="font-header text-[28px] font-black text-white leading-tight uppercase tracking-tight truncate w-[180px]"
                        style={textShadow}
                    >
                        {name && name !== 'Мастер'
                            ? name
                            : vkUser?.firstName
                              ? `${vkUser.firstName} ${vkUser.lastName}`
                              : 'ИГРОК ВК'}
                    </h1>
                    <span className="font-ui text-amber-400 text-[11px] font-black tracking-[0.2em] uppercase">
                        {title || 'МАСТЕР АРЕНЫ'}
                    </span>
                    <div className="mt-3 w-[180px] h-3 bg-black/80 rounded-full border border-white/10 overflow-hidden relative">
                        <div
                            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 animate-shimmer"
                            style={{ width: `${exp}%` }}
                        />
                    </div>
                </div>

                {/* УРОВЕНЬ */}
                <div className="absolute top-[50px] left-[320px] w-10 h-10 flex items-center justify-center">
                    <span className="text-2xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        {level}
                    </span>
                </div>
            </div>
        );
    }

    if (mode === 'resources_only') {
        return (
            <div className="flex items-center gap-6">
                {[
                    { img: AssetsMap.UI.BAR_ENERGY, val: `${energy}/${maxEnergy || 50}`, color: 'text-white' },
                    { img: AssetsMap.UI.BAR_GOLD, val: gold.toLocaleString(), color: 'text-amber-400' },
                    { img: AssetsMap.UI.BAR_GEM, val: crystals, color: 'text-purple-400' },
                ].map((item, i) => (
                    <div
                        key={i}
                        className="relative w-[180px] h-[55px] flex items-center group transition-all hover:brightness-125"
                        style={{
                            filter: isLow ? 'none' : 'contrast(1.15) saturate(1.15)',
                        }}
                    >
                        <img src={item.img} className="absolute inset-0 w-full h-full object-contain" alt="" />

                        {/* ЗНАЧЕНИЕ: Увеличенное пространство и центровка */}
                        <div className="absolute inset-0 flex items-center justify-center pl-10 pr-6">
                            <span
                                className={`font-ui font-black text-[16px] ${item.color} tracking-tight drop-shadow-lg truncate`}
                                style={textShadow}
                            >
                                {item.val}
                            </span>
                        </div>

                        {/* Хитбокс для кнопки + */}
                        <div className="absolute right-0 w-12 h-12 cursor-pointer z-20 flex items-center justify-center hover:scale-110 transition-transform">
                            <div className="w-6 h-6 bg-green-500/0 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};
