import { useState } from 'react';
import { motion } from 'framer-motion';
import { ITEMS_DATABASE, calculateItemPower } from '../../../../../../game/configs/ItemsConfig';
import { useGameStore } from '../../../../../../store/useGameStore';
import { getHeroExpNeeded } from '../../../../../../utils/HeroLevelCalculator';
import { audioService } from '../../../../../../services/AudioService';
import { AssetsMap } from '../../../../../../configs/AssetsMap';
import { EquippedHeroView } from '../../../../EquippedHeroView';
import { InventoryPanel } from '../../../InventoryPanel';
import { rarityColors } from '../../constants/roleIcons';
import { SKINS_DB } from '../../../../../../configs/SkinsConfig';
import { TalentsView } from '../Talents/TalentsView';

import { CornerDecoration, stoneBrickPattern } from './decorations';
import { GearSlotGrid } from './GearSlotGrid';
import { HeroStatsPanel } from './HeroStatsPanel';

export const GearView = ({
    hero,
    stats,
    detailSubTab,
    setDetailSubTab,
    handleItemClick,
    isEquipped,
    equippedIds = {},
    activeDraggingId,
    unequipItem,
    addFloatingText,
    setGlobalHoveredItem,
}: any) => {
    const equippedSkins = useGameStore((s: any) => s.equippedSkins) || {};
    const equippedSkinId = equippedSkins[hero.id] || 'default';
    const activeSkin = SKINS_DB.find((s) => s.id === equippedSkinId && s.heroId === hero.id);
    const isDefaultSkin = !activeSkin || activeSkin.id === 'default' || activeSkin.id.endsWith('_default');

    const heroesState = useGameStore((s: any) => s.heroes) || {};
    const heroState = heroesState[hero.id] || { level: 1, exp: 0 };
    const heroLevel = heroState.level || 1;
    const heroExp = heroState.exp || 0;
    const xpNeeded = getHeroExpNeeded(heroLevel);
    const xpPercentage = heroLevel >= 10 ? 100 : Math.min(100, (heroExp / xpNeeded) * 100);
    const displayHeroName = hero.name;
    const activeRarity = !isDefaultSkin ? activeSkin.rarity : hero.rarity;
    const activeRarityColor = rarityColors[activeRarity] || '#f0c040';

    const currentStats = stats?.total || {
        hp: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        critChance: 0,
        evasion: 0,
        lifesteal: 0,
        penetration: 0,
        critDamage: 1.5,
    };
    const baseStats = stats?.base || currentStats;

    const diffs: any = { hp: 0, attack: 0, defense: 0 };
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
    const [showPowerTooltip, setShowPowerTooltip] = useState(false);

    const { inventory: rawInventory } = useGameStore();
    const inventory = rawInventory || [];

    const gearPower = Object.values(equippedIds).reduce((acc: number, itemId: any) => {
        if (!itemId) return acc;
        const invItem = inventory.find(
            (i: any) => String(i.instanceId) === String(itemId) || String(i.id) === String(itemId),
        );
        const templateId = invItem ? invItem.id : itemId;
        const item = ITEMS_DATABASE[String(templateId)] as any;
        if (!item) return acc;

        const lvl = invItem?.level || 1;
        const mult = lvl === 3 ? 1.35 : lvl === 2 ? 1.15 : 1.0;

        return acc + Math.round(calculateItemPower(item) * mult);
    }, 0);

    const onInternalItemClick = (id: string) => {
        setLocalSelectedId(id);
        handleItemClick(id);
    };

    const handleUnequip = (itemId: string) => {
        const invItem = inventory.find(
            (i: any) => String(i.instanceId) === String(itemId) || String(i.id) === String(itemId),
        );
        const templateId = invItem ? invItem.id : itemId;
        const item = ITEMS_DATABASE[String(templateId)] as any;
        if (item) {
            if (item.attackBonus) addFloatingText(`-${item.attackBonus} АТАКА`, '#ef4444');
            if (item.hpBonus) addFloatingText(`-${item.hpBonus} ЗДОРОВЬЕ`, '#ef4444');
            if (item.defenseBonus) addFloatingText(`-${item.defenseBonus} ЗАЩИТА`, '#ef4444');
            unequipItem(itemId);
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        }
    };

    if (localSelectedId && !isEquipped(localSelectedId)) {
        const selInvItem = inventory.find(
            (i: any) => String(i.instanceId) === String(localSelectedId) || String(i.id) === String(localSelectedId),
        );
        const selTemplateId = selInvItem ? selInvItem.id : localSelectedId;
        const selItem = ITEMS_DATABASE[String(selTemplateId)] as any;
        if (selItem) {
            const equippedId = equippedIds[selItem.subTab];
            const eqInvItem = equippedId
                ? inventory.find(
                      (i: any) => String(i.instanceId) === String(equippedId) || String(i.id) === String(equippedId),
                  )
                : null;
            const eqTemplateId = eqInvItem ? eqInvItem.id : equippedId;
            const equippedItem = eqTemplateId ? (ITEMS_DATABASE[String(eqTemplateId)] as any) : null;

            if (['WEAPONS', 'HELMETS', 'ARMOR', 'SHIELDS'].includes(selItem.subTab)) {
                const eqLvl = eqInvItem?.level || 1;
                const eqMult = eqLvl === 3 ? 1.35 : eqLvl === 2 ? 1.15 : 1.0;

                const selLvl = selInvItem?.level || 1;
                const selMult = selLvl === 3 ? 1.35 : selLvl === 2 ? 1.15 : 1.0;

                diffs.hp = (selItem.hpBonus || 0) * selMult - (equippedItem?.hpBonus || 0) * eqMult;
                diffs.attack = (selItem.attackBonus || 0) * selMult - (equippedItem?.attackBonus || 0) * eqMult;
                diffs.defense = (selItem.defenseBonus || 0) * selMult - (equippedItem?.defenseBonus || 0) * eqMult;
            }
        }
    }

    return (
        <motion.div
            key="hero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{
                position: 'absolute',
                inset: '20px 20px 20px 40px',
                display: 'flex',
                gap: '24px',
                alignItems: 'stretch',
            }}
        >
            {/* ЛЕВАЯ ПАНЕЛЬ: КУКЛА ПЕРСОНАЖА */}
            <div
                style={{
                    width: '420px',
                    height: '100%',
                    background: `${stoneBrickPattern}, linear-gradient(135deg, rgba(28, 22, 18, 0.99) 0%, rgba(16, 12, 10, 1.0) 100%)`,
                    borderRadius: '30px',
                    border: '1.5px solid rgba(240, 192, 64, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '30px',
                    gap: '20px',
                    zIndex: 5,
                    position: 'relative',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.85), 0 20px 40px rgba(0,0,0,0.6)',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: '8px',
                        border: '1px solid rgba(240, 192, 64, 0.15)',
                        borderRadius: '24px',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />
                <CornerDecoration />

                <div style={{ textAlign: 'center', zIndex: 2 }}>
                    <h3
                        style={{
                            color: '#f0c040',
                            fontSize: '20px',
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            letterSpacing: '3px',
                            margin: 0,
                            textShadow: '0 0 10px rgba(240, 192, 64, 0.25)',
                        }}
                    >
                        СНАРЯЖЕНИЕ
                    </h3>
                    <div
                        style={{
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, #f0c040, transparent)',
                            marginTop: '10px',
                            opacity: 0.5,
                        }}
                    />
                </div>

                <div
                    style={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <GearSlotGrid
                        equippedIds={equippedIds}
                        activeDraggingId={activeDraggingId}
                        handleUnequip={handleUnequip}
                        setGlobalHoveredItem={setGlobalHoveredItem}
                    />
                </div>

                <div
                    onMouseEnter={() => setShowPowerTooltip(true)}
                    onMouseLeave={() => setShowPowerTooltip(false)}
                    style={{
                        position: 'relative',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '15px',
                        borderRadius: '20px',
                        border: '1px solid rgba(240,192,64,0.15)',
                        textAlign: 'center',
                        marginTop: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                        cursor: 'help',
                    }}
                >
                    {showPowerTooltip && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '110%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.95)',
                                border: '1px solid #f0c040',
                                padding: '12px',
                                borderRadius: '12px',
                                width: '220px',
                                fontSize: '12px',
                                color: '#fff',
                                zIndex: 100,
                                pointerEvents: 'none',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div
                                style={{ color: '#f0c040', fontWeight: 900, marginBottom: '5px', letterSpacing: '1px' }}
                            >
                                БОЕВАЯ МОЩЬ
                            </div>
                            Суммарный показатель силы вашего снаряжения. Учитывает бонусы атаки, защиты и здоровья от
                            всех надетых предметов.
                        </div>
                    )}
                    <div
                        style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '10px',
                            fontWeight: 900,
                            letterSpacing: '3px',
                            marginBottom: '5px',
                        }}
                    >
                        ОБЩАЯ МОЩЬ
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span
                            style={{
                                background: 'linear-gradient(180deg, #ffffff 0%, #f0c040 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '36px',
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 900,
                                letterSpacing: '1px',
                                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
                            }}
                        >
                            {Math.floor(gearPower)}
                        </span>
                        <img
                            src="/assets/images/ui/mosh.png"
                            style={{
                                height: '35px',
                                width: '35px',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))',
                            }}
                            alt="Мощь"
                        />
                    </div>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    margin: '0 4px',
                }}
            >
                {/* Showcase Alcove Frame */}
                <div
                    style={{
                        width: '560px',
                        height: '100%',
                        background: `${stoneBrickPattern}, linear-gradient(180deg, rgba(24, 18, 15, 0.98) 0%, rgba(12, 9, 8, 1.0) 100%)`,
                        borderRadius: '30px',
                        border: '1.5px solid rgba(240, 192, 64, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingBottom: '25px',
                        position: 'relative',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9), 0 20px 40px rgba(0,0,0,0.65)',
                        zIndex: 5,
                        overflow: 'visible',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: '8px',
                            border: '1px solid rgba(240, 192, 64, 0.15)',
                            borderRadius: '24px',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />
                    <CornerDecoration />

                    {/* Dynamic Breathing Backlight Halo */}
                    <motion.div
                        animate={{
                            opacity: [0.75, 1.0, 0.75],
                            scale: [0.93, 1.05, 0.93],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        style={{
                            position: 'absolute',
                            bottom: '290px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '450px',
                            height: '450px',
                            background: `radial-gradient(circle, ${activeRarityColor}66 0%, transparent 70%)`,
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />

                    {/* Pedestal */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '230px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '760px',
                            height: '450px',
                            backgroundImage: `url("${AssetsMap.UI.HERO_PEDESTAL}")`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            zIndex: 2,
                            opacity: 0.95,
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Character Model */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '250px',
                            left: '50%',
                            transform: 'translateX(-50%) scale(1.05)',
                            zIndex: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.85))',
                        }}
                    >
                        <EquippedHeroView heroId={hero.id} size={580} />
                    </div>

                    {/* Premium Nameplate Plaque */}
                    <div
                        style={{
                            width: '88%',
                            textAlign: 'center',
                            zIndex: 10,
                            background:
                                'linear-gradient(180deg, rgba(32, 25, 20, 0.98) 0%, rgba(16, 12, 10, 0.99) 100%)',
                            padding: '16px 20px',
                            borderRadius: '18px',
                            border: '1.5px solid rgba(240, 192, 64, 0.35)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.85), inset 0 0 15px rgba(0,0,0,0.7)',
                            marginBottom: '10px',
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: '#f0c040',
                                opacity: 0.7,
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: '#f0c040',
                                opacity: 0.7,
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '6px',
                                left: '6px',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: '#f0c040',
                                opacity: 0.7,
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: '#f0c040',
                                opacity: 0.7,
                            }}
                        />

                        {/* Top Accent bar */}
                        <div
                            style={{
                                position: 'absolute',
                                top: -1,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '60px',
                                height: '2px',
                                background:
                                    'linear-gradient(90deg, transparent, #f0c040 30%, #fff 50%, #f0c040 70%, transparent)',
                                boxShadow: '0 0 8px #f0c040',
                            }}
                        />

                        <h2
                            style={{
                                color: '#f0c040',
                                fontSize: '26px',
                                margin: 0,
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                lineHeight: '1.2',
                            }}
                        >
                            <span
                                style={{
                                    background: 'linear-gradient(180deg, #ffffff 0%, #f5be38 50%, #a07010 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))',
                                }}
                            >
                                {displayHeroName}
                            </span>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #2a1808 0%, #150f08 100%)',
                                    border: '1px solid rgba(240, 192, 64, 0.5)',
                                    borderRadius: '5px',
                                    padding: '2px 8px',
                                    fontSize: '13px',
                                    color: '#fff',
                                    marginLeft: '10px',
                                    verticalAlign: 'middle',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                                    fontFamily: "'Philosopher', sans-serif",
                                    fontWeight: 'bold',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                ур. {heroLevel}
                            </span>
                        </h2>

                        {/* Title with decorative wings */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                margin: '6px 0 12px 0',
                            }}
                        >
                            <div
                                style={{
                                    width: '30px',
                                    height: '1px',
                                    background: 'linear-gradient(90deg, transparent, rgba(240, 192, 64, 0.45))',
                                }}
                            />
                            <span
                                style={{
                                    color: !isDefaultSkin && activeSkin.color ? activeSkin.color : activeRarityColor,
                                    fontWeight: 900,
                                    letterSpacing: '3px',
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                }}
                            >
                                {!isDefaultSkin ? activeSkin.name : hero.title}
                            </span>
                            <div
                                style={{
                                    width: '30px',
                                    height: '1px',
                                    background: 'linear-gradient(270deg, transparent, rgba(240, 192, 64, 0.45))',
                                }}
                            />
                        </div>

                        {/* XP Progress Bar */}
                        {heroLevel < 10 ? (
                            <div style={{ width: '100%', margin: '0 auto' }}>
                                <div
                                    style={{
                                        height: '8px',
                                        background: 'rgba(10, 8, 6, 0.85)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(240, 192, 64, 0.25)',
                                        position: 'relative',
                                        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.8)',
                                    }}
                                >
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpPercentage}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #eab308 100%)',
                                            borderRadius: '4px',
                                            position: 'relative',
                                            boxShadow:
                                                '0 0 10px rgba(217, 70, 239, 0.7), 0 0 15px rgba(234, 179, 8, 0.3)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundImage:
                                                    'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                                backgroundSize: '12px 12px',
                                                opacity: 0.25,
                                                animation: 'move-stripes 2s linear infinite',
                                            }}
                                        />
                                    </motion.div>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '10px',
                                        color: '#d97706',
                                        marginTop: '5px',
                                        fontWeight: 800,
                                        letterSpacing: '0.5px',
                                        fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    }}
                                >
                                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>ОПЫТ ГЕРОЯ</span>
                                    <span>
                                        {heroExp} <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>/</span>{' '}
                                        {xpNeeded} ({Math.round(xpPercentage)}%)
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: '#eab308',
                                    fontWeight: 900,
                                    letterSpacing: '1.5px',
                                    textShadow: '0 0 8px rgba(234, 179, 8, 0.4)',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ 🏆
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ width: '480px', display: 'flex', flexDirection: 'column', zIndex: 5 }}>
                <div
                    style={{
                        display: 'flex',
                        background: 'rgba(20, 16, 12, 0.65)',
                        borderRadius: '12px',
                        padding: '4px',
                        marginBottom: '20px',
                        gap: '6px',
                        border: '1px solid rgba(240, 192, 64, 0.22)',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
                    }}
                >
                    {['STATS', 'INVENTORY', 'TALENTS', 'LORE'].map((tab) => {
                        const active = detailSubTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setDetailSubTab(tab as any);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 4px',
                                    background: active
                                        ? 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)'
                                        : 'rgba(28, 22, 18, 0.5)',
                                    color: active ? '#1a0f00' : 'rgba(255, 254, 250, 0.6)',
                                    border: active ? '1.5px solid #fffdf7' : '1px solid rgba(240, 192, 64, 0.15)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 900,
                                    fontSize: '10.5px',
                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                    letterSpacing: '0.8px',
                                    textShadow: active
                                        ? '0 1px 2px rgba(255,255,255,0.2)'
                                        : '0 2px 4px rgba(0,0,0,0.8)',
                                    boxShadow: active
                                        ? '0 4px 10px rgba(240, 192, 64, 0.25)'
                                        : 'inset 0 2px 5px rgba(0,0,0,0.4)',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {tab === 'STATS'
                                    ? 'АТРИБУТЫ'
                                    : tab === 'INVENTORY'
                                      ? 'ИНВЕНТАРЬ'
                                      : tab === 'TALENTS'
                                        ? 'ТАЛАНТЫ'
                                        : 'ЛЕГЕНДА'}
                            </button>
                        );
                    })}
                </div>
                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        background: `${stoneBrickPattern}, linear-gradient(135deg, rgba(28, 22, 18, 0.99) 0%, rgba(16, 12, 10, 1.0) 100%)`,
                        borderRadius: '30px',
                        border: '1.5px solid rgba(240, 192, 64, 0.25)',
                        padding: '25px',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.85), 0 20px 40px rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: '8px',
                            border: '1px solid rgba(240, 192, 64, 0.15)',
                            borderRadius: '24px',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />
                    <CornerDecoration />
                    {detailSubTab === 'TALENTS' ? (
                        <TalentsView hero={hero} isCompact={true} />
                    ) : detailSubTab === 'INVENTORY' ? (
                        <InventoryPanel
                            mode="COMPACT"
                            onItemClick={onInternalItemClick}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                    ) : detailSubTab === 'STATS' ? (
                        <HeroStatsPanel
                            currentStats={currentStats}
                            baseStats={baseStats}
                        />
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                overflowY: 'auto',
                                paddingRight: '5px',
                                paddingTop: '5px',
                            }}
                            className="custom-scrollbar"
                        >
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <h4
                                    style={{
                                        margin: 0,
                                        color: '#f0c040',
                                        fontFamily: "'Cinzel', 'Philosopher', serif",
                                        fontSize: '18px',
                                        letterSpacing: '2px',
                                        fontWeight: 800,
                                    }}
                                >
                                    ИСТОРИЯ ПЕРСОНАЖА
                                </h4>
                                <div
                                    style={{
                                        height: '1px',
                                        background:
                                            'linear-gradient(90deg, transparent, rgba(240, 192, 64, 0.4), transparent)',
                                        marginTop: '8px',
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    color: '#dddddd',
                                    fontSize: '14px',
                                    lineHeight: '1.7',
                                    fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    textAlign: 'justify',
                                    whiteSpace: 'pre-wrap',
                                    padding: '0 5px 15px 5px',
                                }}
                            >
                                {hero.lore || 'История этого героя пока покрыта тайной...'}
                                {activeSkin && activeSkin.skinLore && (
                                    <div
                                        style={{
                                            marginTop: '20px',
                                            paddingTop: '20px',
                                            borderTop: '1px dashed rgba(240, 192, 64, 0.25)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: '#f0c040',
                                                fontWeight: 800,
                                                marginBottom: '8px',
                                                fontSize: '15px',
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            ✨ {activeSkin.name.toUpperCase()}
                                        </div>
                                        {activeSkin.skinLore}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
