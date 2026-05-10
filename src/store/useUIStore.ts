import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';
import { CoordinateConverter } from '../utils/CoordinateConverter';

export interface IUIElement {
    id: string;
    type: string;
    x: number;
    y: number;
    scale?: number | { x: number, y: number };
    rotation?: number;
    alpha?: number;
    tint?: string | number;
    zIndex?: number;
    isVisible?: boolean;
    isLocked?: boolean;
    text?: string;
    color?: string;
    width?: number;
    height?: number;
    parentId?: string | null;
    [key: string]: any;
}

interface UIStoreState {
    isEditMode: boolean;
    isGridEnabled: boolean;
    toggleEditMode: () => void;
    toggleGrid: () => void;
    elements: Record<string, IUIElement>;
    viewportTransform: { x: number, y: number, scale: number };
    setElements: (elements: Record<string, IUIElement>) => void;
    updateElementProps: (id: string, props: Partial<IUIElement>) => void;
    updateElementPosition: (id: string, x: number, y: number) => void;
    updateViewportTransform: (transform: Partial<{ x: number, y: number, scale: number }>) => void;
    removeElement: (id: string) => void;
    importFromUnity: (json: string) => void;
}

export const DEFAULT_ELEMENTS: Record<string, IUIElement> = {
    'top-bar': { id: 'top-bar', type: 'ui-container', x: 0, y: 0, isVisible: true, zIndex: 50, scale: 1 },
    'left-sidebar': { id: 'left-sidebar', type: 'ui-container', x: 0, y: 0, isVisible: true, zIndex: 50, scale: 1 },
    'right-panel': { id: 'right-panel', type: 'ui-container', x: 0, y: 0, isVisible: true, zIndex: 50, scale: 1 },
    'bottom-bar': { id: 'bottom-bar', type: 'ui-container', x: 0, y: 0, isVisible: true, zIndex: 50, scale: 1 },
    
    // Top Bar Widgets (Relative to top-bar)
    'topbar-avatar': { id: 'topbar-avatar', type: 'ui-widget', x: 20, y: 20, isVisible: true, text: 'ИГРОК ВК', zIndex: 50, scale: 1, parentId: 'top-bar' },
    'topbar-bp': { id: 'topbar-bp', type: 'ui-widget', x: 360, y: 20, isVisible: true, text: 'ПРОПУСК', zIndex: 50, scale: 1, parentId: 'top-bar' },
    'topbar-res': { id: 'topbar-res', type: 'ui-container', x: 740, y: 20, isVisible: true, zIndex: 50, scale: 1, parentId: 'top-bar' },
    'topbar-gold': { id: 'topbar-gold', type: 'ui-widget', x: 0, y: 0, isVisible: true, zIndex: 51, scale: 1, parentId: 'topbar-res' },
    'topbar-gems': { id: 'topbar-gems', type: 'ui-widget', x: 140, y: 0, isVisible: true, zIndex: 51, scale: 1, parentId: 'topbar-res' },
    'topbar-energy': { id: 'topbar-energy', type: 'ui-widget', x: 280, y: 0, isVisible: true, zIndex: 51, scale: 1, parentId: 'topbar-res' },
    
    // Left Sidebar Items (Relative to left-sidebar)
    'left-beasts': { id: 'left-beasts', type: 'ui-widget', x: 40, y: 80, isVisible: true, text: 'ЗВЕРИ', zIndex: 51, scale: 1, parentId: 'left-sidebar' },
    'left-inventory': { id: 'left-inventory', type: 'ui-widget', x: 40, y: 165, isVisible: true, text: 'ИНВЕНТАРЬ', zIndex: 51, scale: 1, parentId: 'left-sidebar' },
    'left-shop': { id: 'left-shop', type: 'ui-widget', x: 40, y: 250, isVisible: true, text: 'МАГАЗИН', zIndex: 51, scale: 1, parentId: 'left-sidebar' },
    'left-clans': { id: 'left-clans', type: 'ui-widget', x: 40, y: 335, isVisible: true, text: 'КЛАНЫ', zIndex: 51, scale: 1, parentId: 'left-sidebar' },
    'left-rating': { id: 'left-rating', type: 'ui-widget', x: 40, y: 420, isVisible: true, text: 'РЕЙТИНГ', zIndex: 51, scale: 1, parentId: 'left-sidebar' },

    // Bottom Bar Widgets (Independent - reset to 0 to align with CSS anchors)
    'bottom-chat': { id: 'bottom-chat', type: 'ui-widget', x: 0, y: 0, isVisible: true, zIndex: 50, scale: 1 },
    'bottom-center': { id: 'bottom-center', type: 'ui-widget', x: 0, y: 0, isVisible: true, text: 'В БОЙ!', zIndex: 50, scale: 1 },
    'bottom-modes': { id: 'bottom-modes', type: 'ui-widget', x: 0, y: 0, isVisible: true, text: 'РЕЖИМЫ', zIndex: 50, scale: 1 },
    'bottom-social': { id: 'bottom-social', type: 'ui-widget', x: 0, y: 0, isVisible: true, zIndex: 50, scale: 1 },

    // Right Panel Blocks (Relative - reset to 0)
    'right-daily': { id: 'right-daily', type: 'ui-widget', x: 0, y: 0, isVisible: true, text: 'ЕЖЕДНЕВНЫЕ', zIndex: 51, scale: 1, parentId: 'right-panel' },
    'right-gift': { id: 'right-gift', type: 'ui-widget', x: 0, y: 0, isVisible: true, zIndex: 51, scale: 1, parentId: 'right-panel' },
    'right-quests': { id: 'right-quests', type: 'ui-widget', x: 0, y: 0, isVisible: true, text: 'ТЕКУЩИЕ ЗАДАЧИ', zIndex: 51, scale: 1, parentId: 'right-panel' }
};

