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
    return (
        <motion.div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            whileHover={
                isUnlocked && !isMax && canAfford ? { scale: 1.05, boxShadow: `0 0 35px ${branchColor}aa` } : {}
            }
            whileTap={isUnlocked && !isMax && canAfford ? { scale: 0.95 } : {}}
            onClick={isUnlocked && !isMax && canAfford ? onClick : undefined}
            style={{
                width: '120px',
                height: '120px',
                borderRadius: '28px',
                background: isUnlocked ? 'rgba(20, 20, 30, 0.85)' : 'rgba(10,10,15,0.9)',
                border: `2px solid ${isMax ? '#f0c040' : isUnlocked ? `${branchColor}cc` : 'rgba(255,255,255,0.08)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isUnlocked && !isMax && canAfford ? 'pointer' : 'default',
                position: 'relative',
                boxShadow: isMax
                    ? `0 0 35px rgba(240,192,64,0.4), inset 0 0 15px rgba(240,192,64,0.15)`
                    : isUnlocked
                      ? `0 8px 25px rgba(0,0,0,0.5), inset 0 0 15px ${branchColor}1a`
                      : 'none',
                filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.4)',
                transition: 'all 0.25s ease-out',
            }}
        >
            {/* Увеличенная иконка таланта */}
            <div
                className={talent.iconClass}
                style={{
                    width: '102px',
                    height: '102px',
                    filter: isUnlocked ? 'drop-shadow(0 0 12px rgba(0,0,0,0.6))' : 'grayscale(1) brightness(0.5)',
                }}
            />

            {/* Компактный индикатор уровня (0/5) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    background: isMax ? 'linear-gradient(135deg, #f0c040, #d4a017)' : 'rgba(0,0,0,0.85)',
                    color: isMax ? '#000' : '#aaa',
                    padding: '2px 7px',
                    borderRadius: '7px',

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: `1.5px solid ${isMax ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                    backdropFilter: 'blur(4px)',
                    zIndex: 10,
                    pointerEvents: 'none',
                }}
            >
                {level}
                <span style={{ opacity: 0.5, margin: '0 1px' }}>/</span>
                {talent.max}
            </div>

            {isMax && (
                <>
                    {/* Эпическое свечение максимального уровня */}
                    <motion.div
                        animate={{
                            boxShadow: [
                                '0 0 15px rgba(240,192,64,0.4)',
                                '0 0 35px rgba(240,192,64,0.8)',
                                '0 0 15px rgba(240,192,64,0.4)',
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '28px',
                            pointerEvents: 'none',
                            zIndex: -1,
                        }}
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        style={{
                            position: 'absolute',
                            inset: '-6px',
                            border: '2px dashed #f0c040',
                            borderRadius: '28px',
                            opacity: 0.7,
                            boxShadow: '0 0 10px rgba(240,192,64,0.5)',
                        }}
                    />
                </>
            )}
        </motion.div>
    );
};
