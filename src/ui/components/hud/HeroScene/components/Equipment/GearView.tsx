import { useState } from 'react';
import { motion } from 'framer-motion';
import { ITEMS_DATABASE, calculateItemPower } from '../../../../../../game/configs/ItemsConfig';
import { useGameStore } from '../../../../../../store/useGameStore';
import { audioService } from '../../../../../../services/AudioService';
import { AssetsMap } from '../../../../../../configs/AssetsMap';
import { EquipmentSlot } from './EquipmentSlot';
import { EquippedHeroView } from '../../../../EquippedHeroView';
import { InventoryPanel } from '../../../InventoryPanel';
import { StatCard } from './StatCard';
import { rarityColors } from '../../constants/roleIcons';
import { SKINS_DB } from '../../../../../../configs/SkinsConfig';

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
    const displayHeroName = activeSkin && activeSkin.id !== 'default' ? activeSkin.name : hero.name;
    const activeRarity = activeSkin && activeSkin.id !== 'default' ? activeSkin.rarity : hero.rarity;
    const activeRarityColor = rarityColors[activeRarity] || '#f0c040';

    // stats теперь имеет структуру { base, total, weaponTexture }
    const currentStats = stats?.total || {
        hp: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        critChance: 0,
        evasion: 0,
        resilience: 0,
        lifesteal: 0,
        penetration: 0,
        critDamage: 1.5,
    };
    const baseStats = stats?.base || currentStats;

    const diffs: any = { hp: 0, attack: 0, defense: 0 };
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
    const [showPowerTooltip, setShowPowerTooltip] = useState(false);

    const { inventory } = useGameStore();

    const gearPower = Object.values(equippedIds).reduce((acc: number, itemId: any) => {
        if (!itemId) return acc;
        const item = ITEMS_DATABASE[String(itemId)] as any;
        if (!item) return acc;

        const invItem = inventory.find((i: any) => String(i.id) === String(itemId));
        const lvl = invItem?.level || 1;
        const mult = lvl === 3 ? 1.35 : lvl === 2 ? 1.15 : 1.0;

        return acc + Math.round(calculateItemPower(item) * mult);
    }, 0);

    const onInternalItemClick = (id: string) => {
        setLocalSelectedId(id);
        handleItemClick(id);
    };

    const handleUnequip = (itemId: string) => {
        const item = ITEMS_DATABASE[itemId] as any;
        if (item) {
            if (item.attackBonus) addFloatingText(`-${item.attackBonus} АТАКА`, '#ef4444');
            if (item.hpBonus) addFloatingText(`-${item.hpBonus} ЗДОРОВЬЕ`, '#ef4444');
            if (item.defenseBonus) addFloatingText(`-${item.defenseBonus} ЗАЩИТА`, '#ef4444');
            unequipItem(itemId);
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        }
    };

    if (localSelectedId && !isEquipped(localSelectedId)) {
        const selItem = ITEMS_DATABASE[localSelectedId] as any;
        if (selItem) {
            const equippedId = equippedIds[selItem.subTab];
            const equippedItem = equippedId ? (ITEMS_DATABASE[equippedId] as any) : null;
            if (['WEAPONS', 'HELMETS', 'ARMOR', 'SHIELDS'].includes(selItem.subTab)) {
                const eqInvItem = inventory.find((i: any) => String(i.id) === String(equippedId));
                const eqLvl = eqInvItem?.level || 1;
                const eqMult = eqLvl === 3 ? 1.35 : eqLvl === 2 ? 1.15 : 1.0;

                const selInvItem = inventory.find((i: any) => String(i.id) === String(localSelectedId));
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
                    background:
                        'radial-gradient(circle at 50% 30%, rgba(60, 40, 10, 0.4) 0%, rgba(10, 10, 15, 0.8) 70%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '30px',
                    border: '1px solid rgba(240, 192, 64, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '30px',
                    gap: '20px',
                    zIndex: 5,
                    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 20px 50px rgba(0,0,0,0.6)',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <h3
                        style={{
                            color: '#f0c040',
                            fontSize: '20px',
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            letterSpacing: '3px',
                            margin: 0,
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
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 110px)',
                            gridTemplateRows: 'repeat(4, 110px)',
                            gap: '15px',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '450px',
                                height: '450px',
                                marginLeft: '-225px',
                                marginTop: '-225px',
                                border: '1px dashed rgba(240,192,64,0.06)',
                                borderRadius: '50%',
                                pointerEvents: 'none',
                                zIndex: 0,
                            }}
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '350px',
                                height: '350px',
                                marginLeft: '-175px',
                                marginTop: '-175px',
                                border: '1px solid rgba(160,64,255,0.05)',
                                borderRadius: '50%',
                                pointerEvents: 'none',
                                zIndex: 0,
                            }}
                        />

                        {/* Ряд 1: Голова */}
                        <div style={{ zIndex: 1 }} />
                        <div style={{ zIndex: 1 }}>
                            <EquipmentSlot
                                id="HELMETS"
                                label="ШЛЕМЫ"
                                itemId={equippedIds.HELMETS}
                                activeDraggingId={activeDraggingId}
                                onClick={() => {
                                    if (equippedIds.HELMETS) handleUnequip(equippedIds.HELMETS);
                                }}
                                setGlobalHoveredItem={setGlobalHoveredItem}
                            />
                        </div>
                        <div style={{ zIndex: 1 }} />

                        {/* Ряд 2: Плечи и Доспех */}
                        <div style={{ zIndex: 1 }}>
                            <EquipmentSlot
                                id="SHOULDERS"
                                label="НАПЛЕЧНИКИ"
                                itemId={equippedIds.SHOULDERS}
                                activeDraggingId={activeDraggingId}
                                onClick={() => {
                                    if (equippedIds.SHOULDERS) handleUnequip(equippedIds.SHOULDERS);
                                }}
                                setGlobalHoveredItem={setGlobalHoveredItem}
                            />
                        </div>
                        <div style={{ zIndex: 1 }}>
                            <EquipmentSlot
                                id="ARMOR"
                                label="ДОСПЕХИ"
                                itemId={equippedIds.ARMOR}
                                activeDraggingId={activeDraggingId}
                                onClick={() => {
                                    if (equippedIds.ARMOR) handleUnequip(equippedIds.ARMOR);
                                }}
                                setGlobalHoveredItem={setGlobalHoveredItem}
                            />
                        </div>
                        <div style={{ zIndex: 1 }} />

                        {/* Ряд 3: Оружие, Поножи, Щит */}
                        <div style={{ zIndex: 1 }}>
                            <EquipmentSlot
                                id="WEAPONS"
                                label="ОРУЖИЕ"
                                itemId={equippedIds.WEAPONS}
                                activeDraggingId={activeDraggingId}
                                onClick={() => {
                                    if (equippedIds.WEAPONS) handleUnequip(equippedIds.WEAPONS);
                                }}
                                setGlobalHoveredItem={setGlobalHoveredItem}
                            />
                        </div>
                        <div style={{ zIndex: 1 }}>
                            <EquipmentSlot
                                id="PANTS"
                                label="ПОНОЖИ"
                                itemId={equippedIds.PANTS}
                                activeDraggingId={activeDraggingId}
                                onClick={() => {
                                    if (equippedIds.PANTS) handleUnequip(equippedIds.PANTS);
                                }}
                                setGlobalHoveredItem={setGlobalHoveredItem}
                            />
                        </div>
                        <div style={{ zIndex: 1 }}>
                            <EquipmentSlot
                                id="SHIELDS"
                                label="ЩИТЫ"
                                itemId={equippedIds.SHIELDS}
                                activeDraggingId={activeDraggingId}
                                onClick={() => {
                                    if (equippedIds.SHIELDS) handleUnequip(equippedIds.SHIELDS);
                                }}
                                setGlobalHoveredItem={setGlobalHoveredItem}
                            />
                        </div>

                        {/* Ряд 4: Сапоги */}
                        <div style={{ zIndex: 1 }} />
                        <div style={{ zIndex: 1 }}>
                            <EquipmentSlot
                                id="BOOTS"
                                label="САПОГИ"
                                itemId={equippedIds.BOOTS}
                                activeDraggingId={activeDraggingId}
                                onClick={() => {
                                    if (equippedIds.BOOTS) handleUnequip(equippedIds.BOOTS);
                                }}
                                setGlobalHoveredItem={setGlobalHoveredItem}
                            />
                        </div>
                        <div style={{ zIndex: 1 }} />
                    </div>
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
                    justifyContent: 'flex-end',
                    paddingBottom: '120px',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        bottom: '80px',
                        width: '900px',
                        height: '600px',
                        backgroundImage: `url("${AssetsMap.UI.HERO_PEDESTAL}")`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 1,
                        opacity: 0.9,
                    }}
                />
                <div
                    style={{
                        zIndex: 2,
                        marginBottom: '-40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <EquippedHeroView heroId={hero.id} size={640} />
                </div>
                <div
                    style={{
                        textAlign: 'center',
                        zIndex: 10,
                        marginBottom: '40px',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '18px 50px',
                        borderRadius: '15px',
                        border: '1px solid rgba(240,192,64,0.3)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <h2
                        style={{
                            color: '#f0c040',
                            fontSize: '34px',
                            margin: 0,
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                        }}
                    >
                        {displayHeroName}
                    </h2>
                    <p
                        style={{
                            color: activeRarityColor,
                            margin: 0,
                            fontWeight: 900,
                            letterSpacing: '4px',
                            fontSize: '12px',
                        }}
                    >
                        {activeSkin && activeSkin.id !== 'default' ? `${hero.title} · ${activeSkin.sourceLabel}` : hero.title}
                    </p>
                </div>
            </div>

            <div style={{ width: '480px', display: 'flex', flexDirection: 'column' }}>
                <div
                    style={{
                        display: 'flex',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '12px',
                        padding: '4px',
                        marginBottom: '20px',
                        gap: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    {['STATS', 'INVENTORY', 'LORE'].map((tab) => {
                        const active = detailSubTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setDetailSubTab(tab as any);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: active ? 'rgba(240, 192, 64, 0.12)' : 'transparent',
                                    color: active ? '#f0c040' : 'rgba(255, 255, 255, 0.5)',
                                    border: active ? '1px solid #f0c040' : '1px solid transparent',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 900,
                                    fontSize: '11px',
                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                    letterSpacing: '1px',
                                    textShadow: active ? '0 0 8px rgba(240, 192, 64, 0.3)' : 'none',
                                    boxShadow: active ? 'inset 0 0 8px rgba(240, 192, 64, 0.05)' : 'none',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {tab === 'STATS' ? 'СТАТЫ' : tab === 'INVENTORY' ? 'РЮКЗАК' : 'ЛОР'}
                            </button>
                        );
                    })}
                </div>
                <div
                    style={{
                        flex: 1,
                        background: 'rgba(20, 20, 25, 0.6)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '30px',
                        border: '1px solid rgba(240,192,64,0.3)',
                        padding: '25px',
                        overflow: 'visible',
                        boxShadow: '0 20px 60px rgba(0,0,0,1)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}
                >
                    {detailSubTab === 'INVENTORY' ? (
                        <InventoryPanel
                            mode="COMPACT"
                            onItemClick={onInternalItemClick}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                    ) : detailSubTab === 'STATS' ? (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '22px',
                                overflowY: 'auto',
                                paddingRight: '5px',
                                paddingTop: '10px',
                            }}
                            className="custom-scrollbar"
                        >
                            <StatCard
                                label="ЗДОРОВЬЕ"
                                value={Math.round(currentStats.hp)}
                                base={Math.round(baseStats.hp)}
                                icon="❤️"
                                color="#ef4444"
                                max={10000}
                                tooltip="Общий запас жизненных сил персонажа."
                            />
                            <StatCard
                                label="СИЛА АТАКИ"
                                value={Math.round(currentStats.attack)}
                                base={Math.round(baseStats.attack)}
                                icon="⚔️"
                                color="#f97316"
                                max={2000}
                                tooltip="Влияет на урон, наносимый противникам в бою."
                            />
                            <StatCard
                                label="ЗАЩИТА"
                                value={Math.round(currentStats.defense)}
                                base={Math.round(baseStats.defense)}
                                icon="🛡️"
                                color="#3b82f6"
                                max={1000}
                                tooltip="Снижает получаемый физический урон от атак врага."
                            />
                            <StatCard
                                label="ЛОВКОСТЬ"
                                value={Math.round(currentStats.evasion ?? 0)}
                                base={Math.round(baseStats.evasion ?? 0)}
                                icon="🌪️"
                                color="#22c55e"
                                max={100}
                                suffix="%"
                                tooltip="Шанс уклонения от атак противника в бою."
                            />
                            <StatCard
                                label="КРИТ. ШАНС"
                                value={Math.round(currentStats.critChance)}
                                base={Math.round(baseStats.critChance)}
                                icon="💥"
                                color="#a855f7"
                                max={100}
                                suffix="%"
                                tooltip="Шанс нанести критический удар (x1.5 урон)."
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.3,
                                fontWeight: 900,
                            }}
                        >
                            LORE COMING SOON...
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
