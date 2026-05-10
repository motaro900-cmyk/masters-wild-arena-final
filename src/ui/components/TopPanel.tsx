import React from 'react';
import { useGameStore } from '../../store/useGameStore';

const SvgIcon = {
  Trophy: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="#fbbf24"><path d="M18 2h-3v2h3v2h-1.07c-.45 2.71-2.22 4.96-4.93 5.76V15h3v2h-3v2h-2v-2H7v-2h3v-3.24c-2.71-.8-4.48-3.05-4.93-5.76H4V6h3V4H4V2h3V0h10v2z"/></svg>,
};

export const TopPanel: React.FC = () => {
  const gold = useGameStore(state => state.gold);
  const crystals = useGameStore(state => state.crystals);
  const energy = useGameStore(state => state.energy);
  const maxEnergy = useGameStore(state => state.maxEnergy);
  const level = useGameStore(state => state.level);
  const exp = useGameStore(state => state.exp);
  const currentHeroId = useGameStore(state => state.currentHeroId);

  const expNeeded = level * 600;
  const expPercent = Math.min(100, (exp / expNeeded) * 100);
  const heroName = currentHeroId === 'panda' ? 'ИГРОК ВК' : 'ГЕРОЙ';

  return (
    <div className="absolute top-3 left-4 right-4 flex justify-between items-start pointer-events-none z-50">
      {/* Профиль игрока - СДЕЛАНО УЖЕ */}
      <div className="flex items-center p-1 bg-[#1c1f26] border-[3px] border-[#3d4149] rounded-2xl h-[84px] min-w-[300px] pointer-events-auto shadow-2xl relative">
        <div className="relative ml-0.5 w-14 h-14 border-[3px] border-[#8a6845] rotate-[22.5deg] rounded-[18%] bg-[#16181d] flex items-center justify-center shadow-lg">
           <span className="-rotate-[22.5deg] text-2xl">{currentHeroId === 'panda' ? '🐼' : '🐾'}</span>
        </div>
        <div className="ml-3 flex flex-col flex-1 h-full justify-between py-0.5">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col leading-none">
              <h2 className="text-lg font-black text-white uppercase tracking-tighter truncate max-w-[100px]">{heroName}</h2>
              <p className="text-[8px] font-black text-amber-500 uppercase mt-0.5 whitespace-nowrap">ЛЕГЕНДА ДВОРА</p>
            </div>
            <div className="bg-[#2a2d35] rounded-lg px-1.5 py-0.5 flex items-center gap-1 border border-[#3d4149] shadow-inner shrink-0">
              <SvgIcon.Trophy />
              <span className="text-[7px] font-black text-amber-400 uppercase">ЗОЛОТО III</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-black/60 rounded-full border border-white/5 overflow-hidden">
               <div className="h-full bg-gradient-to-r from-orange-400 to-amber-500 relative" style={{ width: `${expPercent}%` }}>
                  <div className="absolute inset-0 bg-white/20 animate-[shine_3s_infinite]" />
               </div>
            </div>
            <span className="text-[10px] font-black text-white italic">L{level}</span>
          </div>
        </div>
      </div>

      {/* Валюта и Энергия */}
      <div className="flex gap-2 pointer-events-auto mt-1">
        {[
          { icon: '⚡', val: `${energy}/${maxEnergy}`, color: 'text-yellow-400' },
          { icon: '💰', val: gold.toLocaleString(), color: 'text-yellow-500' },
          { icon: '💎', val: crystals, color: 'text-purple-400' }
        ].map((res, i) => (
          <div key={i} className="flex items-center bg-[#1c1f26] border-2 border-[#3d4149] rounded-xl pl-2 pr-1 py-1 gap-2 h-10 min-w-[115px] shadow-xl">
            <span className="text-lg drop-shadow-md">{res.icon}</span>
            <span className="text-sm font-black text-white italic tracking-tighter flex-1">{res.val}</span>
            <button className="w-7 h-7 bg-[#26a541] hover:bg-[#1e8534] rounded-lg border-b-[3px] border-[#145a23] text-white font-black text-lg active:translate-y-0.5 transition-all">+</button>
          </div>
        ))}
      </div>
    </div>
  );
};
