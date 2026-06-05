import React from 'react';
import { AssetsMap } from '../../configs/AssetsMap';

/**
 * Экран «Игра доступна только во ВКонтакте».
 * Показывается когда пользователь не авторизован через VK Bridge
 * (блокировка гостевого доступа в production).
 */
export const NotInVkScreen: React.FC = () => {
    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundImage: `url(${AssetsMap.BACKGROUNDS.MAIN_MENU})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0c0c0c',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                textAlign: 'center',
                padding: '24px',
                fontFamily: "'Cinzel', serif",
                position: 'fixed',
                top: 0,
                left: 0,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    background: 'rgba(10, 7, 5, 0.9)',
                    backdropFilter: 'blur(30px)',
                    padding: '40px 60px',
                    borderRadius: '30px',
                    border: '1.5px solid rgba(200,149,42,0.6)',
                    boxShadow: '0 20px 80px rgba(0,0,0,0.8), 0 0 40px rgba(200,149,42,0.15)',
                    maxWidth: '650px',
                }}
            >
                <div
                    style={{
                        color: '#ffd700',
                        fontSize: '16px',
                        letterSpacing: '0.4em',
                        marginBottom: '15px',
                        textTransform: 'uppercase',
                    }}
                >
                    Вход ограничен
                </div>
                <h2
                    style={{
                        fontSize: '32px',
                        margin: '0 0 20px 0',
                        lineHeight: 1.2,
                        fontFamily: "'Cinzel Decorative', serif",
                    }}
                >
                    Игра доступна только во ВКонтакте
                </h2>
                <p
                    style={{
                        fontSize: '18px',
                        lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: '35px',
                    }}
                >
                    Для игры в <strong style={{ color: '#ffd700' }}>Masters of the Wild</strong> используйте официальное
                    мини-приложение ВКонтакте. Гостевой доступ к веб-версии отключен разработчиком.
                </p>
                <button
                    onClick={() => window.open('https://vk.com/app52446645', '_blank')}
                    style={{
                        padding: '16px 45px',
                        background: 'linear-gradient(135deg, #ffe082, #c8952a)',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#1a0e05',
                        cursor: 'pointer',
                        letterSpacing: '0.15em',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    ИГРАТЬ В ВК
                </button>
            </div>
        </div>
    );
};
