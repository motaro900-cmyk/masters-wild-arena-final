import { motion } from 'framer-motion';

export const TalentTooltip = ({ talent, pos, color }: any) => {
    const isMax = talent.level >= talent.max;
    const progressValue = talent.level * (talent.id.includes('ult') ? 10 : 5);
    const progressText = talent.desc.replace('{v}', progressValue.toString());

    let left = pos.x;
    let top = pos.y;
    // Bounds check within talents-view-root space (approx 1520x934)
    const expectedHeight = 500;
    if (left + 470 > 1510) left = pos.x - 590;
    if (left < 10) left = 10;
    if (top + expectedHeight > 910) top = 910 - expectedHeight;
    if (top < 10) top = 10;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: 'absolute',
                left: left,
                top: top,
                width: '450px',
                background: 'rgba(10, 10, 18, 0.98)',
                backdropFilter: 'blur(25px)',
                borderRadius: '28px',
                border: `3px solid ${color}`,
                padding: '35px',
                zIndex: 100000,
                boxShadow: `0 40px 120px rgba(0,0,0,1), 0 0 60px ${color}33`,
                pointerEvents: 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '25px' }}>
                <div
                    style={{
                        width: '85px',
                        height: '85px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${color}66`,
                        boxShadow: `inset 0 0 15px ${color}22`,
                    }}
                >
                    <div className={talent.iconClass} style={{ width: '60px', height: '60px' }} />
                </div>
                <div>
                    <div
                        style={{
                            color: '#fff',
                            fontSize: '28px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        }}
                    >
                        {talent.name}
                    </div>
                    <div style={{ color: color, fontSize: '15px', fontWeight: 900, letterSpacing: '2px' }}>
                        {isMax ? 'МАКС. УРОВЕНЬ' : `УРОВЕНЬ ${talent.level}/${talent.max}`}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Описание таланта */}
                <div
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        padding: '20px',
                        borderRadius: '18px',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <div
                        style={{
                            color: color,
                            fontSize: '12px',
                            fontWeight: 900,
                            marginBottom: '10px',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Свойства таланта
                    </div>
                    <div style={{ color: '#fff', fontSize: '17px', lineHeight: '1.5', fontWeight: 600 }}>
                        {!isMax
                            ? talent.desc.replace(
                                  '{v}',
                                  (talent.level > 0 ? progressValue : talent.id.includes('ult') ? 10 : 5).toString(),
                              )
                            : progressText}
                    </div>
                </div>

                {/* СРАВНЕНИЕ УРОВНЕЙ */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1.5px solid rgba(255,255,255,0.08)',
                        borderRadius: '18px',
                        padding: '20px 30px',
                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 800, letterSpacing: '1px' }}>
                            ТЕКУЩИЙ
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                color: '#fff',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                marginTop: '5px',
                            }}
                        >
                            {talent.level > 0 ? `+${progressValue}${talent.id.includes('ult') ? '' : '%'}` : '—'}
                        </div>
                    </div>
                    <div style={{ fontSize: '28px', color: color, transform: 'scaleX(1.3)' }}>➔</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: color, fontWeight: 800, letterSpacing: '1px' }}>
                            СЛЕДУЮЩИЙ
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                color: isMax ? '#888' : '#fbbf24',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                marginTop: '5px',
                            }}
                        >
                            {isMax
                                ? 'МАКС'
                                : `+${progressValue + (talent.id.includes('ult') ? 10 : 5)}${talent.id.includes('ult') ? '' : '%'}`}
                        </div>
                    </div>
                </div>
            </div>

            {talent.branchPoints < talent.required && (
                <div
                    style={{
                        marginTop: '25px',
                        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.1))',
                        padding: '15px',
                        borderRadius: '14px',
                        border: '1px solid #ef4444',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 900,
                        textAlign: 'center',
                        letterSpacing: '1.5px',
                        fontFamily: "'Cinzel', serif",
                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    }}
                >
                    ⚠️ ТРЕБУЕТСЯ {talent.required} ОЧКОВ ВЕТКИ
                </div>
            )}

            {!talent.isLevelUnlocked && talent.requiredLevel && (
                <div
                    style={{
                        marginTop: '10px',
                        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.1))',
                        padding: '15px',
                        borderRadius: '14px',
                        border: '1px solid #ef4444',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 900,
                        textAlign: 'center',
                        letterSpacing: '1.5px',
                        fontFamily: "'Cinzel', serif",
                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    }}
                >
                    ⚠️ ТРЕБУЕТСЯ {talent.requiredLevel} УРОВЕНЬ ГЕРОЯ
                </div>
            )}
        </motion.div>
    );
};
