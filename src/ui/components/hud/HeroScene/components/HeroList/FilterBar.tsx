import { motion } from 'framer-motion';
import { useGameStore } from '../../../../../../store/useGameStore';
import { HEROES_DB } from '../../../../../../configs/HeroesConfig';
import { AssetsMap } from '../../../../../../configs/AssetsMap';

export const FilterBar = ({ activeFilter, onSelect }: any) => {
    const { gold, crystals, ownedHeroes } = useGameStore((s: any) => ({
        gold: s.gold,
        crystals: s.crystals,
        ownedHeroes: s.ownedHeroes,
    }));

    // Считаем сколько героев можно купить прямо сейчас
    const affordableGold = HEROES_DB.filter(
        (h: any) => !ownedHeroes.includes(h.id) && h.unlockType === 'gold' && gold >= (h.unlockCost || 0),
    ).length;
    const affordableDiamond = HEROES_DB.filter(
        (h: any) => !ownedHeroes.includes(h.id) && h.unlockType === 'diamonds' && crystals >= (h.unlockCost || 0),
    ).length;

    const filters = [
        { id: 'ВСЕ', label: 'ВСЕ', badge: 0 },
        { id: 'ДОСТУПНЫЕ', label: 'МОИ', badge: 0 },
        { id: 'gold', label: 'ЗА ЗОЛОТО', badge: affordableGold },
        { id: 'diamonds', label: 'ЗА АЛМАЗЫ', badge: affordableDiamond },
        { id: 'achievement', label: 'ДОСТИЖЕНИЯ', badge: 0 },
    ];

    return (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', padding: '0 5px' }}>
            {filters.map((f) => {
                const isActive = activeFilter === f.id;
                return (
                    <motion.button
                        key={f.id}
                        whileHover={{
                            scale: 1.05,
                            filter: isActive
                                ? 'brightness(1.4) drop-shadow(0 0 8px rgba(255,200,0,0.6))'
                                : 'brightness(1.15)',
                        }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => onSelect(f.id)}
                        style={{
                            width: '140px',
                            height: '42px',
                            background: `url("${AssetsMap.BACKGROUNDS.SHOP_BANNER_RED}")`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            border: 'none',
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            filter: isActive
                                ? 'brightness(1.3) drop-shadow(0 0 5px rgba(255,200,0,0.5))'
                                : 'brightness(0.8)',
                            transition: 'all 0.2s',
                            padding: '0 10px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            position: 'relative',
                        }}
                    >
                        {f.id === 'gold' && (
                            <img
                                src={AssetsMap.UI.ICON_GOLD_FULL}
                                style={{ width: '18px', height: '18px', marginRight: '5px' }}
                                alt=""
                            />
                        )}
                        {f.id === 'diamonds' && (
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '18px', height: '18px', marginRight: '5px' }}
                                alt=""
                            />
                        )}
                        {f.id === 'achievement' && (
                            <img
                                src={AssetsMap.UI.TROPHY_PREMIUM}
                                style={{ width: '18px', height: '18px', marginRight: '5px', objectFit: 'contain' }}
                                alt=""
                            />
                        )}
                        {f.label}
                        {f.badge > 0 && (
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    minWidth: '18px',
                                    height: '18px',
                                    borderRadius: '9px',
                                    background: '#ef4444',
                                    border: '2px solid #fff',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 8px rgba(239,68,68,0.8)',
                                    padding: '0 3px',
                                }}
                            >
                                {f.badge}
                            </motion.div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
};
