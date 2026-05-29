import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { getRankInfo } from '../../../configs/RankSystem';
import { getHeroConfig, HEROES_DB } from '../../../configs/HeroesConfig';
import { audioService } from '../../../services/AudioService';
import '../../styles/profile-hub.css';

// Subcomponents
import { MatchmakingSearching } from './Matchmaking/MatchmakingSearching';
import { MatchmakingFound } from './Matchmaking/MatchmakingFound';

const shouldFlipEnemy = (src: string): boolean => {
    if (!src) return false;
    const s = src.toLowerCase();
    return !(s.includes('panther') || (s.includes('wolf') && !s.includes('wolf_knight')));
};

interface MatchmakingOverlayProps {
    onFound: (enemyId?: string) => void;
    onCancel: () => void;
}

export const MatchmakingOverlay: React.FC<MatchmakingOverlayProps> = ({ onFound, onCancel }) => {
    const { name, rating, vipLevel, selectedHeroId, level, getCalculatedStats, avatar, vkUser } = useGameStore();

    const playerName = name && name !== 'Мастер' ? name : vkUser?.first_name || vkUser?.firstName || 'Мастер';
    const playerAvatarSrc =
        avatar && avatar.startsWith('http')
            ? avatar
            : vkUser?.photo_200 || vkUser?.photo || '/assets/images/avatars/панда.webp';

    const [state, setState] = useState<'SEARCHING' | 'FOUND'>('SEARCHING');
    const [seconds, setSeconds] = useState(0);
    const [searchRange, setSearchRange] = useState(50);

    // Данные оппонента
    const [opponent, setOpponent] = useState<{
        id: string;
        name: string;
        rating: number;
        heroImage: string;
        rankIcon: string;
        level: number;
        stats: { hp: number; attack: number; defense: number; speed: number; crit: number };
    } | null>(null);

    const playerHero = getHeroConfig(selectedHeroId);
    const playerRank = getRankInfo(rating);

    useEffect(() => {
        if (state !== 'SEARCHING') return;

        const interval = setInterval(() => {
            setSeconds((s) => {
                const nextSec = s + 1;
                if (nextSec % 2 === 0) {
                    setSearchRange((r) => r + 100);
                }
                return nextSec;
            });
        }, 1000);

        const searchTime = 4500 + Math.random() * 1500;
        const timeout = setTimeout(() => {
            const oppRating = Math.max(0, rating + Math.floor(Math.random() * 110) - 50);
            const oppRankInfo = getRankInfo(oppRating);

            // Select random opponent from HEROES_DB instead of MOBS_DB
            const randomHero = HEROES_DB[Math.floor(Math.random() * HEROES_DB.length)] || HEROES_DB[0];
            
            const randomNames = [
                'Дикий Клык', 'Гром-Орк', 'Рыцарь Света', 'Мастер Дзен',
                'Храбрый Панда', 'Воин Зари', 'Стальной Щит', 'Быстрая Стрела'
            ];
            const oppName = randomNames[Math.floor(Math.random() * randomNames.length)];

            const calculatedStats = getCalculatedStats(randomHero.id)?.total || {
                hp: randomHero.stats.stamina * 20,
                attack: randomHero.stats.strength * 2,
                defense: randomHero.stats.agility * 1,
                speed: 1.0,
                crit: 0.05
            };

            const oppLevel = Math.max(1, level + Math.floor(Math.random() * 3) - 1);

            setOpponent({
                id: randomHero.id,
                name: oppName,
                rating: oppRating,
                heroImage: randomHero.image,
                rankIcon: oppRankInfo.icon,
                level: oppLevel,
                stats: {
                    hp: calculatedStats.hp,
                    attack: calculatedStats.attack,
                    defense: calculatedStats.defense,
                    speed: calculatedStats.speed || 1.0,
                    crit: calculatedStats.critChance || 0.05
                },
            });

            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
            audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);
            setState('FOUND');
        }, searchTime);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [state, rating, selectedHeroId, getCalculatedStats]);

    const onFoundRef = React.useRef(onFound);
    useEffect(() => {
        onFoundRef.current = onFound;
    }, [onFound]);

    const playerStats = getCalculatedStats(selectedHeroId)?.total || {
        hp: 100,
        attack: 10,
        defense: 5,
        speed: 1.0,
        crit: 0.1,
    };

    let forecast = 50;
    if (opponent) {
        const pScore = playerStats.hp + playerStats.attack * 10 + playerStats.defense * 10;
        const eScore = opponent.stats.hp + opponent.stats.attack * 10 + opponent.stats.defense * 10;
        forecast = Math.max(5, Math.min(95, Math.round((pScore / (pScore + eScore)) * 100)));
    }

    const renderStatRow = (label: string, pVal: number, eVal: number, maxVal: number) => {
        const pPct = Math.min(100, Math.max(0, (pVal / maxVal) * 100));
        const ePct = Math.min(100, Math.max(0, (eVal / maxVal) * 100));
        const pColor = pVal >= eVal ? '#22c55e' : '#a8a29e';
        const eColor = eVal >= pVal ? '#ef4444' : '#a8a29e';

        return (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '15px' }} key={label}>
                <div style={{ width: '40px', textAlign: 'right', color: pColor, fontWeight: 'bold' }}>
                    {Math.round(pVal)}
                </div>
                <div
                    style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ width: `${pPct}%`, height: '100%', background: pColor, borderRadius: '4px' }} />
                </div>
                <div
                    style={{
                        width: '120px',
                        textAlign: 'center',
                        color: '#fef3c7',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        fontFamily: "'Montserrat', sans-serif",
                        letterSpacing: '1px',
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ width: `${ePct}%`, height: '100%', background: eColor, borderRadius: '4px' }} />
                </div>
                <div style={{ width: '40px', textAlign: 'left', color: eColor, fontWeight: 'bold' }}>
                    {Math.round(eVal)}
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${AssetsMap.BACKGROUNDS.RANKED_LOBBY})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4000,
                pointerEvents: 'auto',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: state === 'SEARCHING' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.05)',
                    backdropFilter: state === 'SEARCHING' ? 'blur(4px)' : 'none',
                    transition: 'all 0.8s ease-in-out',
                    zIndex: 0,
                }}
            />
            <AnimatePresence mode="wait">
                {state === 'SEARCHING' ? (
                    <MatchmakingSearching
                        playerAvatarSrc={playerAvatarSrc}
                        vipLevel={vipLevel}
                        playerRank={playerRank}
                        playerName={playerName}
                        playerHero={playerHero}
                        level={level}
                        rating={rating}
                        seconds={seconds}
                        searchRange={searchRange}
                        onCancel={onCancel}
                    />
                ) : (
                    opponent && (
                        <MatchmakingFound
                            opponent={opponent}
                            playerHero={playerHero}
                            playerName={playerName}
                            vipLevel={vipLevel}
                            playerRank={playerRank}
                            rating={rating}
                            level={level}
                            playerStats={playerStats}
                            forecast={forecast}
                            shouldFlipEnemy={shouldFlipEnemy}
                            renderStatRow={renderStatRow}
                            onCancel={onCancel}
                            onStartFight={() => onFoundRef.current(opponent.id)}
                        />
                    )
                )}
            </AnimatePresence>
        </div>
    );
};
