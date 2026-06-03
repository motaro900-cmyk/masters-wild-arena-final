import React from 'react';
import { AssetsMap } from '../../../../../configs/AssetsMap';

/**
 * Левая фиксированная панель с названиями дорожек наград:
 * «Королевский путь» (премиум) и «Воинский путь» (бесплатный).
 * Чисто декоративный статический компонент без стейта.
 */
export const BattlePassSidePanel: React.FC = () => {
    return (
        <div
            style={{
                width: '240px',
                background: 'linear-gradient(90deg, #1b120c 0%, #150f0c 100%)',
                borderRight: '3px solid #b8860b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
                boxShadow: '5px 0 15px rgba(0,0,0,0.5)',
                zIndex: 2,
            }}
        >
            {/* Верхняя метка — Премиум путь */}
            <div
                style={{
                    width: '200px',
                    height: '240px',
                    background: 'radial-gradient(circle at center, #3a1515 0%, #150505 100%)',
                    border: '2px solid #ffd700',
                    borderRadius: '12px',
                    boxShadow: '0 0 15px rgba(255,215,0,0.15), inset 0 0 10px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '20px 10px',
                    gap: '15px',
                }}
            >
                <img
                    src={AssetsMap.UI.ICON_CROWN}
                    alt="Premium Path"
                    style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.6))',
                    }}
                />
                <div>
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 950,
                            fontSize: '15px',
                            color: '#ffd700',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            display: 'block',
                        }}
                    >
                        КОРОЛЕВСКИЙ
                    </span>
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 900,
                            fontSize: '12px',
                            color: '#f59e0b',
                            letterSpacing: '2.5px',
                            textTransform: 'uppercase',
                            marginTop: '4px',
                            display: 'block',
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                    >
                        ПУТЬ
                    </span>
                </div>
            </div>

            {/* Центральный разделитель */}
            <div
                style={{
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <span
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 950,
                        fontSize: '14px',
                        color: '#f0c040',
                        letterSpacing: '2px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    ЭТАПЫ
                </span>
            </div>

            {/* Нижняя метка — Бесплатный путь */}
            <div
                style={{
                    width: '200px',
                    height: '240px',
                    background: 'radial-gradient(circle at center, #1c110a 0%, #0c0704 100%)',
                    border: '2px solid #c8a870',
                    borderRadius: '12px',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '20px 10px',
                    gap: '15px',
                }}
            >
                <img
                    src="/assets/images/ui/power_icon.webp"
                    alt="Free Path"
                    style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
                    }}
                />
                <div>
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 950,
                            fontSize: '15px',
                            color: '#c8a870',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            display: 'block',
                        }}
                    >
                        ВОИНСКИЙ
                    </span>
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 900,
                            fontSize: '12px',
                            color: '#a3a3a3',
                            letterSpacing: '2.5px',
                            textTransform: 'uppercase',
                            marginTop: '4px',
                            display: 'block',
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                    >
                        ПУТЬ
                    </span>
                </div>
            </div>
        </div>
    );
};
