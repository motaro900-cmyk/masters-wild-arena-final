import React from 'react';

export const WindowLoadingSpinner: React.FC = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999,
                color: '#f5d37a',
                fontFamily: "'Cinzel', 'Philosopher', serif",
                gap: '15px',
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid rgba(245, 211, 122, 0.1)',
                    borderTop: '5px solid #f5d37a',
                    borderRadius: '50%',
                    animation: 'window-spin 1s linear infinite',
                }}
            />
            <style>{`
                @keyframes window-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <div
                style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                }}
            >
                Загрузка...
            </div>
        </div>
    );
};
