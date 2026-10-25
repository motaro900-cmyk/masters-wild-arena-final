/**
 * PORTAL HEADER (Шапка игрового портала)
 * Навигация, статус игрового сервера, быстрый вход в бой и PWA установка.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';

interface PortalHeaderProps {
    onLaunchGame: () => void;
    installPrompt?: any;
    onInstallPwa?: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
    onLaunchGame,
    installPrompt,
    onInstallPwa,
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollTo = (id: string) => {
        proceduralAudio.playClick(1.0);
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                zIndex: 1000,
                backgroundColor: 'rgba(7, 5, 11, 0.88)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(200, 168, 112, 0.25)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
            }}
        >
            {/* Left: Brand Logo & Server Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <a
                    href="#hero"
                    onClick={(e) => {
                        e.preventDefault();
                        scrollTo('hero');
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textDecoration: 'none',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>🐺</span>
                    <div>
                        <div
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: '15px',
                                fontWeight: 800,
                                letterSpacing: '2px',
                                color: '#FFE07D',
                                textShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                                lineHeight: 1.1,
                            }}
                        >
                            MASTERS OF THE WILD
                        </div>
                        <div
                            style={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: '10px',
                                color: '#9ca3af',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                            }}
                        >
                            Официальный портал арены
                        </div>
                    </div>
                </a>

                {/* Server Status Badge (Desktop) */}
                <div
                    style={{
                        display: 'none',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(34, 197, 94, 0.12)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        fontSize: '11px',
                        color: '#4ade80',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                    }}
                    className="desktop-server-badge"
                >
                    <span
                        style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            boxShadow: '0 0 8px #22c55e',
                        }}
                    />
                    <span>S1: Туманная Долина (Онлайн: 1,420)</span>
                </div>
            </div>

            {/* Center: Desktop Navigation Links */}
            <nav
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                }}
                className="desktop-nav"
            >
                {[
                    { label: 'Главная', id: 'hero' },
                    { label: 'Звери и Навыки', id: 'codex' },
                    { label: 'Саундтреки', id: 'ost' },
                    { label: 'Награды', id: 'rewards' },
                    { label: 'Зал Славы', id: 'arena' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => scrollTo(item.id)}
                        onMouseEnter={() => proceduralAudio.playHover()}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#e5e7eb',
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: "'Philosopher', serif",
                            letterSpacing: '0.5px',
                            cursor: 'pointer',
                            padding: '6px 4px',
                            transition: 'color 0.15s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = '#FFE07D')}
                        onMouseOut={(e) => (e.currentTarget.style.color = '#e5e7eb')}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Right: Actions (PWA + Launch Game Button) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {installPrompt && onInstallPwa && (
                    <button
                        onClick={onInstallPwa}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(245, 158, 11, 0.6)',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#FFE07D',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontFamily: "'Montserrat', sans-serif",
                            transition: 'all 0.2s',
                        }}
                    >
                        📲 Установить PWA
                    </button>
                )}

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        proceduralAudio.playDuelHorn();
                        onLaunchGame();
                    }}
                    style={{
                        padding: '10px 22px',
                        borderRadius: '10px',
                        border: '1px solid #FFE07D',
                        background: 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)',
                        color: '#150f05',
                        fontSize: '14px',
                        fontWeight: 800,
                        fontFamily: "'Philosopher', serif",
                        letterSpacing: '0.8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <span>⚔️</span>
                    <span>В БОЙ!</span>
                </motion.button>

                {/* Mobile Menu Toggle Button */}
                <button
                    onClick={() => {
                        proceduralAudio.playClick(0.9);
                        setMobileMenuOpen(!mobileMenuOpen);
                    }}
                    style={{
                        display: 'none',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        width: '38px',
                        height: '38px',
                        color: '#FFE07D',
                        fontSize: '20px',
                        cursor: 'pointer',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    className="mobile-menu-toggle"
                >
                    {mobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            position: 'absolute',
                            top: '70px',
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(10, 7, 14, 0.98)',
                            backdropFilter: 'blur(20px)',
                            borderBottom: '2px solid rgba(200, 168, 112, 0.4)',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                color: '#4ade80',
                                paddingBottom: '10px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                        >
                            <span
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#22c55e',
                                }}
                            />
                            <span>Сервер: S1 Туманная Долина (Онлайн)</span>
                        </div>

                        {[
                            { label: 'Главная', id: 'hero' },
                            { label: 'Звери и Навыки', id: 'codex' },
                            { label: 'Саундтреки', id: 'ost' },
                            { label: 'Награды и Чекин', id: 'rewards' },
                            { label: 'Зал Славы', id: 'arena' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollTo(item.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#f3e8d2',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    fontFamily: "'Philosopher', serif",
                                    textAlign: 'left',
                                    padding: '8px 0',
                                    cursor: 'pointer',
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};
