import React from 'react';

interface CornerAccentProps {
    position: 'tl' | 'tr' | 'bl' | 'br';
    color: string;
}

/** Угловая декорация для панели */
export const CornerAccent = React.memo<CornerAccentProps>(({ position, color }) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        width: '12px',
        height: '12px',
        zIndex: 10,
        ...(position === 'tl' && {
            top: -1,
            left: -1,
            borderTop: `2px solid ${color}`,
            borderLeft: `2px solid ${color}`,
        }),
        ...(position === 'tr' && {
            top: -1,
            right: -1,
            borderTop: `2px solid ${color}`,
            borderRight: `2px solid ${color}`,
        }),
        ...(position === 'bl' && {
            bottom: -1,
            left: -1,
            borderBottom: `2px solid ${color}`,
            borderLeft: `2px solid ${color}`,
        }),
        ...(position === 'br' && {
            bottom: -1,
            right: -1,
            borderBottom: `2px solid ${color}`,
            borderRight: `2px solid ${color}`,
        }),
    };
    return <div style={style} />;
});
