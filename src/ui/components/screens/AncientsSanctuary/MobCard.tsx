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

interface MobCardProps {
    selectedMob: MobData;
    selectedFloor: number;
    pveStage: number;
}

export const MobCard: React.FC<MobCardProps> = ({ selectedMob, selectedFloor, pveStage }) => {
    return (
        <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{
                width: '360px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(196, 139, 59, 0.3)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                cursor: 'default',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span
                    style={{
                        fontSize: '9px',
                        letterSpacing: '2px',
                        color: selectedMob.isBoss ? '#ef4444' : '#fbbf24',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <span style={{ fontSize: '7px' }}>▲</span>{' '}
                    {selectedMob.isBoss
                        ? 'ЛЕГЕНДАРНЫЙ БОСС'
                        : selectedFloor === pveStage
                          ? 'ТЕКУЩИЙ СТРАЖ'
                          : 'ПРОСМОТР СТРАЖА'}
                </span>
                <h2
                    style={{
                        margin: 0,
                        fontSize: '24px',
                        fontFamily: "'Cinzel', serif",
                        color: '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    {selectedMob.name}
                </h2>

                <p
                    style={{
                        fontSize: '12px',
                        lineHeight: '1.6',
                        color: 'rgba(255,255,255,0.6)',
                        fontStyle: 'normal',
                        margin: '6px 0 0 0',
                        textAlign: 'center',
                    }}
                >
                    "{getMobLore(selectedMob.id)}"
                </p>
            </div>
        </motion.div>
    );
};
