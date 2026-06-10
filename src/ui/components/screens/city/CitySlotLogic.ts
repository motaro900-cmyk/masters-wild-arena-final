export interface SlotSymbol {
    id: string;
    emoji: string;
    label: string;
    color: string;
}

export interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    type: 'crystal' | 'coin';
    targetRotation: number;
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
    { id: 'panda', emoji: '🐼', label: 'ПАНДА', color: '#ffcc00' },
    { id: 'raccoon', emoji: '🦝', label: 'ЕНОТ', color: '#a855f7' },
    { id: 'monkey', emoji: '🐵', label: 'ОБЕЗЬЯНА', color: '#3b82f6' },
    { id: 'tiger', emoji: '🐯', label: 'ТИГР', color: '#ef4444' },
    { id: 'rabbit', emoji: '🐰', label: 'КРОЛИК', color: '#10b981' },
    { id: 'bear', emoji: '🐻', label: 'МЕДВЕДЬ', color: '#f97316' },
];

export const getRandomSymbol = (): SlotSymbol => {
    return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
};

export const generateTrack = (currentSymbols: SlotSymbol[], winSymbol: SlotSymbol, length: number): SlotSymbol[] => {
    const track = [...currentSymbols];
    while (track.length < 3) {
        track.push(getRandomSymbol());
    }
    const midLength = length - 6;
    for (let i = 0; i < midLength; i++) {
        track.push(getRandomSymbol());
    }
    track.push(getRandomSymbol());
    track.push(winSymbol);
    track.push(getRandomSymbol());
    return track;
};
