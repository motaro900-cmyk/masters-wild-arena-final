import { gsap } from 'gsap';
import { HeroUnit } from '../../entities/HeroUnit';
import { EffectsManager } from '../../systems/EffectsManager';
import { audioService } from '../../../services/AudioService';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { getAbilityConfig, getAbilityConfigByRole } from '../../../configs/AbilityConfig';
import type { BattleEngine } from '../BattleEngine';

function getWeaponArchetype(itemId: string | null): 'SWORD' | 'BOW' | 'STAFF' | 'DAGGER' | 'OTHER' {
    if (!itemId) return 'OTHER';
    const id = itemId.toLowerCase();
    if (id.includes('bow')) return 'BOW';
    if (
        id.includes('staff') ||
        id.includes('wand') ||
        id.includes('stick') ||
        id.includes('scepter') ||
        id.includes('jezl')
    )
        return 'STAFF';
    if (id.includes('dagger') || id.includes('claw')) return 'DAGGER';
    if (id.includes('sword') || id.includes('katana') || id.includes('blade') || id.includes('sabre')) return 'SWORD';
    return 'OTHER';
}

export async function executeAttack(engine: BattleEngine, attacker: HeroUnit, victim: HeroUnit, isPlayer: boolean) {
    const anyEngine = engine as any;
    if (!anyEngine.isCombatRunning) return;

    const { timeScale } = useGameStore.getState();
    const attackerEquipment = useGameStore.getState().heroEquipment[attacker.config?.id || ''] || {};
    const attackerWeaponId = attackerEquipment.WEAPONS || null;
    const attackerWeaponArchetype = getWeaponArchetype(attackerWeaponId);

    if (isPlayer) {
        const currentMana = anyEngine.state.playerMana;
        const newMana = Math.min(100, currentMana + 25);
        anyEngine.updateState({ playerMana: newMana });
    }

    await new Promise((r) => setTimeout(r, 100 / timeScale));

    const startX = attacker.x;
    const startY = attacker.y;

    const inventoryItem = useGameStore
        .getState()
        .inventory.find((i: any) => i.id === attackerWeaponId || i.instanceId === attackerWeaponId);
    const weaponBaseId = inventoryItem ? inventoryItem.id : attackerWeaponId;
    const weaponData = weaponBaseId ? ITEMS_DATABASE[weaponBaseId] : null;
    let specialChance = 0.08;
    if (weaponData) {
        const rarity = (weaponData.rarity || 'COMMON').toUpperCase();
        if (rarity === 'UNCOMMON') specialChance += 0.05;
        else if (rarity === 'RARE') specialChance += 0.1;
        else if (rarity === 'EPIC') specialChance += 0.18;
        else if (rarity === 'LEGENDARY') specialChance += 0.28;

        const wLvl = inventoryItem?.level || 1;
        specialChance += wLvl * 0.01;
    }

    const stats = isPlayer ? anyEngine.playerStats! : anyEngine.enemyStats!;
    const isCrit = Math.random() < stats.critChance;
    if (isCrit) specialChance += 0.12;
    specialChance = Math.min(0.8, specialChance);

    const isSpecialStrike = Math.random() < specialChance;
    attacker.attackCounter = (attacker.attackCounter || 0) + 1;
    const isAssassin = attacker.config?.role === 'ASSASSIN';
    const isShadowStep = isAssassin && attacker.attackCounter % 3 === 0;

    if (isShadowStep) {
        const stepLog = `👤 ${attacker.config.name} уходит в тень (Shadow Step)!`;
        anyEngine.updateState({ log: stepLog });
        anyEngine.addCombatLog(stepLog);

        await attacker.animateTeleportOut();
        if (!anyEngine.isCombatRunning) return;

        const targetX = isPlayer ? victim.x + 85 : victim.x - 85;
        const faceScaleX = -attacker.parentDefaultScaleX;

        await attacker.animateTeleportIn(targetX, faceScaleX);
    } else if (isSpecialStrike) {
        if (attacker.config?.role === 'TANK' && typeof attacker.jumpSlam === 'function') {
            await attacker.jumpSlam(isPlayer ? victim.x - 85 : victim.x + 85);
        } else {
            await attacker.animateLungeForward(isPlayer, 6, victim.x);
        }
    } else {
        await attacker.animateLungeForward(isPlayer, undefined, victim.x);
    }

    if (!anyEngine.isCombatRunning) return;

    const isJumpStrikeCombo = isSpecialStrike && !isShadowStep;

    if (isJumpStrikeCombo) {
        const baseScale = attacker.config.baseScale || 1.0;

        const tweenTo = (
            obj: any,
            props: Record<string, number>,
            durationMs: number,
            easeIn = false,
        ): Promise<void> => {
            return new Promise((resolve) => {
                const startVals: Record<string, number> = {};
                for (const k in props) startVals[k] = obj[k];
                const start = performance.now();
                let id: number;
                const tick = (now: number) => {
                    if (anyEngine.tweensCancelled) {
                        resolve();
                        return;
                    }
                    const t = Math.min(1, (now - start) / durationMs);
                    const ease = easeIn ? t * t : 1 - Math.pow(1 - t, 2);
                    for (const k in props) obj[k] = startVals[k] + (props[k] - startVals[k]) * ease;
                    if (t < 1) {
                        anyEngine.activeRafIds = anyEngine.activeRafIds.filter((x: any) => x !== id);
                        id = requestAnimationFrame(tick);
                        anyEngine.activeRafIds.push(id);
                    } else {
                        anyEngine.activeRafIds = anyEngine.activeRafIds.filter((x: any) => x !== id);
                        resolve();
                    }
                };
                id = requestAnimationFrame(tick);
                anyEngine.activeRafIds.push(id);
            });
        };

        const chargeDuration = Math.round(450 / timeScale);
        tweenTo(attacker, { y: startY - 460 }, chargeDuration);
        tweenTo(
            attacker.scale,
            {
                x: attacker.parentDefaultScaleX * 1.3,
                y: baseScale * 1.3,
            },
            chargeDuration,
        );

        EffectsManager.getInstance().particleBurst(attacker.x, attacker.y - 200, 12, 0x00ffff, 120);

        await new Promise((r) => setTimeout(r, chargeDuration));
        if (!anyEngine.isCombatRunning) return;

        attacker.playAttackAnimation();

        const smashDuration = Math.round(220 / timeScale);
        tweenTo(attacker, { x: victim.x, y: victim.y }, smashDuration, true);
        tweenTo(
            attacker.scale,
            {
                x: attacker.parentDefaultScaleX,
                y: baseScale,
            },
            smashDuration,
            true,
        );

        await new Promise((r) => setTimeout(r, smashDuration));
        if (!anyEngine.isCombatRunning) return;

        EffectsManager.getInstance().screenShake(25, 0.9, 600);
        audioService.playCritSFX();

        const hitX = victim.x;
        const hitY = victim.y - 120;
        EffectsManager.getInstance().particleBurst(hitX, hitY, 35, 0xffea00, 320);
        EffectsManager.getInstance().slashEffect(hitX, hitY, isPlayer, attacker.config?.role, true);

        const targetStats = isPlayer ? anyEngine.enemyStats! : anyEngine.playerStats!;
        const { isOneShot } = useGameStore.getState();

        let damage = stats.attack * 2.5 * (0.9 + Math.random() * 0.2);
        if (isPlayer && isOneShot) damage = 999999;
        const finalDamage = Math.ceil(Math.max(1, damage - targetStats.defense * 0.5));

        const hasStunImmunity = victim.statusEffects.some((s: any) => s.type === 'STUN_IMMUNITY');

        if (!hasStunImmunity) {
            victim.isStunnedStatus = true;
            victim.showStunEffect();
            victim.setFrame(0);
            anyEngine.onCombatEvent({
                type: 'INSTINCT',
                damage: 0,
                target: isPlayer ? 'enemy' : 'player',
                label: '💫 ОГЛУШЕНИЕ!',
            });
        } else {
            anyEngine.onCombatEvent({
                type: 'INSTINCT',
                damage: 0,
                target: isPlayer ? 'enemy' : 'player',
                label: '🛡️ ИММУНИТЕТ К СТАНУ',
            });
            anyEngine.addCombatLog(`🛡️ ${victim.config.name} защищен от оглушения иммунитетом!`);
        }

        victim.playHitEffect();
        victim.animateHitReaction(true);

        const comboMsg = `💥 [КОМБО] ${attacker.config.name} проводит Сокрушительный прыжок на ${finalDamage} урона с оглушением!`;
        anyEngine.updateState({ log: comboMsg });
        anyEngine.addCombatLog(comboMsg);

        if (isPlayer) {
            const nextHP = anyEngine.applyDamage('enemy', finalDamage);
            if (nextHP <= 0) victim.animateDeath(false);
        } else {
            const nextHP = anyEngine.applyDamage('player', finalDamage);
            if (nextHP <= 0) victim.animateDeath(true);
        }

        await new Promise((r) => setTimeout(r, 600 / timeScale));
        await attacker.animateLungeReturn(startX, startY);
        return;
    }

    attacker.playAttackAnimation();

    const hitX = isPlayer ? attacker.x + 85 : attacker.x - 85;
    const hitY = attacker.y - 120;

    if (attackerWeaponArchetype === 'STAFF') {
        const startX = attacker.x;
        const startY = attacker.y - 120;
        const targetX = victim.x;
        const targetY = victim.y - 120;
        if (isCrit) {
            EffectsManager.getInstance().spawnLightningStrike(targetX, targetY);
        } else {
            EffectsManager.getInstance().spawnFireballProjectile(startX, startY, targetX, targetY, victim);
        }
    } else {
        EffectsManager.getInstance().slashEffect(hitX, hitY, isPlayer, attacker.config?.role, isCrit);
    }

    const targetStats = isPlayer ? anyEngine.enemyStats! : anyEngine.playerStats!;
    const { isGodMode, isOneShot } = useGameStore.getState();

    let instinctEvent: { type: 'RAGE' | 'SHIELD' | 'COUNTER' | 'FOCUS'; label: string } | null = null;
    if (Math.random() < 0.15 && !(isPlayer && isOneShot)) {
        const instincts = [
            { type: 'RAGE', label: 'ЯРОСТЬ (+50% Урон)' },
            { type: 'FOCUS', label: 'КОНЦЕНТРАЦИЯ (Без промаха)' },
            { type: 'SHIELD', label: 'КАМЕННАЯ КОЖА (-50% Урон)' },
            { type: 'COUNTER', label: 'ОТВЕТНЫЙ УДАР' },
        ] as const;
        instinctEvent = instincts[Math.floor(Math.random() * instincts.length)];

        anyEngine.onCombatEvent({
            type: 'INSTINCT',
            damage: 0,
            target:
                instinctEvent.type === 'SHIELD' || instinctEvent.type === 'COUNTER'
                    ? isPlayer
                        ? 'enemy'
                        : 'player'
                    : isPlayer
                      ? 'player'
                      : 'enemy',
            label: instinctEvent.label,
        });
        anyEngine.addCombatLog(`⚡ Сработал инстинкт: ${instinctEvent.label}!`);

        await new Promise((r) => setTimeout(r, 400 / timeScale));
    }

    const victimEquipment = useGameStore.getState().heroEquipment[victim.config?.id || ''] || {};
    const victimWeaponId = victimEquipment.WEAPONS || null;
    const victimWeaponArchetype = getWeaponArchetype(victimWeaponId);

    let extraDodge = 0;
    if (victimWeaponArchetype === 'BOW') {
        extraDodge = 0.15;
    }

    const effectiveAccuracy = stats.accuracy || 100;
    const effectiveDodge = Math.max(0, (targetStats.dodge || 0.05) - Math.max(0, effectiveAccuracy - 100) * 0.005);
    const totalDodgeChance = Math.min(0.6, effectiveDodge + extraDodge);
    let hasDodged = Math.random() < totalDodgeChance;
    if (instinctEvent?.type === 'FOCUS') hasDodged = false;
    if (victim.isStunnedStatus) hasDodged = false;

    if (hasDodged && !(isPlayer && isOneShot)) {
        attacker.playAttackAnimation();
        await new Promise((r) => setTimeout(r, 150 / timeScale));

        audioService.playSFX('/assets/audio/sfx/miss.mp3');
        const dodgeTypeLabel = victimWeaponArchetype === 'BOW' ? ' (Благодаря луку!)' : '';
        const logMsg = `[Раунд] ${isPlayer ? 'Враг' : 'Вы'} уклоняется от атаки! (УВОРОТ)${dodgeTypeLabel}`;
        anyEngine.updateState({ log: logMsg });
        anyEngine.addCombatLog(logMsg);
        anyEngine.onCombatEvent({ type: 'DODGE', damage: 0, target: isPlayer ? 'enemy' : 'player' });

        const dodgePromise = victim.animateDodge(!isPlayer);
        EffectsManager.getInstance().dodgeEffect(victim);

        await dodgePromise;

        if (isShadowStep) {
            await attacker.animateTeleportOut();
            const originalFaceScaleX = attacker.parentDefaultScaleX;
            await attacker.animateTeleportIn(startX, originalFaceScaleX);
        } else {
            await attacker.animateLungeReturn(startX, startY);
        }
        return;
    }

    let damage = stats.attack * (0.9 + Math.random() * 0.2);
    const cappedCritDamage = Math.min(stats.critDamage || 1.5, 3.0);
    if (isCrit) damage *= cappedCritDamage;
    if (instinctEvent?.type === 'RAGE') damage *= 1.5;
    if (isPlayer && isOneShot) damage = 999999;

    const effectiveDef = Math.max(0, targetStats.defense - (stats.penetration || 0));
    let targetDefense = effectiveDef;
    if (attackerWeaponArchetype === 'STAFF') {
        targetDefense *= 0.5;
        anyEngine.addCombatLog(`✨ [Магия] Атака посохом игнорирует 50% защиты цели!`);
    }

    const targetAvgItemLevel = targetStats.avgItemLevel || 1;
    const divisor = 200 + (targetAvgItemLevel - 1) * 25;
    const mitigation = targetDefense / (targetDefense + divisor);
    let mitigated = damage * (1 - mitigation);
    if (!isPlayer && isGodMode) mitigated = 0;
    if (instinctEvent?.type === 'SHIELD') mitigated *= 0.5;

    let finalDamage = Math.ceil(mitigated);
    finalDamage = anyEngine.triggerPassiveOnDealDamage(attacker, victim, finalDamage, isCrit, isPlayer);

    if (instinctEvent?.type === 'COUNTER') {
        const counterDamage = Math.max(1, Math.ceil(targetStats.attack * 0.5));
        if (isPlayer) {
            const nextP_HP = anyEngine.applyDamage('player', counterDamage);
            anyEngine.totalDamageTaken += counterDamage;
            anyEngine.onCombatEvent({ type: 'HIT', damage: counterDamage, target: 'player' });
            if (nextP_HP <= 0) attacker.animateDeath(true);
        } else {
            const nextE_HP = anyEngine.applyDamage('enemy', counterDamage);
            anyEngine.onCombatEvent({ type: 'HIT', damage: counterDamage, target: 'enemy' });
            anyEngine.totalDamageDealt += counterDamage;
            if (counterDamage > anyEngine.maxSingleHitDamage) {
                anyEngine.maxSingleHitDamage = counterDamage;
            }
            if (nextE_HP <= 0) attacker.animateDeath(false);
        }
    }

    let hasBlocked = Math.random() < (targetStats.defense > 0 ? 0.15 : 0.05);
    if (instinctEvent?.type === 'FOCUS') hasBlocked = false;
    if (victim.isStunnedStatus) hasBlocked = false;

    if (hasBlocked && !(isPlayer && isOneShot)) {
        audioService.playSFX('/assets/audio/sfx/block.mp3');
        const blockedDamage = Math.max(1, Math.ceil(finalDamage * 0.3));
        if (isPlayer) {
            anyEngine.totalDamageDealt += blockedDamage;
            if (blockedDamage > anyEngine.maxSingleHitDamage) {
                anyEngine.maxSingleHitDamage = blockedDamage;
            }
        }
        const logMsg = `[Раунд] ${isPlayer ? 'Враг' : 'Вы'} блокирует удар! Урон снижен до ${blockedDamage}.`;
        anyEngine.updateState({ log: logMsg });
        anyEngine.addCombatLog(logMsg);
        anyEngine.onCombatEvent({ type: 'BLOCK', damage: blockedDamage, target: isPlayer ? 'enemy' : 'player' });

        victim.animateDefend();
        EffectsManager.getInstance().blockEffect(victim);
        victim.playHitEffect();

        if (isPlayer) {
            const nextHP = anyEngine.applyDamage('enemy', blockedDamage);
            if (nextHP <= 0) victim.animateDeath(false);
        } else {
            const nextHP = anyEngine.applyDamage('player', blockedDamage);
            anyEngine.totalDamageTaken += blockedDamage;
            if (nextHP <= 0) victim.animateDeath(true);
        }

        await new Promise((r) => setTimeout(r, 600 / timeScale));
        await attacker.animateLungeReturn(startX, startY);
        return;
    }

    let logMsg: string;
    if (isPlayer) {
        anyEngine.totalDamageDealt += finalDamage;
        if (finalDamage > anyEngine.maxSingleHitDamage) {
            anyEngine.maxSingleHitDamage = finalDamage;
        }
    } else {
        anyEngine.totalDamageTaken += finalDamage;
    }

    let isStunnedThisHit = false;
    if (isCrit && Math.random() < 0.35) {
        isStunnedThisHit = true;
        anyEngine.applyStatus(victim, 'STUN', 1, 0, !isPlayer);
    }

    const attackerId = attacker.config?.id;
    const attackerRole = attacker.config?.role;

    const abilityCfg = getAbilityConfig(attackerId) ?? getAbilityConfigByRole(attackerRole);
    if (abilityCfg?.attackPassive) {
        const { chance, status, duration, damagePercent, value } = abilityCfg.attackPassive;
        if (Math.random() < chance) {
            const avgItemLevel = stats.avgItemLevel || 1;
            const itemLevelFactor = 1 - (avgItemLevel - 1) * 0.03;
            let baseDmg = damagePercent ? (stats.attack * damagePercent) : (value ?? 0);
            if (attackerId === 'raccoon' && status === 'POISON') {
                baseDmg = Math.max(15, baseDmg);
            }
            const dmgPerTurn = Math.ceil(baseDmg * itemLevelFactor);
            anyEngine.applyStatus(victim, status, duration, dmgPerTurn, !isPlayer);
        }
    }

    if (isCrit) {
        audioService.playCritSFX();
        logMsg = `[Раунд] ${isPlayer ? 'Вы наносите' : 'Враг наносит'} КРИТИЧЕСКИЙ УДАР на ${finalDamage}!${isStunnedThisHit ? ' (ОГЛУШЕНИЕ!)' : ''}`;
        anyEngine.onCombatEvent({
            type: 'CRIT',
            damage: finalDamage,
            target: isPlayer ? 'enemy' : 'player',
        });

        if (isStunnedThisHit) {
            anyEngine.onCombatEvent({
                type: 'INSTINCT',
                damage: 0,
                target: isPlayer ? 'enemy' : 'player',
                label: '💫 ОГЛУШЕНИЕ!',
            });
        }

        victim.animateHitReaction(true);
        EffectsManager.getInstance().criticalHit(victim);
        if (isStunnedThisHit) {
            anyEngine.addCombatLog(`💫 ${isPlayer ? 'Враг' : 'Вы'} оглушен критическим ударом!`);
        }
    } else {
        audioService.playStrikeSFX(attackerWeaponArchetype);
        logMsg = `[Раунд] ${isPlayer ? 'Вы бьёте' : 'Враг бьёт'} на ${finalDamage}!`;
        anyEngine.onCombatEvent({ type: 'HIT', damage: finalDamage, target: isPlayer ? 'enemy' : 'player' });

        victim.animateHitReaction(false);
        EffectsManager.getInstance().normalHit(victim);
    }

    victim.playHitEffect();
    anyEngine.updateState({ log: logMsg });
    anyEngine.addCombatLog(logMsg);

    if (isPlayer) {
        const nextHP = anyEngine.applyDamage('enemy', finalDamage);
        if (nextHP <= 0) victim.animateDeath(false);
    } else {
        const nextHP = anyEngine.applyDamage('player', finalDamage);
        if (nextHP <= 0) victim.animateDeath(true);
    }

    await new Promise((r) => setTimeout(r, 600 / timeScale));
    if (isShadowStep) {
        await attacker.animateTeleportOut();
        const originalFaceScaleX = attacker.parentDefaultScaleX;
        await attacker.animateTeleportIn(startX, originalFaceScaleX);
    } else {
        await attacker.animateLungeReturn(startX, startY);
    }
}
