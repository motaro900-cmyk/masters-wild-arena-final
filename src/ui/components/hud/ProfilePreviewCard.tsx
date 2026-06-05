import React from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';
import { getAvatarFrameStyle, getAvatarFramePath, getAvatarImageStyle } from '../../../configs/ProfileCustomization';

interface ProfilePreviewCardProps {
    level: number;
    vipLevel: number;
    trophies: number;
    title: string;
    frame: string;
    name: string;
    playerAvatar: string;
    vkUser: any;
}

export const ProfilePreviewCard: React.FC<ProfilePreviewCardProps> = ({
    level,
    vipLevel,
    trophies,
    title,
    frame,
    name,
    playerAvatar,
    vkUser,
}) => {
    const activeFrameStyle = getAvatarFrameStyle(frame);

    const colors = {
        accent: '#f5d37a',
    };

    return (
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
                flexShrink: 0,
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
                    textAlign: 'center',
                }}
            >
                ВАША ВИЗИТКА
            </div>

            {/* АВАТАР И РАМКА */}
            <div
                style={{
                    position: 'relative',
                    width: '170px',
                    height: '170px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: '114px',
                        height: '114px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        position: 'relative',
                        transform: 'translateY(1px)',
                    }}
                >
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
                            pointerEvents: 'none',
                        }}
                    />
                )}

                <img
                    src={getAvatarFramePath(frame)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 20,
                        transition: 'all 0.3s',
                    }}
                    alt="preview frame"
                />

                {/* LVL BADGE */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '118px',
                        width: '42px',
                        height: '42px',
                        zIndex: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
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
                        width: '100%',
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
                        textAlign: 'center',
                    }}
                >
                    {title || 'Странник'}
                </div>
            </div>

            {/* РАЗДЕЛИТЕЛЬНАЯ ЛИНИЯ */}
            <div
                style={{
                    height: '1px',
                    width: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(240, 192, 64, 0.45), transparent)',
                }}
            />

            {/* ХАРАКТЕРИСТИКИ / СТАТИСТИКА ПРОФИЛЯ */}
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    gap: '10px',
                }}
            >
                {/* КУБКИ СПРАЙТ + ТЕКСТ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                        src={AssetsMap.UI.TROPHY_PREMIUM}
                        style={{
                            width: '42px',
                            height: '42px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
                        }}
                        alt="trophies count"
                    />
                    <span
                        style={{
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: '24px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                        }}
                    >
                        {trophies}
                    </span>
                </div>

                {/* VIP ПЛАШКА С НАЛОЖЕНИЕМ ТЕКСТА */}
                <div
                    style={{
                        position: 'relative',
                        width: '108px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <img
                        src={AssetsMap.UI.VIP_PLAQUE}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter:
                                vipLevel > 0
                                    ? 'drop-shadow(0 2px 6px rgba(240, 192, 64, 0.6))'
                                    : 'grayscale(1) opacity(0.5)',
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
                            marginTop: '-1px',
                        }}
                    >
                        {vipLevel > 0 ? 'VIP' : 'БЕЗ VIP'}
                    </span>
                </div>
            </div>
        </div>
    );
};
