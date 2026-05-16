import { motion } from 'framer-motion';
import { HEROES_DB } from '../../../../../../configs/HeroesConfig';
import { FilterBar } from './FilterBar';
import { HeroCard } from './HeroCard';

export const HeroList = ({
    rarityColors,
    ownedHeroes,
    selectedHeroId,
    activeFilter,
    setActiveFilter,
    setTooltipHero,
    setMousePos,
    onBuyClick,
    onHeroClick,
}: any) => {
    const filteredHeroes = HEROES_DB.filter((hero) => {
        if (activeFilter === 'ВСЕ') return true;
        if (activeFilter === 'ДОСТУПНЫЕ') return ownedHeroes.includes(hero.id);
        return hero.unlockType === activeFilter;
    });

    const handleMouseMove = (e: React.MouseEvent) => {
        const root = document.getElementById('hero-scene-root');
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const scaleX = rect.width / 1920;
        const scaleY = rect.height / 1080;

        setMousePos({
            x: (e.clientX - rect.left) / scaleX,
            y: (e.clientY - rect.top) / scaleY,
        });
    };

    return (
        <motion.div
            key="list"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            style={{
                position: 'absolute',
                inset: '20px 80px 40px 80px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <FilterBar activeFilter={activeFilter} onSelect={setActiveFilter} />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gridAutoRows: 'min-content',
                    gap: '25px',
                    overflowY: 'auto',
                    paddingRight: '20px',
                    flex: 1,
                }}
                className="custom-scrollbar"
            >
                {filteredHeroes.map((hero: any) => (
                    <HeroCard
                        key={hero.id}
                        hero={hero}
                        isOwned={ownedHeroes.includes(hero.id)}
                        isActive={selectedHeroId === hero.id}
                        onClick={() => onHeroClick(hero)}
                        onBuyClick={() => onBuyClick(hero)}
                        color={rarityColors[hero.rarity]}
                        onMouseEnter={(e: any) => {
                            setTooltipHero(hero);
                            handleMouseMove(e);
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setTooltipHero(null)}
                    />
                ))}
            </div>
        </motion.div>
    );
};
