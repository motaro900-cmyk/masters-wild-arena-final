import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HEROES_DB } from '../../../../../../configs/HeroesConfig';
import { useGameStore } from '../../../../../../store/useGameStore';
import { audioService } from '../../../../../../services/AudioService';
import { getSkinsForHero } from '../../../../../../configs/SkinsConfig';
import { HeroCard } from './components/HeroCard';
import { HeroDetailPanel } from './components/HeroDetailPanel';

const stoneBrickPattern =
    "url(\"data:image/svg+xml;utf8,<svg width='60' height='40' viewBox='0 0 60 40' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='40' fill='none'/><line x1='0' y1='20' x2='60' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='40' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='30' y1='0' x2='30' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='20' x2='0' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='60' y1='20' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='1.5' x2='60' y2='1.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='0' y1='21.5' x2='60' y2='21.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='31.5' y1='0.8' x2='31.5' y2='19.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='1.5' y1='20.8' x2='1.5' y2='39.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><path d='M44,3 L40,7 L42,12 L38,15' stroke='rgba(0,0,0,0.45)' stroke-width='0.8' fill='none'/><path d='M45,3.5 L41,7.5 L43,12.5 L39,15.5' stroke='rgba(255,255,255,0.08)' stroke-width='0.8' fill='none'/><line x1='6' y1='8' x2='20' y2='8' stroke='rgba(0,0,0,0.42)' stroke-width='0.8'/><line x1='6' y1='9' x2='20' y2='9' stroke='rgba(255,255,255,0.08)' stroke-width='0.8'/><path d='M10,23 L13,28 L11,34' stroke='rgba(0,0,0,0.48)' stroke-width='0.9' fill='none'/><path d='M11,23.5 L14,28.5 L12,34.5' stroke='rgba(255,255,255,0.09)' stroke-width='0.9' fill='none'/><path d='M35,33 L48,30 L54,32' stroke='rgba(0,0,0,0.42)' stroke-width='0.8' fill='none'/><path d='M35,34 L48,31 L54,33' stroke='rgba(255,255,255,0.07)' stroke-width='0.8' fill='none'/><circle cx='12' cy='14' r='0.8' fill='rgba(0,0,0,0.45)'/><circle cx='12.5' cy='14.5' r='0.4' fill='rgba(255,255,255,0.08)'/><circle cx='48' cy='26' r='1.2' fill='rgba(0,0,0,0.5)'/><circle cx='48.5' cy='26.5' r='0.6' fill='rgba(255,255,255,0.1)'/></svg>\")";

const CornerDecoration = () => (
    <>
        <div
            style={{
                position: 'absolute',
                top: 12,
                left: 12,
                width: 14,
                height: 14,
                borderTop: '2.5px solid rgba(240, 192, 64, 0.65)',
                borderLeft: '2.5px solid rgba(240, 192, 64, 0.65)',
                pointerEvents: 'none',
                zIndex: 5,
            }}
        />
        <div
            style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 14,
                height: 14,
                borderTop: '2.5px solid rgba(240, 192, 64, 0.65)',
                borderRight: '2.5px solid rgba(240, 192, 64, 0.65)',
                pointerEvents: 'none',
                zIndex: 5,
            }}
        />
        <div
            style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                width: 14,
                height: 14,
                borderBottom: '2.5px solid rgba(240, 192, 64, 0.65)',
                borderLeft: '2.5px solid rgba(240, 192, 64, 0.65)',
                pointerEvents: 'none',
                zIndex: 5,
            }}
        />
        <div
            style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                width: 14,
                height: 14,
                borderBottom: '2.5px solid rgba(240, 192, 64, 0.65)',
                borderRight: '2.5px solid rgba(240, 192, 64, 0.65)',
                pointerEvents: 'none',
                zIndex: 5,
            }}
        />
    </>
);

