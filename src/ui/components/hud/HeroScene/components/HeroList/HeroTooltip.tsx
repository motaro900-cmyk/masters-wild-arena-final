import { motion } from 'framer-motion';
import { useGameStore } from '../../../../../../store/useGameStore';

export const TooltipStat = ({ label, value, color, icon }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                fontWeight: 600,
            }}
        >
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span>{label}</span>
        </div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: '13px', textShadow: `0 0 10px ${color}44` }}>
            {value.toLocaleString()}
        </div>
    </div>
);

export const HeroTooltip = ({ hero, mousePos, rarityColors }: any) => {
    const { ownedHeroes, graphicsQuality } = useGameStore();
    const isLowGraphics = graphicsQuality === 'LOW';
    const isOwned = ownedHeroes.includes(hero.id);
    const color = rarityColors[hero.rarity];
    const tooltipWidth = 280;
    const tooltipHeight = 240;

    let left = mousePos.x + 30;
    let top = mousePos.y + 10;

    if (left + tooltipWidth > 1880) left = mousePos.x - tooltipWidth - 30;
    if (top + tooltipHeight > 1040) top = mousePos.y - tooltipHeight - 10;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: 'absolute',
                left: left,
                top: top,
                width: `${tooltipWidth}px`,
                background: isLowGraphics ? 'rgba(5,3,2,1)' : 'rgba(10,6,3,0.98)',
                border: `2px solid ${color}`,
                borderRadius: '16px',
                padding: '20px',
                zIndex: 10000,
                pointerEvents: 'none',
                boxShadow: isLowGraphics ? 'none' : `0 20px 60px rgba(0,0,0,0.9), 0 0 40px ${color}44`,
                backdropFilter: isLowGraphics ? 'none' : 'blur(16px)',
            }}
        >
            <div
                style={{
                    color: '#fff',
                    fontSize: '20px',
                    fontFamily: "'Cinzel', serif",
                    marginBottom: '8px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
            >
                {hero.name}
            </div>
            <div
                style={{
                    color: color,
                    fontSize: '11px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    marginBottom: '15px',
                    background: `${color}33`,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    display: 'inline-block',
                }}
            >
                {hero.rarity}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <TooltipStat icon="❤️" label="Здоровье" value={hero.stats.stamina * 10} color="#ef4444" />
                <TooltipStat icon="⚔️" label="Атака" value={hero.stats.strength * 2} color="#f97316" />
                <TooltipStat icon="🛡️" label="Защита" value={hero.stats.stamina * 0.5} color="#3b82f6" />
            </div>

            {!isOwned && (
                <div
                    style={{
                        marginTop: '20px',
                        paddingTop: '15px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        color: '#ff4444',
                        fontSize: '12px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        textAlign: 'center',
                    }}
                >
                    ТРЕБУЕТСЯ РАЗБЛОКИРОВКА
                </div>
            )}
        </motion.div>
    );
};
