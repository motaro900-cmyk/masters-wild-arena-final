import type { BattleEngine } from '../BattleEngine';
import { useGameStore } from '../../../store/useGameStore';
import { audioService } from '../../../services/AudioService';
import { EffectsManager } from '../../systems/EffectsManager';

export async function castActiveAbility(engine: BattleEngine) {
    const anyEngine = engine as any;
    if (!anyEngine.isCombatRunning || engine.state.playerMana < 100 || engine.state.playerHP <= 0 || engine.state.enemyHP <= 0)
        return;

    // Consume all mana
    engine.updateState({ playerMana: 0 });

    const store = useGameStore.getState();
    const heroName = anyEngine.player?.config?.name || 'Герой';
    const role = anyEngine.player?.config?.role || 'WARRIOR';

    // Play casting effects
    audioService.playSFX('/assets/audio/sfx/strike_staff.mp3');

    let abilityName = 'Суперудар';
    let damageMultiplier = 2.0;
    let healAmount = 0;
    let shieldAmount = 0;

    if (role === 'WARRIOR') {
        abilityName = 'Удар Дзена';
        damageMultiplier = 2.5;
    } else if (role === 'ASSASSIN') {
        abilityName = 'Танец Теней';
        damageMultiplier = 3.5;
    } else if (role === 'TANK') {
        abilityName = 'Молот Земли';
        damageMultiplier = 1.8;
        shieldAmount = Math.ceil(anyEngine.playerStats!.hp * 0.25);
    } else {
        abilityName = 'Вспышка Звезд';
        damageMultiplier = 2.2;
        healAmount = Math.ceil(anyEngine.playerStats!.hp * 0.2);
    }

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
        await anyEngine.player.animateLungeForward(true, undefined, anyEngine.enemy.x);
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

        if (role === 'WARRIOR' && Math.random() < 0.5) {
            engine.applyStatus(anyEngine.enemy, 'STUN', 1, 0, false);
        } else if (role === 'TANK' && Math.random() < 0.5) {
            engine.applyStatus(anyEngine.enemy, 'STUN', 1, 0, false);
        } else if (role === 'MAGE') {
            const burnDmg = Math.ceil(anyEngine.playerStats!.attack * 0.15);
            engine.applyStatus(anyEngine.enemy, 'BURN', 3, burnDmg, false);
        } else if (role === 'ASSASSIN') {
            const poisonDmg = Math.ceil(anyEngine.playerStats!.attack * 0.1);
            engine.applyStatus(anyEngine.enemy, 'POISON', 4, poisonDmg, false);
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
        const nextP_HP = Math.min(anyEngine.playerStats!.hp + shieldAmount, engine.state.playerHP + shieldAmount);
        engine.updateState({ playerHP: nextP_HP });
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
