import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ITEMS_DATABASE, calculateItemPower } from '../../../../../../game/configs/ItemsConfig';
import { useGameStore } from '../../../../../../store/useGameStore';
import { getHeroExpNeeded } from '../../../../../../features/heroes/leveling/HeroLevelConfig';
import { audioService } from '../../../../../../services/AudioService';
import { AssetsMap } from '../../../../../../configs/AssetsMap';
import { EquippedHeroView } from '../../../../EquippedHeroView';
import { InventoryPanel } from '../../../InventoryPanel';
import { rarityColors } from '../../constants/roleIcons';
import { SKINS_DB } from '../../../../../../configs/SkinsConfig';

import { CornerDecoration, stoneBrickPattern } from './decorations';
import { EquipmentSlot } from './EquipmentSlot';
import { HeroStatsPanel } from './HeroStatsPanel';
import { useGraphicsConfig } from '../../../../../hooks/useGraphicsConfig';
import './gear-view-symmetrical.css';

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
    const gfx = useGraphicsConfig();

    // Memoised particles — random positions fixed on mount, not re-randomised on re-render
    const particles = useMemo(() => [
        { id: 0,  left: '28%', bottom: '160px', dur: '5.2s', delay: '0.0s', drift:  '18px' },
        { id: 1,  left: '35%', bottom: '165px', dur: '6.8s', delay: '1.3s', drift: '-12px' },
        { id: 2,  left: '42%', bottom: '158px', dur: '4.9s', delay: '0.7s', drift:  '22px' },
        { id: 3,  left: '50%', bottom: '162px', dur: '7.1s', delay: '2.1s', drift:  '-8px' },
        { id: 4,  left: '57%', bottom: '170px', dur: '5.5s', delay: '0.4s', drift:  '15px' },
        { id: 5,  left: '63%', bottom: '155px', dur: '6.2s', delay: '1.8s', drift: '-20px' },
        { id: 6,  left: '70%', bottom: '163px', dur: '4.7s', delay: '0.9s', drift:  '10px' },
        { id: 7,  left: '33%', bottom: '168px', dur: '8.0s', delay: '3.0s', drift: '-16px' },
        { id: 8,  left: '46%', bottom: '157px', dur: '5.8s', delay: '1.5s', drift:  '25px' },
        { id: 9,  left: '54%', bottom: '172px', dur: '6.4s', delay: '2.6s', drift:  '-9px' },
        { id: 10, left: '38%', bottom: '161px', dur: '7.3s', delay: '0.2s', drift:  '13px' },
        { id: 11, left: '61%', bottom: '166px', dur: '5.0s', delay: '1.1s', drift: '-24px' },
    ], []);

    const diffs: any = { hp: 0, attack: 0, defense: 0 };
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
    const [showPowerTooltip, setShowPowerTooltip] = useState(false);
    const [showHpTooltip, setShowHpTooltip] = useState(false);
    const [showAttackTooltip, setShowAttackTooltip] = useState(false);
    const [showDefenseTooltip, setShowDefenseTooltip] = useState(false);
    const [showSpeedTooltip, setShowSpeedTooltip] = useState(false);
    const [showCritTooltip, setShowCritTooltip] = useState(false);

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
            {/* Symmetrical Hero Card (combines old left & center panels) */}
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
                <div
                    className="symmetrical-hero-card"
                    style={{
                        background: `${stoneBrickPattern}, linear-gradient(180deg, rgba(24, 18, 15, 0.98) 0%, rgba(12, 9, 8, 1.0) 100%)`
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


                    {/* ── Atmospheric inner fog (MEDIUM+) ── */}
                    {!gfx.isLow && <div className="frame-atmosphere" />}

                    {/* ── Ground spotlight (MEDIUM+) ── */}
                    {!gfx.isLow && <div className="character-spotlight" />}

                    {/* ── Rim light on character silhouette (ULTRA) ── */}
                    {gfx.isUltra && <div className="character-rimlight" />}

                    {/* ── Scan line sweep (ULTRA) ── */}
                    {gfx.isUltra && <div className="frame-scan-line" />}

                    {/* ── Floating particles (ULTRA only) ── */}
                    {gfx.showParticles && gfx.isUltra && particles.map((p) => (
                        <div
                            key={p.id}
                            className="gear-particle"
                            style={{
                                left: p.left,
                                bottom: p.bottom,
                                '--dur': p.dur,
                                '--delay': p.delay,
                                '--drift': p.drift,
                            } as React.CSSProperties}
                        />
                    ))}

                    {/* ── Rectangular ornate frame around character ── */}
                    <div className="character-frame-rect">
                        {/* Corner L-bars */}
                        <div className="frame-corner frame-corner-tl" />
                        <div className="frame-corner frame-corner-tr" />
                        <div className="frame-corner frame-corner-bl" />
                        <div className="frame-corner frame-corner-br" />
                        {/* Corner diamonds */}
                        <div className="frame-corner-diamond frame-corner-diamond-tl" />
                        <div className="frame-corner-diamond frame-corner-diamond-tr" />
                        <div className="frame-corner-diamond frame-corner-diamond-bl" />
                        <div className="frame-corner-diamond frame-corner-diamond-br" />
                        {/* Mid-edge gems */}
                        <div className="frame-side-gem frame-side-gem-left" />
                        <div className="frame-side-gem frame-side-gem-right" />
                        <div className="frame-side-gem frame-side-gem-top" />
                        <div className="frame-side-gem frame-side-gem-bottom" />
                    </div>


                    {/* ── Connector lines LEFT (slot right edge → frame left edge) ── */}
                    <div className={`slot-connector-left conn-helm ${gfx.isUltra ? 'with-pulse' : ''}`} />
                    <div className={`slot-connector-left conn-shoulders ${gfx.isUltra ? 'with-pulse' : ''}`} />
                    <div className={`slot-connector-left conn-armor ${gfx.isUltra ? 'with-pulse' : ''}`} />
                    <div className={`slot-connector-left conn-pants ${gfx.isUltra ? 'with-pulse' : ''}`} />

                    {/* ── Connector lines RIGHT (frame right edge → slot left edge) ── */}
                    <div className={`slot-connector-right conn-weapons ${gfx.isUltra ? 'with-pulse' : ''}`} />
                    <div className={`slot-connector-right conn-shields ${gfx.isUltra ? 'with-pulse' : ''}`} />
                    <div className={`slot-connector-right conn-boots ${gfx.isUltra ? 'with-pulse' : ''}`} />

                    {/* ── LEFT COLUMN SLOTS ── */}
                    <div className="equipment-slot-wrapper slot-helm">
                        <EquipmentSlot
                            id="HELMETS"
                            itemId={equippedIds.HELMETS}
                            activeDraggingId={activeDraggingId}
                            onClick={() => { if (equippedIds.HELMETS) handleUnequip(equippedIds.HELMETS); }}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                        <div className="slot-wrapper-label">ШЛЕМ</div>
                    </div>
                    <div className="equipment-slot-wrapper slot-shoulders">
                        <EquipmentSlot
                            id="SHOULDERS"
                            itemId={equippedIds.SHOULDERS}
                            activeDraggingId={activeDraggingId}
                            onClick={() => { if (equippedIds.SHOULDERS) handleUnequip(equippedIds.SHOULDERS); }}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                        <div className="slot-wrapper-label">ПЛЕЧИ</div>
                    </div>
                    <div className="equipment-slot-wrapper slot-armor">
                        <EquipmentSlot
                            id="ARMOR"
                            itemId={equippedIds.ARMOR}
                            activeDraggingId={activeDraggingId}
                            onClick={() => { if (equippedIds.ARMOR) handleUnequip(equippedIds.ARMOR); }}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                        <div className="slot-wrapper-label">ДОСПЕХ</div>
                    </div>
                    <div className="equipment-slot-wrapper slot-pants">
                        <EquipmentSlot
                            id="PANTS"
                            itemId={equippedIds.PANTS}
                            activeDraggingId={activeDraggingId}
                            onClick={() => { if (equippedIds.PANTS) handleUnequip(equippedIds.PANTS); }}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                        <div className="slot-wrapper-label">ПОНОЖИ</div>
                    </div>

                    {/* ── RIGHT COLUMN SLOTS ── */}
                    <div className="equipment-slot-wrapper slot-weapons">
                        <EquipmentSlot
                            id="WEAPONS"
                            itemId={equippedIds.WEAPONS}
                            activeDraggingId={activeDraggingId}
                            onClick={() => { if (equippedIds.WEAPONS) handleUnequip(equippedIds.WEAPONS); }}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                        <div className="slot-wrapper-label">ОРУЖИЕ</div>
                    </div>
                    <div className="equipment-slot-wrapper slot-shields">
                        <EquipmentSlot
                            id="SHIELDS"
                            itemId={equippedIds.SHIELDS}
                            activeDraggingId={activeDraggingId}
                            onClick={() => { if (equippedIds.SHIELDS) handleUnequip(equippedIds.SHIELDS); }}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                        <div className="slot-wrapper-label">ЩИТ</div>
                    </div>
                    <div className="equipment-slot-wrapper slot-boots">
                        <EquipmentSlot
                            id="BOOTS"
                            itemId={equippedIds.BOOTS}
                            activeDraggingId={activeDraggingId}
                            onClick={() => { if (equippedIds.BOOTS) handleUnequip(equippedIds.BOOTS); }}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                        <div className="slot-wrapper-label">САПОГИ</div>
                    </div>

                    {/* Dynamic Breathing Backlight Halo */}
                    <div
                        className="breathing-backlight"
                        style={{
                            background: `radial-gradient(circle, ${activeRarityColor}66 0%, transparent 70%)`,
                            '--glow-color': `${activeRarityColor}33`,
                        } as any}
                    />

                    {/* Pedestal */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '255px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '940px',
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
                            top: '330px',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(1.05)',
                            zIndex: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.85))',
                        }}
                    >
                        <EquippedHeroView heroId={hero.id} size={460} />
                    </div>

                    {/* Bottom Stats Card */}
                    <div className="mockup-stats-card">
                        <div className="stats-card-inner-border" />
                        <div
                            className="mockup-stat-item"
                            onMouseEnter={() => setShowPowerTooltip(true)}
                            onMouseLeave={() => setShowPowerTooltip(false)}
                            style={{ position: 'relative' }}
                        >
                            {showPowerTooltip && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '115%',
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
                                        fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    }}
                                >
                                    <div style={{ color: '#f5be38', fontWeight: 900, marginBottom: '5px', letterSpacing: '1px' }}>
                                        ОБЩАЯ МОЩЬ
                                    </div>
                                    <div style={{ color: '#dddddd', fontSize: '11px', lineHeight: '1.4' }}>
                                        Сила персонажа, рассчитанная на основе надетой экипировки.
                                    </div>
                                </div>
                            )}
                            <div className="mockup-stat-label" style={{ color: '#f0c040', textShadow: '0 0 5px rgba(240, 192, 64, 0.3)' }}>МОЩЬ</div>
                            <div className="mockup-stat-value power" style={{
                                background: 'linear-gradient(180deg, #ffffff 0%, #f0c040 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            }}>
                                <img
                                    src="/assets/images/ui/mosh.png"
                                    style={{
                                        height: '20px',
                                        width: '20px',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                                    }}
                                    alt="Мощь"
                                />
                                {gearPower}
                            </div>
                        </div>
                        <div
                            className="mockup-stat-item"
                            onMouseEnter={() => setShowHpTooltip(true)}
                            onMouseLeave={() => setShowHpTooltip(false)}
                            style={{ position: 'relative' }}
                        >
                            {showHpTooltip && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '115%',
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
                                        fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    }}
                                >
                                    <div style={{ color: '#f43f5e', fontWeight: 900, marginBottom: '5px', letterSpacing: '1px' }}>
                                        МАКСИМАЛЬНОЕ ЗДОРОВЬЕ
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span>Базовое:</span>
                                        <span>{baseStats.hp}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                                        <span>Бонус экипировки:</span>
                                        <span>+{currentStats.hp - baseStats.hp}</span>
                                    </div>
                                </div>
                            )}
                            <div className="mockup-stat-label">ЗДОРОВЬЕ</div>
                            <div className="mockup-stat-value hp">❤️ {currentStats.hp}</div>
                        </div>

                        <div
                            className="mockup-stat-item"
                            onMouseEnter={() => setShowAttackTooltip(true)}
                            onMouseLeave={() => setShowAttackTooltip(false)}
                            style={{ position: 'relative' }}
                        >
                            {showAttackTooltip && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '115%',
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
                                        fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    }}
                                >
                                    <div style={{ color: '#3b82f6', fontWeight: 900, marginBottom: '5px', letterSpacing: '1px' }}>
                                        СИЛА АТАКИ
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span>Базовая:</span>
                                        <span>{baseStats.attack}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                                        <span>Бонус экипировки:</span>
                                        <span>+{currentStats.attack - baseStats.attack}</span>
                                    </div>
                                </div>
                            )}
                            <div className="mockup-stat-label">АТАКА</div>
                            <div className="mockup-stat-value attack">⚔️ {currentStats.attack}</div>
                        </div>

                        <div
                            className="mockup-stat-item"
                            onMouseEnter={() => setShowDefenseTooltip(true)}
                            onMouseLeave={() => setShowDefenseTooltip(false)}
                            style={{ position: 'relative' }}
                        >
                            {showDefenseTooltip && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '115%',
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
                                        fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    }}
                                >
                                    <div style={{ color: '#10b981', fontWeight: 900, marginBottom: '5px', letterSpacing: '1px' }}>
                                        ПОКАЗАТЕЛЬ ЗАЩИТЫ
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span>Базовая:</span>
                                        <span>{baseStats.defense}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                                        <span>Бонус экипировки:</span>
                                        <span>+{currentStats.defense - baseStats.defense}</span>
                                    </div>
                                </div>
                            )}
                            <div className="mockup-stat-label">ЗАЩИТА</div>
                            <div className="mockup-stat-value defense">🛡️ {currentStats.defense}</div>
                        </div>

                        <div
                            className="mockup-stat-item"
                            onMouseEnter={() => setShowSpeedTooltip(true)}
                            onMouseLeave={() => setShowSpeedTooltip(false)}
                            style={{ position: 'relative' }}
                        >
                            {showSpeedTooltip && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '115%',
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
                                        fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    }}
                                >
                                    <div style={{ color: '#22c55e', fontWeight: 900, marginBottom: '5px', letterSpacing: '1px' }}>
                                        СКОРОСТЬ ПЕРСОНАЖА
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span>Базовая:</span>
                                        <span>{(baseStats.speed ?? 0).toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                                        <span>Бонус экипировки:</span>
                                        <span>+{Math.max(0, (currentStats.speed ?? 0) - (baseStats.speed ?? 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                            <div className="mockup-stat-label">СКОРОСТЬ</div>
                            <div className="mockup-stat-value speed" style={{ color: '#22c55e' }}>💨 {(currentStats.speed ?? 0).toFixed(2)}</div>
                        </div>

                        <div
                            className="mockup-stat-item"
                            onMouseEnter={() => setShowCritTooltip(true)}
                            onMouseLeave={() => setShowCritTooltip(false)}
                            style={{ position: 'relative' }}
                        >
                            {showCritTooltip && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '115%',
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
                                        fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    }}
                                >
                                    <div style={{ color: '#a855f7', fontWeight: 900, marginBottom: '5px', letterSpacing: '1px' }}>
                                        КРИТ. ШАНС
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span>Базовый:</span>
                                        <span>{Math.round(baseStats.critChance ?? 0)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                                        <span>Бонус экипировки:</span>
                                        <span>+{Math.round((currentStats.critChance ?? 0) - (baseStats.critChance ?? 0))}%</span>
                                    </div>
                                </div>
                            )}
                            <div className="mockup-stat-label">КРИТ. ШАНС</div>
                            <div className="mockup-stat-value crit" style={{ color: '#a855f7' }}>💥 {Math.round(currentStats.critChance ?? 0)}%</div>
                        </div>
                    </div>

                    {/* Bottom XP Progress Bar & unified Nameplate */}
                    <div className="mockup-xp-panel">

                        <div className="mockup-xp-name-row">
                            <span className="mockup-xp-hero-name">{displayHeroName}</span>
                            <span className="mockup-xp-level-badge">ур. {heroLevel}</span>
                        </div>

                        <div className="mockup-xp-title-row">
                            <div className="title-divider-line" />
                            <div className="mockup-xp-hero-title">
                                {!isDefaultSkin ? activeSkin.name : hero.title}
                            </div>
                            <div className="title-divider-line" />
                        </div>

                        <div className="mockup-xp-bar-container">
                            <div className="mockup-xp-bar-bg">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpPercentage}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className="mockup-xp-bar-fill"
                                />
                            </div>
                            <div className="mockup-xp-labels-row">
                                <span className="mockup-xp-label">ОПЫТ ГЕРОЯ</span>
                                <span className="mockup-xp-value">
                                    {heroExp} <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>/</span> {xpNeeded} ({Math.round(xpPercentage)}%)
                                </span>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            <div style={{ width: '560px', display: 'flex', flexDirection: 'column', zIndex: 5 }}>
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
                    {['INVENTORY', 'LORE'].map((tab) => {
                        const active = detailSubTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setDetailSubTab(tab as any);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '13px 8px',
                                    background: active
                                        ? 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)'
                                        : 'rgba(28, 22, 18, 0.5)',
                                    color: active ? '#1a0f00' : 'rgba(255, 254, 250, 0.6)',
                                    border: active ? '1.5px solid #fffdf7' : '1px solid rgba(240, 192, 64, 0.15)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 900,
                                    fontSize: '12px',
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
                                {tab === 'INVENTORY'
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
                    {detailSubTab === 'INVENTORY' ? (
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
