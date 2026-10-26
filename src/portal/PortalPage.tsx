import React, { useState } from 'react';
import { PortalHeader } from './components/PortalHeader';
import { PortalHero } from './components/PortalHero';
import { PortalBeastCodex } from './components/PortalBeastCodex';
import { PortalNews } from './components/PortalNews';
import { PortalOSTPlayer } from './components/PortalOSTPlayer';
import { PortalDailyCheckIn } from './components/PortalDailyCheckIn';
import { PortalHallOfFame } from './components/PortalHallOfFame';
import { PortalFooter } from './components/PortalFooter';
import { PortalLegalModal } from './components/PortalLegalModal';
import { PortalParticleCanvas } from './components/PortalParticleCanvas';

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
            {/* Live Interactive Ambient Background Canvas (60 FPS standard) */}
            <PortalParticleCanvas />

            {/* 1. Sticky Navigation Header */}
            <PortalHeader
                onLaunchGame={onLaunchGame}
                installPrompt={installPrompt}
                onInstallPwa={onInstallPwa}
            />

            {/* 2. Hero Section: Promo & Direct Site Registration / Game Account */}
            <PortalHero
                onLaunchGame={onLaunchGame}
                onExploreBeasts={handleExploreBeasts}
            />

            {/* 3. Interactive Beast Codex (Authentic Game Sprites & Skills) */}
            <PortalBeastCodex onSelectAndPlay={onSelectAndPlay} />

            {/* 4. Chronicles & News Hub */}
            <PortalNews onLaunchGame={onLaunchGame} />

            {/* 5. Soundtracks Player (Procedural Web Audio) */}
            <PortalOSTPlayer isGameActive={isGameActive} />

            {/* 6. Daily Rewards Hub (7-Day Calendar) */}
            <PortalDailyCheckIn />

            {/* 7. Hall of Fame (Top 10 Leaderboard & P2P Duels) */}
            <PortalHallOfFame onChallengePlayer={onChallengePlayer} />

            {/* 8. Footer (152-ФЗ, 436-ФЗ 12+, Direct Play) */}
            <PortalFooter
                onLaunchGame={onLaunchGame}
                onOpenLegal={(tab) => setLegalTab(tab)}
            />

            {/* 9. Legal Compliance Modal (РФ 152-ФЗ) */}
            <PortalLegalModal
                isOpen={legalTab !== null}
                tab={legalTab}
                onClose={() => setLegalTab(null)}
                onSelectTab={(t) => setLegalTab(t)}
            />
        </div>
    );
};

export default PortalPage;
