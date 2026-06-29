import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../../configs/AssetsMap';
import { audioService } from '../../../../../services/AudioService';
import { TabButton } from '../TabButton';
import { useGameStore } from '../../../../../store/useGameStore';

interface BattlePassHeaderProps {
    bpLevel: number;
    bpExp: number;
    maxExp: number;
    timeLeft: string;
    isPremium: boolean;
    activeTab: 'REWARDS' | 'QUESTS';
    setActiveTab: (tab: 'REWARDS' | 'QUESTS') => void;
    onBuyLevel: () => void;
    onBuyPremium: () => void;
    onClose: () => void;
}

/**
 * Шапка экрана Боевого Пропуска:
 * - Спрайт-баннер с уровнем и XP-баром
 * - Переключатель вкладок НАГРАДЫ / ЗАДАНИЯ
 * - Кнопки «Купить уровень», «Купить премиум», «Закрыть»
 */
export const BattlePassHeader: React.FC<BattlePassHeaderProps> = ({
    bpLevel,
    bpExp,
    maxExp,
    timeLeft,
    isPremium,
    activeTab,
    setActiveTab,
    onBuyLevel,
    onBuyPremium,
    onClose,
}) => {
    const isMobile = useGameStore((state) => state.isMobile);
    const progress = bpLevel >= 15 ? 100 : (bpExp / maxExp) * 100;

    return (
        <div
            style={{
                height: '135px',
                padding: '0 40px',
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(180deg, #251b14 0%, #150f0c 100%)',
                borderBottom: '3px solid #b8860b',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                zIndex: 10,
                position: 'relative',
            }}
        >
            {/* ГОТОВЫЙ СПРАЙТ БАННЕРА */}
            <div
                style={{
                    width: 550,
                    height: 120,
                    backgroundImage: `url(${AssetsMap.UI.ICON_BEAST_PASS})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    marginRight: '20px',
                    flexShrink: 0,
                }}
            >
                {/* УРОВЕНЬ НА ГЕРБЕ */}
                <div
                    style={{
                        position: 'absolute',
                        left: '12.1%',
                        top: '46%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: 38,
                            fontWeight: 900,
                            color: '#ffffff',
                            textShadow: '0 0 10px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,1)',
                            lineHeight: '1',
                        }}
                    >
                        {bpLevel}
                    </span>
                </div>

                {/* ДИНАМИЧЕСКИЙ ПРОГРЕСС-БАР ОПЫТА */}
                <div
                    style={{
                        position: 'absolute',
                        left: '24.9%',
                        top: 'calc(49% + 10px)',
                        width: '48.2%',
                        height: '18px',
                        transform: 'translateY(-50%)',
                        borderRadius: '9px',
                        pointerEvents: 'none',
                        background: '#0c0d10',
                        border: '1px solid rgba(240, 192, 64, 0.45)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.8), inset 0 1px 5px rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #f0c040 0%, #ffea80 50%, #f0c040 100%)',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            borderRadius: '9px',
                            boxShadow: '0 0 10px rgba(240, 192, 64, 0.8)',
                        }}
                        className="bp-gold-sweep"
                    />
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 2,
                            fontFamily: "'Nunito', sans-serif",
                            fontSize: '11px',
                            fontWeight: 900,
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,0.8)',
                        }}
                    >
                        {bpLevel >= 15 ? 'МАКС. УРОВЕНЬ' : `${bpExp} / ${maxExp} XP`}
                    </div>
                </div>

                {/* ЗАГОЛОВОК */}
                <div
                    style={{
                        position: 'absolute',
                        left: '48%',
                        top: '18%',
                        transform: 'translateX(-50%)',
                        fontFamily: "'Cinzel', serif",
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#f0c040',
                        textShadow: '0 2px 4px rgba(0,0,0,1)',
                        letterSpacing: '2.8px',
                        textTransform: 'uppercase',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    БОЕВОЙ ПРОПУСК
                </div>

                {/* ТАЙМЕР */}
                <div
                    style={{
                        position: 'absolute',
                        left: '48%',
                        bottom: '12%',
                        transform: 'translateX(-50%)',
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'rgba(255, 255, 255, 0.6)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span style={{ fontSize: 11 }}>⏳</span>
                    <span>ДО КОНЦА: {timeLeft}</span>
                </div>
            </div>

            {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <div
                    style={{
                        display: 'flex',
                        background: '#120b08',
                        padding: '4px',
                        borderRadius: '8px',
                        border: '2px solid #5c4033',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                    }}
                >
                    <TabButton
                        active={activeTab === 'REWARDS'}
                        onClick={() => {
                            setActiveTab('REWARDS');
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        }}
                        label="НАГРАДЫ"
                        icon="sprite-gift"
                    />
                    <TabButton
                        active={activeTab === 'QUESTS'}
                        onClick={() => {
                            setActiveTab('QUESTS');
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        }}
                        label="ЗАДАНИЯ"
                        icon="📜"
                    />
                </div>
            </div>

            {/* КНОПКИ ДЕЙСТВИЙ */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {bpLevel < 15 && (
                    <motion.button
                        onClick={onBuyLevel}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            height: '52px',
                            padding: '0 20px',
                            background: 'linear-gradient(180deg, #2a1b14 0%, #150f0c 100%)',
                            border: '2px solid #b8860b',
                            borderRadius: '8px',
                            color: '#c8a870',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '12px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                            }}
                        >
                            КУПИТЬ УРОВЕНЬ
                        </span>
                        <div style={{ width: '1px', height: '24px', background: '#3d2314' }} />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(0,0,0,0.4)',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid #3d2314',
                            }}
                        >
                            <img
                                src="/assets/images/ui/icons/almaz.webp"
                                alt="Gems"
                                style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                            />
                            <span
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                150
                            </span>
                        </div>
                    </motion.button>
                )}

                {!isPremium && (
                    <motion.button
                        onClick={onBuyPremium}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            height: '52px',
                            padding: '0 25px',
                            background: 'linear-gradient(180deg, #1b3a24 0%, #0c1c11 100%)',
                            border: '2px solid #b8860b',
                            borderRadius: '8px',
                            color: '#ffd700',
                            fontSize: '13px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            cursor: 'pointer',
                            letterSpacing: '1.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            textShadow: '0 1.5px 2px rgba(0,0,0,0.8)',
                        }}
                    >
                        <span>👑</span>
                        <span>КУПИТЬ ПРЕМИУМ</span>
                    </motion.button>
                )}

                {/* ЗАКРЫТЬ */}
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                        onClose();
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    }}
                    style={{
                        width: isMobile ? '50px' : '45px',
                        height: isMobile ? '50px' : '45px',
                        background: 'linear-gradient(180deg, #8b1c1c 0%, #450a0a 100%)',
                        border: '2px solid #b8860b',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: isMobile ? '26px' : '22px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        boxSizing: 'content-box',
                        padding: isMobile ? '16px' : '0px',
                        margin: isMobile ? '-16px' : '0px',
                    }}
                >
                    ×
                </motion.button>
            </div>
        </div>
    );
};
