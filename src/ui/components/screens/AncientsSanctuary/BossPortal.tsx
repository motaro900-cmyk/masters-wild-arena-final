import React from 'react';
import { motion } from 'framer-motion';

interface MobData {
    id: string;
    name: string;
    image: string;
    icon: string;
    isBoss: boolean;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
}

interface BossPortalProps {
    selectedMob: MobData;
}

export const BossPortal: React.FC<BossPortalProps> = ({ selectedMob }) => {
    // Лор стражей
    const getMobLore = (mobId: string) => {
        switch (mobId) {
            case 'ancient_wolf':
                return 'Свирепый лесной хищник, охраняющий границы священной обители. Его клыки наполнены яростной силой природы.';
            case 'ancient_panther':
                return 'Неуловимая бестия, атакующая из тени. Древняя магия скрывает её движения от глаз незваных гостей.';
            case 'ancient_spider':
                return 'Глубинный обитатель руин. Его панцирь покрыт светящимися кристаллами, концентрирующими чистую ману.';
            case 'ancient_golem':
                return 'Величественный страж, высеченный из монолитной скалы. Практически невосприимчим к физическим атакам.';
            case 'ancient_treant':
                return 'Огромный оживший дуб, помнящий сотворение этого мира. Сокрушает врагов тяжелыми ветвями и корнями.';
            case 'ancient_griffin':
                return 'Царь небес, способный призывать молнии. Его ярость обрушивается на каждого нарушителя покоя.';
            default:
                return 'Таинственное порождение древней обители, скрывающее свою истинную силу до начала поединка.';
        }
    };

    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                height: '100%',
                minHeight: '520px',
            }}
        >
            {/* Текстовое описание по центру сверху с контрастной плашкой */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    zIndex: 3,
                    background: 'rgba(5, 3, 15, 0.75)',
                    border: '1px solid rgba(196, 139, 59, 0.25)',
                    borderRadius: '6px',
                    padding: '12px 30px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                }}
            >
                <span
                    style={{
                        fontSize: '10px',
                        letterSpacing: '2px',
                        color: selectedMob.isBoss ? '#f87171' : '#fbbf24',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                        textTransform: 'uppercase',
                    }}
                >
                    {selectedMob.isBoss ? '▲ ЛЕГЕНДАРНЫЙ БОСС' : '▲ СТРАЖ ОБИТЕЛИ'}
                </span>
                <h2
                    style={{
                        margin: 0,
                        fontSize: '30px',
                        fontFamily: "'Cinzel', serif",
                        color: '#fff',
                        textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                        fontWeight: 700,
                    }}
                >
                    {selectedMob.name}
                </h2>
                <p
                    style={{
                        margin: '6px 0 0 0',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.7)',
                        maxWidth: '480px',
                        lineHeight: '1.5',
                        fontStyle: 'italic',
                        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    "{getMobLore(selectedMob.id)}"
                </p>
            </div>

            {/* Контейнер портала и спрайта с премиум-рамкой */}
            <div
                style={{
                    position: 'relative',
                    width: '560px',
                    height: '520px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(196, 139, 59, 0.15)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
                    padding: '20px',
                    boxSizing: 'border-box',
                }}
            >
                {/* Анимированный вращающийся портал сзади монстра */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        width: '460px',
                        height: '460px',
                        borderRadius: '50%',
                        border: selectedMob.isBoss
                            ? '1px dashed rgba(239,68,68,0.25)'
                            : '1px dashed rgba(196,139,59,0.15)',
                        boxShadow: selectedMob.isBoss
                            ? '0 0 60px rgba(239,68,68,0.2), inset 0 0 60px rgba(239,68,68,0.2)'
                            : '0 0 60px rgba(196,139,59,0.15), inset 0 0 60px rgba(196,139,59,0.15)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '90%',
                            height: '90%',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.02)',
                            background: 'radial-gradient(circle, rgba(196,139,59,0.15) 0%, transparent 70%)',
                        }}
                    />
                </motion.div>

                {/* Дополнительный анимированный светильник за монстром */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{
                        position: 'absolute',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: selectedMob.isBoss ? 'rgba(239,68,68,0.25)' : 'rgba(196,139,59,0.2)',
                        filter: 'blur(60px)',
                        zIndex: 1,
                    }}
                />

                {/* Спрайт босса с левитацией и интерактивным свечением (увеличен в 2.5 раза) */}
                <motion.img
                    key={selectedMob.id}
                    src={selectedMob.image}
                    initial={{ scale: 1.0, opacity: 0 }}
                    animate={{ scale: 1.3, opacity: 1, y: [0, -15, 0] }}
                    whileHover={{
                        scale: 1.35,
                        filter: selectedMob.isBoss
                            ? 'drop-shadow(0 20px 40px rgba(239,68,68,0.6))'
                            : 'drop-shadow(0 20px 40px rgba(196,139,59,0.5))',
                    }}
                    transition={{
                        scale: { duration: 0.3 },
                        opacity: { duration: 0.5 },
                        y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
                    }}
                    style={{
                        width: '480px',
                        height: '480px',
                        objectFit: 'contain',
                        zIndex: 2,
                        filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.85))',
                        cursor: 'pointer',
                    }}
                />
            </div>
        </div>
    );
};
