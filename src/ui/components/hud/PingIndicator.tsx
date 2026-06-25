import React from 'react';
import { useGameStore } from '../../../store/useGameStore';

export const PingIndicator: React.FC = () => {
    const showPing = useGameStore((state) => state.showPing !== false);

    if (!showPing) return null;

    const [ping, setPing] = React.useState<number>(24);
    const [status, setStatus] = React.useState<'good' | 'medium' | 'bad'>('good');

    React.useEffect(() => {
        const measurePing = async () => {
            const start = performance.now();
            try {
                // Fetch index page with cache-busting to force server roundtrip
                await fetch(`/?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
                const duration = Math.round(performance.now() - start);
                setPing(duration);
                if (duration < 60) setStatus('good');
                else if (duration < 180) setStatus('medium');
                else setStatus('bad');
            } catch (e) {
                setPing(999);
                setStatus('bad');
            }
        };

        measurePing();
        const interval = setInterval(measurePing, 8000); // Measure every 8 seconds
        return () => clearInterval(interval);
    }, []);

    const color = status === 'good' ? '#2ecc71' : status === 'medium' ? '#f1c40f' : '#e74c3c';
    const bgColor =
        status === 'good'
            ? 'rgba(46, 204, 113, 0.08)'
            : status === 'medium'
              ? 'rgba(241, 196, 15, 0.08)'
              : 'rgba(231, 76, 60, 0.08)';
    const borderColor =
        status === 'good'
            ? 'rgba(46, 204, 113, 0.2)'
            : status === 'medium'
              ? 'rgba(241, 196, 15, 0.2)'
              : 'rgba(231, 76, 60, 0.2)';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Montserrat', sans-serif",
                color: color,
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                padding: '5px 12px',
                background: bgColor,
                borderRadius: '20px',
                border: `1px solid ${borderColor}`,
                boxShadow: `0 0 8px ${bgColor}`,
                transition: 'all 0.3s ease',
            }}
        >
            {/* keyframes pulseStatus объявлены в index.css — инлайн <style> не нужен */}
            <span style={{ fontSize: '7px', animation: 'pulseStatus 1.8s infinite' }}>●</span>
            <span>{ping === 999 ? 'OFFLINE' : `ONLINE • ${ping}ms`}</span>
        </div>
    );
};
export default PingIndicator;
