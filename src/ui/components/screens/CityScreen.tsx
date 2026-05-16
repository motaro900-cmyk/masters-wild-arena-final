import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

export const CityScreen: React.FC = () => {
    const goToMainMenu = useGameStore((state) => state.goToMainMenu);
    const goToShop = useGameStore((state) => state.goToShop);
    const goToForge = useGameStore((state) => state.goToForge);
    const [modalText, setModalText] = useState<string | null>(null);

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
                    onClick={goToMainMenu}
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
            <BuildingHotspot x="64%" y="82%" label="КУЗНИЦА" onClick={goToForge} />

            {/* 2. ЗВЕРИНЕЦ (Самое левое здание по центру) */}
            <BuildingHotspot
                x="8%"
                y="65%"
                label="ЗВЕРИНЕЦ"
                onClick={() => {
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
                onClick={() =>
                    setModalText('Таверна временно закрыта на реконструкцию. Шеф-повар готовит новые блюда!')
                }
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
