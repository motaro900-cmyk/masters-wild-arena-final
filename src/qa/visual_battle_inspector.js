import puppeteer from 'puppeteer-core';
import { join } from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const REPORT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\ccb229ee-9ac6-48e8-8e69-1d19f584eae7';
const REPORT_PATH = join(REPORT_DIR, 'visual_qa_report.json');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVisualQA() {
    console.log('🔍 Starting Visual Battle Inspector Bot...');
    console.log(`🔗 Navigating to ${GAME_URL}...`);

    const matchups = [
        { player: 'minotaur', enemy: 'tiger_warrior' },
        { player: 'lion_knight', enemy: 'minotaur' }
    ];

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-gl=angle',
                '--use-angle=d3d11',
                '--ignore-gpu-blocklist',
            ],
            defaultViewport: {
                width: 1280,
                height: 720,
            }
        });

        const samples = [];

        for (const matchup of matchups) {
            console.log(`\n⚔️ Testing Matchup: ${matchup.player} vs ${matchup.enemy}`);
            const page = await browser.newPage();
            
            page.on('console', msg => {
                if (msg.text().includes('[HeroUnit]') || msg.text().includes('BattleEngine') || msg.text().includes('QA')) {
                    console.log(`[Browser] ${msg.text()}`);
                }
            });

            await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
            await delay(3000);

            // Force initialize store to skip onboarding and enter Battle directly
            console.log('⚡ Injecting battle state via GameStore...');
            await page.evaluate((pId, eId) => {
                if (window.useGameStore) {
                    window.useGameStore.setState({
                        onboardingCompleted: true,
                        name: 'VisualQATester',
                        activeScreen: 'BATTLE',
                        battleMode: 'RANKED',
                        selectedHeroId: pId,
                        selectedEnemyId: eId,
                        timeScale: 2.0 // Run battle faster to inspect transitions quickly
                    });
                    console.log(`QA: Battle state injected successfully for ${pId} vs ${eId}.`);
                } else {
                    console.error('QA: useGameStore not found on window.');
                }
            }, matchup.player, matchup.enemy);

            await delay(2000); // Wait for Pixi and BattleEngine to initialize

            console.log('🛡️ Monitoring battle visual frames for 6 seconds...');
            const startTime = Date.now();

            // Sample battle rendering details every 250ms
            for (let i = 0; i < 24; i++) {
                const frameInfo = await page.evaluate(() => {
                    if (!window.__PIXI_APP__) {
                        return { error: 'Pixi app __PIXI_APP__ not found' };
                    }

                    // Recursive helper to find HeroUnit nodes
                    function findHeroUnits(node) {
                        let results = [];
                        if (!node) return results;
                        if (node.heroInstanceId || node.bodySprite || (node.config && node.loadHero)) {
                            results.push(node);
                        }
                        if (node.children) {
                            for (let child of node.children) {
                                results = results.concat(findHeroUnits(child));
                            }
                        }
                        return results;
                    }

                    const units = findHeroUnits(window.__PIXI_APP__.stage);
                    if (units.length === 0) {
                        return { error: 'No HeroUnit instances found in Pixi stage' };
                    }

                    return units.map(unit => {
                        const globalPos = unit.parent ? unit.parent.toGlobal(unit.position) : unit.position;
                        const isPlayer = unit.position.x < 960; // Player is on the left side
                        
                        // Check texture issues (e.g. if loaded texture is empty/white fallback)
                        let textureSrc = '';
                        let isFallbackTexture = false;
                        let textureWidth = 0;
                        let textureHeight = 0;
                        if (unit.bodySprite && unit.bodySprite.texture) {
                            const tex = unit.bodySprite.texture;
                            textureWidth = tex.width;
                            textureHeight = tex.height;
                            if (tex.source && tex.source.label) {
                                textureSrc = tex.source.label;
                            }
                            if ((tex.width <= 1 && tex.height <= 1) || (tex.source && tex.source.label && tex.source.label.includes('white'))) {
                                isFallbackTexture = true;
                            }
                        }

                        // Check weapons, head, etc. socket containers
                        const hasWeapon = !!unit.weaponSocketContainer;
                        const hasHelmet = !!unit.helmetSocketContainer;
                        
                        return {
                            id: unit.config ? unit.config.id : 'unknown',
                            name: unit.config ? unit.config.name : 'unknown',
                            isPlayer,
                            x: unit.position.x,
                            y: unit.position.y,
                            globalX: globalPos.x,
                            globalY: globalPos.y,
                            scaleX: unit.scale.x,
                            scaleY: unit.scale.y,
                            bodyContainerScaleX: unit.bodyContainer ? unit.bodyContainer.scale.x : 1,
                            bodyContainerScaleY: unit.bodyContainer ? unit.bodyContainer.scale.y : 1,
                            width: unit.width,
                            height: unit.height,
                            textureSrc,
                            isFallbackTexture,
                            textureWidth,
                            textureHeight,
                            hasWeapon,
                            hasHelmet,
                            currentFrame: unit.bodySprite && unit.posesTextures ? unit.posesTextures.indexOf(unit.bodySprite.texture) : -1
                        };
                    });
                });

                if (frameInfo.error) {
                    console.log(`⚠️ QA Warning: ${frameInfo.error}`);
                } else {
                    samples.push({
                        timestamp: Date.now() - startTime,
                        units: frameInfo
                    });
                }

                // Capture screenshots at critical times for each matchup
                if (i === 4) {
                    await page.screenshot({ path: join(REPORT_DIR, `qa_${matchup.player}_vs_${matchup.enemy}_start.png`) });
                    console.log(`📸 Captured: qa_${matchup.player}_vs_${matchup.enemy}_start.png`);
                } else if (i === 12) {
                    await page.screenshot({ path: join(REPORT_DIR, `qa_${matchup.player}_vs_${matchup.enemy}_mid.png`) });
                    console.log(`📸 Captured: qa_${matchup.player}_vs_${matchup.enemy}_mid.png`);
                }

                await delay(250);
            }

            await page.screenshot({ path: join(REPORT_DIR, `qa_${matchup.player}_vs_${matchup.enemy}_end.png`) });
            console.log(`📸 Captured: qa_${matchup.player}_vs_${matchup.enemy}_end.png`);
            await page.close();
        }

        // Analyze captured frames to identify visual and logic issues
        console.log('📊 Analyzing battle telemetry...');
        const report = analyzeTelemetry(samples);
        
        fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 4));
        console.log(`\n🎉 Visual QA completed! Report saved to: ${REPORT_PATH}`);
        
        // Print Summary to console
        console.log('\n================ Visual QA Summary ================');
        console.log(`Total Samples Checked: ${report.totalSamples}`);
        console.log(`Status: ${report.status}`);
        
        if (report.issues.length > 0) {
            console.log(`❌ Found ${report.issues.length} visual/rendering issues:`);
            report.issues.forEach(issue => console.log(`  - [${issue.severity}] ${issue.description}`));
        } else {
            console.log('✅ No critical visual issues found!');
        }
        console.log('===================================================\n');

    } catch (err) {
        console.error('❌ Visual QA execution failed:', err);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 Browser closed.');
        }
    }
}

