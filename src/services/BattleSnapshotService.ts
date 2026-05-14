
import * as PIXI from 'pixi.js';
import { HEROES_DB, IHeroConfig } from '../configs/HeroesConfig';
import { ITEMS_DATABASE } from '../game/configs/ItemsConfig';

/**
 * СЕРВИС БОЕВЫХ СНИМКОВ (Runtime Texture Merger)
 * Собирает персонажа из слоев в одну текстуру для PIXI.
 */
class BattleSnapshotService {
    private cache: Map<string, PIXI.Texture> = new Map();

    /**
     * Генерирует или берет из кэша готовую текстуру героя в текущем обвесе
     */
    public async generateBattleTexture(heroId: string, equipment: Record<string, string>): Promise<PIXI.Texture> {
        const hash = this.getEquipmentHash(heroId, equipment);
        
        if (this.cache.has(hash)) {
            return this.cache.get(hash)!;
        }

        const heroConfig = HEROES_DB.find(h => h.id === heroId) || HEROES_DB[0];
        const texture = await this.createComposedTexture(heroConfig, equipment);
        
        this.cache.set(hash, texture);
        return texture;
    }

    /**
     * Создает уникальный хэш для кэширования
     */
    private getEquipmentHash(heroId: string, equipment: Record<string, string>): string {
        const sortedItems = Object.entries(equipment)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([_, id]) => id)
            .join('_');
        return `${heroId}_${sortedItems}`;
    }

    /**
     * Основная логика склейки слоев на Canvas
     */
    private async createComposedTexture(hero: IHeroConfig, equipment: Record<string, string>): Promise<PIXI.Texture> {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas context');

        const BASE_SIZE = 512;
        canvas.width = BASE_SIZE;
        canvas.height = BASE_SIZE;

        const scale = hero.baseScale || 1.0;
        const centerX = canvas.width / 2;
        const groundY = canvas.height * 0.85; // Чуть выше края для тени
        
        // 1. Расчет корневой точки (Root Offset)
        // Ноги персонажа должны стоять точно в (centerX, groundY)
        const rootX = centerX - (hero.anchors.feet.x * BASE_SIZE * scale);
        const rootY = groundY - (hero.anchors.feet.y * BASE_SIZE * scale);

        const layers = await this.getLayers(hero, equipment);

        for (const layer of layers) {
            if (!layer.img) continue;
            
            ctx.save();
            
            if (layer.type === 'body') {
                // Тело рисуется от Root
                ctx.drawImage(layer.img, rootX, rootY, BASE_SIZE * scale, BASE_SIZE * scale);
            } else {
                // ПРЕДМЕТЫ (Оружие, Шлем)
                const anchor = (hero.anchors as any)[layer.socket!];
                if (anchor) {
                    // Позиция сокета в мировых координатах холста
                    const socketX = rootX + (anchor.x * BASE_SIZE * scale);
                    const socketY = rootY + (anchor.y * BASE_SIZE * scale);
                    
                    ctx.translate(socketX, socketY);
                    
                    if (anchor.angle) {
                        ctx.rotate((anchor.angle * Math.PI) / 180);
                    }
                    
                    // Масштабирование предмета (наследование + тюнинг слота)
                    const itemScale = (anchor.scale || 1) * scale * (layer.itemSubTab === 'WEAPONS' ? 1.0 : 0.8);
                    
                    // Рисуем предмет, центрируя его текстуру в точке сокета
                    const drawW = BASE_SIZE * itemScale;
                    const drawH = BASE_SIZE * itemScale;
                    ctx.drawImage(layer.img, -drawW / 2, -drawH / 2, drawW, drawH);
                }
            }
            ctx.restore();
        }

        return PIXI.Texture.from(canvas);
    }

    /**
     * Загружает все нужные изображения и сортирует их по Z-Index
     */
    private async getLayers(hero: IHeroConfig, equipment: Record<string, string>) {
        const loadPromises: any[] = [];

        // Слой ТЕЛА
        loadPromises.push(this.loadImage(hero.image).then(img => ({ type: 'body', img, zIndex: 10 })));

        // Слой ПРЕДМЕТОВ
        const slotToSocket: Record<string, string> = {
            'WEAPONS': 'rightHand',
            'SHIELDS': 'leftHand',
            'HELMETS': 'head',
            'ARMOR': 'center'
        };

        Object.entries(slotToSocket).forEach(([slot, socketKey]) => {
            const itemId = equipment[slot];
            if (!itemId) return;

            const item = ITEMS_DATABASE[itemId] as any;
            if (!item || item.visualSocket !== socketKey) return;

            loadPromises.push(this.loadImage(item.image).then(img => ({ 
                type: 'item', 
                img, 
                socket: socketKey, 
                itemSubTab: slot,
                zIndex: socketKey === 'head' ? 30 : 20 
            })));
        });

        const loadedLayers = await Promise.all(loadPromises);
        return loadedLayers.sort((a, b) => a.zIndex - b.zIndex);
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * Очистка кэша (например, при смене сцены или недостатке памяти)
     */
    public clearCache() {
        this.cache.forEach(t => t.destroy(true));
        this.cache.clear();
    }
}

export const battleSnapshotService = new BattleSnapshotService();
