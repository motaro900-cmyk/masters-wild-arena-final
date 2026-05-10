import React from 'react';
import { motion } from 'framer-motion';
import { WEAPON_SOCKETS } from '../../../configs/WeaponSockets';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { resolveAssetPath } from '../../../utils/assetPath';

export type HeroAction = 'IDLE' | 'RUN' | 'ATTACK1' | 'ATTACK2' | 'HIT' | 'DEATH' | 'ULTIMATE' | 'VICTORY';

interface HeroAnimatorProps {
    heroId: string;
    atlasUrl: string;
    action: HeroAction;
    weaponId?: string | null;
    helmId?: string | null;
    armorId?: string | null;
    shieldId?: string | null;
    className?: string;
    style?: React.CSSProperties;
}

export const HeroAnimator: React.FC<HeroAnimatorProps> = ({ 
    heroId,
    atlasUrl, 
    action, 
    weaponId,
    helmId,
    armorId,
    shieldId,
    className,
    style
}) => {
    const actionMap: Record<HeroAction, number> = {
        'IDLE': 0, 'RUN': 1, 'ATTACK1': 2, 'ATTACK2': 3,
        'HIT': 4, 'DEATH': 5, 'ULTIMATE': 6, 'VICTORY': 7
    };

    const index = actionMap[action];
    const col = index % 4;
    const row = Math.floor(index / 4);
    
    const heroSockets = WEAPON_SOCKETS[heroId] || WEAPON_SOCKETS['panda'];
    const weaponSocket = heroSockets[String(index)] || { x: 0, y: 0, rotation: 0, scale: 1 };
    
    // Используем профессиональные точки крепления из конфига
    const shieldSocket = heroSockets["SHIELD"] || { ...weaponSocket, x: -weaponSocket.x - 50, rotation: -weaponSocket.rotation };
    const helmSocket = heroSockets["HELMET"] || { x: 0, y: -500, rotation: 0, scale: 0.8 };
    const armorSocket = heroSockets["ARMOR"] || { x: 0, y: -350, rotation: 0, scale: 1.2 };

    const getImageUrl = (id: string | null | undefined) => {
        if (!id) return "";
        const itemData = ITEMS_DATABASE[String(id)] as any;
        return itemData ? itemData.image : resolveAssetPath(`/assets/images/items/${id}.png`);
    };

    const weaponImage = getImageUrl(weaponId);
    const helmImage = getImageUrl(helmId);
    const armorImage = getImageUrl(armorId);
    const shieldImage = getImageUrl(shieldId);

    const renderEquipment = (img: string, socket: any, id: string | null | undefined, zIndex: number) => {
        if (!img) return null;
        return (
            <motion.div 
                key={img + zIndex}
                initial={{ opacity: 0, scale: 0.5 }} 
                animate={{ 
                    opacity: 1, 
                    scale: socket.scale || 1,
                    x: `calc(-50% + ${socket.x}px)`,
                    y: `${socket.y}px`,
                    rotate: `${socket.rotation}rad`
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{
                    position: 'absolute',
                    left: '50%', bottom: '0%',
                    width: '300px', height: '300px',
                    backgroundImage: `url("${img}")`,
                    backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                    transformOrigin: '50% 80%',
                    pointerEvents: 'none',
                    zIndex,
                    filter: (id === 'pan' || id === 'stick' || id?.toString().includes('starter'))
                        ? 'url(#remove-white) drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                        : 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                }}
            />
        );
    };

    return (
        <div style={{ 
            width: '450px', height: '800px', position: 'relative', ...style 
        }}>
            {/* БАЗОВЫЙ ПЕРСОНАЖ */}
            <motion.div 
                className={className}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    width: '100%', height: '100%',
                    backgroundImage: `url("${atlasUrl}")`,
                    backgroundSize: '400% 200%',
                    backgroundPosition: `${(col / 3) * 100}% ${(row / 1) * 100}%`,
                    backgroundRepeat: 'no-repeat',
                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))',
                    zIndex: 2
                }}
            />

            {/* СЛОИ ЭКИПИРОВКИ */}
            {renderEquipment(weaponImage, weaponSocket, weaponId, 5)}
            {renderEquipment(shieldImage, shieldSocket, shieldId, 3)}
            {renderEquipment(helmImage, helmSocket, helmId, 6)}
            {/* Броня обычно идет под персонажем или поверх в зависимости от дизайна, 
                в 2D чаще всего это просто оверлей */}
            {renderEquipment(armorImage, armorSocket, armorId, 4)}
        </div>
    );
};

