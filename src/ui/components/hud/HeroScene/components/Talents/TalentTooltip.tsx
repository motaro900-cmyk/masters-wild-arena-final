
import { motion } from 'framer-motion';

export const TalentTooltip = ({ talent, pos, color }: any) => {
    const isMax = talent.level >= talent.max;
    const progressValue = talent.level * (talent.id.includes('ult') ? 10 : 5);
    const progressText = talent.desc.replace('{v}', progressValue.toString());
    const nextText = !isMax ? talent.desc.replace('{v}', (progressValue + (talent.id.includes('ult') ? 10 : 5)).toString()) : null;

    let left = pos.x;
    let top = pos.y;
    // Bounds check within 1920x1080 (Hero Scene bounds)
    const expectedHeight = 550;
    if (left + 480 > 1910) left = pos.x - 520;
    if (top + expectedHeight > 1070) top = 1070 - expectedHeight;
    if (top < 10) top = 10;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: 'absolute', left: left, top: top,
                width: '450px', background: 'rgba(10, 10, 18, 0.98)', backdropFilter: 'blur(25px)',
                borderRadius: '28px', border: `3px solid ${color}`, padding: '35px', zIndex: 100000,
                boxShadow: `0 40px 120px rgba(0,0,0,1), 0 0 60px ${color}33`,
                pointerEvents: 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '25px' }}>
                <div style={{
                    width: '85px', height: '85px', background: 'rgba(255,255,255,0.05)',
                    borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}66`, boxShadow: `inset 0 0 15px ${color}22`
                }}>
                    <div className={talent.iconClass} style={{ width: '60px', height: '60px' }} />
                </div>
                <div>
                    <div style={{ color: '#fff', fontSize: '28px', fontWeight: 900, fontFamily: "'Cinzel', serif", textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{talent.name}</div>
                    <div style={{ color: color, fontSize: '15px', fontWeight: 900, letterSpacing: '2px' }}>{isMax ? 'МАКС. УРОВЕНЬ' : `УРОВЕНЬ ${talent.level}/${talent.max}`}</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: color, fontSize: '12px', fontWeight: 900, marginBottom: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>Текущий Эффект</div>
                    <div style={{ color: '#fff', fontSize: '17px', lineHeight: '1.5', fontWeight: 600 }}>{talent.level > 0 ? progressText : 'Талант не активирован'}</div>
                </div>

                {!isMax && (
                    <div style={{ background: `${color}15`, padding: '20px', borderRadius: '18px', border: `1px solid ${color}33` }}>
                        <div style={{ color: '#fff', fontSize: '12px', fontWeight: 900, marginBottom: '10px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7 }}>Следующий Уровень</div>
                        <div style={{ color: '#fff', fontSize: '17px', lineHeight: '1.5', fontWeight: 600 }}>{nextText}</div>
                    </div>
                )}
            </div>

            {talent.branchPoints < talent.required && (
                <div style={{
                    marginTop: '25px', background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.1))',
                    padding: '15px', borderRadius: '14px', border: '1px solid #ef4444', color: '#fff',
                    fontSize: '14px', fontWeight: 900, textAlign: 'center', letterSpacing: '1.5px',
                    fontFamily: "'Cinzel', serif", boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}>
                    ⚠️ ТРЕБУЕТСЯ {talent.required} ОЧКОВ ВЕТКИ
                </div>
            )}
        </motion.div>
    );
};
