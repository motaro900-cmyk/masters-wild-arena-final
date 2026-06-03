import React from 'react';

interface InitErrorScreenProps {
    error: string;
}

/**
 * Экран критической ошибки при инициализации приложения.
 * Показывает текст ошибки и кнопку перезагрузки.
 */
export const InitErrorScreen: React.FC<InitErrorScreenProps> = ({ error }) => {
    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: '#0c0c0c',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff4444',
                textAlign: 'center',
                padding: '40px',
                fontFamily: 'sans-serif',
            }}
        >
            <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Критическая ошибка запуска</h2>
            <div
                style={{
                    background: 'rgba(255,0,0,0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,0,0,0.2)',
                    marginBottom: '30px',
                    maxWidth: '500px',
                }}
            >
                <code style={{ fontSize: '14px', color: '#ff7777', wordBreak: 'break-all' }}>{error}</code>
            </div>
            <button
                onClick={() => window.location.reload()}
                style={{
                    padding: '15px 35px',
                    background: '#c8952a',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                ПОПРОБОВАТЬ СНОВА
            </button>
            <div style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
                Если ошибка повторяется, проверьте интернет-соединение или попробуйте позже.
            </div>
        </div>
    );
};
