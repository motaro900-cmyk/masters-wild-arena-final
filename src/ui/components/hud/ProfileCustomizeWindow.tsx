import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { Lock, Check } from 'lucide-react';
import { 
    AVATARS,
    AVATAR_FRAMES, 
    TITLES, 
    isAvatarUnlocked,
    isFrameUnlocked, 
    isTitleUnlocked, 
    getAvatarFrameStyle,
    getAvatarFramePath,
    getAvatarImageStyle
} from '../../../configs/ProfileCustomization';

interface ProfileCustomizeWindowProps {
    onClose: () => void;
}

export const ProfileCustomizeWindow: React.FC<ProfileCustomizeWindowProps> = ({ onClose }) => {
    const { 
        level, 
        vipLevel, 
        trophies, 
        title: playerTitle, 
        frame: playerFrame, 
        name, 
        avatar: playerAvatar, 
        vkUser,
        setFrame,
        setTitle,
        setAvatar
    } = useGameStore();

    // Tab state: 'AVATARS' | 'FRAMES' | 'TITLES'
    const [activeTab, setActiveTab] = useState<'AVATARS' | 'FRAMES' | 'TITLES'>('AVATARS');

    const handleSelectAvatar = (avatarPath: string, unlocked: boolean) => {
        if (!unlocked) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR || AssetsMap.AUDIO.SFX_CLICK);
            return;
        }
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        setAvatar(avatarPath);
    };

    const handleSelectFrame = (frameId: string, unlocked: boolean) => {
        if (!unlocked) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR || AssetsMap.AUDIO.SFX_CLICK);
            return;
        }
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        setFrame(frameId);
    };

    const handleSelectTitle = (titleName: string, unlocked: boolean) => {
        if (!unlocked) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR || AssetsMap.AUDIO.SFX_CLICK);
            return;
        }
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        setTitle(titleName);
    };

    const activeFrameStyle = getAvatarFrameStyle(playerFrame);
    
    // Resolve VK avatar photo if available
    const vkPhoto = vkUser?.photo_200 || vkUser?.photo || null;
    const isUsingVkAvatar = playerAvatar && playerAvatar.startsWith('http');

    const colors = {
        text: '#f2e8c9', 
        textDim: '#eedfa0', 
        accent: '#f5d37a', 
        accentLight: '#ffeaad', 
        cardBg: 'rgba(25, 12, 5, 0.55)', 
        cardBorder: 'rgba(240, 192, 64, 0.22)',
        unlockedText: '#4ade80',
        lockedText: '#f87171',
        lockedBg: 'rgba(239, 68, 68, 0.12)',
        lockedBorder: 'rgba(239, 68, 68, 0.25)',
    };

    return (
        <div 
            style={{ 
                height: '630px',
                display: 'flex',
                gap: '28px',
                padding: '24px',
                color: colors.text,
                fontFamily: "'Philosopher', 'Cinzel', sans-serif",
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
        >
            {/* ЛЕВАЯ КОЛОНКА: ПРЕВЬЮ ПЕРСОНАЖА */}
            <div 
                style={{
                    width: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(180deg, rgba(40, 24, 12, 0.8) 0%, rgba(18, 10, 5, 0.95) 100%)',
                    border: '2px solid rgba(240, 192, 64, 0.45)',
                    borderRadius: '20px',
                    padding: '28px 24px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75), inset 0 0 25px rgba(240, 192, 64, 0.08)',
                    boxSizing: 'border-box',
                    flexShrink: 0
                }}
            >
                <div 
                    style={{ 
                        fontFamily: "'Cinzel', serif",
                        fontSize: '16px', 
                        fontWeight: 900, 
                        color: colors.accent, 
                        letterSpacing: '2.5px',
                        textTransform: 'uppercase',
                        textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                        textAlign: 'center'
                    }}
                >
                    ВАША ВИЗИТКА
                </div>

                {/* АВАТАР И РАМКА */}
                <div style={{ position: 'relative', width: '170px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '114px', height: '114px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, position: 'relative', transform: 'translateY(1px)' }}>
                        <img
                            src={
                                playerAvatar && !playerAvatar.startsWith('sprite:')
                                    ? playerAvatar
                                    : vkUser?.photo_200 || vkUser?.photo || '/assets/images/avatars/panda.webp'
                            }
                            style={getAvatarImageStyle(playerAvatar || '')}
                            alt="preview avatar"
                        />
                    </div>

                    {/* Aura Glow Effect */}
                    {activeFrameStyle.glowClass && (
                        <div 
                            className={activeFrameStyle.glowClass}
                            style={{
                                width: '116px',
                                height: '116px',
                                borderRadius: '50%',
                                position: 'absolute',
                                zIndex: 15,
                                transform: 'translateY(1px)',
                                pointerEvents: 'none'
                            }}
                        />
                    )}

                    <img
                        src={getAvatarFramePath(playerFrame)}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 20,
                            transition: 'all 0.3s'
                        }}
                        alt="preview frame"
                    />

                    {/* LVL BADGE */}
                    <div style={{ position: 'absolute', bottom: '8px', left: '118px', width: '42px', height: '42px', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src={AssetsMap.UI.LVL_BADGE}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                            alt="lvl-bg"
                        />
                        <span
                            style={{
                                position: 'relative',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '16px',
                                fontWeight: 900,
                                color: '#fff',
                                textShadow: '0 2px 4px rgba(0,0,0,1)',
                                zIndex: 1,
                                marginTop: '-1px',
                            }}
                        >
                            {level}
                        </span>
                    </div>
                </div>

                {/* Имя и Титул */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <div 
                        style={{ 
                            fontSize: '25px', 
                            fontWeight: 900, 
                            color: '#fff', 
                            letterSpacing: '1px',
                            textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'center',
                            width: '100%'
                        }}
                    >
                        {name || 'Мастер'}
                    </div>
                    <div 
                        style={{ 
                            fontSize: '15px', 
                            color: colors.accent, 
                            fontWeight: 700, 
                            fontStyle: 'italic',
                            letterSpacing: '1px',
                            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                            textAlign: 'center'
                        }}
                    >
                        {playerTitle || 'Странник'}
                    </div>
                </div>

                {/* РАЗДЕЛИТЕЛЬНАЯ ЛИНИЯ */}
                <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, transparent, rgba(240, 192, 64, 0.45), transparent)' }} />

                {/* ХАРАКТЕРИСТИКИ / СТАТИСТИКА ПРОФИЛЯ */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '10px' }}>
                    {/* КУБКИ СПРАЙТ + ТЕКСТ */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                            src={AssetsMap.UI.TROPHY_PREMIUM} 
                            style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }} 
                            alt="trophies count" 
                        />
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: '24px', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{trophies}</span>
                    </div>

                    {/* VIP ПЛАШКА С НАЛОЖЕНИЕМ ТЕКСТА */}
                    <div style={{ position: 'relative', width: '108px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                            src={AssetsMap.UI.VIP_PLAQUE} 
                            style={{ 
                                position: 'absolute', 
                                inset: 0, 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain',
                                filter: vipLevel > 0 ? 'drop-shadow(0 2px 6px rgba(240, 192, 64, 0.6))' : 'grayscale(1) opacity(0.5)'
                            }} 
                            alt="vip badge" 
                        />
                        <span 
                            style={{ 
                                position: 'relative', 
                                zIndex: 1, 
                                fontFamily: "'Cinzel', serif", 
                                fontSize: vipLevel > 0 ? '16px' : '11px', 
                                fontWeight: 900, 
                                color: vipLevel > 0 ? '#fff' : '#ccc', 
                                textShadow: '0 2px 4px rgba(0,0,0,1)',
                                marginTop: '-1px'
                            }}
                        >
                            {vipLevel > 0 ? 'VIP' : 'БЕЗ VIP'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ПРАВАЯ КОЛОНКА: ВКЛАДКИ И ВЫБОР */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* ТАБ-НАВИГАЦИЯ */}
                <div 
                    style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        marginBottom: '16px',
                        borderBottom: '1px solid rgba(240, 192, 64, 0.2)',
                        paddingBottom: '8px'
                    }}
                >
                    {(['AVATARS', 'FRAMES', 'TITLES'] as const).map((tab) => {
                        const tabLabel = tab === 'AVATARS' ? 'Аватары' : tab === 'FRAMES' ? 'Рамки аватара' : 'Титулы и ранги';
                        const isActive = activeTab === tab;

                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    setActiveTab(tab);
                                }}
                                style={{
                                    background: isActive ? 'rgba(240, 192, 64, 0.15)' : 'transparent',
                                    border: isActive ? '1px solid rgba(240, 192, 64, 0.4)' : '1px solid transparent',
                                    color: isActive ? '#fff' : colors.text,
                                    padding: '10px 18px',
                                    fontSize: '14px',
                                    fontWeight: 900,
                                    letterSpacing: '1.2px',
                                    fontFamily: "'Cinzel', serif",
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                            >
                                {tabLabel}
                            </button>
                        );
                    })}
                </div>

                {/* СПИСОК ЭЛЕМЕНТОВ (SCROLLABLE - 3 COLUMNS) */}
                <div 
                    className="leaderboard-scroll"
                    style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        paddingRight: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}
                >
                    {activeTab === 'AVATARS' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                            {/* VK Avatar Option */}
                            {vkPhoto && (
                                <div
                                    onClick={() => handleSelectAvatar(vkPhoto, true)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        padding: '16px',
                                        borderRadius: '14px',
                                        background: isUsingVkAvatar ? 'rgba(240, 192, 64, 0.14)' : colors.cardBg,
                                        border: isUsingVkAvatar ? '1.5px solid rgba(240, 192, 64, 0.75)' : `1px solid ${colors.cardBorder}`,
                                        cursor: 'pointer',
                                        boxShadow: isUsingVkAvatar ? '0 0 20px rgba(240, 192, 64, 0.2)' : 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#000' }}>
                                            <img
                                                src={vkPhoto}
                                                style={getAvatarImageStyle(vkPhoto)}
                                                alt="VK Avatar Mini"
                                            />
                                        </div>
                                        <img
                                            src={getAvatarFramePath(playerFrame)}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                pointerEvents: 'none'
                                            }}
                                            alt="mini frame"
                                        />
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 900, color: isUsingVkAvatar ? '#fff' : colors.accent, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        Аватар ВК
                                        {isUsingVkAvatar && (
                                            <span style={{ fontSize: '9px', background: colors.accent, color: '#1a1005', padding: '1px 5px', borderRadius: '4px', fontWeight: 900, textTransform: 'uppercase' }}>
                                                Экип
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: colors.textDim, marginTop: '6px', lineHeight: '1.4' }}>
                                        Ваш аватар социальной сети ВКонтакте.
                                    </div>
                                </div>
                            )}

                            {/* Standard Avatars */}
                            {AVATARS.map((a) => {
                                const unlocked = isAvatarUnlocked(a, level, vipLevel);
                                const active = playerAvatar === a.path;

                                return (
                                    <div
                                        key={a.id}
                                        onClick={() => handleSelectAvatar(a.path, unlocked)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            padding: '16px',
                                            borderRadius: '14px',
                                            background: active ? 'rgba(240, 192, 64, 0.14)' : colors.cardBg,
                                            border: active ? '1.5px solid rgba(240, 192, 64, 0.75)' : `1px solid ${colors.cardBorder}`,
                                            cursor: unlocked ? 'pointer' : 'not-allowed',
                                            opacity: unlocked ? 1 : 0.7,
                                            boxShadow: active ? '0 0 20px rgba(240, 192, 64, 0.2)' : 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {/* Avatar Mini Preview */}
                                        <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#000' }}>
                                                <img
                                                    src={a.path}
                                                    style={getAvatarImageStyle(a.path)}
                                                    alt={a.name}
                                                />
                                            </div>
                                            <img
                                                src={getAvatarFramePath(playerFrame)}
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    pointerEvents: 'none'
                                                }}
                                                alt="mini frame"
                                            />
                                        </div>

                                        {/* Avatar Text Info */}
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: active ? '#fff' : colors.accent, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                            {a.name}
                                            {active && (
                                                <span style={{ fontSize: '9px', background: colors.accent, color: '#1a1005', padding: '1px 5px', borderRadius: '4px', fontWeight: 900, textTransform: 'uppercase' }}>
                                                    Экип
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '12px', color: colors.textDim, marginTop: '6px', lineHeight: '1.4' }}>
                                            {a.description}
                                        </div>
                                        {!unlocked && (
                                            <div 
                                                style={{ 
                                                    fontSize: '11px', 
                                                    color: colors.lockedText, 
                                                    marginTop: '10px', 
                                                    fontWeight: 800, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    background: colors.lockedBg,
                                                    border: `1px solid ${colors.lockedBorder}`,
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    width: 'fit-content'
                                                }}
                                            >
                                                <Lock size={12} />
                                                <span>
                                                    {a.requiredLevel && `Ур. ${a.requiredLevel}`}
                                                    {a.requiredVip && `VIP ${a.requiredVip}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'FRAMES' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                            {AVATAR_FRAMES.map((f) => {
                                const unlocked = isFrameUnlocked(f, level, vipLevel, playerTitle);
                                const active = playerFrame === f.id;

                                return (
                                    <div
                                        key={f.id}
                                        onClick={() => handleSelectFrame(f.id, unlocked)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            padding: '16px',
                                            borderRadius: '14px',
                                            background: active ? 'rgba(240, 192, 64, 0.14)' : colors.cardBg,
                                            border: active ? '1.5px solid rgba(240, 192, 64, 0.75)' : `1px solid ${colors.cardBorder}`,
                                            cursor: unlocked ? 'pointer' : 'not-allowed',
                                            opacity: unlocked ? 1 : 0.7,
                                            boxShadow: active ? '0 0 20px rgba(240, 192, 64, 0.2)' : 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {/* Frame Mini Preview */}
                                        <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#000' }}>
                                                <img
                                                    src={
                                                        playerAvatar && !playerAvatar.startsWith('sprite:') 
                                                            ? playerAvatar 
                                                            : vkUser?.photo_200 || vkUser?.photo || '/assets/images/avatars/panda.webp'
                                                    }
                                                    style={getAvatarImageStyle(playerAvatar || '')}
                                                    alt="mini avatar"
                                                />
                                            </div>
                                            <img
                                                src={f.path}
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    pointerEvents: 'none'
                                                }}
                                                alt="mini frame"
                                            />
                                        </div>

                                        {/* Frame Text Info */}
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: active ? '#fff' : colors.accent, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                            {f.name}
                                            {active && (
                                                <span style={{ fontSize: '9px', background: colors.accent, color: '#1a1005', padding: '1px 5px', borderRadius: '4px', fontWeight: 900, textTransform: 'uppercase' }}>
                                                    Экип
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '12px', color: colors.textDim, marginTop: '6px', lineHeight: '1.4' }}>
                                            {f.description}
                                        </div>
                                        {!unlocked && (
                                            <div 
                                                style={{ 
                                                    fontSize: '11px', 
                                                    color: colors.lockedText, 
                                                    marginTop: '10px', 
                                                    fontWeight: 800, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    background: colors.lockedBg,
                                                    border: `1px solid ${colors.lockedBorder}`,
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    width: 'fit-content'
                                                }}
                                            >
                                                <Lock size={12} />
                                                <span>
                                                    {f.requiredLevel && `Ур. ${f.requiredLevel}`}
                                                    {f.requiredVip && `VIP Ур. ${f.requiredVip}`}
                                                    {f.requiresTitle && `Титул "${f.requiresTitle}"`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'TITLES' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {TITLES.map((t) => {
                                const unlocked = isTitleUnlocked(t, level, vipLevel, trophies);
                                const active = playerTitle === t.name;

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => handleSelectTitle(t.name, unlocked)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px 24px',
                                            borderRadius: '14px',
                                            background: active ? 'rgba(240, 192, 64, 0.14)' : colors.cardBg,
                                            border: active ? '1.5px solid rgba(240, 192, 64, 0.75)' : `1px solid ${colors.cardBorder}`,
                                            cursor: unlocked ? 'pointer' : 'not-allowed',
                                            opacity: unlocked ? 1 : 0.7,
                                            boxShadow: active ? '0 0 20px rgba(240, 192, 64, 0.2)' : 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ fontSize: '17px', fontWeight: 900, color: active ? '#fff' : colors.accent, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {t.name}
                                                {active && <Check size={18} style={{ color: colors.accent }} />}
                                                {!unlocked && <Lock size={16} style={{ color: colors.lockedText }} />}
                                            </div>
                                            <div style={{ fontSize: '13px', color: colors.textDim }}>
                                                {t.description}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            {unlocked ? (
                                                <span style={{ fontSize: '13px', color: colors.unlockedText, fontWeight: 900 }}>Доступен</span>
                                            ) : (
                                                <div 
                                                    style={{ 
                                                        fontSize: '11px', 
                                                        color: colors.lockedText, 
                                                        fontWeight: 800, 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '4px',
                                                        background: colors.lockedBg,
                                                        border: `1px solid ${colors.lockedBorder}`,
                                                        padding: '4px 10px',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    <Lock size={12} />
                                                    <span>
                                                        {t.requiredLevel && `Ур. ${t.requiredLevel}`}
                                                        {t.requiredVip && `VIP ${t.requiredVip}`}
                                                        {t.requiredTrophies && `Кубки: ${t.requiredTrophies}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
