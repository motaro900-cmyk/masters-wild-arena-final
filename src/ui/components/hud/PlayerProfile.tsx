import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AvatarFrame } from './SharedUI';
import { EquippedHeroView } from '../EquippedHeroView';

interface PlayerProfileProps {
    onOpenProfile?: () => void;
    onOpenRanks?: () => void;
}

/**
 * PlayerProfile — HUD компонент (кнопка в углу).
 * Теперь использует динамическую систему сокетов для отображения экипировки.
 */
export const PlayerProfile: React.FC<PlayerProfileProps> = ({ onOpenProfile }) => {
    const store = useGameStore();
    const selectedHeroId = store.selectedHeroId || 'panda_warrior';
    const avatar = store.avatar || 'панда.png';
    const frame = store.frame || 'Рамка 1.png';
    const title = store.title || 'СТРАННИК';
    const trophies = store.trophies ?? 0;
    const level = store.level ?? 1;
    const exp = store.exp ?? 0;
    const vkUser = store.vkUser;

    const name = store.name;
    const playerName = name && name !== 'Мастер' ? name : vkUser?.firstName || 'DRAGONSLAYER';
    const expNeeded = level * 600;
    const xpPercent = Math.min(100, (exp / expNeeded) * 100);

    return (
        <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenProfile}
            className="relative flex items-center w-[460px] h-[100px] pointer-events-auto cursor-pointer select-none"
            style={{
                background: 'rgba(20, 10, 10, 0.95)',
                border: '3px solid #5a0e0e',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            }}
        >
            {/* Avatar Section — ТЕПЕРЬ ЖИВОЙ ПЕРСОНАЖ */}
            <div className="ml-3 relative w-[100px] h-[100px] flex items-center justify-center">
                <div className="absolute inset-0 z-20">
                    <AvatarFrame
                        avatarFilename={avatar.replace('.png', '')}
                        frameFilename={frame.replace('.png', '')}
                        size={85}
                    />
                </div>

                {/* Наш новый динамический вид с сокетами */}
                <div className="absolute z-10 scale-[0.3] translate-y-1">
                    <EquippedHeroView heroId={selectedHeroId} size={280} />
                </div>

                <div className="absolute -bottom-1 -left-1 bg-[#8b5e2b] border-2 border-[#f0c040] rounded px-1.5 shadow-lg z-30">
                    <span className="text-white font-black text-[11px]">{level}</span>
                </div>
            </div>

            {/* Stats Section */}
            <div className="flex-1 flex flex-col pl-6">
                <h2
                    className="text-[28px] font-black uppercase text-white"
                    style={{ fontFamily: "'Cinzel', serif", textShadow: '0 2px 10px #000' }}
                >
                    <span
                        style={{
                            background: 'linear-gradient(180deg, #fff 0%, #ffd700 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {playerName}
                    </span>
                </h2>

                <div className="flex items-center gap-3">
                    <span className="text-[#f0c040] text-xs font-black uppercase tracking-widest">{title}</span>
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded border border-white/10">
                        <span className="text-xs">🏆</span>
                        <span className="text-white font-bold text-xs">{trophies}</span>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="mt-3 w-[280px] h-2 bg-black/60 rounded-full border border-white/10 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercent}%` }}
                        className="h-full bg-gradient-to-r from-red-600 to-yellow-500"
                    />
                </div>
            </div>

            {/* Decorative Settings Icon Overlay (Optional Visual Hint) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                <span className="text-white text-xl">⚙️</span>
            </div>
        </motion.div>
    );
};
