import { motion } from 'framer-motion';

export const TalentNode = ({
    talent,
    level,
    branchColor,
    isUnlocked,
    canAfford,
    onClick,
    onMouseEnter,
    onMouseLeave,
}: any) => {
    const isMax = level >= talent.max;
    const isClickable = isUnlocked && !isMax && canAfford;

    return (
        <motion.div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            whileHover={isClickable ? { scale: 1.12 } : {}}
            whileTap={isClickable ? { scale: 0.9 } : {}}
            onClick={isClickable ? onClick : undefined}
            style={{
                position: 'relative',
                cursor: isClickable ? 'pointer' : 'default',
                flexShrink: 0,
                display: 'inline-flex',
            }}
        >
            {/* Красивая круглая иконка на основе эмодзи */}
            <div
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: isUnlocked
                        ? 'radial-gradient(circle, rgba(45, 45, 60, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)'
                        : 'rgba(20, 20, 20, 0.85)',
                    border: `2px solid ${isUnlocked ? (isMax ? '#ffd700' : branchColor) : '#444'}`,
                    boxShadow: isUnlocked
                        ? `0 0 15px ${branchColor}66, inset 0 0 10px rgba(255,255,255,0.05)`
                        : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.4)',
                    transition: 'all 0.25s ease',
                }}
            >
                {(() => {
                    const emojiMap: Record<string, string> = {
                        atk_base: '🔥',
                        atk_crit: '🐾',
                        atk_pen: '🐯',
                        atk_ult: '⚡',
                        def_base: '🛡️',
                        def_res: '🌀',
                        def_eva: '🔮',
                        def_ult: '🐦',
                        mas_base: '🧘',
                        mas_spd: '🌙',
                        mas_focus: '🪷',
                        mas_ult: '💧',
                    };
                    return emojiMap[talent.id] || '✨';
                })()}
            </div>

            {/* Замок поверх */}
            {!isUnlocked && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        pointerEvents: 'none',
                    }}
                >
                    🔒
                </div>
            )}

            {/* Бейдж уровня */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: isMax ? 'linear-gradient(135deg, #f0c040, #d4a017)' : 'rgba(0,0,0,0.82)',
                    color: isMax ? '#000' : 'rgba(255,255,255,0.9)',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    border: `1.5px solid ${isMax ? '#fff8' : 'rgba(255,255,255,0.2)'}`,
                    backdropFilter: 'blur(6px)',
                    zIndex: 10,
                    pointerEvents: 'none',
                    lineHeight: 1.4,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
            >
                {level}
                <span style={{ opacity: 0.45, margin: '0 1px' }}>/</span>
                {talent.max}
            </div>
        </motion.div>
    );
};
