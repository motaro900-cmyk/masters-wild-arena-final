import { HeroUnit } from '../../entities/HeroUnit';
import type { BattleEngine } from '../BattleEngine';
import { useGameStore } from '../../../store/useGameStore';
import type { StatusType } from '../../../configs/AbilityConfig';

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
    type: StatusType,
    duration: number,
    damagePerTurn: number,
    isPlayer: boolean,
) {
    if (!unit || unit.destroyed) return;

    if (type === 'STUN' && unit.statusEffects.some((s) => s.type === 'STUN_IMMUNITY')) {
        return; // Stun lock immunity
    }

    // Mutual exclusivity: Fire melts Ice, Ice extinguishes Fire
    if (type === 'BURN') {
        const hasFreeze = unit.statusEffects.find((s) => s.type === 'FREEZE');
        if (hasFreeze) {
            unit.statusEffects = unit.statusEffects.filter((s) => s.type !== 'FREEZE');
            unit.removeFreezeEffect();
            updateStatusesState(engine);
            return;
        }
    }
    if (type === 'FREEZE') {
        const hasBurn = unit.statusEffects.find((s) => s.type === 'BURN');
        if (hasBurn) {
            unit.statusEffects = unit.statusEffects.filter((s) => s.type !== 'BURN');
            unit.removeBurnEffect();
            updateStatusesState(engine);
            return;
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
            // ── Новые статусы для 5 персонажей ──────────────────────────────────
        } else if (type === 'SHADOW_MARK') {
            unit.showCustomEffect?.('shadow_mark');
            engine.onCombatEvent({
                type: 'INSTINCT',
                damage: 0,
                target: isPlayer ? 'player' : 'enemy',
                label: '🌑 МЕТКА ТЕНЕЙ!',
            });
        } else if (type === 'CRYSTAL_SHIELD') {
            unit.showCustomEffect?.('crystal_shield');
            engine.onCombatEvent({
                type: 'BLOCK',
                damage: 0,
                target: isPlayer ? 'player' : 'enemy',
                label: '💎 КРИСТАЛЬНЫЙ ЩИТ!',
            });
        } else if (type === 'STORM_CHARGE') {
            unit.showCustomEffect?.('storm_charge');
            engine.onCombatEvent({
                type: 'INSTINCT',
                damage: 0,
                target: isPlayer ? 'player' : 'enemy',
                label: `⚡ НАКОПЛЕНИЕ ГРОЗЫ (${duration} ходов)!`,
            });
        } else if (type === 'NATURE_REGEN') {
            unit.showCustomEffect?.('nature_regen');
            engine.onCombatEvent({
                type: 'INSTINCT',
                damage: 0,
                target: isPlayer ? 'player' : 'enemy',
                label: '🌿 ПРИРОДНАЯ РЕГЕНЕРАЦИЯ!',
            });
        } else if (type === 'VOID_SLOW') {
            unit.isFrozenStatus = true; // переиспользуем ATB-флаг
            unit.showCustomEffect?.('void_slow');
            engine.onCombatEvent({
                type: 'STUN',
                damage: 0,
                target: isPlayer ? 'player' : 'enemy',
                label: '🌀 ЗАМЕДЛЕНИЕ ПУСТОТЫ (-50% скорость)!',
            });
        }
    }

    updateStatusesState(engine);
}

