export interface IAbility {
    id: string;
    name: string;
    description: string;
    duration: number; // Duration of the buff in seconds
    applyEffect: (caster: any) => void;
    removeEffect: (caster: any) => void;
}

export const ABILITIES_DB: Record<string, IAbility> = {
    'panda_rage': {
        id: 'panda_rage',
        name: 'Ярость Панды',
        description: '+50% урон на 3 сек',
        duration: 3,
        applyEffect: (caster) => {
            if (caster.stats) caster.stats.attack *= 1.5;
        },
        removeEffect: (caster) => {
            if (caster.stats) caster.stats.attack /= 1.5;
        }
    },
    'goose_haste': {
        id: 'goose_haste',
        name: 'Быстрые Атаки Гуся',
        description: 'Задержка между атаками ÷2 (в 2 раза быстрее) на 3 сек',
        duration: 3,
        applyEffect: (caster) => {
            // In BattleState, speed is a multiplier for the timer, so reducing it makes attacks faster
            if (caster.stats) caster.stats.speed /= 2.0; 
        },
        removeEffect: (caster) => {
            if (caster.stats) caster.stats.speed *= 2.0;
        }
    }
    // Add Moose Shield, Cat Crit, etc. here
};
