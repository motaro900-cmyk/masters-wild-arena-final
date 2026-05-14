
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../../../store/useGameStore';
import { AssetsMap } from '../../../../../../configs/AssetsMap';
import { ROLE_ICONS } from '../../constants/roleIcons';

export const HeroCard = ({ hero, isOwned, isActive, onClick, onBuyClick, color, onMouseEnter, onMouseMove, onMouseLeave }: any) => {
    const { gold, crystals, level, trophies } = useGameStore(s => ({
        gold: s.gold, crystals: s.crystals, level: s.level ?? 1, trophies: s.trophies ?? 0
    }));

    const role = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;
    const isGold = hero.unlockType === 'gold';
    const isDiamond = hero.unlockType === 'diamonds';
    const canAfford = isGold ? gold >= hero.unlockCost : isDiamond ? crystals >= hero.unlockCost : false;
    const showRedDot = !isOwned && (isGold || isDiamond) && canAfford;

    // Прогресс для достижений/уровней
    const achievementProgress = hero.unlockType === 'level'
        ? { current: Math.min(level, hero.unlockCost), max: hero.unlockCost }
        : hero.unlockType === 'achievement' && hero.unlockAchievement?.includes('50')
            ? { current: Math.min(trophies % 50, 50), max: 50 }
            : null;

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -5 }}
            onMouseEnter={onMouseEnter}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                height: '420px',
                background: `linear-gradient(180deg, ${color}22 0%, rgba(10,10,15,1) 60%, rgba(5,5,8,1) 100%)`,
                borderRadius: '24px',
                border: isActive ? `2px solid #f0c040` : `2px solid ${color}55`,
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive ? `0 0 30px ${color}44, inset 0 0 20px ${color}22` : `0 10px 30px rgba(0,0,0,0.5), inset 0 0 15px ${color}11`,
                transition: 'all 0.3s ease'
            }}
            onClick={onClick}
        >
            {/* TOP ACCENT LINE */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.8 }} />

            {/* LEGENDARY SHIMMER */}
            {hero.rarity === 'LEGENDARY' && (
                <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)', pointerEvents: 'none', zIndex: 1 }}
                />
            )}

            {/* ACTIVE CROWN */}
            {isActive && (
                <div style={{ position: 'absolute', top: '-8px', fontSize: '20px', zIndex: 10, filter: 'drop-shadow(0 0 10px gold)' }}>👑</div>
            )}

            {/* ROLE BADGE */}
            <div style={{
                position: 'absolute', top: '10px', left: '10px', zIndex: 10,
                background: role.bg,
                border: `1px solid ${role.color}`,
                borderRadius: '8px', padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: `0 2px 8px rgba(0,0,0,0.7)`
            }}>
                <span style={{ fontSize: '13px', lineHeight: 1 }}>{role.icon}</span>
                <span style={{ color: role.color, fontSize: '10px', fontWeight: 900, letterSpacing: '1.5px', textShadow: 'none' }}>{role.label}</span>
            </div>

            {/* RED DOT */}
            {showRedDot && (
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                        position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                        width: '14px', height: '14px', borderRadius: '50%',
                        background: '#ef4444', border: '2px solid #fff',
                        boxShadow: '0 0 8px rgba(239,68,68,0.8)'
                    }}
                />
            )}

            {/* HERO IMAGE */}
            <div style={{ width: '100%', height: '220px', position: 'relative', marginBottom: '15px' }}>
                <img src={hero.image} style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 2, position: 'relative' }} alt="" />
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`, opacity: 1 }} />
            </div>

            {/* NAME & RARITY */}
            <div style={{ textAlign: 'center', flex: 1, zIndex: 2, width: '100%' }}>
                <h3 style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    margin: '0 0 8px 0',
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: '1px',
                    textShadow: `0 2px 8px rgba(0,0,0,0.9), 0 0 20px ${color}66`,
                    opacity: 1,
                    lineHeight: 1.2
                }}>{hero.name}</h3>
                <div style={{
                    color: isOwned ? color : 'rgba(200,200,200,0.5)',
                    fontSize: '10px', fontWeight: 900,
                    background: isOwned ? `${color}22` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isOwned ? color + '66' : 'rgba(255,255,255,0.1)'}`,
                    padding: '3px 14px', borderRadius: '4px', display: 'inline-block',
                    textTransform: 'uppercase', letterSpacing: '2px'
                }}>{hero.rarity}</div>
            </div>

            {/* BOTTOM ACTION */}
            <div style={{ width: '100%', zIndex: 3, marginTop: '8px' }}>
                {!isOwned ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        {(isGold || isDiamond) ? (
                            <motion.button
                                animate={canAfford ? {
                                    boxShadow: [
                                        `0 0 0px ${color}00`,
                                        `0 0 18px ${color}bb`,
                                        `0 0 0px ${color}00`
                                    ]
                                } : {}}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => { e.stopPropagation(); onBuyClick(); }}
                                style={{
                                    width: '100%', height: '44px',
                                    background: !canAfford
                                        ? 'rgba(50,50,55,0.9)'
                                        : isGold
                                            ? 'linear-gradient(180deg, #f1c40f 0%, #d4a017 100%)'
                                            : 'linear-gradient(180deg, #b060f8 0%, #7c3aed 100%)',
                                    border: canAfford
                                        ? `2px solid ${isGold ? '#f1c40f' : '#c084fc'}`
                                        : '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    cursor: canAfford ? 'pointer' : 'default',
                                    fontFamily: "'Cinzel', serif",
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                    opacity: canAfford ? 1 : 0.5,
                                    letterSpacing: '0.5px',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                                }}
                            >
                                КУПИТЬ ЗА
                                <img src={isGold ? AssetsMap.UI.ICON_GOLD_FULL : AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: '20px', height: '20px' }} alt="" />
                                <span style={{ color: canAfford ? '#fff' : '#ff8888', fontWeight: 900 }}>{hero.unlockCost}</span>
                            </motion.button>
                        ) : (
                            <div style={{ width: '100%' }}>
                                <div style={{
                                    width: '100%', padding: '9px 0', textAlign: 'center',
                                    background: 'rgba(0,0,0,0.7)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '10px',
                                    color: 'rgba(220,200,160,0.9)',
                                    fontSize: '11px', fontWeight: 900,
                                    fontFamily: "'Cinzel', serif", marginBottom: '6px'
                                }}>
                                    {hero.unlockType === 'level' ? `⭐ УРОВЕНЬ ${hero.unlockCost}` : `🏆 ${hero.unlockAchievement}`}
                                </div>
                                {achievementProgress && (
                                    <div style={{ width: '100%' }}>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', marginBottom: '4px',
                                            padding: '0 2px'
                                        }}>
                                            <span style={{ color: 'rgba(180,180,180,0.8)', fontSize: '10px', fontWeight: 700 }}>Прогресс</span>
                                            <span style={{
                                                color: '#f0c040', fontSize: '11px', fontWeight: 900,
                                                textShadow: '0 0 8px rgba(240,192,64,0.5)'
                                            }}>{achievementProgress.current} / {achievementProgress.max}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '7px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(achievementProgress.current / achievementProgress.max) * 100}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                style={{ height: '100%', background: `linear-gradient(90deg, ${color}dd, ${color}66)`, borderRadius: '4px', boxShadow: `0 0 10px ${color}88` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            width: '100%', padding: '13px',
                            background: isActive
                                ? 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)'
                                : 'rgba(240,192,64,0.08)',
                            border: `2px solid ${isActive ? '#22c55e' : '#f0c040'}`,
                            borderRadius: '10px',
                            color: isActive ? '#fff' : '#f0c040',
                            fontSize: '14px', fontWeight: 900, cursor: 'pointer',
                            letterSpacing: '1.5px', fontFamily: "'Cinzel', serif",
                            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                            boxShadow: isActive ? '0 4px 15px rgba(34,197,94,0.4)' : 'none'
                        }}
                    >
                        {isActive ? 'СНАРЯЖЕНИЕ' : 'ЭКИПИРОВАТЬ'}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};
