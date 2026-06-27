import React from 'react';
import { ShopItem } from '../../../../configs/ShopConfig';
import { useGameStore } from '../../../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';

const VkIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ fill: 'currentColor' }}>
        <path d="M15.07 3H8.93C4.55 3 3 4.55 3 8.93v6.14C3 19.45 4.55 21 8.93 21h6.14c4.38 0 5.93-1.55 5.93-5.93V8.93C21 4.55 19.45 3 15.07 3zm2.56 12.02c.3.29.62.58.89.88.3.32.58.66.8 1.05.17.3.06.65-.23.68h-1.35c-.45.01-.83-.15-1.12-.5-.25-.3-.51-.61-.76-.91-.17-.21-.35-.41-.6-.37-.25.04-.33.26-.35.49-.05.51-.02 1.03-.03 1.55-.01.4-.21.57-.58.58-.7.03-1.39-.06-2.05-.33-.8-.33-1.42-.91-1.94-1.58-1.01-1.28-1.77-2.73-2.45-4.21-.13-.28-.04-.51.25-.53h1.35c.33 0 .58.18.7.49.4.1 1.7 2.94 1.7.95c.03-.71.01-1.42-.13-2.12-.09-.41-.32-.58-.72-.63-.17-.02-.16-.09-.06-.16.19-.16.43-.23.75-.23.92.01 1.38.39 1.43 1.3.04.67.01 1.35-.06 2.02-.03.24.05.49.31.54.21.04.35-.09.48-.23.51-.58.89-1.25 1.21-1.98.16-.36.34-.48.74-.48h1.35c.45 0 .56.22.41.62-.24.61-.58 1.15-.97 1.67-.23.31-.5.59-.75.89-.3.36-.29.58.06.92z" />
    </svg>
);

const getVotesPlural = (num: number) => {
    const mod10 = num % 10;
    const mod100 = num % 100;
    if (mod100 >= 11 && mod100 <= 19) return 'голосов';
    if (mod10 === 1) return 'голос';
    if (mod10 >= 2 && mod10 <= 4) return 'голоса';
    return 'голосов';
};

interface BuyBtnProps {
    item: ShopItem;
    onTrigger: () => void;
    discount?: number;
    isPurchasing?: boolean;
}

export const BuyBtn: React.FC<BuyBtnProps> = ({ item, onTrigger, discount = 0, isPurchasing = false }) => {
    const { ownedSkins, equippedSkins, equipSkin, unequipSkin, inventory, heroEquipment, level } = useGameStore(
        useShallow((state) => ({
            ownedSkins: state.ownedSkins,
            equippedSkins: state.equippedSkins,
            equipSkin: state.equipSkin,
            unequipSkin: state.unequipSkin,
            inventory: state.inventory,
            heroEquipment: state.heroEquipment,
            level: state.level,
        })),
    );

    const isSkinOwned = item.mainTab === 'SKINS' && (ownedSkins || []).includes(String(item.id));
    let skinHeroId = '';
    if (String(item.id).includes('panda')) skinHeroId = 'panda';
    else if (String(item.id).includes('wolf')) skinHeroId = 'wolf_knight';

    const isSkinEquipped = item.mainTab === 'SKINS' && skinHeroId && equippedSkins?.[skinHeroId] === String(item.id);

    const isArsenalItem = item.mainTab === 'ARSENAL';
    const isEquipped =
        isArsenalItem &&
        Object.values(heroEquipment || {}).some(
            (gear: any) => gear && Object.values(gear).some((eqId) => String(eqId) === String(item.id)),
        );
    const isOwnedInInventory = isArsenalItem && (inventory || []).some((i: any) => String(i.id) === String(item.id));
    const isOwned = isEquipped || isOwnedInInventory;

    const isLevelLocked = item.requiredLevel !== undefined && item.requiredLevel > (level || 1);

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
                disabled={isPurchasing}
                onClick={isPurchasing ? undefined : handleSkinEquip}
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
                    cursor: isPurchasing ? 'not-allowed' : 'pointer',
                    opacity: isPurchasing ? 0.7 : 1,
                }}
            >
                {isPurchasing ? 'ОБРАБОТКА... ⏳' : isSkinEquipped ? 'СНЯТЬ ОБЛИК' : 'НАДЕТЬ ОБЛИК'}
            </button>
        );
    }

    const originalPrice = item.priceGold ?? item.priceGem ?? item.priceVotes;
    const hasDiscount = discount > 0 && originalPrice !== undefined;
    const price =
        hasDiscount && originalPrice ? Math.max(1, Math.round(originalPrice * (1 - discount / 100))) : originalPrice;
    const isGem = item.priceGem !== undefined;

    return (
        <button
            disabled={isLevelLocked || isOwned || isPurchasing}
            onClick={isLevelLocked || isOwned || isPurchasing ? undefined : onTrigger}
            style={{
                width: '100%',
                height: '50px',
                background:
                    isLevelLocked || isOwned || isPurchasing
                        ? 'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)'
                        : item.isAd
                          ? 'linear-gradient(180deg, #10b981 0%, #047857 100%)'
                          : item.priceVotes !== undefined
                            ? 'linear-gradient(180deg, #2b82c9 0%, #1a5c96 100%)'
                            : isGem
                              ? 'linear-gradient(180deg, #a855f7 0%, #6b21a8 100%)'
                              : 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                border:
                    isLevelLocked || isOwned || isPurchasing
                        ? '1px solid #4b5563'
                        : item.isAd
                          ? '1px solid #059669'
                          : item.priceVotes !== undefined
                            ? '1px solid #52a1e5'
                            : isGem
                              ? '1px solid #c084fc'
                              : '1px solid #ffdf00',
                borderRadius: '8px',
                color:
                    isLevelLocked || isOwned || isPurchasing
                        ? '#9ca3af'
                        : item.priceVotes !== undefined || item.isAd || isGem
                          ? '#fff'
                          : '#1a0f00',
                fontWeight: 900,
                fontFamily: "'Cinzel', 'Philosopher', serif",
                fontSize: '16px',
                cursor: isLevelLocked || isOwned || isPurchasing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isPurchasing ? 0.7 : 1,
            }}
            title={isLevelLocked ? `Требуется уровень ${item.requiredLevel}` : undefined}
        >
            {isPurchasing ? (
                <>ОБРАБОТКА... ⏳</>
            ) : isLevelLocked ? (
                <>ТРЕБУЕТСЯ УР. {item.requiredLevel} 🔒</>
            ) : isOwned ? (
                <>КУПЛЕНО</>
            ) : item.isAd ? (
                <>СМОТРЕТЬ РЕКЛАМУ 📺</>
            ) : item.priceVotes !== undefined ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <VkIcon />
                    <span>
                        {item.priceVotes} {getVotesPlural(item.priceVotes)}
                    </span>
                </div>
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
