import { create } from 'zustand';

export type AssetType = 'image' | 'slice' | 'atlas' | 'icon' | 'prefab' | 'text';

export interface IAsset {
    id: string;
    type: AssetType;
    src: string;
    frame?: { x: number; y: number; w: number; h: number };
    name?: string;
    tags?: string[];
    isTemp?: boolean; // Флаг для временных Blob URL (чтобы очищать или предупреждать при сохранении)
    elements?: any[]; // 🔥 Массив локальных элементов для Prefab
    text?: string;
}

interface AssetsStore {
    assets: Record<string, IAsset>;
    addAsset: (asset: IAsset) => void;
    addAssets: (assets: IAsset[]) => void;
}

export const useAssetsStore = create<AssetsStore>((set) => ({
    assets: {},
    addAsset: (asset) => set((state) => ({ assets: { ...state.assets, [asset.id]: asset } })),
    addAssets: (assets) => set((state) => {
        const newAssets = { ...state.assets };
        assets.forEach(a => newAssets[a.id] = a);
        return { assets: newAssets };
    })
}));
