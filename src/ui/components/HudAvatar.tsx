import React, { useState } from 'react';
import { getHeroConfig } from '../../configs/HeroesConfig';
import { resolveAssetPath } from '../../utils/assetPath';

interface HudAvatarProps {
    heroId: string;
}

export const HudAvatar: React.FC<HudAvatarProps> = ({ heroId }) => {
    const [hasError, setHasError] = useState(false);
    const heroConfig = getHeroConfig(heroId);
    const imageSrc = heroConfig ? resolveAssetPath(heroConfig.image) : '';

    const emojis: Record<string, string> = { 
        panda: '🐼', 
        moose: '🫎', 
        goose: '🦢', 
        cat: '🐱', 
        boar: '🐗',
        raccoon: '🦝'
    };

    const showFallback = hasError || !imageSrc;

    return (
        <div className="w-16 h-16 bg-gradient-to-b from-[#1a365d] to-[#0a192f] rounded-full border-2 border-[#4a90e2] shadow-inner flex-shrink-0 overflow-hidden flex items-end justify-center relative">
            {!showFallback ? (
                <img
                    src={imageSrc}
                    alt={heroConfig?.name || heroId}
                    className="w-14 h-14 object-contain animate-hud-avatar-breathe mb-1"
                    style={{
                        transformOrigin: 'bottom center',
                    }}
                    onError={() => setHasError(true)}
                />
            ) : (
                <span className="text-4xl filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2">
                    {emojis[heroId] || '🐼'}
                </span>
            )}
        </div>
    );
};
