import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';
import { getAvatarFrameStyle, getAvatarFramePath, getAvatarImageStyle } from '../../../../configs/ProfileCustomization';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { resolveAssetPath } from '../../../../utils/assetPath';

interface MatchmakingSearchingProps {
    playerAvatarSrc: string;
    vipLevel: number;
    playerRank: any;
    playerName: string;
    playerHero: any;
    level: number;
    rating: number;
    seconds: number;
    searchRange: number;
    onCancel: () => void;
}

export const MatchmakingSearching: React.FC<MatchmakingSearchingProps> = ({
    playerAvatarSrc,
    vipLevel,
    playerRank,
    playerName,
    playerHero,
    level,
    rating,
    seconds,
    searchRange,
    onCancel,
}) => {
    const frame = useGameStore(state => state.frame);
    const activeFrameStyle = getAvatarFrameStyle(frame);

    return (
        <motion.div
            key="searching-lobby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '580px',
                height: '580px',
                position: 'relative',
                zIndex: 1,
                background: 'linear-gradient(135deg, rgba(26, 17, 8, 0.75) 0%, rgba(10, 5, 2, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: 'none',
                borderRadius: '32px',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), inset 0 0 25px rgba(255, 255, 255, 0.04)',
                padding: '40px',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '0px',
                }}
            >
                {/* Анимированный Круг Поиска / Радар */}
                <div
                    style={{
                        position: 'relative',
                        width: '160px',
                        height: '160px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <motion.div
                        animate={{
                            scale: [1, 2.2],
                            opacity: [0.7, 0],
                        }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            width: '120px',
                            height: '120px',
                            border: '3px solid #fbbf24',
                            borderRadius: '50%',
                            boxShadow: '0 0 25px rgba(251, 191, 36, 0.4)',
                        }}
                    />
                    <motion.div
                        animate={{
                            rotate: 360,
                        }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                        style={{
                            position: 'absolute',
                            width: '138px',
                            height: '138px',
                            border: '2px dashed rgba(251, 191, 36, 0.3)',
                            borderRadius: '50%',
                        }}
                    />

                    {/* Контейнер Аватара с маской круглого фото */}
                    <div
                        style={{
                            width: '108px',
                            height: '108px',
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
                            src={playerAvatarSrc}
                            style={getAvatarImageStyle(playerAvatarSrc || '')}
                            alt="Player Avatar"
                        />
                    </div>

                    {/* VIP / Custom Аура вокруг аватара */}
                    {activeFrameStyle.glowClass ? (
                        <div
                            className={activeFrameStyle.glowClass}
                            style={{
                                position: 'absolute',
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                transform: 'translateY(1px)',
                                pointerEvents: 'none',
                                zIndex: 15,
                            }}
                        />
                    ) : (
                        vipLevel > 0 && (
                            <div
                                className="vip-avatar-glow"
                                style={{
                                    position: 'absolute',
                                    width: '110px',
                                    height: '110px',
                                    borderRadius: '50%',
                                    transform: 'translateY(1px)',
                                    pointerEvents: 'none',
                                    zIndex: 15,
                                }}
                            />
                        )
                    )}

                    {/* Золотая рамка поверх аватара */}
                    <img
                        src={getAvatarFramePath(frame)}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '160px',
                            height: '160px',
                            pointerEvents: 'none',
                            zIndex: 20,
                        }}
                        alt="Frame"
                    />

                    {/* Иконка Ранга снизу справа */}
                    <img
                        src={playerRank.icon}
                        style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            width: '45px',
                            height: '45px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))',
                            zIndex: 30,
                        }}
                        alt="Rank"
                    />
                </div>

                {/* Информация о текущей лиге игрока */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '4px',
                    }}
                >
                    <span
                        style={{
                            color: '#fff',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '28px',
                            fontWeight: 900,
                            letterSpacing: '3px',
                            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
                        }}
                    >
                        {playerName}
                    </span>
                    {vipLevel > 0 && (
                        <span
                            style={{
                                backgroundImage: 'url(/assets/images/ui/vip.webp)',
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                width: '45px',
                                height: '18px',
                                color: '#fff',
                                fontSize: '9px',
                                fontWeight: 900,
                                letterSpacing: '0.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                            }}
                        >
                            VIP
                        </span>
                    )}
                </div>
                <div
                    style={{
                        color: '#fef3c7',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '15px',
                        fontWeight: 700,
                        marginBottom: '8px',
                        opacity: 0.9,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                >
                    {playerHero.name} • Уровень {level}
                </div>
                <div
                    style={{
                        color: '#e2e8f0',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '16px',
                        fontWeight: 700,
                        marginBottom: '24px',
                        opacity: 0.9,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    <span style={{ color: '#fbbf24', textShadow: '0 0 8px rgba(251, 191, 36, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {rating}
                        <img
                            src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)}
                            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                            alt="trophy"
                        />
                    </span>{' '}
                    • {playerRank.name}
                </div>

                {/* Статус поиска */}
                <div
                    style={{
                        color: '#fbbf24',
                        fontSize: '24px',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '2px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textShadow: '0 0 12px rgba(251, 191, 36, 0.4)',
                    }}
                >
                    ПОИСК СОПЕРНИКА
                    <span style={{ display: 'flex', gap: '4px', position: 'relative', top: '-2px' }}>
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                        >
                            .
                        </motion.span>
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
                        >
                            .
                        </motion.span>
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
                        >
                            .
                        </motion.span>
                    </span>
                </div>

                {/* Подробности алгоритма */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        padding: '14px 28px',
                        borderRadius: '16px',
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        marginBottom: '30px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    }}
                >
                    <div
                        style={{
                            color: '#e2e8f0',
                            fontSize: '14px',
                            fontWeight: 700,
                            fontFamily: "'Montserrat', sans-serif",
                        }}
                    >
                        ВРЕМЯ В ОЧЕРЕДИ:{' '}
                        <span style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 900 }}>
                            {Math.floor(seconds / 60)
                                .toString()
                                .padStart(2, '0')}
                            :{(seconds % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                    <div
                        style={{
                            color: '#fef3c7',
                            fontSize: '13px',
                            fontWeight: 700,
                            fontFamily: "'Montserrat', sans-serif",
                        }}
                    >
                        ДИАПАЗОН КУБКОВ:{' '}
                        <span style={{ color: '#fbbf24', fontWeight: 900 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'bottom' }}>
                                {Math.max(0, rating - searchRange)} - {rating + searchRange}
                                <img
                                    src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)}
                                    style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                    alt="trophy"
                                />
                            </span>
                        </span>
                    </div>
                </div>

                {/* Кнопка отмены */}
                <motion.button
                    whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    style={{
                        padding: '14px 44px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#94a3b8',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '16px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        transition: 'all 0.2s',
                    }}
                >
                    ОТМЕНИТЬ ПОИСК
                </motion.button>
            </div>
        </motion.div>
    );
};
