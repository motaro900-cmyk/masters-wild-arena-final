import * as PIXI from 'pixi.js';
import { BaseEntity, EntityState } from '../game/entities/BaseEntity';

/**
 * @class Fighter
 * Расшифрованный боевой персонаж с системой навыков
 */
export class Fighter extends BaseEntity {
    public skills: Skill[] = [];
    public comboCount: number = 0;
    public comboTimer: number = 0;
    public id: string;
    public team: 'player' | 'enemy' = 'player';
    public health: number;
    public maxHealth: number;
    public color: number = 0xff0000;
    public _characterConfig?: {
        bodyColor?: number;
        eyeColor?: number;
        weaponType?: string;
        weaponColor?: number;
        shieldColor?: number;
        bodyType?: string;
        eyeType?: string;
        hatType?: string;
        mouthType?: string;
    };

    constructor(config: any, stats?: any) {
        // Поддержка обоих форматов:
        // 1. new Fighter({ name, health, attack, ... }) - для React UI
        // 2. new Fighter(texture, stats) - для PixiJS
        let fighterConfig: any;
        
        if (config && typeof config === 'object' && 'name' in config && 'health' in config && !('texture' in config)) {
            // Формат config объекта
            fighterConfig = config;
        } else {
            // Форм texture + stats
            fighterConfig = {
                health: stats?.health || 100,
                maxHealth: stats?.health || 100,
                name: 'Fighter',
                color: 0xff0000,
                position: { x: 0, y: 0 },
            };
        }
        
        // Создаём временную текстуру если нужно
        const tempTexture = config && config['texture'] ? config['texture'] : PIXI.Texture.WHITE;
        const tempStats = {
            health: fighterConfig.health,
            strength: fighterConfig.attack || fighterConfig.strength || 10,
        };
        
        super(tempTexture, tempStats);
        
        this.id = `fighter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.health = fighterConfig.health;
        this.maxHealth = fighterConfig.maxHealth || fighterConfig.health;
        
        // Применяем остальные свойства
        if (fighterConfig.name) this.name = fighterConfig.name;
        if (fighterConfig.color) this.color = fighterConfig.color;
        if (fighterConfig.position) {
            this.x = fighterConfig.position.x || this.x;
            this.y = fighterConfig.position.y || this.y;
        }
        
        // Сохраняем characterConfig для TextureGenerator
        if (fighterConfig.bodyColor || fighterConfig.eyeColor || fighterConfig.weaponType ||
            fighterConfig.bodyType || fighterConfig.eyeType || fighterConfig.hatType || 
            fighterConfig.mouthType || fighterConfig.shieldColor) {
            this._characterConfig = {
                bodyColor: fighterConfig.bodyColor || 0xffaa88,
                eyeColor: fighterConfig.eyeColor || 0x222222,
                weaponType: fighterConfig.weaponType || 'sword',
                weaponColor: fighterConfig.weaponColor || 0x888888,
                shieldColor: fighterConfig.shieldColor || 0x4488ff,
                bodyType: fighterConfig.bodyType || 'round',
                eyeType: fighterConfig.eyeType || 'normal',
                hatType: fighterConfig.hatType || 'none',
                mouthType: fighterConfig.mouthType || 'smile',
            };
        }
    }

    /**
     * Добавить навык бойцу
     */
    public addSkill(skill: Skill): void {
        this.skills.push(skill);
    }

    /**
     * Получить доступные навыки
     */
    public getAvailableSkills(): Skill[] {
        return this.skills.filter(s => s.isReady);
    }

    /**
     * Использовать навык
     */
    public useSkill(skillIndex: number): boolean {
        if (skillIndex < 0 || skillIndex >= this.skills.length) return false;
        
        const skill = this.skills[skillIndex];
        if (!skill.isReady) return false;

        skill.activate();
        this.comboCount++;
        this.comboTimer = 3.0; // 3 секунды до сброса комбо

        return true;
    }

    /**
     * Обновить таймеры комбо
     */
    public update(dt: number): void {
        super.update(dt);

        if (this.comboTimer > 0) {
            this.comboTimer -= dt / 1000;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
                this.comboTimer = 0;
            }
        }

        // Обновляем навыки
        for (const skill of this.skills) {
            skill.update(dt);
        }
    }

    /**
     * Получить текущий бонус от комбо
     */
    public getComboBonus(): number {
        return this.comboCount * 0.1; // +10% за каждое комбо
    }

    /**
     * Получить урон от атаки
     */
    public getAttackDamage(): number {
        return this.stats?.strength || 10;
    }

    /**
     * Получить защиту
     */
    public getDefense(): number {
        return this.stats?.defense || 5;
    }

    /**
     * Получить шанс критического удара
     */
    public getCritChance(): number {
        return this.stats?.critChance || 0.1;
    }

    /**
     * Получить скорость
     */
    public getSpeed(): number {
        return this.stats?.speed || 5;
    }

    /**
     * Получить бонус от комбо (для BattleEngine)
     */
    public getComboMultiplier(): number {
        return 1 + this.comboCount * 0.1;
    }

    /**
     * Получить урон (для BattleEngine)
     */
    public getDamage(): number {
        return this.getAttackDamage();
    }

    /**
     * Получить защиту (для BattleEngine)
     */
    public getDefenseValue(): number {
        return this.getDefense();
    }

    /**
     * Получить шанс уклонения (для BattleEngine)
     */
    public getDodgeChance(): number {
        return this.stats?.dodge || 0.15;
    }

    /**
     * Получить крит. шанс (для BattleEngine)
     */
    public getCritChanceValue(): number {
        return this.getCritChance();
    }

    /**
     * Получить крит. множитель (для BattleEngine)
     */
    public getCritMultiplier(): number {
        return this.stats?.critMult || 2.0;
    }

    /**
     * Получить скорость (для BattleEngine)
     */
    public getSpeedValue(): number {
        return this.getSpeed();
    }

    /**
     * Получить имя (для BattleEngine)
     */
    public getName(): string {
        return this.getFighterName();
    }

    /**
     * Получить характеристики (для BattleEngine)
     */
    public getStats(): any {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            strength: this.stats?.strength || 10,
            defense: this.stats?.defense || 5,
            speed: this.stats?.speed || 5,
            critChance: this.stats?.critChance || 0.1,
            critMult: this.stats?.critMult || 2.0,
            dodge: this.stats?.dodge || 0.15,
        };
    }

    /**
     * Принять урон (для BattleEngine)
     */
    public takeDamage(amount: number): { isCrit: boolean, finalDamage: number } {
        const defense = this.getDefense();
        const finalDamage = Math.max(1, amount - defense * 0.5);
        this.health = Math.max(0, this.health - finalDamage);
        this.currentState = EntityState.TAKE_DAMAGE;
        return { isCrit: false, finalDamage };
    }

    /**
     * Проверить уклонение (для BattleEngine)
     */
    public dodge(): boolean {
        const dodgeChance = this.getDodgeChance();
        return Math.random() < dodgeChance;
    }

    /**
     * Использовать способность (для BattleEngine)
     */
    public useAbility(ability: any, target: Fighter): any {
        const baseDamage = this.getAttackDamage() * (ability.multiplier || 1.0);
        const result = target.takeDamage(baseDamage);
        
        if (ability.onHit) {
            ability.onHit(target);
        }
        
        return {
            damage: result.finalDamage,
            isCrit: result.isCrit,
            isDodge: false,
            isDoubleHit: false,
        };
    }

    /**
     * Проверить готовность навыка
     */
    public hasAvailableSkills(): boolean {
        return this.skills.some(s => s.isReady);
    }

    /**
     * Получить доступные навыки (для BattleEngine)
     */
    public getSkills(): Skill[] {
        return this.skills;
    }

    /**
     * Получить имя бойца
     */
    public getFighterName(): string {
        return this.name;
    }

    /**
     * Восстановить здоровье
     */
    public restoreHealth(amount: number): void {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    /**
     * Получить текущее здоровье (для BattleEngine)
     */
    public getCurrentHealth(): number {
        return this.health;
    }

    /**
     * Получить максимальное здоровье (для BattleEngine)
     */
    public getMaxHealth(): number {
        return this.maxHealth;
    }

    /**
     * Установить здоровье (для BattleEngine)
     */
    public setHealth(value: number): void {
        this.health = value;
    }

    /**
     * Установить состояние (для BattleEngine)
     */
    public setFighterState(state: any): void {
        this.currentState = state;
    }

    /**
     * Получить состояние (для BattleEngine)
     */
    public getFighterState(): any {
        return this.currentState;
    }

    /**
     * Получить позицию X (для BattleEngine)
     */
    public getPositionX(): number {
        return this.view ? this.view.x : 0;
    }

    /**
     * Установить позицию X (для BattleEngine)
     */
    public setPositionX(value: number): void {
        if (this.view) this.view.x = value;
    }

    /**
     * Получить позицию Y (для BattleEngine)
     */
    public getPositionY(): number {
        return this.view ? this.view.y : 0;
    }

    /**
     * Установить позицию Y (для BattleEngine)
     */
    public setPositionY(value: number): void {
        if (this.view) this.view.y = value;
    }

    /**
     * Получить ширину хитбокса (для BattleEngine)
     */
    public getHitboxWidth(): number {
        return this.view ? this.view.width : 40;
    }

    /**
     * Получить высоту хитбокса (для BattleEngine)
     */
    public getHitboxHeight(): number {
        return this.view ? this.view.height : 60;
    }

    /**
     * Получить спрайт (для BattleEngine)
     */
    public getSprite(): any {
        return this.view;
    }

    /**
     * Получить оружие (для BattleEngine)
     */
    public getWeapon(): any {
        return this.weaponSprite;
    }

    /**
     * Получить characterConfig (для TextureGenerator)
     */
    public getCharacterConfig(): any {
        return this._characterConfig;
    }

    /**
     * Получить characterConfig (для BattleEngine)
     */
    public getCharacterSprite(): any {
        return this._characterConfig;
    }

    /**
     * Проверить является ли живым
     */
    public isAlive(): boolean {
        return this.health > 0 && this.currentState !== EntityState.DIE;
    }

    /**
     * Получить позицию для отображения (для BattleEngine)
     */
    public getDisplayPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
}

/**
 * @class Skill
 * Боевой навык
 */
export class Skill {
    public name: string;
    public cooldown: number;
    public currentCooldown: number;
    public damageMultiplier: number;
    public isCrit: boolean;
    public effect?: (target: Fighter) => void;

    constructor(config: {
        name: string;
        cooldown: number;
        damageMultiplier?: number;
        isCrit?: boolean;
        effect?: (target: Fighter) => void;
    }) {
        this.name = config.name;
        this.cooldown = config.cooldown;
        this.currentCooldown = 0;
        this.damageMultiplier = config.damageMultiplier || 1.0;
        this.isCrit = config.isCrit || false;
        this.effect = config.effect;
    }

    /**
     * Проверить готовность навыка
     */
    get isReady(): boolean {
        return this.currentCooldown <= 0;
    }

    /**
     * Активировать навык
     */
    activate(): void {
        this.currentCooldown = this.cooldown;
    }

    /**
     * Обновить навык
     */
    update(dt: number): void {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= dt / 1000;
            if (this.currentCooldown < 0) {
                this.currentCooldown = 0;
            }
        }
    }
}
