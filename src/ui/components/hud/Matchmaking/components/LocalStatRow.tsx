import React from 'react';

interface LocalStatRowProps {
    label: string;
    pVal: number;
    eVal: number;
    icon: React.ReactNode;
}

export const LocalStatRow: React.FC<LocalStatRowProps> = ({ label, pVal, eVal, icon }) => {
    const maxVal = Math.max(pVal, eVal, 1) * 1.15;
    const pPct = Math.min(100, Math.max(5, (pVal / maxVal) * 100));
    const ePct = Math.min(100, Math.max(5, (eVal / maxVal) * 100));

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px', height: '42px' }}>
            {/* Player value */}
            <div
                style={{
                    width: '40px',
                    textAlign: 'right',
                    color: '#4ade80',
                    fontSize: '16px',
                    fontWeight: 900,
                    fontFamily: "'Montserrat', sans-serif",
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
            >
                {label === 'СКОРОСТЬ'
                    ? pVal.toFixed(1)
                    : label === 'КРИТ. ШАНС'
                      ? `${Math.round(pVal)}%`
                      : Math.round(pVal)}
            </div>

            {/* Left Fill (Player) - flowing from right to left */}
            <div
                style={{
                    flex: 1,
                    height: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '3px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${pPct}%`,
                        height: '100%',
                        background: '#34d399',
                        borderRadius: '3px',
                        boxShadow: '0 0 8px rgba(52,211,153,0.4)',
                    }}
                />
            </div>

            {/* Icon + Stat Label in Center */}
            <div
                style={{
                    width: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px' }}>
                    {icon}
                </div>
                <div
                    style={{
                        color: '#ffd700',
                        fontSize: '11px',
                        fontWeight: 950,
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        textShadow: '0 1.5px 3px rgba(0,0,0,0.95)',
                    }}
                >
                    {label}
                </div>
            </div>

            {/* Right Fill (Opponent) - flowing from left to right */}
            <div
                style={{
                    flex: 1,
                    height: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${ePct}%`,
                        height: '100%',
                        background: '#f87171',
                        borderRadius: '3px',
                        boxShadow: '0 0 8px rgba(248,113,113,0.4)',
                    }}
                />
            </div>

            {/* Enemy value */}
            <div
                style={{
                    width: '40px',
                    textAlign: 'left',
                    color: '#f87171',
                    fontSize: '16px',
                    fontWeight: 900,
                    fontFamily: "'Montserrat', sans-serif",
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
            >
                {label === 'СКОРОСТЬ'
                    ? eVal.toFixed(1)
                    : label === 'КРИТ. ШАНС'
                      ? `${Math.round(eVal)}%`
                      : Math.round(eVal)}
            </div>
        </div>
    );
};
