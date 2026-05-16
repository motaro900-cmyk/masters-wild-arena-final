import { create } from 'zustand';

export interface IBone {
    id: string;
    parentId: string | null;
    position: { x: number; y: number };
    rotation: number;
    length?: number;
}

export interface DebugState {
    isDebugMode: boolean;
    isEditorMode: boolean;
    showHitboxes: boolean;
    snapToGrid: boolean;
    selectedId: string | null;
    elements: any;
    selectedProps: any;
    setDebugMode: (val: boolean) => void;
    toggleHitboxes: () => void;
    setSelected: (id: string | null, data?: any) => void;
    updateSelected: (data: any) => void;
    registerElement: (el: any) => void;
    unregisterElement: (id: string) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
    isDebugMode: false,
    isEditorMode: false,
    showHitboxes: false,
    snapToGrid: true,
    selectedId: null,
    elements: [],
    selectedProps: {},
    setDebugMode: (val) => set({ isDebugMode: val }),
    toggleHitboxes: () => set((state) => ({ showHitboxes: !state.showHitboxes })),
    setSelected: (id) => set({ selectedId: id }),
    updateSelected: () => {}, // Заглушка
    registerElement: () => {}, // Заглушка
    unregisterElement: () => {}, // Заглушка
}));
