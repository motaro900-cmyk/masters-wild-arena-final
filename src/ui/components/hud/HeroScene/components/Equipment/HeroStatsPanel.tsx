import React from 'react';
import { StatCard } from './StatCard';

interface HeroStatsPanelProps {
    currentStats: any;
    baseStats: any;
}

export const HeroStatsPanel: React.FC<HeroStatsPanelProps> = ({
    currentStats,
    baseStats,
}) => {
    return (
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
    );
};
