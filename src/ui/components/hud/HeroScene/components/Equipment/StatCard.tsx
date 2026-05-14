import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const StatCard = ({ label, value, base, iconClass, color, max, tooltip }: any) => {
    const [showTip, setShowTip] = useState(false);
    const getNum = (v: any) => parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0;
    const valNum = getNum(value);
    const baseNum = getNum(base);
    const bonus = valNum - baseNum;
    
    const isPercentage = label.includes('КРИТ') || label === 'ВАМПИРИЗМ' || label === 'СКОРОСТЬ' || label === 'ТОЧНОСТЬ';
    const displayVal = isPercentage ? (valNum < 5 ? Math.round(valNum * 100) : valNum) : valNum;
    const bonusVal = isPercentage ? (bonus < 5 ? Math.round(bonus * 100) : bonus) : bonus;
    const formattedValue = isPercentage ? `${displayVal}%` : displayVal.toLocaleString();

    return (
        <motion.div 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: color }}
            onMouseEnter={() => setShowTip(true)} 
            onMouseLeave={() => setShowTip(false)} 
            style={{ 
                position: 'relative', 
                background: 'linear-gradient(135deg, rgba(40,40,50,0.4) 0%, rgba(15,15,20,0.7) 100%)',
                borderRadius: '24px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'help',
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                transition: 'all 0.3s'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ 
                    width: '90px', height: '90px', 
                    borderRadius: '20px', 
                    background: 'linear-gradient(135deg, #333 0%, #000 100%)',
                    border: `2px solid ${color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    boxShadow: `0 12px 30px rgba(0,0,0,0.6), inset 0 0 25px ${color}15`
                }}>
                    <div className={iconClass} style={{ 
                        width: '75px', height: '75px', 
                        backgroundSize: '400% 200%', 
                        filter: `contrast(1.2) brightness(1.1) drop-shadow(0 0 15px ${color}aa)`,
                        zIndex: 2,
                        imageRendering: '-webkit-optimize-contrast'
                    }} />
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${color}44 0%, transparent 85%)` }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                    <span style={{ color: color, fontSize: '12px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.9 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ color: '#fff', fontSize: '28px', fontWeight: 900, fontFamily: "'Inter', sans-serif", textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>{formattedValue}</span>
                        {bonus > 0 && (
                            <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 900, filter: 'drop-shadow(0 0 5px rgba(34,197,94,0.4))' }}>+{bonusVal}{isPercentage ? '%' : ''}</span>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${Math.min(100, (valNum / max) * 100)}%` }} 
                    style={{ 
                        height: '100%', 
                        background: `linear-gradient(90deg, ${color}aa 0%, ${color} 100%)`, 
                        boxShadow: `0 0 20px ${color}99`
                    }} 
                />
            </div>

            <AnimatePresence>
                {showTip && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 1.1, y: 10 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 1.1, y: 10 }} 
                        style={{ 
                            position: 'absolute', inset: 0, zIndex: 10,
                            background: 'rgba(5,5,10,0.98)', backdropFilter: 'blur(20px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '15px', textAlign: 'center', color: '#fff',
                            borderRadius: '20px', border: `2px solid ${color}`,
                            boxShadow: `0 0 30px ${color}44`
                        }}
                    >
                        <div style={{ color: color, fontWeight: 900, fontSize: '13px', marginBottom: '5px', letterSpacing: '1px' }}>{label}</div>
                        <div style={{ fontSize: '11px', opacity: 0.9, lineHeight: '1.4' }}>{tooltip}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