// ── MAIN EXPORT COMPONENT ────────────────────────────────────────────────────
export const HeroList = ({ ownedHeroes, selectedHeroId, onBuyClick, onHeroClick }: any) => {
    const { setSelectedHeroId, ownedSkins, equippedSkins, equipSkin, setHeroGalleryId } = useGameStore((s: any) => ({
        setSelectedHeroId: s.setSelectedHeroId,
        ownedSkins: (s.ownedSkins as string[]) || ['default'],
        equippedSkins: (s.equippedSkins as Record<string, string>) || {},
        equipSkin: s.equipSkin,
        setHeroGalleryId: s.setHeroGalleryId,
    }));

    const [subTab, setSubTab] = useState<'ALL' | 'OWNED'>('ALL');
    const [classFilter, setClassFilter] = useState<string>('ALL');
    const [focusedId, setFocusedId] = useState<string>(selectedHeroId || HEROES_DB[0].id);
    const [previewSkinId, setPreviewSkinId] = useState<string | null>(null);

    const handleFocusHero = (heroId: string) => {
        setFocusedId(heroId);
        setPreviewSkinId(null);
    };

    const filteredHeroes = HEROES_DB.filter((hero) => {
        if (subTab === 'OWNED' && !ownedHeroes.includes(hero.id)) return false;
        if (classFilter !== 'ALL' && hero.role !== classFilter) return false;
        return true;
    }).sort((a, b) => {
        if (subTab === 'ALL') {
            return (ownedHeroes.includes(a.id) ? 0 : 1) - (ownedHeroes.includes(b.id) ? 0 : 1);
        }
        return 0;
    });

    const focusedHero = HEROES_DB.find((h) => h.id === focusedId) || filteredHeroes[0];
    const isFocusedOwned = ownedHeroes.includes(focusedHero?.id);
    const isFocusedActive = selectedHeroId === focusedHero?.id;

    const handleSelectHero = (hero: any) => {
        setSelectedHeroId(hero.id);
        if (onHeroClick) {
            onHeroClick(hero);
        } else {
            setHeroGalleryId(hero.id);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* ══════════ LEFT COLUMN: SELECTION ══════════ */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1.5px solid rgba(240, 192, 64, 0.25)',
                    background: `${stoneBrickPattern}, linear-gradient(180deg, rgba(28, 22, 18, 0.99) 0%, rgba(16, 12, 10, 1.0) 100%)`,
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.6)',
                    position: 'relative',
                }}
            >
                <CornerDecoration />
                {/* Filters */}
                <div
                    style={{
                        padding: '16px 14px 12px',
                        flexShrink: 0,
                        borderBottom: '1px solid rgba(240, 192, 64, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    {/* Sub-tab: ALL / OWNED */}
                    <div
                        style={{
                            display: 'flex',
                            background: 'rgba(10, 8, 6, 0.85)',
                            border: '1.5px solid rgba(240, 192, 64, 0.35)',
                            borderRadius: '10px',
                            padding: '4px',
                            gap: '4px',
                        }}
                    >
                        {(['ALL', 'OWNED'] as const).map((t) => (
                            <motion.button
                                key={t}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    setSubTab(t);
                                    audioService.playSFX('SFX_CLICK');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    background:
                                        subTab === t
                                            ? 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)'
                                            : 'transparent',
                                    border: 'none',
                                    borderRadius: '7px',
                                    color: subTab === t ? '#1a0f00' : 'rgba(255, 254, 250, 0.6)',
                                    fontSize: '9.5px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    letterSpacing: '0.5px',
                                    transition: 'all 0.15s',
                                    boxShadow: subTab === t ? '0 2px 6px rgba(240, 192, 64, 0.2)' : 'none',
                                }}
                            >
                                {t === 'ALL' ? 'ВСЕ ГЕРОИ' : 'МОИ ГЕРОИ'}
                            </motion.button>
                        ))}
                    </div>

                    {/* Class filter dropdown */}
                    <select
                        value={classFilter}
                        onChange={(e) => {
                            setClassFilter(e.target.value);
                            audioService.playSFX('SFX_CLICK');
                        }}
                        style={{
                            width: '100%',
                            padding: '8px 28px 8px 12px',
                            background: 'rgba(15, 12, 10, 0.95)',
                            border: '1.5px solid rgba(240, 192, 64, 0.35)',
                            borderRadius: '10px',
                            color: '#fffdf9',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '10.5px',
                            fontWeight: 700,
                            outline: 'none',
                            cursor: 'pointer',
                            letterSpacing: '0.5px',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23f0c040' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center',
                        }}
                    >
                        <option value="ALL">ВСЕ КЛАССЫ</option>
                        <option value="WARRIOR">ВОИН</option>
                        <option value="TANK">ТАНК</option>
                        <option value="ASSASSIN">УБИЙЦА</option>
                        <option value="MAGE">МАГ</option>
                        <option value="SUPPORT">ПОДДЕРЖКА</option>
                    </select>
                </div>

                {/* Heroes Grid Scroll List */}
                <div
                    className="custom-scrollbar"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '20px',
                            alignContent: 'start',
                        }}
                    >
                        <AnimatePresence>
                            {filteredHeroes.map((hero, idx) => {
                                const isOwned = ownedHeroes.includes(hero.id);
                                const heroSkins = getSkinsForHero(hero.id);
                                // Guard: если нет скинов в SkinsConfig — создаём fallback
                                const defaultSkin = heroSkins.find((s) => s.source === 'default') ||
                                    heroSkins[0] || {
                                        id: `${hero.id}_default`,
                                        name: hero.name,
                                        image: hero.image,
                                        heroId: hero.id,
                                        source: 'default',
                                        rarity: hero.rarity,
                                    };
                                const activeSkinId = equippedSkins?.[hero.id] || defaultSkin.id;
                                const displaySkinId =
                                    focusedId === hero.id && previewSkinId ? previewSkinId : activeSkinId;
                                const activeSkin = heroSkins.find((s) => s.id === displaySkinId);
                                return (
                                    <motion.div
                                        key={hero.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.02 }}
                                    >
                                        <HeroCard
                                            hero={hero}
                                            isOwned={isOwned}
                                            isActive={selectedHeroId === hero.id}
                                            isSelected={focusedId === hero.id}
                                            activeSkin={activeSkin}
                                            onClick={() => {
                                                handleFocusHero(hero.id);
                                                audioService.playSFX('SFX_CLICK');
                                                if (onHeroClick) onHeroClick(hero);
                                                else setHeroGalleryId(hero.id);
                                            }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {filteredHeroes.length === 0 && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '80px 0',
                                gap: '12px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '32px',
                                    opacity: 0.45,
                                    filter: 'drop-shadow(0 0 8px rgba(240, 192, 64, 0.35))',
                                }}
                            >
                                ⚔️
                            </div>
                            <div
                                style={{
                                    color: 'rgba(255, 254, 250, 0.6)',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    letterSpacing: '1px',
                                }}
                            >
                                НЕТ ГЕРОЕВ
                            </div>
                        </div>
                    )}
                </div>

                {/* Collection counter / progress indicator */}
                <div
                    style={{
                        padding: '14px 18px',
                        flexShrink: 0,
                        borderTop: '1px solid rgba(240, 192, 64, 0.25)',
                        background: 'linear-gradient(180deg, #14100c 0%, #0e0b08 100%)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: 'rgba(255, 254, 250, 0.6)',
                            fontSize: '9.5px',
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 700,
                            letterSpacing: '1px',
                            marginBottom: '6px',
                        }}
                    >
                        <span>КОЛЛЕКЦИЯ ГЕРОЕВ</span>
                        <span>
                            {ownedHeroes.length} / {HEROES_DB.length}
                        </span>
                    </div>
                    {/* Progress Bar */}
                    <div
                        style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '2px',
                            background: 'rgba(255, 254, 250, 0.08)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${(ownedHeroes.length / HEROES_DB.length) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #c8960a, #f0c040)',
                                boxShadow: '0 0 6px #f0c040',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ══════════ RIGHT COLUMN: DETAILED VIEW ══════════ */}
            <div style={{ width: '420px', flexShrink: 0, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    {focusedHero ? (
                        <HeroDetailPanel
                            key={focusedHero.id}
                            hero={focusedHero}
                            isOwned={isFocusedOwned}
                            isActive={isFocusedActive}
                            ownedSkins={ownedSkins}
                            equippedSkins={equippedSkins}
                            equipSkin={equipSkin}
                            previewSkinId={previewSkinId}
                            setPreviewSkinId={setPreviewSkinId}
                            onSelect={() => handleSelectHero(focusedHero)}
                            onBuy={() => onBuyClick(focusedHero)}
                        />
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(46, 36, 27, 0.5)',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '13px',
                                letterSpacing: '1px',
                            }}
                        >
                            ВЫБЕРИТЕ ГЕРОЯ ДЛЯ ПРОСМОТРА
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