export async function resolvePeriodicDamage(engine: BattleEngine, unit: HeroUnit, isPlayer: boolean) {
    if (!unit || unit.destroyed) return;
    const anyEngine = engine as any;
    if (!anyEngine.isCombatRunning) return;

    const activeEffects = [...unit.statusEffects];
    for (const status of activeEffects) {
        if (status.type === 'BURN' || status.type === 'POISON') {
            const { timeScale } = useGameStore.getState();

            const tickDamage = status.type === 'BURN' ? status.damagePerTurn : status.damagePerTurn * status.stacks;
            const finalDamage = Math.max(1, Math.ceil(tickDamage));

            engine.applyDamage(isPlayer ? 'player' : 'enemy', finalDamage);

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
            const addCombatLog = useGameStore.getState().addCombatLog;
            addCombatLog(logMsg);

            unit.playHitEffect();
            unit.animateHitReaction(false);

            await new Promise((r) => setTimeout(r, 650 / timeScale));
            if (!anyEngine.isCombatRunning || (isPlayer ? engine.state.playerHP : engine.state.enemyHP) <= 0) return;
        }

        // NATURE_REGEN — восстановление HP каждый ход
        if (status.type === 'NATURE_REGEN' && isPlayer) {
            const { timeScale } = useGameStore.getState();
            const maxHP = anyEngine.playerStats!.hp;
            const healAmount = Math.ceil(maxHP * 0.05);
            const nextHP = Math.min(maxHP, engine.state.playerHP + healAmount);
            engine.updateState({ playerHP: nextHP });
            engine.onCombatEvent({
                type: 'BLOCK',
                damage: healAmount,
                target: 'player',
                label: `🌿 +${healAmount} HP`,
            });
            useGameStore.getState().addCombatLog(`[РЕГЕНЕРАЦИЯ] +${healAmount} HP`);
            await new Promise((r) => setTimeout(r, 400 / timeScale));
        }

        // STORM_CHARGE — показываем счётчик заряда
        if (status.type === 'STORM_CHARGE') {
            useGameStore.getState().addCombatLog(`⚡ Гроза заряжается... (${status.duration} ходов до взрыва)`);
        }
    }
}

export function decrementStatusDurations(engine: BattleEngine, unit: HeroUnit) {
    if (!unit || unit.destroyed) return;

    const activeEffects = [...unit.statusEffects];
    for (const status of activeEffects) {
        status.duration -= 1;

        if (status.duration <= 0) {
            unit.statusEffects = unit.statusEffects.filter((s) => s.type !== status.type);
            if (status.type === 'STUN') {
                unit.removeStunEffect();
                applyStatus(engine, unit, 'STUN_IMMUNITY', 3, 0, unit.x < 960);
            } else if (status.type === 'BURN') {
                unit.removeBurnEffect();
            } else if (status.type === 'FREEZE') {
                unit.removeFreezeEffect();
            } else if (status.type === 'POISON') {
                unit.removePoisonEffect();
                // ── Новые статусы ─────────────────────────────────────────────────
            } else if (status.type === 'STORM_CHARGE') {
                // Взрыв при истечении заряда
                unit.removeCustomEffect?.('storm_charge');
                const anyEng = engine as any;
                const isEnemy = unit.x > 960;
                const atkStats = isEnemy ? anyEng.enemyStats! : anyEng.playerStats!;
                const explosionDmg = Math.ceil(atkStats.attack * 1.8);
                engine.applyDamage(isEnemy ? 'enemy' : 'player', explosionDmg);
                engine.onCombatEvent({
                    type: 'CRIT',
                    damage: explosionDmg,
                    target: isEnemy ? 'enemy' : 'player',
                    label: '⚡ ВЗРЫВ ГРОЗЫ!',
                });
                useGameStore.getState().addCombatLog(`[ГРОЗА] Разряд наносит ${explosionDmg} урона!`);
            } else if (status.type === 'SHADOW_MARK') {
                unit.removeCustomEffect?.('shadow_mark');
            } else if (status.type === 'CRYSTAL_SHIELD') {
                unit.removeCustomEffect?.('crystal_shield');
            } else if (status.type === 'NATURE_REGEN') {
                unit.removeCustomEffect?.('nature_regen');
            } else if (status.type === 'VOID_SLOW') {
                unit.isFrozenStatus = false;
                unit.removeCustomEffect?.('void_slow');
            }
        }
    }

    updateStatusesState(engine);
}
