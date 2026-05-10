import React, { useState } from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';

/**
 * ChatPanel (v2.0) — Увеличенная высота и функция сворачивания.
 */
export const ChatPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div style={{
            width: 400,
            position: 'relative',
            pointerEvents: 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'translateY(0)' : 'translateY(210px)', // Смещение вниз при закрытии
            opacity: isOpen ? 1 : 0.8,
        }}>

            {/* Кнопка-переключатель (Вкладка сверху) */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'absolute',
                    top: -30,
                    left: 10,
                    padding: '4px 15px',
                    background: 'rgba(15, 10, 5, 0.9)',
                    border: '1px solid rgba(240, 192, 64, 0.4)',
                    borderBottom: 'none',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#f0c040',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.5)',
                }}
            >
                <span>ЧАТ</span>
                <span style={{
                    fontSize: 8,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                }}>▲</span>
            </div>

            {/* Основное окно чата */}
            <div style={{
                backgroundImage: `url(${AssetsMap.UI.PANEL_CHAT})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: 260, // Увеличено (было 160)
                padding: '35px 20px 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            }}>
                {/* Список сообщений */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }} className="custom-scrollbar">
                    <p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#f0c040', fontWeight: 700, fontStyle: 'italic', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                        [СИСТЕМА]: Добро пожаловать, Мастер! Сегодня Арена открыта до полуночи.
                    </p>

                    {[...Array(3)].map((_, i) => (
                        <p key={i} style={{ margin: '0 0 6px 0', fontSize: 13 }}>
                            <span style={{ color: '#c03030', fontWeight: 900, marginRight: 6 }}>Dragon:</span>
                            <span style={{ color: '#e8d8a8', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                Всем удачи на Арене! Сражайтесь до последнего! 🐉
                            </span>
                        </p>
                    ))}
                </div>

                {/* Поле ввода (Имитация из скриншота) */}
                <div style={{
                    marginTop: 15,
                    height: 45,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(240, 192, 64, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px'
                }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Введите сообщение...</span>
                </div>
            </div>
        </div>
    );
};
