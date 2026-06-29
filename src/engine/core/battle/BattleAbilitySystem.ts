import type { BattleEngine } from '../BattleEngine';
import { useGameStore } from '../../../store/useGameStore';
import { audioService } from '../../../services/AudioService';
import { EffectsManager } from '../../systems/EffectsManager';
import { getAbilityConfig, getAbilityConfigByRole } from '../../../configs/AbilityConfig';

/**
 * Симметричный каст активных способностей для игрока и врага.
 */
export async function castActiveAbility(engine: BattleEngine, isPlayerCast: boolean = true) {
    const anyEngine = engine as any;
    const manaVal = isPlayerCast ? engine.state.playerMana : (engine.state as any).enemyMana || 0;

    if (
        !anyEngine.isCombatRunning ||
        manaVal < 100 ||
        engine.state.playerHP <= 0 ||
        engine.state.enemyHP <= 0
    )
        return;

    // Сброс маны
    if (isPlayerCast) {
        engine.updateState({ playerMana: 0 });
    } else {
        engine.updateState({ enemyMana: 0 } as any);
    }

    const caster = isPlayerCast ? anyEngine.player : anyEngine.enemy;
    const target = isPlayerCast ? anyEngine.enemy : anyEngine.player;
    const targetKey = isPlayerCast ? 'enemy' : 'player';
    const casterKey = isPlayerCast ? 'player' : 'enemy';

    const heroId = caster?.config?.id;
    const role = caster?.config?.role || 'WARRIOR';
    const heroName = caster?.config?.name || (isPlayerCast ? 'Герой' : 'Враг');

    // Получаем конфиг из реестра, fallback по роли
    const abilityCfg = getAbilityConfig(heroId) ?? getAbilityConfigByRole(role);
    const { name: abilityName, damageMultiplier, healPercent, shieldPercent, onCastStatus } = abilityCfg.activeAbility;

    const casterStats = isPlayerCast ? anyEngine.playerStats! : anyEngine.enemyStats!;
    const targetStats = isPlayerCast ? anyEngine.enemyStats! : anyEngine.playerStats!;

    const avgItemLevel = casterStats.avgItemLevel || 1;
    const itemLevelFactor = 1 - (avgItemLevel - 1) * 0.03;

    const healAmount = healPercent ? Math.ceil(casterStats.hp * healPercent) : 0;
    const shieldAmount = shieldPercent ? Math.ceil(casterStats.hp * shieldPercent * itemLevelFactor) : 0;

    // Звуковой эффект каста
    audioService.playSFX('/assets/audio/sfx/strike_staff.mp3');

    const logMsg = `✨ [АКТИВ СПОСОБНОСТЬ] ${heroName} использует "${abilityName}"!`;
    engine.updateState({ log: logMsg });
    engine.addCombatLog(logMsg);

    engine.onCombatEvent({
        type: 'INSTINCT',
        damage: 0,
        target: targetKey,
        label: `💥 ${abilityName.toUpperCase()}!`,
    });

    if (caster && target) {
        caster.playAttackAnimation();
        if (role === 'TANK' && typeof caster.jumpSlam === 'function') {
            await caster.jumpSlam(target.x + (isPlayerCast ? -85 : 85));
        } else {
            await caster.animateLungeForward(isPlayerCast, undefined, target.x);
        }
    }

    const rawDmg = casterStats.attack * damageMultiplier * (0.9 + Math.random() * 0.2);
    const mitigated = Math.max(1, rawDmg - targetStats.defense * 0.25);
    const finalDamage = Math.ceil(mitigated);

    if (isPlayerCast) {
        engine.totalDamageDealt += finalDamage;
    } else {
        engine.totalDamageTaken += finalDamage;
    }
    const damageLog = `💥 ${abilityName} наносит ${finalDamage} урона!`;
    engine.addCombatLog(damageLog);

    engine.onCombatEvent({
        type: 'CRIT',
        damage: finalDamage,
        target: targetKey,
    });

    if (target) {
        target.animateHitReaction(isPlayerCast);
        EffectsManager.getInstance().criticalHit(target);
        target.playHitEffect();

        // Применяем статус из конфига (если есть)
        if (onCastStatus) {
            let baseDmg = onCastStatus.damagePerTurn
                ? onCastStatus.damagePerTurn > 1
                    ? onCastStatus.damagePerTurn
                    : casterStats.attack * onCastStatus.damagePerTurn
                : 0;
            if (heroId === 'raccoon' && onCastStatus.type === 'POISON') {
                baseDmg = Math.max(15, baseDmg);
            }
            const dmgPerTurn = Math.ceil(baseDmg * itemLevelFactor);
            const targetUnit = onCastStatus.target === 'enemy' ? anyEngine.enemy : anyEngine.player;
            const isTargetPlayer = onCastStatus.target === 'player';
            engine.applyStatus(targetUnit, onCastStatus.type, onCastStatus.duration, dmgPerTurn, isTargetPlayer);
        }
    }

    if (isPlayerCast) {
        const nextE_HP = Math.max(0, engine.state.enemyHP - finalDamage);
        engine.updateState({ enemyHP: nextE_HP });
        if (nextE_HP <= 0 && anyEngine.enemy) {
            anyEngine.enemy.animateDeath(false);
        }
    } else {
        const nextP_HP = Math.max(0, engine.state.playerHP - finalDamage);
        engine.updateState({ playerHP: nextP_HP });
        if (nextP_HP <= 0 && anyEngine.player) {
            anyEngine.player.animateDeath(true);
        }
    }

    if (healAmount > 0) {
        if (isPlayerCast) {
            const nextP_HP = Math.min(casterStats.hp, engine.state.playerHP + healAmount);
            engine.updateState({ playerHP: nextP_HP });
        } else {
            const nextE_HP = Math.min(casterStats.hp, engine.state.enemyHP + healAmount);
            engine.updateState({ enemyHP: nextE_HP });
        }
        const healLog = `💚 ${abilityName} исцеляет ${heroName} на +${healAmount} HP!`;
        engine.updateState({ log: healLog });
        engine.addCombatLog(healLog);
        engine.onCombatEvent({
            type: 'BLOCK',
            damage: healAmount,
            target: casterKey,
            label: `+${healAmount} HP`,
        });
    }

    if (shieldAmount > 0) {
        if (isPlayerCast) {
            const currentShield = engine.state.playerShield || 0;
            const maxShieldLimit = Math.ceil(casterStats.hp * 0.5);
            const newShield = Math.min(maxShieldLimit, currentShield + shieldAmount);
            engine.updateState({ playerShield: newShield });
        }
        const shieldLog = `🛡️ ${abilityName} накладывает щит на +${shieldAmount} прочности!`;
        engine.updateState({ log: shieldLog });
        engine.addCombatLog(shieldLog);
        engine.onCombatEvent({
            type: 'BLOCK',
            damage: shieldAmount,
            target: casterKey,
            label: `🛡️ ЩИТ +${shieldAmount}`,
        });
    }

    const { timeScale } = useGameStore.getState();
    await new Promise((r) => setTimeout(r, 900 / timeScale));
    if (caster && ((isPlayerCast && engine.state.playerHP > 0) || (!isPlayerCast && engine.state.enemyHP > 0))) {
        await caster.animateLungeReturn(caster.defaultX, caster.defaultY);
    }
}
