import { HeroUnit } from '../../entities/HeroUnit';
import type { BattleEngine } from '../BattleEngine';
import { useGameStore } from '../../../store/useGameStore';

export function updateStatusesState(engine: BattleEngine) {
    const anyEngine = engine as any;
    engine.updateState({
        playerStatuses: anyEngine.player
            ? anyEngine.player.statusEffects.map((s: any) => ({ type: s.type, stacks: s.stacks, duration: s.duration }))
            : [],
        enemyStatuses: anyEngine.enemy
            ? anyEngine.enemy.statusEffects.map((s: any) => ({ type: s.type, stacks: s.stacks, duration: s.duration }))
            : [],
    });
}

export function applyStatus(
    engine: BattleEngine,
    unit: HeroUnit,
    type: 'STUN' | 'BURN' | 'FREEZE' | 'POISON',
    duration: number,
    damagePerTurn: number,
    isPlayer: boolean,
) {
    if (!unit || unit.destroyed) return;

    // Mutual exclusivity: Fire melts Ice, Ice extinguishes Fire
    if (type === 'BURN') {
        const hasFreeze = unit.statusEffects.find((s) => s.type === 'FREEZE');
        if (hasFreeze) {
            unit.statusEffects = unit.statusEffects.filter((s) => s.type !== 'FREEZE');
            unit.removeFreezeEffect();
        }
    } else if (type === 'FREEZE') {
        const hasBurn = unit.statusEffects.find((s) => s.type === 'BURN');
        if (hasBurn) {
            unit.statusEffects = unit.statusEffects.filter((s) => s.type !== 'BURN');
            unit.removeBurnEffect();
        }
    }

    const existing = unit.statusEffects.find((s) => s.type === type);
    if (existing) {
        if (type === 'POISON') {
            existing.stacks = Math.min(5, existing.stacks + 1);
            existing.duration = Math.max(existing.duration, duration);
            existing.damagePerTurn = damagePerTurn;
        } else {
            existing.duration = Math.max(existing.duration, duration);
        }
    } else {
        unit.statusEffects.push({
            type,
            duration,
            stacks: 1,
            damagePerTurn,
        });

        // Trigger visual on creation
        if (type === 'STUN') {
            unit.showStunEffect();
            unit.setFrame(0);
            engine.onCombatEvent({
                type: 'STUN',
                damage: 0,
                target: isPlayer ? 'player' : 'enemy',
                label: '💫 ОГЛУШЕНИЕ!',
            });
        } else if (type === 'BURN') {
            unit.showBurnEffect();
        } else if (type === 'FREEZE') {
            unit.showFreezeEffect();
            engine.onCombatEvent({
                type: 'FREEZE',
                damage: 0,
                target: isPlayer ? 'player' : 'enemy',
                label: '❄️ ЗАМОРОЗКА!',
            });
        } else if (type === 'POISON') {
            unit.showPoisonEffect();
        }
    }

    updateStatusesState(engine);
}

export async function resolvePeriodicDamage(engine: BattleEngine, unit: HeroUnit, isPlayer: boolean) {
    const anyEngine = engine as any;
    if (!anyEngine.isCombatRunning || !unit || unit.destroyed) return;

    const { timeScale, addCombatLog } = useGameStore.getState();
    const activeEffects = [...unit.statusEffects];

    for (const status of activeEffects) {
        if (status.type === 'BURN' || status.type === 'POISON') {
            const tickDamage = Math.ceil(status.damagePerTurn * status.stacks);

            if (isPlayer) {
                const nextHP = Math.max(0, engine.state.playerHP - tickDamage);
                engine.updateState({ playerHP: nextHP });
                engine.totalDamageTaken += tickDamage;
                if (nextHP <= 0) unit.animateDeath(true);
            } else {
                const nextHP = Math.max(0, engine.state.enemyHP - tickDamage);
                engine.updateState({ enemyHP: nextHP });
                engine.totalDamageDealt += tickDamage;
                if (nextHP <= 0) unit.animateDeath(false);
            }

            // Popup combat event
            engine.onCombatEvent({
                type: status.type,
                damage: tickDamage,
                target: isPlayer ? 'player' : 'enemy',
            });

            const logMsg =
                status.type === 'BURN'
                    ? `🔥 [Горение] ${unit.config.name} получает ${tickDamage} урона от огня!`
                    : `🤢 [Отравление] ${unit.config.name} получает ${tickDamage} урона от яда! (${status.stacks} стак.)`;

            engine.updateState({ log: logMsg });
            addCombatLog(logMsg);

            // Play reaction
            unit.playHitEffect();
            unit.animateHitReaction(false);

            // Tiny pause to read the periodic damage pop
            await new Promise((r) => setTimeout(r, 650 / timeScale));
            if (!anyEngine.isCombatRunning || (isPlayer ? engine.state.playerHP : engine.state.enemyHP) <= 0) return;
        }
    }
}

export function decrementStatusDurations(engine: BattleEngine, unit: HeroUnit) {
    if (!unit || unit.destroyed) return;

    const activeEffects = [...unit.statusEffects];
    for (const status of activeEffects) {
        status.duration -= 1;

        if (status.duration <= 0) {
            // Remove status
            unit.statusEffects = unit.statusEffects.filter((s) => s.type !== status.type);
            if (status.type === 'STUN') {
                unit.removeStunEffect();
            } else if (status.type === 'BURN') {
                unit.removeBurnEffect();
            } else if (status.type === 'FREEZE') {
                unit.removeFreezeEffect();
            } else if (status.type === 'POISON') {
                unit.removePoisonEffect();
            }
        }
    }

    updateStatusesState(engine);
}
