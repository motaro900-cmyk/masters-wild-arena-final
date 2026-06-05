import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HEROES_DB } from '../../../../../../configs/HeroesConfig';
import { useGameStore } from '../../../../../../store/useGameStore';
import { audioService } from '../../../../../../services/AudioService';
import { getSkinsForHero } from '../../../../../../configs/SkinsConfig';
import { HeroCard } from './components/HeroCard';
import { HeroDetailPanel } from './components/HeroDetailPanel';

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
                    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(10, 8, 7, 0.35)',
                    overflow: 'hidden',
                }}
            >
                {/* Filters */}
                <div
                    style={{
                        padding: '16px 14px 12px',
                        flexShrink: 0,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    {/* Sub-tab: ALL / OWNED */}
                    <div
                        style={{
                            display: 'flex',
                            background: 'rgba(6, 5, 4, 0.85)',
                            border: '1px solid rgba(240, 192, 64, 0.18)',
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
                                    background: subTab === t ? '#f0c040' : 'transparent',
                                    border: 'none',
                                    borderRadius: '7px',
                                    color: subTab === t ? '#1a1200' : 'rgba(255, 255, 255, 0.45)',
                                    fontSize: '9.5px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    letterSpacing: '0.5px',
                                    transition: 'all 0.15s',
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
                            background: 'rgba(6, 5, 4, 0.85)',
                            border: '1px solid rgba(240, 192, 64, 0.18)',
                            borderRadius: '10px',
                            color: '#fff',
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
                            <div style={{ fontSize: '32px', opacity: 0.2 }}>⚔️</div>
                            <div
                                style={{
                                    color: 'rgba(255,255,255,0.2)',
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
                        padding: '14px',
                        flexShrink: 0,
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        background: 'rgba(6, 5, 4, 0.8)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: 'rgba(255, 255, 255, 0.4)',
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
                            background: 'rgba(255, 255, 255, 0.05)',
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
                                color: 'rgba(255,255,255,0.2)',
                                fontFamily: "'Cinzel', serif",
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
