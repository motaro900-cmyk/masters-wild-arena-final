import { create } from 'zustand';

export type BeastTabType = 'beasts' | 'equipment' | 'lore' | 'talents';

interface BeastsState {
    activeTab: BeastTabType;
    selectedBeastId: string;
    setTab: (tab: BeastTabType) => void;
    setSelectedBeast: (id: string) => void;
}

export const useBeastsStore = create<BeastsState>((set) => ({
    activeTab: 'beasts',
    selectedBeastId: 'panda',
    // КРИТИЧНО ВАЖНО: Мы используем set(), чтобы пнуть React перерисовать UI
    setTab: (tab) => set({ activeTab: tab }),
    setSelectedBeast: (id) => set({ selectedBeastId: id }),
}));