function analyzeTelemetry(samples) {
    const issues = [];
    let totalSamples = samples.length;
    let status = 'PASSED';

    if (totalSamples === 0) {
        return {
            status: 'FAILED',
            totalSamples: 0,
            issues: [{ severity: 'CRITICAL', description: 'No samples collected. Battle or Pixi did not load.' }]
        };
    }

    const unitHistory = {};

    samples.forEach(sample => {
        sample.units.forEach(unit => {
            const key = unit.isPlayer ? 'player' : 'enemy';
            if (!unitHistory[key]) {
                unitHistory[key] = {
                    id: unit.id,
                    name: unit.name,
                    positions: [],
                    scalesX: [],
                    scalesY: [],
                    frames: [],
                    widths: [],
                    heights: [],
                    fallbackTextures: 0,
                    hasWeapon: false,
                    hasHelmet: false
                };
            }
            
            unitHistory[key].positions.push({ x: unit.x, y: unit.y });
            unitHistory[key].scalesX.push(unit.scaleX);
            unitHistory[key].scalesY.push(unit.scaleY);
            unitHistory[key].frames.push(unit.currentFrame);
            unitHistory[key].widths.push(unit.width);
            unitHistory[key].heights.push(unit.height);
            if (unit.isFallbackTexture) {
                unitHistory[key].fallbackTextures++;
            }
            if (unit.hasWeapon) unitHistory[key].hasWeapon = true;
            if (unit.hasHelmet) unitHistory[key].hasHelmet = true;
        });
    });

    Object.keys(unitHistory).forEach(role => {
        const h = unitHistory[role];
        const isPlayer = role === 'player';

        const avgWidth = h.widths.reduce((sum, val) => sum + Math.abs(val), 0) / h.widths.length;
        const avgHeight = h.heights.reduce((sum, val) => sum + Math.abs(val), 0) / h.heights.length;
        if (avgWidth < 80 || avgHeight < 80) {
            issues.push({
                severity: 'WARNING',
                description: `${h.name} (${role}) is rendering too small. Average size: ${Math.round(avgWidth)}x${Math.round(avgHeight)}px. Config baseSize might need adjustment.`
            });
        }

        const firstScaleX = h.scalesX[0];
        if (isPlayer && firstScaleX < 0) {
            issues.push({
                severity: 'ERROR',
                description: `Player unit (${h.name}) is facing left (scaleX: ${firstScaleX}). Player should face right.`
            });
        }
        if (!isPlayer && firstScaleX > 0) {
            issues.push({
                severity: 'ERROR',
                description: `Enemy unit (${h.name}) is facing right (scaleX: ${firstScaleX}). Enemies should face left.`
            });
        }

        if (h.fallbackTextures > 0) {
            issues.push({
                severity: 'CRITICAL',
                description: `${h.name} (${role}) is using a fallback/empty texture. This means the assets failed to load.`
            });
        }

        const minX = Math.min(...h.positions.map(p => p.x));
        const maxX = Math.max(...h.positions.map(p => p.x));
        const movement = maxX - minX;
        if (movement < 50) {
            issues.push({
                severity: 'WARNING',
                description: `${h.name} (${role}) showed very little/no positional movement (${Math.round(movement)}px shift). Is the lunge animation working?`
            });
        }

        const animatedHeroes = ['panda', 'minotaur', 'tiger_warrior', 'lion_knight', 'raccoon'];
        if (animatedHeroes.includes(h.id)) {
            const uniqueFrames = [...new Set(h.frames)].filter(f => f !== -1);
            if (uniqueFrames.length <= 1) {
                issues.push({
                    severity: 'ERROR',
                    description: `${h.name} (${role}) stays in a single pose frame [${uniqueFrames}] throughout the battle. Pose frame switching is broken.`
                });
            }
        }
    });

    if (issues.some(i => i.severity === 'CRITICAL' || i.severity === 'ERROR')) {
        status = 'FAILED';
    } else if (issues.length > 0) {
        status = 'WARNING';
    }

    return {
        status,
        totalSamples,
        issues,
        telemetrySummary: unitHistory
    };
}

runVisualQA();
