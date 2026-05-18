import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';

export const CityScreen: React.FC = () => {
    const goToMainMenu = useGameStore((state) => state.goToMainMenu);
    const goToShop = useGameStore((state) => state.goToShop);
    const goToForge = useGameStore((state) => state.goToForge);
    const openChest = useGameStore((state) => state.openChest);

    const [modalText, setModalText] = useState<string | null>(null);
    const [showSummon, setShowSummon] = useState(false);

    const [isSpinning, setIsSpinning] = useState(false);
    const [rewards, setRewards] = useState<any[] | null>(null);
    const [rouletteOffset, setRouletteOffset] = useState(0);
    const [rouletteItems, setRouletteItems] = useState<any[]>([]);

    const handleSummon = (type: 'SINGLE' | 'MULTI') => {
        if (isSpinning) return;

        const result = openChest(type);
        if (!result) {
            alert('Недостаточно золота!');
            return;
        }

        setIsSpinning(true);
        setRewards(null);

        // Целевая позиция: каждый элемент 100px + gap 15px = 115px.
        // Мы хотим остановиться на 45-м элементе.
        const targetElement = 45;
        const itemWidth = 115;
        const centerOffset = 450 - 100 / 2;
        const targetX = -(targetElement * itemWidth - centerOffset);

        // Подменим 45-й элемент на выпавшую награду (первую из списка)
        setRouletteItems((prev) => {
            const next = [...prev];
            next[targetElement] = {
                heroId: result[0].heroId,
                isRare: false,
                isEpic: true,
                amount: result[0].amount,
            };
            return next;
        });

        setRouletteOffset(targetX);

        setTimeout(() => {
            setIsSpinning(false);
            setRewards(result);
        }, 4000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: '1920px',
                height: '1080px',
                backgroundImage: `url(${AssetsMap.BACKGROUNDS.CITY_HUB})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0c0c0c',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 9999,
                pointerEvents: 'auto',
            }}
        >
            {/* Overlay Gradient for depth */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Title / Back Button */}
            <div
                style={{
                    position: 'absolute',
                    top: '40px',
                    left: '40px',
                    zIndex: 10,
                }}
            >
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        goToMainMenu();
                    }}
                    style={{
                        padding: '12px 24px',
                        background: 'rgba(20, 15, 10, 0.85)',
                        border: '2px solid #c8a870',
                        borderRadius: '12px',
                        color: '#f0c040',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 5px 25px rgba(0,0,0,0.7)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <span>←</span> В ЛАГЕРЬ
                </button>
            </div>

            {/* ИНТЕРАКТИВНЫЕ ЗОНЫ (Хотспоты) */}

            {/* 1. КУЗНИЦА (Здание с горном справа снизу) */}
            <BuildingHotspot
                x="64%"
                y="82%"
                label="КУЗНИЦА"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    goToForge();
                }}
            />

            {/* 2. ЗВЕРИНЕЦ (Самое левое здание по центру) */}
            <BuildingHotspot
                x="8%"
                y="65%"
                label="ЗВЕРИНЕЦ"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    if ((window as any).setActiveHUDWindow) {
                        (window as any).setActiveHUDWindow('BESTIARY');
                    } else {
                        setModalText('Зверинец: здесь будут жить ваши питомцы! Функция станет доступна позже.');
                    }
                }}
            />

            {/* 3. ТАВЕРНА (Центральное здание) */}
            <BuildingHotspot
                x="53%"
                y="43%"
                label="ТАВЕРНА"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    const items = [];
                    const heroes = ['panda', 'monkey', 'tiger', 'rabbit', 'bear'];
                    for (let i = 0; i < 60; i++) {
                        const randomHero = heroes[Math.floor(Math.random() * heroes.length)];
                        const isRare = i % 3 === 0;
                        const isEpic = i % 7 === 0;
                        items.push({ heroId: randomHero, isRare, isEpic });
                    }
                    setRouletteItems(items);
                    setRouletteOffset(0);
                    setRewards(null);
                    setShowSummon(true);
                }}
            />

            {/* 4. ЗАЛ СЛАВЫ (Круглая башня справа) */}
            <BuildingHotspot
                x="86%"
                y="46%"
                label="ЗАЛ СЛАВЫ"
                onClick={() => setModalText('Зал Славы станет доступен в следующем обновлении. Копите победы!')}
            />

            {/* 5. ОБИТЕЛЬ ДРЕВНИХ (Величественное здание сверху) */}
            <BuildingHotspot
                x="32%"
                y="16%"
                label="ОБИТЕЛЬ ДРЕВНИХ"
                onClick={() => {
                    if ((window as any).setActiveHUDWindow) {
                        (window as any).setActiveHUDWindow('SANCTUARY');
                    }
                }}
            />

            {/* 6. РЫНОК (Торговая площадь) */}
            <BuildingHotspot x="78%" y="78%" label="РЫНОК" onClick={() => goToShop('BANK')} />

            {/* Custom Modal */}
            {modalText && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 100000,
                        backdropFilter: 'blur(5px)',
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(20, 15, 10, 0.95)',
                            border: '2px solid #c8a870',
                            borderRadius: '16px',
                            padding: '40px',
                            textAlign: 'center',
                            maxWidth: '500px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                        }}
                    >
                        <h3
                            style={{
                                color: '#f0c040',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '24px',
                                marginBottom: '20px',
                                letterSpacing: '2px',
                            }}
                        >
                            ИНФОРМАЦИЯ
                        </h3>
                        <p style={{ color: '#fff', fontSize: '16px', marginBottom: '30px', lineHeight: '1.6' }}>
                            {modalText}
                        </p>
                        <button
                            onClick={() => setModalText(null)}
                            style={{
                                padding: '12px 40px',
                                background: 'linear-gradient(135deg, #c8a870 0%, #a6844a 100%)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            ПОНЯТНО
                        </button>
                    </div>
                </div>
            )}
            {/* Summon Overlay (Gacha) */}
            {showSummon && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'url(/assets/images/backgrounds/gacha_bg.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 100000,
                        filter: 'contrast(1.05) saturate(1.1)',
                    }}
                >
                    {/* Кнопка закрытия (Поверх серого элемента внизу) */}
                    <button
                        onClick={() => {
                            if (!isSpinning) {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                setShowSummon(false);
                            }
                        }}
                        style={{
                            position: 'absolute',
                            bottom: '62px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '200px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            background: '#7f1d1d',
                            border: '1px solid #c8a870',
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                            color: '#f0c040',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '24px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            cursor: isSpinning ? 'not-allowed' : 'pointer',
                            opacity: isSpinning ? 0.3 : 0.8,
                            transition: 'all 0.2s',
                            zIndex: 10,
                        }}
                        onMouseEnter={(e) => {
                            if (!isSpinning) {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                                e.currentTarget.style.textShadow = '0 0 10px rgba(255,255,255,0.8)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSpinning) {
                                e.currentTarget.style.opacity = '0.8';
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                                e.currentTarget.style.textShadow = 'none';
                            }
                        }}
                    >
                        <span>ВЫХОД</span>
                    </button>

                    {/* Заголовок */}
                    {/* Заголовок с подложкой для читаемости */}
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.65)',
                            padding: '20px 50px',
                            borderRadius: '16px',
                            border: '1px solid rgba(240, 192, 64, 0.3)',
                            backdropFilter: 'blur(10px)',
                            marginBottom: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(240,192,64,0.05)',
                        }}
                    >
                        <motion.h2
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            style={{
                                color: '#f0c040',
                                background: 'linear-gradient(to bottom, #fff 20%, #f0c040 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '48px',
                                marginBottom: '10px',
                                letterSpacing: '6px',
                                textShadow: '0 4px 10px rgba(0,0,0,0.9)',
                                fontWeight: 900,
                            }}
                        >
                            ТАВЕРНА ПРИЗЫВА
                        </motion.h2>
                        <p
                            style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '14px',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '2px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                            }}
                        >
                            Испытай удачу и собери осколки великих героев
                        </p>
                    </div>

                    {/* РУЛЕТКА */}
                    <div
                        style={{
                            width: '1000px',
                            height: '180px',
                            background: 'rgba(10, 5, 2, 0.4)',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(240, 192, 64, 0.3)',
                            borderRadius: '24px',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '60px',
                            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.6)',
                        }}
                    >
                        {/* Волюметрический свет в центре */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: 0,
                                bottom: 0,
                                width: '120px',
                                background:
                                    'radial-gradient(ellipse at center, rgba(255,51,102,0.15) 0%, transparent 70%)',
                                zIndex: 1,
                                transform: 'translateX(-60px)',
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Лазерный прицел */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: 0,
                                bottom: 0,
                                width: '4px',
                                background: 'linear-gradient(to bottom, #ff3366, #ff0055, #ff3366)',
                                zIndex: 10,
                                boxShadow: '0 0 20px #ff0055, 0 0 40px #ff0055',
                                transform: 'translateX(-2px)',
                            }}
                        />

                        {/* Маска для плавного исчезновения по краям */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'linear-gradient(to right, rgba(10,5,5,1) 0%, rgba(10,5,5,0) 15%, rgba(10,5,5,0) 85%, rgba(10,5,5,1) 100%)',
                                pointerEvents: 'none',
                                zIndex: 5,
                            }}
                        />

                        {/* Элементы рулетки */}
                        <motion.div
                            animate={{ x: rouletteOffset }}
                            transition={{ type: 'tween', ease: 'easeOut', duration: 4 }}
                            style={{
                                display: 'flex',
                                gap: '25px',
                                padding: '0 40px',
                                position: 'absolute',
                                left: 0,
                            }}
                        >
                            {rouletteItems.map((item, i) => {
                                const color = item.isEpic ? '#a855f7' : item.isRare ? '#3b82f6' : '#c8a870';
                                const isWinner = !isSpinning && rouletteOffset !== 0 && i === 45;
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            background: `radial-gradient(circle at center, ${color}33 0%, rgba(15, 10, 5, 0.95) 100%)`,
                                            borderRadius: '50%',
                                            border: `2px solid ${isWinner ? '#fff' : `${color}66`}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            color: '#fff',
                                            gap: '6px',
                                            flexShrink: 0,
                                            boxShadow: isWinner
                                                ? `0 0 40px ${color}, inset 0 0 20px ${color}`
                                                : `0 10px 20px rgba(0,0,0,0.5)`,
                                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transform: isWinner ? 'scale(1.2)' : 'scale(1)',
                                            zIndex: isWinner ? 2 : 1,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '32px',
                                                filter: `drop-shadow(0 0 10px ${color})`,
                                                transform: isWinner ? 'scale(1.2)' : 'scale(1)',
                                                transition: 'transform 0.5s',
                                            }}
                                        >
                                            💎
                                        </div>
                                        <span
                                            style={{
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            {item.heroId}
                                        </span>
                                        <div
                                            style={{
                                                background: color,
                                                color: '#000',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                fontSize: '9px',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {item.isEpic ? 'EPIC' : item.isRare ? 'RARE' : 'COMMON'}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </div>

                    {/* КНОПКИ */}
                    <div style={{ display: 'flex', gap: '30px' }}>
                        <button
                            onClick={() => handleSummon('SINGLE')}
                            disabled={isSpinning}
                            style={{
                                padding: '18px 50px',
                                background: isSpinning ? '#333' : 'linear-gradient(135deg, #f0c040 0%, #c8a870 100%)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '14px',
                                fontWeight: '900',
                                cursor: isSpinning ? 'not-allowed' : 'pointer',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '18px',
                                letterSpacing: '2px',
                                boxShadow: isSpinning ? 'none' : '0 10px 25px rgba(240,192,64,0.4)',
                                transition: 'all 0.3s',
                                opacity: isSpinning ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => !isSpinning && (e.currentTarget.style.transform = 'translateY(-3px)')}
                            onMouseLeave={(e) => !isSpinning && (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            {isSpinning ? (
                                'ПРИЗЫВ...'
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    ПРИЗЫВ X1 (100{' '}
                                    <img src={AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: '24px', height: '24px' }} />
                                    )
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleSummon('MULTI')}
                            disabled={isSpinning}
                            style={{
                                padding: '18px 50px',
                                background: isSpinning ? '#222' : 'linear-gradient(135deg, #1f1a10 0%, #0a0500 100%)',
                                color: '#f0c040',
                                border: '2px solid #f0c040',
                                borderRadius: '14px',
                                fontWeight: '900',
                                cursor: isSpinning ? 'not-allowed' : 'pointer',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '18px',
                                letterSpacing: '2px',
                                transition: 'all 0.3s',
                                opacity: isSpinning ? 0.3 : 1,
                                boxShadow: isSpinning ? 'none' : '0 10px 25px rgba(0,0,0,0.5)',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSpinning) {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.background = 'rgba(240,192,64,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSpinning) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.background =
                                        'linear-gradient(135deg, #1f1a10 0%, #0a0500 100%)';
                                }
                            }}
                        >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                ПРИЗЫВ X10 (950{' '}
                                <img src={AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: '24px', height: '24px' }} />)
                            </span>
                        </button>
                    </div>

                    {/* ОКНО НАГРАДЫ (GRAND REVEAL) */}
                    <AnimatePresence>
                        {rewards && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: '#0a0505',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 200,
                                }}
                            >
                                {/* Вспышка света на фоне */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '600px',
                                        height: '600px',
                                        background:
                                            'radial-gradient(circle, rgba(240,192,64,0.15) 0%, transparent 70%)',
                                        zIndex: -1,
                                    }}
                                />

                                <motion.h3
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
                                    style={{
                                        color: '#f0c040',
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: '42px',
                                        marginBottom: '40px',
                                        letterSpacing: '4px',
                                        textShadow: '0 0 20px rgba(240,192,64,0.3)',
                                    }}
                                >
                                    ВЫ ПОЛУЧИЛИ:
                                </motion.h3>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '25px',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        maxWidth: '900px',
                                        marginBottom: '60px',
                                    }}
                                >
                                    {rewards.map((r, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0, opacity: 0, rotateY: 90 }}
                                            animate={{
                                                scale: 1,
                                                opacity: 1,
                                                rotateY: 0,
                                                transition: { delay: 0.4 + i * 0.1, type: 'spring', stiffness: 100 },
                                            }}
                                            style={{
                                                padding: '30px 20px',
                                                background:
                                                    'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                                                border: '1px solid rgba(200,168,112,0.4)',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '15px',
                                                width: '130px',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '4px',
                                                    background:
                                                        'linear-gradient(to right, transparent, #c8a870, transparent)',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    fontSize: '42px',
                                                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))',
                                                }}
                                            >
                                                💎
                                            </div>
                                            <span
                                                style={{
                                                    color: '#fff',
                                                    fontWeight: '900',
                                                    fontSize: '13px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                }}
                                            >
                                                {r.heroId}
                                            </span>
                                            <div
                                                style={{
                                                    background: '#c8a870',
                                                    color: '#000',
                                                    padding: '3px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                x{r.amount}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, transition: { delay: 1.5 } }}
                                    onClick={() => setRewards(null)}
                                    style={{
                                        padding: '14px 60px',
                                        background: 'linear-gradient(135deg, #c8a870 0%, #a6844a 100%)',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: '18px',
                                        letterSpacing: '2px',
                                        boxShadow: '0 5px 15px rgba(200,168,112,0.3)',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    ОТЛИЧНО
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </motion.div>
    );
};

interface HotspotProps {
    x: string;
    y: string;
    label: string;
    onClick: () => void;
}

const BuildingHotspot: React.FC<HotspotProps> = ({ x, y, label, onClick }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                zIndex: 5,
            }}
        >
            {/* Marker / Glow */}
            <div
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(240,192,64,0.6) 0%, transparent 70%)',
                    border: '2px solid rgba(240,192,64,0.4)',
                    boxShadow: '0 0 20px rgba(240,192,64,0.3)',
                    animation: 'pulse 2s infinite ease-in-out',
                }}
            />

            {/* Label */}
            <div
                style={{
                    background: 'rgba(15, 10, 5, 0.85)',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: '1px solid #c8a870',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 0.6; }
                }
            `}</style>
        </motion.div>
    );
};
