import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

export const CityScreen: React.FC = () => {
    const goToMainMenu = useGameStore(state => state.goToMainMenu);
    const goToShop = useGameStore(state => state.goToShop);
    
    // В будущем здесь можно добавить стейт для открытия конкретных окон (Инкубатор, Кузница и т.д.)

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
                pointerEvents: 'auto'
            }}
        >
            {/* Overlay Gradient for depth */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%)',
                pointerEvents: 'none'
            }} />

            {/* Title / Back Button */}
            <div style={{
                position: 'absolute',
                top: '40px',
                left: '40px',
                zIndex: 10
            }}>
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
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <span>←</span> В ЛАГЕРЬ
                </button>
            </div>

            {/* ИНТЕРАКТИВНЫЕ ЗОНЫ (Хотспоты) */}
            
            {/* 1. КУЗНИЦА (Слева снизу) */}
            <BuildingHotspot 
                x="15%" y="70%" label="КУЗНИЦА" 
                onClick={() => goToShop('ARSENAL')} 
            />

            {/* 2. ТАВЕРНА (Центр-справа) */}
            <BuildingHotspot 
                x="60%" y="55%" label="ТАВЕРНА" 
                onClick={() => alert('Таверна в разработке!')} 
            />

            {/* 3. ИНКУБАТОР (Центральная башня) */}
            <BuildingHotspot 
                x="48%" y="30%" label="ИНКУБАТОР" 
                onClick={() => alert('Инкубатор в разработке!')} 
            />

            {/* 4. ЗАЛ СЛАВЫ (Справа) */}
            <BuildingHotspot 
                x="82%" y="45%" label="ЗАЛ СЛАВЫ" 
                onClick={() => alert('Зал славы: Рейтинги великих мастеров.')} 
            />

            {/* 5. ОБИТЕЛЬ ДРЕВНИХ */}
            <BuildingHotspot 
                x="38%" y="55%" label="ОБИТЕЛЬ ДРЕВНИХ" 
                onClick={() => (window as any).setActiveHUDWindow('SANCTUARY')} 
            />

            {/* 6. РЫНОК */}
            <BuildingHotspot 
                x="75%" y="75%" label="РЫНОК" 
                onClick={() => goToShop('BANK')} 
            />

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
                zIndex: 5
            }}
        >
            {/* Marker / Glow */}
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(240,192,64,0.6) 0%, transparent 70%)',
                border: '2px solid rgba(240,192,64,0.4)',
                boxShadow: '0 0 20px rgba(240,192,64,0.3)',
                animation: 'pulse 2s infinite ease-in-out'
            }} />
            
            {/* Label */}
            <div style={{
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
                whiteSpace: 'nowrap'
            }}>
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
