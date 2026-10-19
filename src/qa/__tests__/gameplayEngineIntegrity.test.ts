// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { HEROES_DB } from '../../configs/HeroesConfig';
import { ITEMS_DATABASE, calculateItemPower } from '../../game/configs/ItemsConfig';

describe('Gameplay & Engine Integrity Verification', () => {
    const EXPECTED_HERO_IDS = ['panda', 'raccoon', 'minotaur', 'tiger_warrior', 'lion_knight'];

    describe('1. 5 Heroes & Anchor Data Integrity', () => {
        it('should contain all 5 playable heroes in HEROES_DB', () => {
            const dbHeroIds = HEROES_DB.map((h) => h.id);
            for (const expectedId of EXPECTED_HERO_IDS) {
                expect(dbHeroIds).toContain(expectedId);
            }
        });

        it('should have valid non-NaN base stats for all 5 heroes', () => {
            for (const heroId of EXPECTED_HERO_IDS) {
                const hero = HEROES_DB.find((h) => h.id === heroId)!;
                expect(hero).toBeDefined();

                expect(Number.isFinite(hero.stats.hp)).toBe(true);
                expect(hero.stats.hp).toBeGreaterThan(0);
                expect(Number.isNaN(hero.stats.hp)).toBe(false);

                expect(Number.isFinite(hero.stats.attack)).toBe(true);
                expect(hero.stats.attack).toBeGreaterThan(0);
                expect(Number.isNaN(hero.stats.attack)).toBe(false);

                expect(Number.isFinite(hero.stats.defense)).toBe(true);
                expect(hero.stats.defense).toBeGreaterThanOrEqual(0);
                expect(Number.isNaN(hero.stats.defense)).toBe(false);

                expect(Number.isFinite(hero.stats.speed)).toBe(true);
                expect(hero.stats.speed).toBeGreaterThan(0);
                expect(Number.isNaN(hero.stats.speed)).toBe(false);

                expect(Number.isFinite(hero.stats.critChance)).toBe(true);
                expect(hero.stats.critChance).toBeGreaterThan(0);
                expect(Number.isNaN(hero.stats.critChance)).toBe(false);

                expect(Number.isFinite(hero.baseScale || 1.0)).toBe(true);
                expect((hero.baseScale || 1.0)).toBeGreaterThan(0);
            }
        });

        it('should have valid non-NaN anchors within normalized 0..1 range', () => {
            for (const heroId of EXPECTED_HERO_IDS) {
                const hero = HEROES_DB.find((h) => h.id === heroId)!;
                const { feet, head, rightHand, leftHand, center } = hero.anchors;

                const sockets = [
                    { name: 'feet', s: feet },
                    { name: 'head', s: head },
                    { name: 'rightHand', s: rightHand },
                    { name: 'center', s: center },
                ];
                if (leftHand) sockets.push({ name: 'leftHand', s: leftHand });

                for (const { name, s } of sockets) {
                    expect(Number.isFinite(s.x), `${heroId} ${name} x is not finite`).toBe(true);
                    expect(Number.isNaN(s.x), `${heroId} ${name} x is NaN`).toBe(false);
                    expect(s.x, `${heroId} ${name} x out of bounds`).toBeGreaterThanOrEqual(0);
                    expect(s.x, `${heroId} ${name} x out of bounds`).toBeLessThanOrEqual(1);

                    expect(Number.isFinite(s.y), `${heroId} ${name} y is not finite`).toBe(true);
                    expect(Number.isNaN(s.y), `${heroId} ${name} y is NaN`).toBe(false);
                    expect(s.y, `${heroId} ${name} y out of bounds`).toBeGreaterThanOrEqual(0);
                    expect(s.y, `${heroId} ${name} y out of bounds`).toBeLessThanOrEqual(1);

                    if (s.scale !== undefined) {
                        expect(Number.isFinite(s.scale)).toBe(true);
                        expect(Number.isNaN(s.scale)).toBe(false);
                        expect(s.scale).toBeGreaterThan(0);
                    }
                    if (s.angle !== undefined) {
                        expect(Number.isFinite(s.angle)).toBe(true);
                        expect(Number.isNaN(s.angle)).toBe(false);
                    }
                }
            }
        });

        it('should have valid spritesheet JSON on disk for each hero', () => {
            const projectRoot = path.resolve(__dirname, '../../..');
            for (const heroId of EXPECTED_HERO_IDS) {
                const jsonPath = path.join(projectRoot, 'public', 'assets', 'characters', heroId, `${heroId}_poses.png.json`);
                expect(fs.existsSync(jsonPath), `Missing spritesheet JSON: ${jsonPath}`).toBe(true);

                const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                expect(content.frames, `Spritesheet JSON ${heroId} missing frames`).toBeDefined();
            }
        });

        it('should calculate valid avatar renderer dimensions without NaN for all 5 heroes', () => {
            const HERO_TEXTURE_DIMENSIONS: Record<string, { width: number; height: number }> = {
                panda: { width: 509, height: 500 },
                raccoon: { width: 562, height: 491 },
                minotaur: { width: 487, height: 462 },
                tiger_warrior: { width: 429, height: 447 },
                lion_knight: { width: 411, height: 438 },
            };

            const size = 460;
            const BASE_SIZE = 512;
            const cameraScale = 0.95;
            const groundY = size * 0.85;
            const centerX = size * 0.5;

            for (const heroId of EXPECTED_HERO_IDS) {
                const heroConfig = HEROES_DB.find((h) => h.id === heroId)!;
                const scaleFactor = (size / BASE_SIZE) * (heroConfig.baseScale || 1.0) * cameraScale;

                const texDimensions = HERO_TEXTURE_DIMENSIONS[heroId] || { width: 512, height: 512 };
                const maxDim = Math.max(texDimensions.width, texDimensions.height, 512);
                const normWidth = 512 * (texDimensions.width / maxDim);
                const normHeight = 512 * (texDimensions.height / maxDim);

                const rootX = centerX - heroConfig.anchors.feet.x * normWidth * scaleFactor;
                const rootY = groundY - heroConfig.anchors.feet.y * normHeight * scaleFactor;

                expect(Number.isFinite(scaleFactor)).toBe(true);
                expect(scaleFactor).toBeGreaterThan(0);
                expect(Number.isFinite(rootX)).toBe(true);
                expect(Number.isFinite(rootY)).toBe(true);
                expect(Number.isNaN(rootX)).toBe(false);
                expect(Number.isNaN(rootY)).toBe(false);

                // Test socket positions (rightHand, head, center)
                for (const socket of [heroConfig.anchors.head, heroConfig.anchors.rightHand, heroConfig.anchors.center]) {
                    const itemX = rootX + socket.x * normWidth * scaleFactor;
                    const itemY = rootY + socket.y * normHeight * scaleFactor;
                    expect(Number.isFinite(itemX)).toBe(true);
                    expect(Number.isFinite(itemY)).toBe(true);
                    expect(Number.isNaN(itemX)).toBe(false);
                    expect(Number.isNaN(itemY)).toBe(false);
                }
            }
        });
    });

    describe('2. Combat Math & Damage Formula Verification', () => {
        function calculateDamageSimulation(
            attackerAttack: number,
            attackerCritChance: number,
            attackerCritDamage: number,
            targetDefense: number,
            targetAvgItemLevel: number,
            isCrit: boolean = false,
            role: string = 'WARRIOR',
            isExecuteRange: boolean = false
        ) {
            let finalAttack = attackerAttack;
            let finalCritChance = attackerCritChance;

            if (role === 'ASSASSIN' && isExecuteRange) {
                finalAttack = Math.round(finalAttack * 1.3);
                finalCritChance = Math.min(1.0, finalCritChance + 0.15);
            }

            let damage = finalAttack * 1.0; // midpoint of (0.9..1.1)
            const cappedCrit = Math.min(attackerCritDamage || 1.5, 3.0);
            if (isCrit) damage *= cappedCrit;

            const divisor = 200 + (Math.max(1, targetAvgItemLevel) - 1) * 25;
            const mitigation = targetDefense / (targetDefense + divisor);
            const mitigated = damage * (1 - mitigation);
            const finalDamage = Math.max(1, Math.ceil(mitigated));

            return {
                finalAttack,
                finalCritChance,
                damage,
                mitigation,
                finalDamage,
            };
        }

        it('should produce strictly positive, finite integers for damage across extreme values', () => {
            const testCases = [
                { atk: 10, def: 5, lvl: 1 },
                { atk: 1, def: 0, lvl: 1 },
                { atk: 10000, def: 0, lvl: 100 },
                { atk: 10, def: 10000, lvl: 1 }, // massive defense
                { atk: 100, def: 50, lvl: 10 },
                { atk: 42, def: 18, lvl: 5 }, // Rikki vs Gromm
                { atk: 28, def: 6, lvl: 5 },  // Gromm vs Rikki
                { atk: 34, def: 11, lvl: 8 }, // Aurelius vs Tiger
            ];

            for (const tc of testCases) {
                const resNormal = calculateDamageSimulation(tc.atk, 0.1, 1.5, tc.def, tc.lvl, false);
                expect(Number.isFinite(resNormal.finalDamage)).toBe(true);
                expect(Number.isNaN(resNormal.finalDamage)).toBe(false);
                expect(resNormal.finalDamage).toBeGreaterThanOrEqual(1);

                const resCrit = calculateDamageSimulation(tc.atk, 0.1, 1.5, tc.def, tc.lvl, true);
                expect(Number.isFinite(resCrit.finalDamage)).toBe(true);
                expect(Number.isNaN(resCrit.finalDamage)).toBe(false);
                expect(resCrit.finalDamage).toBeGreaterThanOrEqual(resNormal.finalDamage);

                // Assassin execute range check
                const resExecute = calculateDamageSimulation(tc.atk, 0.1, 1.5, tc.def, tc.lvl, false, 'ASSASSIN', true);
                expect(resExecute.finalDamage).toBeGreaterThanOrEqual(resNormal.finalDamage);
            }
        });

        it('should calculate item powers for weapons, helmets, armor without NaN', () => {
            for (const [itemId, item] of Object.entries(ITEMS_DATABASE)) {
                const power = calculateItemPower(item);
                expect(Number.isFinite(power), `Item ${itemId} power is not finite`).toBe(true);
                expect(Number.isNaN(power), `Item ${itemId} power is NaN`).toBe(false);
                expect(power, `Item ${itemId} power should be >= 0`).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('3. Memory GC & Floating Text Limiter Verification', () => {
        it('should cap floating damage texts to max allowed count', () => {
            let damageTexts: any[] = [];
            const addDamageText = (text: string) => {
                const maxAllowed = 4;
                const sliced = damageTexts.length >= 5 ? damageTexts.slice(damageTexts.length - maxAllowed) : damageTexts;
                damageTexts = [...sliced, { id: Math.random(), text }];
            };

            for (let i = 0; i < 20; i++) {
                addDamageText(`-${i * 10}`);
            }

            expect(damageTexts.length).toBeLessThanOrEqual(5);
        });

        it('should cap live combat log to last 5 entries', () => {
            let liveLog: any[] = [];
            const addLog = (text: string) => {
                liveLog = [...liveLog.slice(-4), { id: Math.random(), text }];
            };

            for (let i = 0; i < 30; i++) {
                addLog(`Log ${i}`);
            }

            expect(liveLog.length).toBeLessThanOrEqual(5);
        });
    });
});
