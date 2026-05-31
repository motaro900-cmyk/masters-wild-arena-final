import React from 'react';
import { ShopItem } from '../../../../configs/ShopConfig';
import { useGameStore } from '../../../../store/useGameStore';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface BuyBtnProps {
    item: ShopItem;
    onTrigger: () => void;
    discount?: number;
}

export const BuyBtn: React.FC<BuyBtnProps> = ({ item, onTrigger, discount = 0 }) => {
    const { ownedSkins, equippedSkins, equipSkin, unequipSkin, inventory, heroEquipment } = useGameStore();

    const isSkinOwned = item.mainTab === 'SKINS' && (ownedSkins || []).includes(String(item.id));
    let skinHeroId = '';
    if (String(item.id).includes('panda')) skinHeroId = 'panda';
    else if (String(item.id).includes('wolf')) skinHeroId = 'wolf_knight';

    const isSkinEquipped = item.mainTab === 'SKINS' && skinHeroId && equippedSkins?.[skinHeroId] === String(item.id);

    const isArsenalItem = item.mainTab === 'ARSENAL';
    const isEquipped = isArsenalItem && Object.values(heroEquipment || {}).some((gear: any) => 
        gear && Object.values(gear).some((eqId) => String(eqId) === String(item.id))
    );
    const isOwnedInInventory = isArsenalItem && (inventory || []).some((i: any) => String(i.id) === String(item.id));
    const isOwned = isEquipped || isOwnedInInventory;

    const handleSkinEquip = (e: React.MouseEvent) => {
        e.stopPropagation();
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        if (isSkinEquipped) {
            unequipSkin?.(skinHeroId);
        } else {
            equipSkin?.(skinHeroId, String(item.id));
        }
    };

    if (item.mainTab === 'SKINS' && isSkinOwned) {
        return (
            <button
                onClick={handleSkinEquip}
                style={{
                    width: '100%',
                    height: '50px',
                    background: isSkinEquipped
                        ? 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)'
                        : 'linear-gradient(180deg, #10b981 0%, #065f46 100%)',
                    border: isSkinEquipped ? '1px solid #f87171' : '1px solid #34d399',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 900,
                    fontFamily: "'Cinzel', 'Philosopher', serif",
                    fontSize: '15px',
                    cursor: 'pointer',
                }}
            >
                {isSkinEquipped ? 'СНЯТЬ ОБЛИК' : 'НАДЕТЬ ОБЛИК'}
            </button>
        );
    }

    if (isArsenalItem && isOwned) {
        return (
            <button
                disabled
                style={{
                    width: '100%',
                    height: '50px',
                    background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)',
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    color: '#9ca3af',
                    fontWeight: 900,
                    fontFamily: "'Cinzel', 'Philosopher', serif",
                    fontSize: '15px',
                    cursor: 'not-allowed',
                }}
            >
                {isEquipped ? 'НАДЕТО' : 'КУПЛЕНО'}
            </button>
        );
    }

    const originalPrice = item.priceGold ?? item.priceGem ?? item.priceStars;
    const hasDiscount = discount > 0 && originalPrice !== undefined;
    const price =
        hasDiscount && originalPrice ? Math.max(1, Math.round(originalPrice * (1 - discount / 100))) : originalPrice;
    const isGem = item.priceGem !== undefined;

    return (
        <button
            onClick={onTrigger}
            style={{
                width: '100%',
                height: '50px',
                background: item.isAd
                    ? 'linear-gradient(180deg, #10b981 0%, #047857 100%)'
                    : item.priceStars !== undefined
                      ? 'linear-gradient(180deg, #2b82c9 0%, #1a5c96 100%)'
                      : 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                border: item.isAd
                    ? '1px solid #059669'
                    : item.priceStars !== undefined
                      ? '1px solid #52a1e5'
                      : '1px solid #ffdf00',
                borderRadius: '8px',
                color: item.priceStars !== undefined || item.isAd ? '#fff' : '#1a0f00',
                fontWeight: 900,
                fontFamily: "'Cinzel', 'Philosopher', serif",
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
            }}
        >
            {item.isAd ? (
                <>СМОТРЕТЬ РЕКЛАМУ 📺</>
            ) : item.priceStars !== undefined ? (
                <>{item.priceStars} ⭐</>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {hasDiscount && (
                        <span
                            style={{
                                textDecoration: 'line-through',
                                opacity: 0.7,
                                fontSize: '13px',
                                marginRight: '4px',
                                color: '#851414',
                            }}
                        >
                            {originalPrice?.toLocaleString()}
                        </span>
                    )}
                    <span>{price?.toLocaleString()}</span>
                    <img
                        src={isGem ? AssetsMap.UI.ICON_ALMAZ_FULL : AssetsMap.UI.ICON_GOLD_FULL}
                        style={{ width: '22px', height: '22px' }}
                        alt=""
                    />
                    {hasDiscount && (
                        <span
                            style={{
                                fontSize: '11px',
                                color: '#fff',
                                background: '#e11d48',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginLeft: '4px',
                                fontWeight: 900,
                            }}
                        >
                            -{discount}%
                        </span>
                    )}
                </div>
            )}
        </button>
    );
};
