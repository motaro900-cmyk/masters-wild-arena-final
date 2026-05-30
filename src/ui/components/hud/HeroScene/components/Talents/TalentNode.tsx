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
            {/* Только спрайт — без ячейки, без обрезки */}
            <div
                className={talent.iconClass}
                style={{
                    filter: isUnlocked
                        ? isMax
                            ? `drop-shadow(0 0 16px ${branchColor}) drop-shadow(0 0 8px #f0c040)`
                            : `drop-shadow(0 0 10px ${branchColor}99)`
                        : 'grayscale(0.7) brightness(0.55)',
                    transition: 'filter 0.25s ease',
                }}
            />

            {/* Замок поверх */}
            {!isUnlocked && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    pointerEvents: 'none',
                }}>
                    🔒
                </div>
            )}

            {/* Бейдж уровня */}
            <div style={{
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
            }}>
                {level}<span style={{ opacity: 0.45, margin: '0 1px' }}>/</span>{talent.max}
            </div>
        </motion.div>
    );
};
