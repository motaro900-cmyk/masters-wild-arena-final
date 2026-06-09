import type { BattleEngine } from '../BattleEngine';
import { useGameStore } from '../../../store/useGameStore';
import { audioService } from '../../../services/AudioService';
import { EffectsManager } from '../../systems/EffectsManager';
import { getAbilityConfig, getAbilityConfigByRole } from '../../../configs/AbilityConfig';

export async function castActiveAbility(engine: BattleEngine) {
    const anyEngine = engine as any;
    if (
        !anyEngine.isCombatRunning ||
        engine.state.playerMana < 100 ||
        engine.state.playerHP <= 0 ||
        engine.state.enemyHP <= 0
    )
        return;

    // Consume all mana
    engine.updateState({ playerMana: 0 });

    const store = useGameStore.getState();
    const heroId = anyEngine.player?.config?.id;
    const role = anyEngine.player?.config?.role || 'WARRIOR';
    const heroName = anyEngine.player?.config?.name || 'Герой';

    // Получаем конфиг из реестра, fallback по роли
    const abilityCfg = getAbilityConfig(heroId) ?? getAbilityConfigByRole(role);
    const { name: abilityName, damageMultiplier, healPercent, shieldPercent, onCastStatus } = abilityCfg.activeAbility;

    const avgItemLevel = anyEngine.playerStats?.avgItemLevel || 1;
    const itemLevelFactor = 1 - (avgItemLevel - 1) * 0.03;

    const healAmount = healPercent ? Math.ceil(anyEngine.playerStats!.hp * healPercent) : 0;
    const shieldAmount = shieldPercent ? Math.ceil(anyEngine.playerStats!.hp * shieldPercent * itemLevelFactor) : 0;

    // Play casting effects
    audioService.playSFX('/assets/audio/sfx/strike_staff.mp3');

    const logMsg = `✨ [АКТИВ СПОСОБНОСТЬ] ${heroName} использует "${abilityName}"!`;
    engine.updateState({ log: logMsg });
    store.addCombatLog(logMsg);

    engine.onCombatEvent({
        type: 'INSTINCT',
        damage: 0,
        target: 'enemy',
        label: `💥 ${abilityName.toUpperCase()}!`,
    });

    if (anyEngine.player && anyEngine.enemy) {
        anyEngine.player.playAttackAnimation();
        if (role === 'TANK' && typeof anyEngine.player.jumpSlam === 'function') {
            await anyEngine.player.jumpSlam(anyEngine.enemy.x - 85);
        } else {
            await anyEngine.player.animateLungeForward(true, undefined, anyEngine.enemy.x);
        }
    }

    const rawDmg = anyEngine.playerStats!.attack * damageMultiplier * (0.9 + Math.random() * 0.2);
    const mitigated = Math.max(1, rawDmg - anyEngine.enemyStats!.defense * 0.25);
    const finalDamage = Math.ceil(mitigated);

    engine.totalDamageDealt += finalDamage;
    const damageLog = `💥 ${abilityName} наносит ${finalDamage} урона врагу!`;
    store.addCombatLog(damageLog);

    engine.onCombatEvent({
        type: 'CRIT',
        damage: finalDamage,
        target: 'enemy',
    });

    if (anyEngine.enemy) {
        anyEngine.enemy.animateHitReaction(true);
        EffectsManager.getInstance().criticalHit(anyEngine.enemy);
        anyEngine.enemy.playHitEffect();

        // Применяем статус из конфига (если есть)
        if (onCastStatus) {
            let baseDmg = onCastStatus.damagePerTurn
                ? onCastStatus.damagePerTurn > 1
                    ? onCastStatus.damagePerTurn
                    : (anyEngine.playerStats!.attack * onCastStatus.damagePerTurn)
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

    const nextE_HP = Math.max(0, engine.state.enemyHP - finalDamage);
    engine.updateState({ enemyHP: nextE_HP });
    store.updateQuestProgress('DAMAGE', finalDamage);

    if (healAmount > 0) {
        const nextP_HP = Math.min(anyEngine.playerStats!.hp, engine.state.playerHP + healAmount);
        engine.updateState({ playerHP: nextP_HP });
        const healLog = `💚 ${abilityName} исцеляет вас на +${healAmount} HP!`;
        engine.updateState({ log: healLog });
        store.addCombatLog(healLog);
        engine.onCombatEvent({
            type: 'BLOCK',
            damage: healAmount,
            target: 'player',
            label: `+${healAmount} HP`,
        });
    }

    if (shieldAmount > 0) {
        const currentShield = engine.state.playerShield || 0;
        const maxShieldLimit = Math.ceil(anyEngine.playerStats!.hp * 0.5);
        const newShield = Math.min(maxShieldLimit, currentShield + shieldAmount);
        engine.updateState({ playerShield: newShield });
        const shieldLog = `🛡️ ${abilityName} накладывает щит на +${shieldAmount} прочности!`;
        engine.updateState({ log: shieldLog });
        store.addCombatLog(shieldLog);
        engine.onCombatEvent({
            type: 'BLOCK',
            damage: shieldAmount,
            target: 'player',
            label: `🛡️ ЩИТ +${shieldAmount}`,
        });
    }

    if (nextE_HP <= 0 && anyEngine.enemy) {
        anyEngine.enemy.animateDeath(false);
    }

    const { timeScale } = useGameStore.getState();
    await new Promise((r) => setTimeout(r, 900 / timeScale));
    if (anyEngine.player && engine.state.playerHP > 0) {
        await anyEngine.player.animateLungeReturn(anyEngine.player.defaultX, anyEngine.player.defaultY);
    }
}
