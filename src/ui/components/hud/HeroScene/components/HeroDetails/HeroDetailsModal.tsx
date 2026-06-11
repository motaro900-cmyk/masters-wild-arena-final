import { motion } from 'framer-motion';
import { ROLE_ICONS } from '../../constants/roleIcons';
import { DetailStat } from './DetailStat';
import { SkillItem } from './SkillItem';
import { resolveAssetPath } from '../../../../../../utils/assetPath';

export const HeroDetailsModal = ({ hero, isOwned, onClose, rarityColors, onBuy, onSelect }: any) => {
    const color = rarityColors[hero.rarity];
    const role = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100000,
                backdropFilter: 'blur(10px)',
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '1200px',
                    height: '800px',
                    background: '#0a0a0a',
                    borderRadius: '40px',
                    border: `2px solid ${color}`,
                    overflow: 'hidden',
                    display: 'flex',
                    position: 'relative',
                    boxShadow: `0 30px 100px rgba(0,0,0,1), 0 0 50px ${color}33`,
                }}
            >
                {/* LEFT SIDE: HERO PREVIEW */}
                <div
                    style={{
                        width: '45%',
                        height: '100%',
                        position: 'relative',
                        background: `radial-gradient(circle at center, ${color}22 0%, transparent 70%)`,
                    }}
                >
                    <motion.img
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        src={resolveAssetPath(hero.image)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '60px',
                            zIndex: 2,
                            position: 'relative',
                        }}
                    />
                    <div style={{ position: 'absolute', bottom: '60px', left: '60px', zIndex: 3 }}>
                        <div
                            style={{
                                background: role.bg,
                                border: `1px solid ${role.color}`,
                                borderRadius: '12px',
                                padding: '8px 20px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '20px',
                            }}
                        >
                            <span style={{ fontSize: '24px' }}>{role.icon}</span>
                            <span
                                style={{ color: role.color, fontSize: '18px', fontWeight: 900, letterSpacing: '2px' }}
                            >
                                {role.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: INFO */}
                <div
                    style={{
                        width: '55%',
                        height: '100%',
                        padding: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px',
                        overflowY: 'auto',
                    }}
                    className="custom-scrollbar"
                >
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                fontSize: '64px',
                                color: '#fff',
                                margin: 0,
                                fontFamily: "'Cinzel', serif",
                                textShadow: `0 0 20px ${color}44`,
                            }}
                        >
                            {hero.name}
                        </motion.h1>
                        <div
                            style={{
                                color: color,
                                fontSize: '20px',
                                fontWeight: 900,
                                letterSpacing: '4px',
                                textTransform: 'uppercase',
                            }}
                        >
                            {hero.rarity}
                        </div>
                    </div>

                    <div
                        style={{
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '18px',
                            lineHeight: '1.6',
                            fontStyle: 'italic',
                        }}
                    >
                        "{hero.lore}"
                    </div>

                    {/* STATS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <DetailStat icon="❤️" label="ЗДОРОВЬЕ (BASE)" value={hero.stats.stamina * 10} color="#ef4444" />
                        <DetailStat
                            icon="⚔️"
                            label="СИЛА АТАКИ (BASE)"
                            value={hero.stats.strength * 2}
                            color="#f97316"
                        />
                        <DetailStat
                            icon="🛡️"
                            label="ЗАЩИТА (BASE)"
                            value={Math.round(hero.stats.stamina * 0.5)}
                            color="#3b82f6"
                        />
                        <DetailStat
                            icon="🌪️"
                            label="ЛОВКОСТЬ / УКЛОН"
                            value={`${Math.round(hero.stats.agility * 0.2)}%`}
                            color="#22c55e"
                        />
                        <DetailStat
                            icon="💥"
                            label="КРИТ. ШАНС"
                            value={`${Math.round(hero.stats.agility * 0.5)}%`}
                            color="#a855f7"
                        />
                    </div>

                    {/* SKILLS PLACEHOLDER */}
                    <div>
                        <div
                            style={{
                                color: '#fff',
                                fontSize: '24px',
                                fontWeight: 900,
                                marginBottom: '20px',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                paddingBottom: '10px',
                            }}
                        >
                            СПОСОБНОСТИ
                        </div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            {(() => {
                                const HERO_SKILLS: Record<string, { icon: string; name: string; desc: string }[]> = {
                                    panda: [
                                        { icon: '🎋', name: 'Двойной удар', desc: 'Наносит 180% урона и глушит врага на 1 ход.' },
                                        { icon: '🏮', name: 'Духовный щит', desc: 'Повышает защиту на 40% и восстанавливает здоровье.' },
                                        { icon: '🌀', name: 'Ураган лап', desc: 'Рассекающий удар, наносящий 120% урона всем врагам.' }
                                    ],
                                    wolf: [
                                        { icon: '🐺', name: 'Вой стаи', desc: 'Повышает атаку всех союзников на 30% на 2 хода.' },
                                        { icon: '🩸', name: 'Растерзание', desc: 'Наносит 150% урона и накладывает кровотечение.' },
                                        { icon: '⚡', name: 'Быстрый выпад', desc: 'Быстрая атака с шансом критического урона +50%.' }
                                    ],
                                    bear: [
                                        { icon: '🐻', name: 'Дикий натиск', desc: 'Пробивает броню цели на 50% и наносит урон.' },
                                        { icon: '⛰️', name: 'Каменная кожа', desc: 'Поглощает 30% входящего урона в течение 3 ходов.' },
                                        { icon: '🪵', name: 'Сотрясение', desc: 'Атакует землю, снижая ловкость врагов на 40%.' }
                                    ],
                                    fox: [
                                        { icon: '🦊', name: 'Иллюзия', desc: 'Позволяет уклониться от следующей атаки врага.' },
                                        { icon: '🔥', name: 'Огненный лис', desc: 'Поджигает цель, нанося периодический магический урон.' },
                                        { icon: '✨', name: 'Чары', desc: 'Ослабляет цель, снижая её атаку на 50% на 2 хода.' }
                                    ],
                                    lion: [
                                        { icon: '🦁', name: 'Царский рык', desc: 'Снижает защиту всех врагов на 30% на 2 хода.' },
                                        { icon: '👑', name: 'Величие', desc: 'Удваивает силу следующего критического удара.' },
                                        { icon: '⚔️', name: 'Золотой коготь', desc: 'Мощный удар, полностью игнорирующий броню.' }
                                    ]
                                };
                                const skills = HERO_SKILLS[hero.id] || [
                                    { icon: '🔥', name: 'Мощный удар', desc: 'Наносит 200% урона по цели.' },
                                    { icon: '🛡️', name: 'Железная воля', desc: 'Повышает защиту на 50% на 2 хода.' },
                                    { icon: '🌀', name: 'Вихрь', desc: 'Атака по всем противникам.' }
                                ];
                                return skills.map((s, idx) => (
                                    <SkillItem key={idx} icon={s.icon} name={s.name} desc={s.desc} />
                                ));
                            })()}
                        </div>
                    </div>

                    <div style={{ flex: 1 }} />

                    <div style={{ display: 'flex', gap: '20px' }}>
                        {isOwned ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
                                style={{
                                    flex: 1,
                                    height: '70px',
                                    background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                                    border: 'none',
                                    borderRadius: '15px',
                                    color: '#fff',
                                    fontSize: '20px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                }}
                                onClick={onSelect}
                            >
                                ВЫБРАТЬ ГЕРОЯ
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
                                style={{
                                    flex: 1,
                                    height: '70px',
                                    background: 'linear-gradient(180deg, #f1c40f 0%, #d4a017 100%)',
                                    border: 'none',
                                    borderRadius: '15px',
                                    color: '#fff',
                                    fontSize: '20px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                }}
                                onClick={onBuy}
                            >
                                РАЗБЛОКИРОВАТЬ
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* CLOSE BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '30px',
                        right: '30px',
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '32px',
                        cursor: 'pointer',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                    }}
                >
                    ✕
                </motion.button>
            </motion.div>
        </motion.div>
    );
};
