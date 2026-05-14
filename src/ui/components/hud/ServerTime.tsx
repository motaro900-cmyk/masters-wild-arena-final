import React, { useState, useEffect } from 'react';

/**
 * ServerTime Component (MSK)
 * Displays current Moscow time and date with a premium aesthetic.
 */
export const ServerTime: React.FC = () => {
    const [time, setTime] = useState<string>('');
    const [date, setDate] = useState<string>('');

    useEffect(() => {
        const updateTime = () => {
            const MSK_OFFSET = 3 * 60 * 60 * 1000;
            const nowMSK = new Date(Date.now() + MSK_OFFSET);

            // Time: HH:MM:SS
            const h = nowMSK.getUTCHours().toString().padStart(2, '0');
            const m = nowMSK.getUTCMinutes().toString().padStart(2, '0');
            const s = nowMSK.getUTCSeconds().toString().padStart(2, '0');
            setTime(`${h}:${m}:${s}`);

            // Date: DD.MM.YYYY
            const d = nowMSK.getUTCDate().toString().padStart(2, '0');
            const mo = (nowMSK.getUTCMonth() + 1).toString().padStart(2, '0');
            const y = nowMSK.getUTCFullYear();
            setDate(`${d}.${mo}.${y}`);
        };

        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            fontFamily: "'Montserrat', sans-serif",
            color: '#fff',
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '1px',
            padding: '4px 12px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '20px',
            border: '1px solid rgba(240, 192, 64, 0.2)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', opacity: 0.8 }}>🌐</span>
                <span style={{ fontFamily: 'monospace', fontSize: '16px' }}>{time}</span>
                <span style={{ fontSize: '10px', color: '#f0c040', opacity: 0.9 }}>MSK</span>
            </div>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ fontSize: '12px', opacity: 0.6, fontWeight: 500 }}>
                {date}
            </div>
        </div>
    );
};
