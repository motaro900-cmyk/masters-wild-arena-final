import React from 'react';
import { motion } from 'framer-motion';
import { useAvatarRenderer } from '../../hooks/useAvatarRenderer';

interface EquippedHeroViewProps {
    heroId: string;
    size?: number;
}

/**
 * КОМПОНЕНТ РЕНДЕРИНГА ЭКИПИРОВАННОГО ГЕРОЯ
 * Чистая версия без отладочных элементов.
 */
export const EquippedHeroView: React.FC<EquippedHeroViewProps> = ({ heroId, size = 512 }) => {
    const { layers, dimensions, heroConfig } = useAvatarRenderer(heroId, size);

    return (
        <div
            className="relative overflow-hidden flex items-center justify-center pointer-events-none"
            style={{ width: size, height: size }}
        >
            {layers.map((layer) => {
                const key = `${heroId}-${layer.id}-${layer.src}`;
                const isBody = layer.type === 'body';
                const isWeapon = layer.id === 'item-WEAPONS';
                const isItem = layer.type === 'item';

                const style: any = isBody
                    ? {
                          position: 'absolute',
                          left: layer.x,
                          top: layer.y,
                          width: dimensions.normWidth * dimensions.scaleFactor,
                          height: dimensions.normHeight * dimensions.scaleFactor,
                          objectFit: 'contain',
                          zIndex: layer.zIndex,
                      }
                    : {
                          position: 'absolute',
                          left: layer.x,
                          top: layer.y,
                          width: 512,
                          height: 512,
                          objectFit: 'contain',
                          zIndex: layer.zIndex,
                          filter: `brightness(1.1) contrast(1.1)`,
                          transformOrigin: isWeapon ? '50% 90%' : '50% 50%',
                      };

                // Поддержка спрайт-листов для героев (если остались такие)
                if (isBody && heroConfig.sheet) {
                    return (
                        <div
                            key={key}
                            className="absolute pointer-events-none"
                            style={{
                                ...style,
                                overflow: 'hidden',
                                ...layer.style,
                            }}
                        >
                            <motion.img
                                src={layer.src}
                                style={{
                                    width: `${heroConfig.sheet.cols * 100}%`,
                                    height: `${heroConfig.sheet.rows * 100}%`,
                                    objectFit: 'fill',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            />
                        </div>
                    );
                }

                // Спрайты для оружия из инвентаря
                if (isItem && layer.spriteClass) {
                    return (
                        <motion.div
                            key={key}
                            className={`sprite-icon ${layer.spriteClass} absolute pointer-events-none`}
                            style={{
                                ...style,
                                backgroundSize: '400% 400%',
                                ...layer.style,
                            }}
                            initial={{
                                opacity: 0,
                                scale: 0.8 * layer.scale,
                                rotate: layer.rotation,
                                x: '-50%',
                                y: isWeapon ? '-90%' : '-50%',
                            }}
                            animate={{
                                opacity: 1,
                                scale: layer.scale,
                                rotate: layer.rotation,
                                x: '-50%',
                                y: isWeapon ? '-90%' : '-50%',
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    );
                }

                // Обычные картинки (тело, спец-оружие)
                return (
                    <motion.img
                        key={key}
                        src={layer.src}
                        className="absolute pointer-events-none"
                        style={{
                            ...style,
                            ...layer.style,
                        }}
                        initial={
                            isBody
                                ? { opacity: 0 }
                                : {
                                      opacity: 0,
                                      scale: 0.8 * layer.scale,
                                      rotate: layer.rotation,
                                      x: '-50%',
                                      y: isWeapon ? '-90%' : '-50%',
                                  }
                        }
                        animate={
                            isBody
                                ? { opacity: 1 }
                                : {
                                      opacity: 1,
                                      scale: layer.scale,
                                      rotate: layer.rotation,
                                      x: '-50%',
                                      y: isWeapon ? '-90%' : '-50%',
                                  }
                        }
                        transition={{ duration: 0.3 }}
                    />
                );
            })}
        </div>
    );
};
