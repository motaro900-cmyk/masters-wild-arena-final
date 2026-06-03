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
                    color: '#22c55e',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    fontFamily: "'Montserrat', sans-serif",
                }}
            >
                {Math.round(pVal)}
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
                        background: '#10b981',
                        borderRadius: '3px',
                        boxShadow: '0 0 6px rgba(16,185,129,0.3)',
                    }}
                />
            </div>

            {/* Icon + Stat Label in Center */}
            <div
                style={{
                    width: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16px' }}>
                    {icon}
                </div>
                <div
                    style={{
                        color: '#b5a695',
                        fontSize: '8px',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
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
                        background: '#ef4444',
                        borderRadius: '3px',
                        boxShadow: '0 0 6px rgba(239,68,68,0.3)',
                    }}
                />
            </div>

            {/* Enemy value */}
            <div
                style={{
                    width: '40px',
                    textAlign: 'left',
                    color: '#ef4444',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    fontFamily: "'Montserrat', sans-serif",
                }}
            >
                {Math.round(eVal)}
            </div>
        </div>
    );
};
