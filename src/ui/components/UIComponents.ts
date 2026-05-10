import * as PIXI from 'pixi.js';

export const baseTextStyle = {
    fontFamily: 'Arial',
    fontWeight: 'bold' as const,
    fill: '#ffffff',
    stroke: { color: '#000000', width: 5 },
    dropShadow: { color: '#000000', alpha: 1, blur: 2, distance: 3 }
};

export const headerTextStyle = {
    fontFamily: 'Arial Black',
    fontWeight: 'bold' as const,
    fill: '#ffffff', 
    stroke: { color: '#000000', width: 6 },
    dropShadow: { color: '#000000', alpha: 1, blur: 2, distance: 3 },
    letterSpacing: 2, 
    lineJoin: 'round' as const
};

export const darkTextStyle = {
    ...baseTextStyle,
    fill: '#1a1a1a',
    stroke: { width: 0 },
    dropShadow: { alpha: 0 }
};

export class GlassPanel extends PIXI.Graphics {
    constructor(width: number, height: number) {
        super();
        this.roundRect(0, 0, width, height, 20)
            .fill({ color: 0x1a1b26, alpha: 0.8 })
            .stroke({ width: 2, color: 0x3b4261 });
    }
}

export class GreenButton extends PIXI.Container {
    constructor(text: string, cost: string, width: number, height: number, onClick: () => void) {
        super();
        const bg = new PIXI.Graphics()
            .roundRect(0, 0, width, height, 12)
            .fill(0x4caf50);
        
        const txt = new PIXI.Text({ text: `${text}\n${cost}`, style: { ...baseTextStyle, fontSize: 14, align: 'center' } });
        txt.anchor.set(0.5);
        txt.position.set(width / 2, height / 2);
        
        this.addChild(bg, txt);
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.on('pointerdown', onClick);
    }
}

export class CurrencyPanel extends PIXI.Container {
    constructor(icon: string, val: number | string) {
        super();
        const bg = new PIXI.Graphics().roundRect(0, 0, 160, 40, 20).fill({ color: 0x000000, alpha: 0.5 });
        const txt = new PIXI.Text({ text: val.toString(), style: { ...baseTextStyle, fontSize: 18 } });
        txt.position.set(50, 8);
        this.addChild(bg, txt);
    }
}

export class IconButton extends PIXI.Container {
    constructor(symbol: string, onClick: () => void) {
        super();
        const bg = new PIXI.Graphics().circle(20, 20, 20).fill(0x3b4261);
        const txt = new PIXI.Text({ text: symbol, style: { ...baseTextStyle, fontSize: 24 } });
        txt.anchor.set(0.5);
        txt.position.set(20, 20);
        this.addChild(bg, txt);
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.on('pointerdown', onClick);
    }
}

export const createGradientTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1e293b'); grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
    return PIXI.Texture.from(canvas);
};

export const headerTextStyle = {
    fontFamily: 'Arial Black',
    fontWeight: 'bold' as const,
    fill: '#ffffff', 
    stroke: { color: '#000000', width: 6 },
    dropShadow: { color: '#000000', alpha: 1, blur: 2, distance: 3 },
    letterSpacing: 2, 
    lineJoin: 'round' as const
};

export const darkTextStyle = {
    ...baseTextStyle,
    fill: '#1a1a1a',
    stroke: { width: 0 },
    dropShadow: { alpha: 0 }
};
