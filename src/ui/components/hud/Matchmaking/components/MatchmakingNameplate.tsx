import React from 'react';
import { getRankInfo } from '../../../../../configs/RankSystem';
import { AssetsMap } from '../../../../../configs/AssetsMap';

interface MatchmakingNameplateProps {
    // Данные игрока
    playerName: string;
    displayName: string;
    vipLevel: number;
    rating: number;
    level: number;
    title: string;
    playerRankName: string;
    playerWinRateStr: string;
    playerHeroName?: string; // Имя персонажа игрока

    // Данные противника
    opponentName: string;
    opponentRating: number;
    opponentLevel: number;
    opponentVipLevel?: number;
    opponentWinRateStr: string;
    opponentHeroName?: string; // Имя персонажа противника
}

/** Плашка (nameplate) одного из бойцов: заголовок "ВЫ" / "ВРАГ", ник, кубки, ранг, винрейт, уровень. */
const Nameplate: React.FC<{
    side: 'player' | 'opponent';
    displayName: string;
    vipLevel: number;
    rating: number;
    level: number;
    titleLine: string;
    winRateStr: string;
    rankColor: string;
    rankIcon: string;
    rankName: string;
    titleText: string;
}> = ({ side, displayName, vipLevel, rating, level, titleLine, winRateStr, rankColor, rankIcon, rankName, titleText }) => {
    const isPlayer = side === 'player';
    const accentColor = isPlayer ? 'rgba(240, 192, 64, 0.55)' : 'rgba(239, 68, 68, 0.55)';
    const bgGradient = isPlayer
        ? 'linear-gradient(135deg, rgba(12, 22, 42, 0.96) 0%, rgba(6, 10, 20, 0.98) 100%)'
        : 'linear-gradient(135deg, rgba(42, 12, 12, 0.96) 0%, rgba(20, 6, 6, 0.98) 100%)';
    const tabBg = isPlayer
        ? 'linear-gradient(180deg, #1e40af 0%, #1d4ed8 100%)'
        : 'linear-gradient(180deg, #991b1b 0%, #b91c1c 100%)';
    const tabBorder = isPlayer ? 'rgba(240, 192, 64, 0.5)' : 'rgba(220, 38, 38, 0.5)';
    const bottomBg = isPlayer ? 'rgba(8, 12, 22, 0.95)' : 'rgba(20, 6, 6, 0.95)';
    const bottomBorder = isPlayer ? 'rgba(240, 192, 64, 0.35)' : 'rgba(239, 68, 68, 0.35)';
    const shieldColor = isPlayer ? '#1d4ed8' : '#b91c1c';
    const posStyle: React.CSSProperties = isPlayer
        ? { top: '127px', left: 'calc(7% + 225px)' }
        : { top: '127px', right: 'calc(7% + 225px)' };

    return (
        <div
            style={{
                position: 'absolute',
                ...posStyle,
                width: '390px',
                height: '136px',
                background: bgGradient,
                border: `2px solid ${accentColor}`,
                borderRadius: '10px',
                boxShadow: `0 10px 30px rgba(0, 0, 0, 0.85), inset 0 0 15px ${accentColor.replace('0.55', '0.05')}`,
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'visible',
            }}
        >
            {/* Header Tab */}
            <div
                style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: tabBg,
                    border: `1.5px solid ${tabBorder}`,
                    borderRadius: '4px',
                    padding: '1px 20px',
                    color: '#fff',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '11px',
                    fontWeight: 'bold',
                    letterSpacing: '1.5px',
                    zIndex: 10,
                }}
            >
                {isPlayer ? 'ВЫ' : 'ВРАГ'}
            </div>

            {/* Nickname, VIP badge + Stats Grid */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    paddingTop: '16px',
                    gap: '4px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                        style={{
                            fontFamily: "'Georgia', serif",
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#fff',
                            textShadow: '0 2px 4px rgba(0,0,0,0.85)',
                            lineHeight: 1.1,
                        }}
                    >
                        {displayName} <span style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 'bold', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase' }}>• {titleText}</span>
                    </span>
                    {vipLevel > 0 && (
                        <div
                            style={{
                                backgroundImage: 'url(/assets/images/ui/vip.webp)',
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                width: '45px',
                                height: '18px',
                                color: '#fff',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                fontSize: '9px',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                                flexShrink: 0,
                            }}
                        >
                            VIP
                        </div>
                    )}
                </div>

                {/* Stats Grid: Кубки | Ранг | Винрейт */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        width: '100%',
                        padding: '0 12px',
                        marginTop: '4px',
                        gap: '6px',
                    }}
                >
                    {/* Кубки */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span
                            style={{
                                fontSize: '8px',
                                color: '#a3a3a3',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Кубки
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                            <img
                                src={AssetsMap.UI.TROPHY_PREMIUM}
                                style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                alt="cups"
                            />
                            <span
                                style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#fbbf24',
                                }}
                            >
                                {rating}
                            </span>
                        </div>
                    </div>

                    {/* Ранг */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            borderLeft: '1px solid rgba(255,255,255,0.08)',
                            borderRight: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '8px',
                                color: '#a3a3a3',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Ранг
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <img
                                src={rankIcon}
                                style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                                alt="rank"
                            />
                            <span
                                style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: rankColor,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2px',
                                }}
                            >
                                {rankName}
                            </span>
                        </div>
                    </div>

                    {/* Винрейт */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span
                            style={{
                                fontSize: '8px',
                                color: '#a3a3a3',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Винрейт
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                            <span
                                style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#10b981',
                                }}
                            >
                                {winRateStr}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar: level shield + title */}
            <div
                style={{
                    background: bottomBg,
                    borderTop: `1.5px solid ${bottomBorder}`,
                    borderBottomLeftRadius: '9px',
                    borderBottomRightRadius: '9px',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                }}
            >
                {/* Level Shield SVG */}
                <div
                    style={{
                        position: 'relative',
                        width: '16px',
                        height: '19px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <svg width="16" height="19" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M9 1L1 4V10C1 15.5 4.5 19.5 9 21C13.5 19.5 17 15.5 17 10V4L9 1Z"
                            fill={shieldColor}
                            stroke="#fbbf24"
                            strokeWidth="1.2"
                        />
                    </svg>
                    <span
                        style={{
                            position: 'absolute',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '9px',
                            fontWeight: 900,
                            color: '#fff',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            textShadow: '0 1px 2px #000',
                        }}
                    >
                        {level}
                    </span>
                </div>

                <span
                    style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '11px',
                        fontWeight: '900',
                        color: '#fbbf24',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                    }}
                >
                    {titleLine}
                </span>
            </div>
        </div>
    );
};

