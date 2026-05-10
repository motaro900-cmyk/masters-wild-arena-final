import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { AvatarFrame } from './SharedUI';

/**
 * PlayerProfile (v50.0) — Step 4: XP Bar.
 * Adding a sleek, animated progress bar under the title.
 */
export const PlayerProfile: React.FC = () => {
    const { avatar, vkUser, title, exp = 750 } = useGameStore();
    const playerName = vkUser?.firstName || "DRAGONSLAYER";
    
    const expNeeded = 1000;
    const xpPercent = Math.min(100, (exp / expNeeded) * 100);
    
    return (
        <div className="relative flex items-center w-[520px] h-[130px] pointer-events-auto select-none overflow-hidden">
            {/* BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={AssetsMap.UI.PROFILE_PLAQUE} 
                    className="w-full h-full object-contain" 
                    alt="plaque" 
                />
            </div>

            {/* STEP 1: AVATAR */}
            <div 
                className="absolute z-10"
                style={{ left: '12px', top: '12px' }}
            >
                <div className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]">
                    <AvatarFrame 
                        avatarFilename={avatar.replace('.png','')} 
                        frameFilename="Рамка 1" 
                        size={100} 
                    />
                </div>
            </div>

            {/* STEP 3 & 4: INFO + XP BAR */}
            <div 
                className="absolute z-10 flex flex-col items-start"
                style={{ left: '190px', top: '35px' }}
            >
                {/* Имя */}
                <h2 
                    className="text-[20px] font-black text-[#c8a870] uppercase tracking-wider leading-none mb-1" 
                    style={{ 
                        fontFamily: "'Cinzel', serif", 
                        textShadow: '0 2px 4px black' 
                    }}
                >
                    {playerName}
                </h2>
                
                {/* Титул */}
                <span className="text-[#8b5e2b] text-[10px] font-bold uppercase tracking-[0.3em] drop-shadow-md">
                    {title || "Легенда Арены"}
                </span>

                {/* Разделитель */}
                <div className="mt-1.5 h-[1px] w-32 bg-gradient-to-r from-[#c8a870]/30 to-transparent" />

                {/* STEP 4: XP BAR */}
                <div className="mt-3 w-[260px] relative">
                    {/* Фон полоски */}
                    <div className="h-[10px] w-full bg-black/80 rounded-full border border-[#3a2b1f] relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,1)]">
                        {/* Сама полоска опыта */}
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#7f1d1d] via-[#ef4444] to-[#7f1d1d] relative"
                        >
                            {/* Эффект блика на полоске */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                        </motion.div>
                    </div>
                    
                    {/* Текст опыта (опционально, очень мелко) */}
                    <div className="mt-1 flex justify-end">
                        <span className="text-[8px] font-black text-white/20 tracking-widest uppercase italic">
                            {exp} / {expNeeded} XP
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
