import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';
import '../../styles/profile-hub.css';
import { getAvatarFrameStyle, getAvatarFramePath, getAvatarImageStyle } from '../../../configs/ProfileCustomization';
export const ProfileHub: React.FC = () => {
    const { level, vipLevel, exp, vkUser, title, name, avatar, frame, glowEnabled, uiAnimations } = useGameStore(
        useShallow((state) => ({
            level: state.level,
            vipLevel: state.vipLevel,
            exp: state.exp,
            vkUser: state.vkUser,
            title: state.title,
            name: state.name,
            avatar: state.avatar,
            frame: state.frame,
            glowEnabled: state.glowEnabled,
            uiAnimations: state.uiAnimations,
        }))
    );
    const activeFrameStyle = getAvatarFrameStyle(frame);

    const getBadgeColor = (lvl: number) => {
        if (lvl >= 72) return 'from-[#8c6a3d] to-[#1a150f]'; // Эфир (Золотое сияние)
        if (lvl >= 64) return 'from-[#4a2a5d] to-[#120a1a]'; // Аметист
        if (lvl >= 56) return 'from-[#6d1a1a] to-[#1a0a0a]'; // Рубин
        if (lvl >= 48) return 'from-[#1a3a5d] to-[#0a121a]'; // Сапфир
        if (lvl >= 40) return 'from-[#1a4d2a] to-[#0a1a0d]'; // Изумруд
        if (lvl >= 32) return 'from-[#b38b3b] to-[#2d1f0a]'; // Золото
        if (lvl >= 24) return 'from-[#7a7a7a] to-[#1a1a1a]'; // Серебро
        if (lvl >= 16) return 'from-[#8c4a2a] to-[#2d150a]'; // Бронза
        if (lvl >= 8) return 'from-[#454d55] to-[#1a1c1e]'; // Железо
        return 'from-[#3d2b1f] to-[#1a0f0a]'; // Странник
    };

    const maxExp = level * 600;
    const expPct = Math.min(100, (exp / maxExp) * 100);

    const [showExpTooltip, setShowExpTooltip] = React.useState(false);
    const [isHoveredVIP, setIsHoveredVIP] = React.useState(false);

    React.useEffect(() => {
        if (exp >= maxExp) {
            useGameStore.getState().addExp(0);
        }
    }, [exp, maxExp]);

    return (
        <>
            <motion.div
                initial={uiAnimations ? { x: -220, opacity: 0 } : { x: 0, opacity: 1 }}
                animate={{ x: 0, opacity: 1 }}
                transition={uiAnimations ? undefined : { duration: 0 }}
                className="relative pointer-events-auto cursor-pointer"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    if ((window as any).setActiveHUDWindow) {
                        (window as any).setActiveHUDWindow('PROFILE_CUSTOMIZE');
                    }
                }}
                style={{
                    width: '465px',
                    height: '112px',
                    backgroundImage: `url(${AssetsMap.UI.PROFILE_PANEL_BASE})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                    filter: 'brightness(1.08) saturate(1.08)',
                    willChange: 'transform, opacity',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                }}
            >
                {/* АВАТАР И РАМКА */}
                <div className="absolute left-[-18px] top-[-20px] w-[160px] h-[160px] flex items-center justify-center">
                    <div
                        className="w-[108px] h-[108px] rounded-full overflow-hidden z-10 flex items-center justify-center relative translate-y-[1px]"
                        style={{ backgroundColor: '#000' }}
                    >
                        <img
                            src={
                                avatar && !avatar.startsWith('sprite:')
                                    ? avatar
                                    : vkUser?.photo_200 || vkUser?.photo || '/assets/images/avatars/panda.webp'
                            }
                            style={getAvatarImageStyle(avatar || '')}
                            alt="avatar"
                        />
                    </div>

                    {/* VIP / Custom Аура (Свечение) */}
                    {glowEnabled && (activeFrameStyle.glowClass ? (
                        <div
                            className={activeFrameStyle.glowClass}
                            style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                transform: 'translateY(1px)',
                                pointerEvents: 'none',
                            }}
                        />
                    ) : (
                        vipLevel > 0 && (
                            <div
                                className="vip-avatar-glow absolute z-15"
                                style={{
                                    width: '110px',
                                    height: '110px',
                                    borderRadius: '50%',
                                    transform: 'translateY(1px)',
                                    pointerEvents: 'none',
                                }}
                            />
                        )
                    ))}

                    <img
                        src={getAvatarFramePath(frame)}
                        className="absolute inset-0 w-full h-full pointer-events-none z-20 transition-all duration-300"
                        alt="frame"
                    />

                    {/* LVL BADGE */}
                    <div className="absolute bottom-[8px] left-[112px] w-[40px] h-[40px] z-30 flex items-center justify-center">
                        <div
                            className={`absolute inset-[4px] rounded-full bg-gradient-to-b ${getBadgeColor(level)} shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] border border-white/10`}
                        />

                        <img
                            src={AssetsMap.UI.LVL_BADGE}
                            className="absolute inset-0 w-full h-full object-contain"
                            alt="lvl-bg"
                        />
                        <span
                            style={{
                                position: 'relative',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '16px',
                                fontWeight: 900,
                                color: '#fff',
                                textShadow: '0 2px 5px rgba(0,0,0,1)',
                                zIndex: 1,
                                marginTop: '-1px',
                            }}
                        >
                            {level}
                        </span>
                    </div>
                </div>

                {/* VIP ПЛАШКА */}
                <button
                    className="absolute left-[345px] top-[10px] flex items-center justify-center group z-[101] outline-none bg-transparent border-none p-0 cursor-pointer"
                    style={{
                        width: '105px',
                        height: '38px',
                        willChange: 'transform',
                        transform: 'translate3d(0, 0, 0)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        if ((window as any).setActiveHUDWindow) {
                            (window as any).setActiveHUDWindow('VIP');
                        }
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onMouseEnter={() => setIsHoveredVIP(true)}
                    onMouseLeave={() => setIsHoveredVIP(false)}
                >
                    <img
                        src={AssetsMap.UI.VIP_PLAQUE}
                        className="absolute inset-0 w-full h-full object-contain transition-all duration-200"
                        style={{
                            willChange: 'filter',
                            filter:
                                vipLevel > 0
                                    ? 'drop-shadow(0 0 8px rgba(240, 192, 64, 0.6))'
                                    : isHoveredVIP
                                      ? 'grayscale(0) opacity(1) drop-shadow(0 0 8px rgba(240, 192, 64, 0.5))'
                                      : 'grayscale(1) brightness(0.95) contrast(1.1) opacity(0.85)',
                            transform: 'translate3d(0, 0, 0)',
                        }}
                        alt="vip"
                    />
                    <span
                        style={{
                            position: 'relative',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '16px',
                            fontWeight: 900,
                            color: vipLevel > 0 ? '#fff' : '#d0d0d0',
                            textShadow: '0 1px 3px rgba(0,0,0,1)',
                            zIndex: 1,
                        }}
                    >
                        VIP
                    </span>
                </button>

                {/* ИМЯ И ЗВАНИЕ */}
                <div className="absolute left-[140px] top-[15px] flex items-center gap-0">
                    <img
                        src={AssetsMap.UI.ICON_CROWN}
                        className="w-[40px] h-[40px] object-contain relative"
                        style={{
                            left: '0px',
                            top: '3px',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                        }}
                        alt="crown"
                    />
                    <div className="flex flex-col items-start" style={{ marginLeft: '5px' }}>
                        <div className="flex items-center gap-2">
                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '22px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    textShadow: '0 2px 4px rgba(0,0,0,1)',
                                    letterSpacing: '2px',
                                    lineHeight: '1.1',
                                }}
                            >
                                {name || 'Мастер'}
                            </span>
                        </div>
                        <span
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#ffd700',
                                textShadow: '0 1px 2px rgba(0,0,0,1)',
                                letterSpacing: '1px',
                                marginTop: '1px',
                            }}
                        >
                            {title || 'Странник'}
                        </span>
                    </div>
                </div>

                {/* ПОЛОСКА ОПЫТА */}
                <div
                    className="absolute left-[130px] bottom-[11px] w-[280px] h-[35px] flex items-center justify-center"
                    onMouseEnter={() => setShowExpTooltip(true)}
                    onMouseLeave={() => setShowExpTooltip(false)}
                >
                    <img
                        src={AssetsMap.UI.EXP_BAR_BG}
                        className="absolute inset-0 w-full h-full object-fill"
                        alt="exp-bg"
                    />

                    <div
                        className="absolute left-[15px] right-[20px] h-[22px] bg-black/50 rounded-full overflow-hidden border border-white/5"
                        style={{ top: '50%', transform: 'translateY(-50%)' }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${expPct}%` }}
                            style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #001144 0%, #0044bb 100%)',
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6), 0 0 15px rgba(0,30,120,0.4)',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '9999px',
                            }}
                        />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: '10px',
                                fontWeight: 900,
                                color: '#fff',
                                textShadow: '0 1px 3px #000',
                                letterSpacing: '1px',
                            }}
                        >
                            {exp} / {maxExp} XP
                        </span>
                    </div>

                    {/* Тултип Опыта */}
                    {showExpTooltip && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '120%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(10, 5, 2, 0.95)',
                                border: '1px solid #c8a870',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                zIndex: 1000,
                                whiteSpace: 'nowrap',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.8)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#f0c040',
                                }}
                            >
                                ОПЫТ ПРОФИЛЯ
                            </span>
                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '10px',
                                    fontWeight: 500,
                                    color: '#d0d0d0',
                                }}
                            >
                                До следующего уровня: {maxExp - exp} XP
                            </span>
                        </div>
                    )}
                </div>

                {/* КНОПКА НАСТРОЕК */}
                <button
                    id="profile-settings-btn"
                    className="absolute right-[15px] bottom-[8px] w-[50px] h-[50px] flex items-center justify-center cursor-pointer group z-[100] outline-none bg-transparent border-none p-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        if ((window as any).setActiveHUDWindow) {
                            (window as any).setActiveHUDWindow('PROFILE_CUSTOMIZE');
                        }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
                    <img
                        src={AssetsMap.UI.ICON_SETTINGS_PROFILE}
                        className="w-[34px] h-[34px] object-contain transition-all duration-300 group-hover:rotate-90 group-hover:scale-110 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]"
                        alt="settings"
                    />
                </button>
            </motion.div>
        </>
    );
};
