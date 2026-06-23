import React from 'react';
import gsap from 'gsap';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';

export interface AnimatingXPBarProps {
    label: string;
    startLevel: number;
    endLevel: number;
    startExp: number;
    endExp: number;
    xpEarned: number;
    getExpNeededFunc: (lvl: number) => number;
    icon: React.ReactNode;
    barColor: string;
    glowColor: string;
    textColor: string;
}

export const AnimatingXPBar: React.FC<AnimatingXPBarProps> = ({
    label,
    startLevel,
    endLevel,
    startExp,
    endExp,
    xpEarned,
    getExpNeededFunc,
    icon,
    barColor,
    glowColor,
    textColor,
}) => {
    const startTotal = React.useMemo(() => {
        let total = startExp;
        for (let l = 1; l < startLevel; l++) {
            total += getExpNeededFunc(l);
        }
        return total;
    }, [startLevel, startExp, getExpNeededFunc]);

    const endTotal = React.useMemo(() => {
        let total = endExp;
        for (let l = 1; l < endLevel; l++) {
            total += getExpNeededFunc(l);
        }
        return total;
    }, [endLevel, endExp, getExpNeededFunc]);

    const getLevelAndExpFromTotal = React.useCallback(
        (totalXP: number) => {
            let l = 1;
            let remaining = totalXP;
            let needed = getExpNeededFunc(l);
            while (remaining >= needed) {
                remaining -= needed;
                l++;
                needed = getExpNeededFunc(l);
            }
            return { level: l, exp: remaining, maxExp: needed };
        },
        [getExpNeededFunc]
    );

    const [displayLevel, setDisplayLevel] = React.useState(startLevel);
    const [displayExp, setDisplayExp] = React.useState(startExp);
    const [displayMaxExp, setDisplayMaxExp] = React.useState(getExpNeededFunc(startLevel));
    
    const [isLevelUp, setIsLevelUp] = React.useState(false);
    const levelRef = React.useRef(startLevel);

    React.useEffect(() => {
        const obj = { value: startTotal };
        const duration = Math.min(2.2, Math.max(1.2, (endTotal - startTotal) / 180));
        const tween = gsap.to(obj, {
            value: endTotal,
            duration: duration,
            ease: 'power2.out',
            delay: 1.2,
            onUpdate: () => {
                const { level: currentLvl, exp: currentXp, maxExp: currentMax } = getLevelAndExpFromTotal(obj.value);
                setDisplayLevel(currentLvl);
                setDisplayExp(Math.round(currentXp));
                setDisplayMaxExp(currentMax);
                
                if (currentLvl > levelRef.current) {
                    levelRef.current = currentLvl;
                    setIsLevelUp(true);
                    audioService.playSFX(AssetsMap.AUDIO.SFX_LEVEL_UP);
                    setTimeout(() => setIsLevelUp(false), 800);
                }
            },
        });

        return () => {
            tween.kill();
        };
    }, [startTotal, endTotal, getLevelAndExpFromTotal]);

    const progressPercent = Math.min(100, (displayExp / displayMaxExp) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon}
                    <span
                        style={{
                            color: textColor,
                            fontSize: '14px',
                            fontWeight: 800,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.5px',
                            transition: 'transform 0.2s',
                            transform: isLevelUp ? 'scale(1.2)' : 'scale(1)',
                            display: 'inline-block',
                        }}
                    >
                        {label}: {displayLevel}
                    </span>
                    {isLevelUp && (
                        <span
                            style={{
                                color: '#10b981',
                                fontSize: '12px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                                marginLeft: '8px',
                                textShadow: '0 0 8px rgba(16,185,129,0.6)',
                            }}
                        >
                            УРОВЕНЬ ПОВЫШЕН!
                        </span>
                    )}
                </div>
                <span
                    style={{
                        color: '#d1d5db',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '0.5px',
                    }}
                >
                    +{xpEarned} XP ({displayExp}/{displayMaxExp} XP)
                </span>
            </div>

            <div
                style={{
                    height: '14px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '7px',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: barColor,
                        borderRadius: '7px',
                        boxShadow: `0 0 12px ${glowColor}`,
                        transition: 'width 0.05s linear',
                    }}
                />
                
                {progressPercent > 0 && progressPercent < 100 && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `calc(${progressPercent}% - 6px)`,
                            top: 0,
                            width: '12px',
                            height: '100%',
                            background: '#ffffff',
                            opacity: 0.8,
                            filter: `blur(2px) drop-shadow(0 0 6px ${glowColor})`,
                            borderRadius: '50%',
                        }}
                    />
                )}
            </div>
        </div>
    );
};