export const useUIStore = create<UIStoreState>()(
    persist(
        (set, get) => ({
            isEditMode: false,
            isGridEnabled: true,
            toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
            toggleGrid: () => set((state) => ({ isGridEnabled: !state.isGridEnabled })),
            elements: DEFAULT_ELEMENTS,
            viewportTransform: { x: 0, y: 0, scale: 1 },
            setElements: (elements) => set({ elements }),
            updateElementProps: (id, props) => set((state) => {
                if (!state.elements[id]) return state;
                return {
                    elements: { ...state.elements, [id]: { ...state.elements[id], ...props } }
                };
            }),
            updateElementPosition: (id, x, y) => set((state) => ({
                elements: { ...state.elements, [id]: { ...state.elements[id], x, y } }
            })),
            updateViewportTransform: (transform) => set((state) => ({
                viewportTransform: { ...state.viewportTransform, ...transform }
            })),
            removeElement: (id) => set((state) => { const e = { ...state.elements }; delete e[id]; return { elements: e }; }),
            importFromUnity: (json: string) => {
                try {
                    const data = JSON.parse(json) as { items: any[] };
                    if (!data.items) return;

                    const currentElements = get().elements;
                    const newElements = { ...currentElements };
                    
                    data.items.forEach((item) => {
                        if (newElements[item.id]) {
                            const { x, y } = CoordinateConverter.convertToWeb(item);
                            newElements[item.id] = {
                                ...newElements[item.id],
                                x,
                                y,
                                width: item.width || newElements[item.id].width,
                                height: item.height || newElements[item.id].height
                            };
                        }
                    });

                    set({ elements: newElements });
                } catch (e) {
                    console.error('[UIStore] Unity layout parse error:', e);
                }
            }
        }),
        {
            name: 'ui-storage-v8', 
            storage: createJSONStorage(() => getStorage()),
            version: 8,
            migrate: (persistedState: unknown, version: number) => {
                if (version < 8) {
                    return { ...(persistedState as object), elements: DEFAULT_ELEMENTS, version: 8 };
                }
                return persistedState as UIStoreState;
            }
        }
    )
);

// [Lead Architect]: Debug exposure only in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    (window as any).uiStore = useUIStore;
}
