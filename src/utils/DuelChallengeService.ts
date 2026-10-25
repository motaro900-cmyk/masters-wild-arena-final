/**
 * DUEL CHALLENGE SERVICE
 * Viral P2P asynchronous duel link engine for Masters of the Wild standalone web play.
 * Encodes, validates, and routes challenge URLs: ?duel=<encoded>&sig=<checksum>
 */
import { HEROES_DB } from '../configs/HeroesConfig';
import { useGameStore } from '../store/useGameStore';
import { proceduralAudio } from './ProceduralAudio';

export interface IDuelChallenge {
    challengerId: string;
    challengerName: string;
    heroId: string;
    heroLevel: number;
    power: number;
    timestamp: number;
    seed: number;
    sig: string;
}

// 32-bit FNV-1a hash for URL integrity checksum
function fnv1a(str: string): string {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) & 0xffff).toString(16).padStart(4, '0');
}

export class DuelChallengeService {
    /**
     * Encodes current player's loadout into a shareable duel link
     */
    public static createDuelLink(): { url: string; challenge: IDuelChallenge } {
        const state: any = useGameStore.getState();
        const heroId = state.selectedHeroId || 'panda';
        const heroData = state.heroes?.[heroId] || { level: 1 };
        const heroLevel = Number(heroData.level) || 1;
        const name = (state.name || 'Дикий Мастер').trim().slice(0, 24);
        const userId = state.playerId || state.name || 'GUEST_' + Math.floor(Math.random() * 89999 + 10000);
        const power = Math.floor(100 + heroLevel * 45 + (state.rating || 0) * 0.5);
        const seed = (Math.random() * 0xffffffff) >>> 0;
        const timestamp = Math.floor(Date.now() / 1000);

        const payloadStr = [
            seed.toString(16),
            userId,
            encodeURIComponent(name),
            heroId,
            heroLevel,
            power,
            timestamp,
        ].join(':');

        const b64 = btoa(payloadStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const sig = fnv1a(payloadStr);

        const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://mastersofthewild.ru';
        const url = `${origin}/?duel=${b64}&sig=${sig}`;

        const challenge: IDuelChallenge = {
            challengerId: userId,
            challengerName: name,
            heroId,
            heroLevel,
            power,
            timestamp,
            seed,
            sig,
        };

        return { url, challenge };
    }

    /**
     * Parses and verifies inbound duel challenge from current URL query
     */
    public static parseInboundChallenge(): IDuelChallenge | null {
        if (typeof window === 'undefined') return null;
        try {
            const params = new URLSearchParams(window.location.search);
            const duelParam = params.get('duel');
            const sigParam = params.get('sig');
            if (!duelParam) return null;

            // Restore base64
            let b64 = duelParam.replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            const raw = atob(b64);

            const [seedHex, challengerId, encName, heroId, lvlStr, powerStr, tsStr] = raw.split(':');
            if (!heroId || !lvlStr) return null;

            // Signature verification
            if (sigParam && fnv1a(raw) !== sigParam) {
                console.warn('[DuelChallenge] Signature mismatch, rejecting tampered duel challenge.');
                return null;
            }

            const heroExists = HEROES_DB.some((h) => h.id === heroId);
            const validatedHeroId = heroExists ? heroId : 'panda';

            return {
                challengerId: challengerId || 'Unknown',
                challengerName: decodeURIComponent(encName || 'Безымянный Воин'),
                heroId: validatedHeroId,
                heroLevel: Math.min(Math.max(Number(lvlStr) || 1, 1), 60),
                power: Math.min(Math.max(Number(powerStr) || 100, 50), 99999),
                timestamp: Number(tsStr) || Math.floor(Date.now() / 1000),
                seed: parseInt(seedHex, 16) || 12345678,
                sig: sigParam || '',
            };
        } catch (err) {
            console.warn('[DuelChallenge] Failed to parse duel parameter:', err);
            return null;
        }
    }

    /**
     * Starts an asynchronous duel against the challenger's mirrored beast
     */
    public static acceptDuel(challenge: IDuelChallenge): void {
        const heroConfig = HEROES_DB.find((h) => h.id === challenge.heroId) || HEROES_DB[0];
        const mult = 1 + (challenge.heroLevel - 1) * 0.12;

        const enemyProfile = {
            id: `DUEL_${challenge.challengerId}`,
            name: `${challenge.challengerName} (${heroConfig.name})`,
            level: challenge.heroLevel,
            heroId: challenge.heroId,
            image: heroConfig.image,
            hp: Math.floor(heroConfig.stats.hp * mult),
            attack: Math.floor(heroConfig.stats.attack * mult),
            defense: Math.floor(heroConfig.stats.defense * mult),
            speed: heroConfig.stats.speed,
            critChance: heroConfig.stats.critChance,
            isDuelBoss: true,
            isBoss: false,
        };

        // Play duel start sound
        proceduralAudio.playDuelHorn();

        // Launch battle in useGameStore
        const store: any = useGameStore.getState();
        store.setBattleMode?.('WARMUP'); // Non-ranked safe battle
        useGameStore.setState({
            activeScreen: 'BATTLE',
            activePveEnemy: enemyProfile,
            selectedEnemyId: challenge.heroId,
        });

        // Clean query params so refresh doesn't re-trigger modal
        if (typeof window !== 'undefined' && window.history) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }
}

export const duelChallengeService = DuelChallengeService;

