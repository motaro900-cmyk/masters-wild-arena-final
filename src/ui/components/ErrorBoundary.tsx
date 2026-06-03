import React from 'react';
import * as Sentry from '@sentry/react';

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error('ErrorBoundary caught an error', error, errorInfo);
        Sentry.captureException(error, {
            extra: {
                componentStack: errorInfo?.componentStack,
                source: 'ErrorBoundary',
            },
        });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff4444',
                        textAlign: 'center',
                        padding: '20px',
                        fontFamily: 'sans-serif',
                    }}
                >
                    <h2>Произошла критическая ошибка интерфейса</h2>
                    <p style={{ color: '#aaa', maxWidth: '600px' }}>
                        {this.state.error?.message || 'Неизвестная ошибка'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            marginTop: '20px',
                            cursor: 'pointer',
                            background: '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                        }}
                    >
                        Перезагрузить игру
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
