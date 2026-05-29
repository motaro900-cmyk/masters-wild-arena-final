import { motion } from 'framer-motion';

export const StatCard = ({ label, value, base, iconClass, color, max, tooltip }: any) => {
    const getNum = (v: any) => parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0;
    const valNum = getNum(value);
    const baseNum = getNum(base);
    const bonus = valNum - baseNum;

    const isPercentage =
        label.includes('КРИТ') || label === 'ВАМПИРИЗМ' || label === 'СКОРОСТЬ' || label === 'ТОЧНОСТЬ';
    const displayVal = isPercentage ? (valNum < 5 ? Math.round(valNum * 100) : valNum) : valNum;
    const bonusVal = isPercentage ? (bonus < 5 ? Math.round(bonus * 100) : bonus) : bonus;
    const formattedValue = isPercentage ? `${displayVal}%` : displayVal.toLocaleString();

    // Расчет процента заполнения полосы
    const fillPercent = Math.min(100, (valNum / max) * 100);

    return (
        <motion.div
            whileHover={{ scale: 1.015, backgroundColor: 'rgba(255,255,255,0.07)', borderColor: color }}
            style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(35,35,42,0.6) 0%, rgba(18,18,24,0.85) 100%)',
                borderRadius: '20px',
                padding: '22px 24px',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflow: 'hidden',
                boxShadow: '0 6px 25px rgba(0,0,0,0.4)',
                transition: 'all 0.25s ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                    {/* Icon container */}
                    <div
                        style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #2b2b35 0%, #0d0d14 100%)',
                            border: `1.5px solid ${color}77`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative',
                            boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset 0 0 12px ${color}25`,
                        }}
                    >
                        <div
                            className={iconClass}
                            style={{
                                width: '42px',
                                height: '42px',
                                backgroundSize: '400% 200%',
                                filter: `contrast(1.3) brightness(1.2) drop-shadow(0 0 8px ${color}99)`,
                                zIndex: 2,
                                imageRendering: '-webkit-optimize-contrast',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: `radial-gradient(circle, ${color}44 0%, transparent 80%)`,
                            }}
                        />
                    </div>

                    {/* Label & Tooltip text */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                        <span
                            style={{
                                color: color,
                                fontSize: '13px',
                                fontWeight: 900,
                                letterSpacing: '1.2px',
                                textTransform: 'uppercase',
                                textShadow: `0 0 12px ${color}33`,
                            }}
                        >
                            {label}
                        </span>
                        <span
                            style={{
                                color: 'rgba(255,255,255,0.45)',
                                fontSize: '11px',
                                fontWeight: 500,
                                lineHeight: '1.3',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {tooltip}
                        </span>
                    </div>
                </div>

                {/* Values */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '2px',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            color: '#fff',
                            fontSize: '28px',
                            fontWeight: 900,
                            fontFamily: "'Inter', sans-serif",
                            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
                            lineHeight: 1,
                        }}
                    >
                        {formattedValue}
                    </span>
                    {bonus > 0 ? (
                        <span
                            style={{
                                color: '#22c55e',
                                fontSize: '12px',
                                fontWeight: 900,
                                filter: 'drop-shadow(0 0 5px rgba(34,197,94,0.4))',
                                lineHeight: 1,
                            }}
                        >
                            +{bonusVal}
                            {isPercentage ? '%' : ''}
                        </span>
                    ) : (
                        <span style={{ height: '12px' }} />
                    )}
                </div>
            </div>

            {/* Progress bar container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                    style={{
                        width: '100%',
                        height: '12px',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.06)',
                        position: 'relative',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                    }}
                >
                    {/* Glowing background track under the fill */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${fillPercent}%`,
                            background: color,
                            opacity: 0.1,
                            filter: 'blur(4px)',
                        }}
                    />

                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                            height: '100%',
                            background: `linear-gradient(90deg, ${color}99 0%, ${color} 100%)`,
                            boxShadow: `0 0 15px ${color}88`,
                            borderRadius: '6px',
                            position: 'relative',
                        }}
                    >
                        {/* Highlight line on top of progress bar */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '30%',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                            }}
                        />
                    </motion.div>
                </div>
                {/* Min / Max Labels under progress bar to make it clearer */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '9px',
                        color: 'rgba(255,255,255,0.25)',
                        fontWeight: 800,
                    }}
                >
                    <span>0</span>
                    <span>{max.toLocaleString()} (МАКС)</span>
                </div>
            </div>
        </motion.div>
    );
};
