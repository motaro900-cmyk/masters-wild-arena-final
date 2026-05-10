import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { UI_SIZES, UI_COLORS } from '../UI_CONFIG';

export interface IButtonOptions {
    text: string;
    width?: number;
    height?: number;
    bgTextureUrl?: string;
    onClick: () => void;
}

/**
 * ButtonFactory — Стандартизированная фабрика UI-компонентов.
 * Реализует безопасную загрузку ассетов и строгий порядок слоев.
 */
export class ButtonFactory {
    /**
     * Создает универсальную кнопку с поддержкой текстуры и fallback-графики.
     */
    public static async createButton(options: IButtonOptions): Promise<PIXI.Container> {
        const container = new PIXI.Container();
        container.eventMode = 'static';
        container.cursor = 'pointer';

        const w = options.width || UI_SIZES.BUTTON_WIDTH;
        const h = options.height || UI_SIZES.BUTTON_HEIGHT;

        // --- 1. ФОН (Нижний слой) ---
        let background: PIXI.Container;
        
        try {
            if (options.bgTextureUrl) {
                // Асинхронная загрузка с проверкой
                const texture = await PIXI.Assets.load(options.bgTextureUrl);
                if (!texture) throw new Error('Failed to load texture');
                
                const sprite = new PIXI.Sprite(texture);
                sprite.width = w;
                sprite.height = h;
                background = sprite;
            } else {
                throw new Error('No texture URL provided');
            }
        } catch (e) {
            console.warn(`[ButtonFactory] Fallback active for: ${options.text}. Reason: ${e}`);
            // КРАСИВЫЙ FALLBACK (Graphics)
            background = new PIXI.Graphics()
                .roundRect(0, 0, w, h, 12)
                .fill({ color: UI_COLORS.GOLD, alpha: 1 })
                .stroke({ color: UI_COLORS.GOLD_LIGHT, width: 3 });
        }
        
        container.addChild(background);

        // --- 2. ТЕКСТ (Верхний слой) ---
        const text = new PIXI.Text({
            text: options.text,
            style: {
                fill: 0x000000,
                fontSize: Math.floor(h * 0.35),
                fontWeight: 'bold',
                fontFamily: 'Arial Black',
                stroke: { color: 0xFFFFFF, width: 1 },
                dropShadow: { color: 0x000000, alpha: 0.5, blur: 2, distance: 2 }
            }
        });
        text.anchor.set(0.5);
        text.position.set(w / 2, h / 2);
        container.addChild(text);

        // --- 3. ИНТЕРАКТИВНОСТЬ ---
        const onOver = () => gsap.to(container.scale, { x: 1.05, y: 1.05, duration: 0.1 });
        const onOut = () => gsap.to(container.scale, { x: 1, y: 1, duration: 0.1 });
        const onDown = () => {
            gsap.to(container.scale, { x: 0.95, y: 0.95, duration: 0.05, yoyo: true, repeat: 1 });
            options.onClick();
        };

        container.on('pointerover', onOver);
        container.on('pointerout', onOut);
        container.on('pointerdown', onDown);

        // Очистка при уничтожении
        container.on('destroyed', () => {
            container.off('pointerover', onOver);
            container.off('pointerout', onOut);
            container.off('pointerdown', onDown);
        });

        return container;
    }
}