/** Обёртка — рендерит плашку игрока и противника */
export const MatchmakingNameplates: React.FC<MatchmakingNameplateProps> = ({
    playerName,
    displayName,
    vipLevel,
    rating,
    level,
    title,
    playerWinRateStr,
    playerHeroName = 'Панда',
    opponentName,
    opponentRating,
    opponentLevel,
    opponentVipLevel,
    opponentWinRateStr,
    opponentHeroName = 'Пантера',
}) => {
    const pRank = getRankInfo(rating);
    const eRank = getRankInfo(opponentRating);

    return (
        <>
            <Nameplate
                side="player"
                displayName={displayName || playerName || 'Мастер'}
                vipLevel={vipLevel}
                rating={rating}
                level={level}
                titleLine={`Уровень ${level} • ${playerHeroName}`}
                winRateStr={playerWinRateStr}
                rankColor={pRank.color}
                rankIcon={pRank.icon}
                rankName={pRank.name}
                titleText={title || pRank.name}
            />
            <Nameplate
                side="opponent"
                displayName={opponentName}
                vipLevel={opponentVipLevel ?? 0}
                rating={opponentRating}
                level={opponentLevel || 2}
                titleLine={`Уровень ${opponentLevel || 2} • ${opponentHeroName}`}
                winRateStr={opponentWinRateStr}
                rankColor={eRank.color}
                rankIcon={eRank.icon}
                rankName={eRank.name}
                titleText={eRank.name}
            />
        </>
    );
};
