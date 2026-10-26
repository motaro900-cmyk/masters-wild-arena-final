/**
 * PORTAL PAGE (Главная страница студийного игрового портала)
 * Сборка всех ключевых модулей: Header, Hero, Бестиарий, Новости, OST-плеер,
 * Ежедневные Награды, Зал Чемпионов, Личный Кабинет и Юридический Подвал (152-ФЗ / 436-ФЗ).
 */
import React, { useState } from 'react';
import { PortalHeader } from './components/PortalHeader';
import { PortalHero } from './components/PortalHero';
import { PortalBeastCodex } from './components/PortalBeastCodex';
import { PortalItemCodex } from './components/PortalItemCodex';
import { PortalNews } from './components/PortalNews';
import { PortalOSTPlayer } from './components/PortalOSTPlayer';
import { PortalDailyCheckIn } from './components/PortalDailyCheckIn';
import { PortalHallOfFame } from './components/PortalHallOfFame';
import { PortalCabinet } from './components/PortalCabinet';
import { PortalFooter } from './components/PortalFooter';
import { PortalLegalModal } from './components/PortalLegalModal';
import { PortalParticleCanvas } from './components/PortalParticleCanvas';
import { PortalChatDock } from './components/PortalChatDock';

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
    const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'cookies' | 'age' | null>(null);

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
            {/* Live Interactive Ambient Background Canvas (60 FPS Blizzard/HoYoverse standard) */}
            <PortalParticleCanvas />

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

            {/* 3.5. Armory & Items Codex (Weapons, Armor, Shields, Relics) */}
            <PortalItemCodex />

            {/* 4. Chronicles & News Hub (Steam/Battle.net standard) */}
            <PortalNews onLaunchGame={onLaunchGame} />

            {/* 5. OST Sanctuary (8-Track Web Audio Player & Canvas FFT) */}
            <PortalOSTPlayer isGameActive={isGameActive} />

            {/* 6. Daily Rewards Retention Hub (7-Day Calendar) */}
            <PortalDailyCheckIn />

            {/* 7. Hall of Fame (Top 10 Leaderboard & P2P Duels) */}
            <PortalHallOfFame onChallengePlayer={onChallengePlayer} />

            {/* 8. Footer (152-ФЗ, 436-ФЗ 12+, Studio Imprint) */}
            <PortalFooter
                onLaunchGame={onLaunchGame}
                onOpenLegal={(tab) => setLegalTab(tab)}
            />

            {/* 9. Personal Player Cabinet Modal */}
            <PortalCabinet
                isOpen={isCabinetOpen}
                onClose={() => setIsCabinetOpen(false)}
                onLaunchGame={(heroId) => {
                    if (heroId) onSelectAndPlay(heroId);
                    else onLaunchGame();
                }}
            />

            {/* 10. Legal Compliance Modal (РФ) */}
            <PortalLegalModal
                isOpen={legalTab !== null}
                tab={legalTab}
                onClose={() => setLegalTab(null)}
                onSelectTab={(t) => setLegalTab(t)}
            />

            {/* 11. Live Community Chat & Activity Dock (Fixed Bottom-Right) */}
            <PortalChatDock />
        </div>
    );
};
export default PortalPage;
