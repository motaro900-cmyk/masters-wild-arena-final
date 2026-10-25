/**
 * PORTAL PAGE (Главная страница студийного игрового портала)
 * Сборка всех ключевых модулей: Header, Hero, Бестиарий, OST-плеер,
 * Ежедневные Награды, Зал Чемпионов, Личный Кабинет и Юридический Подвал.
 */
import React, { useState } from 'react';
import { PortalHeader } from './components/PortalHeader';
import { PortalHero } from './components/PortalHero';
import { PortalBeastCodex } from './components/PortalBeastCodex';
import { PortalOSTPlayer } from './components/PortalOSTPlayer';
import { PortalDailyCheckIn } from './components/PortalDailyCheckIn';
import { PortalHallOfFame } from './components/PortalHallOfFame';
import { PortalCabinet } from './components/PortalCabinet';
import { PortalFooter } from './components/PortalFooter';

interface PortalPageProps {
    onLaunchGame: () => void;
    onSelectAndPlay: (heroId: string) => void;
    onChallengePlayer: (playerName: string) => void;
    installPrompt?: any;
    onInstallPwa?: () => void;
    isGameActive?: boolean;
}

export const PortalPage: React.FC<PortalPageProps> = ({
    onLaunchGame,
    onSelectAndPlay,
    onChallengePlayer,
    installPrompt,
    onInstallPwa,
    isGameActive = false,
}) => {
    const [isCabinetOpen, setIsCabinetOpen] = useState(false);

    const handleExploreBeasts = () => {
        const el = document.getElementById('beasts');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div
            style={{
                width: '100%',
                minHeight: '100vh',
                backgroundColor: '#050407',
                color: '#f5ede0',
                fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                overflowX: 'hidden',
                position: 'relative',
            }}
        >
            {/* Ambient Background Particles / Glow */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.05) 0%, transparent 60%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {/* 1. Sticky Navigation Header */}
            <PortalHeader
                onLaunchGame={onLaunchGame}
                onOpenCabinet={() => setIsCabinetOpen(true)}
                installPrompt={installPrompt}
                onInstallPwa={onInstallPwa}
            />

            {/* 2. Hero Section */}
            <PortalHero
                onLaunchGame={onLaunchGame}
                onOpenCabinet={() => setIsCabinetOpen(true)}
                onExploreBeasts={handleExploreBeasts}
            />

            {/* 3. Interactive Beast Codex (Authentic Game Sprites & 3D Cards) */}
            <PortalBeastCodex onSelectAndPlay={onSelectAndPlay} />

            {/* 4. OST Sanctuary (8-Track Web Audio Player & Canvas FFT) */}
            <PortalOSTPlayer isGameActive={isGameActive} />

            {/* 5. Daily Rewards Retention Hub (7-Day Calendar) */}
            <PortalDailyCheckIn />

            {/* 6. Hall of Fame (Top 10 Leaderboard & P2P Duels) */}
            <PortalHallOfFame onChallengePlayer={onChallengePlayer} />

            {/* 7. Footer (152-ФЗ, 436-ФЗ 12+, Studio Imprint) */}
            <PortalFooter onLaunchGame={onLaunchGame} />

            {/* 8. Personal Player Cabinet Modal */}
            <PortalCabinet
                isOpen={isCabinetOpen}
                onClose={() => setIsCabinetOpen(false)}
                onLaunchGame={(heroId) => {
                    if (heroId) onSelectAndPlay(heroId);
                    else onLaunchGame();
                }}
            />
        </div>
    );
};
export default PortalPage;
