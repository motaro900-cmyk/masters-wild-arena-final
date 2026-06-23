import React from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { getRankInfo } from '../../../../configs/RankSystem';
import { bootController } from '../../../../bootstrap/BootController';
import { PlayerPanel } from './PlayerPanel';
import { EnemyPanel } from './EnemyPanel';
import { BattleVSPanel } from './BattleVSPanel';

interface BattleHUDProps {
    playerHero: any;
    enemyData: any;
    battleMode: string;
    activePveEnemy: any;
    battleState: any;
    playerPulse: boolean;
    enemyPulse: boolean;
    currentAttacker: 'player' | 'enemy' | null;
    liveLog: Array<{ id: number; text: string; type: string }>;
}

export const BattleHUD = React.memo<BattleHUDProps>(({
    enemyData,
    battleMode,
    activePveEnemy,
    battleState,
    playerPulse,
    enemyPulse,
    currentAttacker,
    liveLog,
}) => {
    // READY GATE HARD BLOCK
    if (bootController.getState() !== 'READY') {
        console.error('[READY GATE VIOLATION] BattleHUD attempted to render before BootController is READY.');
        return null;
    }

    const [timeLeft, setTimeLeft] = React.useState(300); // 5 minutes in seconds
    const [scale, setScale] = React.useState(1);

    React.useEffect(() => {
        const updateScale = () => {
            const container = document.getElementById('game-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                setScale(rect.width / 1920 || 1);
            } else {
                const widthScale = window.innerWidth / 1920;
                const heightScale = window.innerHeight / 1080;
                setScale(Math.min(widthScale, heightScale) || 1);
            }
        };

        window.addEventListener('resize', updateScale);
        updateScale();
        const timer = setTimeout(updateScale, 500);

        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }, []);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const selectedHeroId = useGameStore((s) => s.selectedHeroId) || 'panda';
    const heroes = useGameStore((s) => s.heroes) || {};
    const heroLevel = heroes[selectedHeroId]?.level || 1;
    const playerRating = useGameStore((s) => s.rating || s.trophies || 0);

    // Read precomputed HUD values from the store
    const precomputedPlayerRank = useGameStore((s) => s.hudPlayerRank);
    const precomputedPlayerAvatar = useGameStore((s) => s.hudPlayerAvatar);
    const precomputedEnemyLevel = useGameStore((s) => s.hudEnemyLevel);
    const precomputedEnemyRating = useGameStore((s) => s.hudEnemyRating);
    const precomputedEnemyRank = useGameStore((s) => s.hudEnemyRank);
    const precomputedEnemyAvatar = useGameStore((s) => s.hudEnemyAvatar);

    const playerRank = precomputedPlayerRank || getRankInfo(playerRating);
    const playerName = useGameStore((s) => s.name) || 'Мастер';
    const rawAvatar = useGameStore((s) => s.avatar);
    const vkUser = useGameStore((s) => s.vkUser);
    const playerFrame = useGameStore((s) => s.frame) || 'default';
    const vipLevel = useGameStore((s) => s.vipLevel) || 0;

    const playerAvatar = precomputedPlayerAvatar || (rawAvatar && !rawAvatar.startsWith('sprite:') ? rawAvatar : (vkUser?.photo200 || vkUser?.photo_200 || vkUser?.photo || '/assets/images/avatars/panda.webp'));

    const activeRankedOpponent = useGameStore((s) => s.activeRankedOpponent);

    const enemyLevel = precomputedEnemyLevel !== undefined ? precomputedEnemyLevel : (battleMode === 'PVE' && activePveEnemy ? (activePveEnemy.level || 1) : (activeRankedOpponent?.level || 1));
    const enemyRating = precomputedEnemyRating !== undefined ? precomputedEnemyRating : (battleMode === 'PVE' && activePveEnemy ? Math.max(0, (activePveEnemy.level || 1) * 180) : (activeRankedOpponent?.rating || 0));

    const enemyRank = precomputedEnemyRank || getRankInfo(enemyRating);

    const enemyName = battleMode === 'PVE' && activePveEnemy ? activePveEnemy.name : enemyData.name;
    const lastLog = liveLog.length > 0 ? liveLog[liveLog.length - 1] : null;

    // Enemy Avatar
    const enemyAvatar = precomputedEnemyAvatar || (battleMode === 'PVE' ? (enemyData.image || '/assets/images/avatars/wolf.webp') : (activeRankedOpponent?.avatar || enemyData.image || '/assets/images/avatars/wolf.webp'));

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
            <div
                style={{
                    padding: '20px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                    boxSizing: 'border-box',
                    gap: '16px',
                }}
            >
                {/* ══════════════ ПАНЕЛЬ ИГРОКА ══════════════ */}
                <PlayerPanel
                    playerPulse={playerPulse}
                    currentAttacker={currentAttacker}
                    playerAvatar={playerAvatar}
                    playerFrame={playerFrame}
                    vipLevel={vipLevel}
                    heroLevel={heroLevel}
                    playerName={playerName}
                    playerRank={playerRank}
                    playerRating={playerRating}
                    battleState={battleState}
                />

                {/* ══════════════ ЦЕНТР (VS & Таймер & Последний Лог) ══════════════ */}
                <BattleVSPanel
                    timeLeft={timeLeft}
                    lastLog={lastLog}
                    scale={scale}
                    formatTime={formatTime}
                />

                {/* ══════════════ ПАНЕЛЬ ВРАГА ══════════════ */}
                <EnemyPanel
                    enemyPulse={enemyPulse}
                    currentAttacker={currentAttacker}
                    enemyAvatar={enemyAvatar}
                    activeRankedOpponent={activeRankedOpponent}
                    battleMode={battleMode}
                    enemyLevel={enemyLevel}
                    enemyName={enemyName}
                    enemyRank={enemyRank}
                    enemyRating={enemyRating}
                    battleState={battleState}
                />
            </div>
        </div>
    );
});
