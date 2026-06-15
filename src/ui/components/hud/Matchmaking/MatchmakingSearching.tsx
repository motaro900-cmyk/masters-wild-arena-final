import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';
import { getAvatarFrameStyle, getAvatarFramePath, getAvatarImageStyle } from '../../../../configs/ProfileCustomization';

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
                background: 'linear-gradient(135deg, rgba(26, 17, 8, 0.82) 0%, rgba(10, 5, 2, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(251, 191, 36, 0.35)',
                borderRadius: '32px',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(251, 191, 36, 0.1), inset 0 0 25px rgba(255, 255, 255, 0.04)',
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
                            key="searching-avatar-img"
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
                        key="searching-frame-img"
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
                        key="searching-rank-img"
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
                            textShadow: '0 2px 12px rgba(0, 0, 0, 0.95), 0 0 8px rgba(255, 255, 255, 0.1)',
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
                        fontSize: '16px',
                        fontWeight: 700,
                        marginBottom: '8px',
                        opacity: 0.95,
                        letterSpacing: '1px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                    }}
                >
                    {playerHero.name} • Уровень {level}
                </div>
                <div
                    style={{
                        color: '#ffd700',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '20px',
                        fontWeight: 900,
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textShadow: '0 2px 6px rgba(0,0,0,0.95)',
                    }}
                >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {rating}
                        <img
                            key="searching-trophy-rating"
                            src="/assets/images/ui/trophy_premium.webp"
                            style={{ width: '24px', height: '24px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
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
                        textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 15px rgba(251, 191, 36, 0.6)',
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
                        gap: '12px',
                        background: 'linear-gradient(180deg, rgba(20, 10, 5, 0.95) 0%, rgba(10, 5, 2, 0.98) 100%)',
                        padding: '18px 36px',
                        borderRadius: '16px',
                        border: '2px solid #b8860b',
                        marginBottom: '30px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.85), inset 0 0 15px rgba(184, 134, 11, 0.15)',
                    }}
                >
                    <div
                        style={{
                            color: '#c8a870',
                            fontSize: '15px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.5px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        ВРЕМЯ В ОЧЕРЕДИ:{' '}
                        <span style={{ color: '#ffd700', fontSize: '24px', fontWeight: 950, textShadow: '0 0 12px rgba(255, 215, 0, 0.5), 0 2px 4px rgba(0,0,0,0.9)' }}>
                            {Math.floor(seconds / 60)
                                .toString()
                                .padStart(2, '0')}
                            :{(seconds % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                    <div
                        style={{
                            color: '#c8a870',
                            fontSize: '15px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.5px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        ДИАПАЗОН КУБКОВ:{' '}
                        <span style={{ color: '#ffd700', fontWeight: 950, fontSize: '24px', textShadow: '0 0 12px rgba(255, 215, 0, 0.5), 0 2px 4px rgba(0,0,0,0.9)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', verticalAlign: 'middle' }}>
                                <span>
                                    {Math.max(0, rating - searchRange)} - {rating + searchRange}
                                </span>
                                <img
                                    key="searching-trophy-range"
                                    src="/assets/images/ui/trophy_premium.webp"
                                    style={{ width: '24px', height: '24px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                                    alt="trophy"
                                />
                            </span>
                        </span>
                    </div>
                </div>

                {/* Кнопка отмены */}
                <motion.button
                    whileHover={{ 
                        scale: 1.05, 
                        background: 'linear-gradient(180deg, #8b0000 0%, #4a0000 100%)', 
                        borderColor: '#ffd700', 
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(139, 0, 0, 0.5)' 
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    style={{
                        padding: '14px 44px',
                        background: 'linear-gradient(180deg, #660000 0%, #330000 100%)',
                        border: '2px solid #8b0000',
                        borderRadius: '12px',
                        color: '#ffd700',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '15px',
                        fontWeight: 950,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '2.5px',
                        transition: 'all 0.2s',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                    }}
                >
                    ОТМЕНИТЬ ПОИСК
                </motion.button>
            </div>
        </motion.div>
    );
};
