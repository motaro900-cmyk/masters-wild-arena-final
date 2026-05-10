import * as PIXI from 'pixi.js';
import { WEAPON_SOCKETS } from '../../configs/WeaponSockets';
import { resolveAssetPath } from '../../utils/assetPath';

export class HeroUnit extends PIXI.Container {
    mainSprite: PIXI.Sprite;
    weaponSprite: PIXI.Sprite;
    layers: PIXI.Container;
    weaponTextures: Record<number, PIXI.Texture> = {};

    constructor(texture: PIXI.Texture) {
        super();
        this.layers = new PIXI.Container();
        this.addChild(this.layers);

        this.mainSprite = new PIXI.Sprite(texture);
        this.mainSprite.anchor.set(0.5, 0.9);
        this.layers.addChild(this.mainSprite);

        this.weaponSprite = new PIXI.Sprite();
        this.weaponSprite.anchor.set(0.5, 0.5);
        this.weaponSprite.visible = false; 
        this.addChild(this.weaponSprite);
    }

    async loadWeapon(weaponId: string) {
        try {
            const p1 = await PIXI.Assets.load(resolveAssetPath(`/assets/images/items/${weaponId}.png`)).catch(() => null);
            const p2 = await PIXI.Assets.load(resolveAssetPath(`/assets/images/items/${weaponId}_alt.png`)).catch(() => p1); 
            const p3 = await PIXI.Assets.load(resolveAssetPath(`/assets/images/items/${weaponId}_impact.png`)).catch(() => p1);

            this.weaponTextures = {
                1: p1,
                2: p2,
                3: p3
            };

            if (p1) {
                this.weaponSprite.texture = p1;
                this.weaponSprite.visible = true;
            }
        } catch (e) {
            console.warn("Error loading weapon poses:", e);
        }
    }

    setFrame(texture: PIXI.Texture, frameIndex: number) {
        this.mainSprite.texture = texture;
        // Используем сокеты для конкретного героя (по умолчанию панда)
        const heroSockets = WEAPON_SOCKETS['panda']; // В будущем можно передавать ключ героя
        const socket = heroSockets[String(frameIndex)];

        if (this.weaponSprite.visible && socket) {
            this.weaponSprite.x = socket.x * (this.scale.x > 0 ? 1 : -1);
            this.weaponSprite.y = socket.y;
            this.weaponSprite.rotation = socket.rotation * (this.scale.x > 0 ? 1 : -1);

            if (frameIndex === 5) this.weaponSprite.texture = this.weaponTextures[2] || this.weaponSprite.texture;
            else if (frameIndex === 6) this.weaponSprite.texture = this.weaponTextures[3] || this.weaponSprite.texture;
            else this.weaponSprite.texture = this.weaponTextures[1] || this.weaponSprite.texture;
        }
    }
}
