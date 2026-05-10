/**
 * @module BattleCanvas
 * Компонент отрисовки боевой сцены на PixiJS
 */

import { useEffect, useRef, useState } from 'react';
import { useBattleStore } from '../../store/useBattleStore';
import { PixiApp } from '../../engine/core/PixiApp';
import { Fighter } from '../../entities/Fighter';
import { BattleEngine } from '@engine/core/BattleEngine';
import { getHeroConfig } from '../../data/heroes';
import * as PIXI from 'pixi.js';

interface BattleUnit {
    fighter: Fighter;
    sprite: PIXI.Sprite;
    healthBar: PIXI.Graphics;
    updateHealthBar: () => void;
}

export function BattleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pixiAppRef = useRef<PixiApp | null>(null);
    const battleEngineRef = useRef<BattleEngine | null>(null);
    const unitsRef = useRef<Map<string, BattleUnit>>(new Map());
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [roundNumber] = useState(1);

    const battlePhase = useBattleStore((s) => s.battlePhase);
    const battleActive = useBattleStore((s) => s.battleActive);

    // Инициализация PixiJS и боевого движка
    useEffect(() => {
        if (!canvasRef.current) return;

        let isMounted = true;
        const app = PixiApp.getInstance();
        
        // Асинхронная инициализация PixiJS v8
        app.init({ width: 1920, height: 1080 }, canvasRef.current).then(() => {
            if (!isMounted) return;
            pixiAppRef.current = app;

            // Создаём контейнер для бойцов
            const fightersContainer = new PIXI.Container();
            app.stage.addChild(fightersContainer);

            // Создаём контейнер для фона
            const backgroundContainer = new PIXI.Container();
            app.stage.addChildAt(backgroundContainer, 0);

            // EMERGENCY RESTORATION: Disable placeholder background overriding the scene

            // TECHNICAL ARTIST DIRECTIVE: Pixel-Perfect Text Rendering
            if (!PIXI.Cache.has('BattlePixelFont-bitmap')) {
                PIXI.BitmapFont.install({
                    name: 'BattlePixelFont',
                    style: {
                        fontFamily: 'Impact', // Heavy block font
                        fontWeight: '900',
                        fontSize: 48, // Large atlas size for crisp scaled rendering
                        fill: 0xffffff,
                        stroke: { color: 0x10131f, width: 4, join: 'miter' }
                    },
                    chars: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-!?., ',
                    resolution: 2
                });
            }

            battleEngineRef.current = new BattleEngine();
            battleEngineRef.current.setContainer(fightersContainer);
        });

        return () => {
            isMounted = false;
            app.destroy();
            pixiAppRef.current = null;
            battleEngineRef.current = null;
            unitsRef.current.clear();
        };
    }, []);

    // Запуск боя
    useEffect(() => {
        if (!battleActive || !battleEngineRef.current || !pixiAppRef.current) return;
        if (battlePhase !== 'start') return;

        const engine = battleEngineRef.current;
        const app = pixiAppRef.current;
        const container = app.stage.children[0] as PIXI.Container;

        // Создаём бойцов из выбранных героев
        const hero1Config = getHeroConfig('panda');
        const hero2Config = getHeroConfig('cat');

        if (!hero1Config || !hero2Config) return;

        // Создаём бойца 1 (слева)
        const fighter1 = new Fighter({
            name: hero1Config.name,
            health: hero1Config.stats.strength * 5,
            maxHealth: hero1Config.stats.strength * 5,
            attack: hero1Config.stats.strength,
            defense: hero1Config.stats.stamina,
            speed: hero1Config.stats.agility,
            critChance: 0.1,
            color: hero1Config.color,
            position: { x: 250, y: 300 },
        });

        // Создаём бойца 2 (справа)
        const fighter2 = new Fighter({
            name: hero2Config.name,
            health: hero2Config.stats.strength * 5,
            maxHealth: hero2Config.stats.strength * 5,
            attack: hero2Config.stats.strength,
            defense: hero2Config.stats.stamina,
            speed: hero2Config.stats.agility,
            critChance: 0.1,
            color: hero2Config.color,
            position: { x: 550, y: 300 },
        });

        // Добавляем бойцов в движок
        engine.addFighter(fighter1, 250, 300);
        engine.addFighter(fighter2, 550, 300);

        // Создаём спрайты
        const createUnit = (fighter: Fighter, side: 'left' | 'right') => {
            const group = new PIXI.Container();

            // Тело (круг)
            const body = new PIXI.Graphics();
            body.beginFill(fighter.color);
            body.drawCircle(0, 0, 40);
            body.endFill();
            body.lineStyle(3, 0xffffff);
            body.drawCircle(0, 0, 40);
            group.addChild(body);

            // TECHNICAL ARTIST DIRECTIVE: Overhead Pixel-Perfect Label
            const nameText = new PIXI.BitmapText({
                text: 'ЧТО-ТО',
                style: {
                    fontFamily: 'BattlePixelFont',
                    fontSize: 24, // Clean multiple for retro pixel look
                    align: 'center'
                }
            });
            nameText.anchor.set(0.5, 0); // Center horizontally, top origin
            nameText.y = -90; // Approx 20-30px padding above the head radius (40) plus text height
            group.addChild(nameText);

            // Полоска здоровья
            const healthBarBg = new PIXI.Graphics();
            healthBarBg.beginFill(0x333333);
            healthBarBg.drawRect(-40, -70, 80, 8);
            healthBarBg.endFill();
            group.addChild(healthBarBg);

            const healthBarFill = new PIXI.Graphics();
            group.addChild(healthBarFill);

            // Обновление полоски здоровья
            const updateHealthBar = () => {
                healthBarFill.clear();
                const healthPercent = fighter.health / fighter.maxHealth;
                healthBarFill.beginFill(healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000);
                healthBarFill.drawRect(-40, -70, 80 * healthPercent, 8);
                healthBarFill.endFill();
            };

            // Позиционирование
            group.x = side === 'left' ? 250 : 550;
            group.y = 300;

            container.addChild(group);

            return {
                fighter,
                sprite: group as unknown as PIXI.Sprite,
                healthBar: healthBarFill,
                updateHealthBar,
            };
        };

        const unit1 = createUnit(fighter1, 'left');
        const unit2 = createUnit(fighter2, 'right');

        unitsRef.current.set(fighter1.id, unit1);
        unitsRef.current.set(fighter2.id, unit2);

        // Запуск боя
        engine.start();

        // Игровой цикл
        const gameLoop = (ticker: PIXI.Ticker) => {
            const deltaTimeSec = ticker.deltaTime / 60; // Примерный перевод в секунды
            engine.update(deltaTimeSec);

            // Обновляем позиции и состояния бойцов
            unitsRef.current.forEach((unit) => {
                // Анимация здоровья
                unit.updateHealthBar();

            // EMERGENCY RESTORATION: Disable jumping/wobbling placeholder
            // unit.sprite.rotation = Math.sin(Date.now() * 0.003) * 0.05;
            });

            // Проверка окончания боя
            if (engine.phase === 'end') {
                const winner = engine.getWinner();
                if (winner) {
                    setBattleLog((prev) => [...prev, `🏆 ${winner.name} побеждает!`]);
                    useBattleStore.getState().setBattlePhase('end');
                }
            }
        };

        app.ticker.add(gameLoop);

        return () => {
            app.ticker.remove(gameLoop);
        };
    }, [battleActive, battlePhase]);

    // Обработка нажатий для атаки
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (battlePhase !== 'combat') return;

            const engine = battleEngineRef.current;
            if (!engine) return;

            // Получаем координаты клика
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Проверяем клик по врагу
            const enemyX = 550;
            const enemyY = 300;
            const distance = Math.sqrt((x - enemyX) ** 2 + (y - enemyY) ** 2);

            if (distance < 60) {
                // Атака по врагу
                const attacker = engine.getCurrentTurnFighter();
                if (attacker) {
                    const target = engine.getOpponent(attacker);
                    if (target) {
                        engine.attack(attacker, target);
                        setBattleLog((prev) => [...prev, `${attacker.name} атакует ${target.name}!`]);
                    }
                }
            }
        };

        canvasRef.current?.addEventListener('click', handleClick);

        return () => {
            canvasRef.current?.removeEventListener('click', handleClick);
        };
    }, [battlePhase]);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{
                    border: '2px solid #333',
                    borderRadius: '8px',
                    cursor: battlePhase === 'combat' ? 'pointer' : 'default',
                }}
            />

            {/* Информация о раунде */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            }}>
                Раунд: {roundNumber} | Фаза: {battlePhase}
            </div>

            {/* Лог боя */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                right: '10px',
                height: '100px',
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '8px',
                padding: '10px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#fff',
            }}>
                {battleLog.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>
        </div>
    );
}

export default BattleCanvas;
