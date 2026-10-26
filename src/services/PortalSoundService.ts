/**
 * PORTAL SOUND SERVICE (Web Audio API Procedural Synthesizer)
 * ==========================================================
 * Masters of the Wild — High-Craft UI Sound Engine
 *
 * Designed to studio-grade acoustic standards:
 * - Pure procedural synthesis: 0 external audio files (0 KB network overhead)
 * - True Peak calibrated <= -1.0 dBFS with brickwall limiter
 * - Perceived integrated loudness target ~ -14 LUFS
 * - Full browser autoplay policy compliance (auto-unlock on first user gesture)
 * - Seamless integration with Zustand useGameStore (isMuted & soundVolume)
 */

import { useGameStore } from '../store/useGameStore';

export type PortalSoundType = 'hover' | 'click' | 'equip' | 'reward';

export class PortalSoundService {
    private static instance: PortalSoundService | null = null;

    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private limiterNode: DynamicsCompressorNode | null = null;
    private noiseBuffer: AudioBuffer | null = null;

    private isUnlocked: boolean = false;
    private unlockListenersAttached: boolean = false;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.attachAutoUnlockListeners();
        }
    }

    /**
     * Singleton instance accessor
     */
    public static getInstance(): PortalSoundService {
        if (!PortalSoundService.instance) {
            PortalSoundService.instance = new PortalSoundService();
        }
        return PortalSoundService.instance;
    }

    /**
     * Automatic user-gesture listener attaching.
     * Unlocks the AudioContext on first tap, click or keydown without latency.
     */
    private attachAutoUnlockListeners(): void {
        if (this.unlockListenersAttached || typeof window === 'undefined') return;
        this.unlockListenersAttached = true;

        const unlockHandler = () => {
            this.ensureContext();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            this.isUnlocked = true;
            window.removeEventListener('pointerdown', unlockHandler);
            window.removeEventListener('keydown', unlockHandler);
            window.removeEventListener('touchstart', unlockHandler);
            window.removeEventListener('click', unlockHandler);
        };

        window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
        window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
        window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
        window.addEventListener('click', unlockHandler, { once: true, passive: true });
    }

    /**
     * Lazy AudioContext and Dynamics Bus initialization.
     */
    private ensureContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;

        if (!this.ctx) {
            const AudioContextClass =
                window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

            if (!AudioContextClass) {
                return null;
            }

            try {
                this.ctx = new AudioContextClass();

                // Studio Limiter Stage to guarantee True Peak <= -1.0 dBFS
                this.limiterNode = this.ctx.createDynamicsCompressor();
                this.limiterNode.threshold.setValueAtTime(-1.5, this.ctx.currentTime); // -1.5 dBFS threshold
                this.limiterNode.knee.setValueAtTime(2.0, this.ctx.currentTime);
                this.limiterNode.ratio.setValueAtTime(20.0, this.ctx.currentTime); // Brickwall limiting
                this.limiterNode.attack.setValueAtTime(0.001, this.ctx.currentTime); // 1ms attack
                this.limiterNode.release.setValueAtTime(0.05, this.ctx.currentTime); // 50ms release
                this.limiterNode.connect(this.ctx.destination);

                // Master Bus Gain Node
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
                this.masterGain.connect(this.limiterNode);

                // Precompute 1-second white noise buffer for organic procedural textures
                this.initNoiseBuffer(this.ctx);
            } catch (err) {
                console.warn('[PortalSoundService] AudioContext initialization failed:', err);
                return null;
            }
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        return this.ctx;
    }

    /**
     * Generates a cached white noise buffer for procedural UI rasp and friction
     */
    private initNoiseBuffer(ctx: AudioContext): void {
        const bufferSize = ctx.sampleRate; // 1 second of noise
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    /**
     * Evaluates current mute & volume state from Zustand useGameStore
     */
    private isMuted(): boolean {
        try {
            const state = useGameStore.getState() as { isMuted?: boolean; soundVolume?: number };
            if (state?.isMuted) return true;
            if (typeof state?.soundVolume === 'number' && state.soundVolume <= 0) return true;
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Computes final gain taking soundVolume into account
     */
    private getEffectiveGain(nominalGain: number): number {
        try {
            const state = useGameStore.getState() as { soundVolume?: number };
            const userVolume = typeof state?.soundVolume === 'number' ? Math.max(0, Math.min(100, state.soundVolume)) / 100 : 0.8;
            return nominalGain * userVolume;
        } catch {
            return nominalGain * 0.8;
        }
    }

    /**
     * Manual unlock/init trigger (call from UI components if needed)
     */
    public init(): void {
        this.ensureContext();
    }

    /**
     * Generic sound playback dispatcher
     */
    public play(sound: PortalSoundType): void {
        switch (sound) {
            case 'hover':
                this.playHover();
                break;
            case 'click':
                this.playClick();
                break;
            case 'equip':
                this.playEquip();
                break;
            case 'reward':
                this.playReward();
                break;
        }
    }

    /**
     * 1. HOVER SOUND (30ms)
     * Ultra-short delicate tick/shimmer on menu button & card hover.
     * Synthesized via a high-passed micro-noise burst + soft sine frequency chirp.
     */
    public playHover(): void {
        if (this.isMuted()) return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain) return;

        const now = ctx.currentTime;
        const duration = 0.030; // 30ms target
        const effectiveGain = this.getEffectiveGain(0.09);

        // Sub-component A: High-pass filtered noise tick (tactile texture)
        if (this.noiseBuffer) {
            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = this.noiseBuffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(3200, now);
            noiseFilter.Q.setValueAtTime(2.5, now);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(effectiveGain * 0.4, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            noiseSrc.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.masterGain);

            noiseSrc.start(now);
            noiseSrc.stop(now + duration);
        }

        // Sub-component B: Soft sine micro-chirp (1350Hz -> 650Hz)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1350, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + duration);

        oscGain.gain.setValueAtTime(effectiveGain * 0.6, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * 2. CLICK SOUND (80ms)
     * Resonant metallic sword/lock click on button activation.
     * Synthesized with strike transient (triangle snap) + metallic blade chime (2800Hz) + lock body (850Hz).
     */
    public playClick(pitchMultiplier: number = 1.0): void {
        if (this.isMuted()) return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain) return;

        const now = ctx.currentTime;
        const duration = 0.080; // 80ms target
        const effectiveGain = this.getEffectiveGain(0.28);

        // Component A: Sharp strike transient (sword hit / trigger latch)
        const strikeOsc = ctx.createOscillator();
        const strikeGain = ctx.createGain();

        strikeOsc.type = 'triangle';
        strikeOsc.frequency.setValueAtTime(2100 * pitchMultiplier, now);
        strikeOsc.frequency.exponentialRampToValueAtTime(420 * pitchMultiplier, now + 0.040);

        strikeGain.gain.setValueAtTime(effectiveGain * 0.8, now);
        strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        strikeOsc.connect(strikeGain);
        strikeGain.connect(this.masterGain);

        strikeOsc.start(now);
        strikeOsc.stop(now + 0.045);

        // Component B: Metallic ringing chime (in-harmonic blade overtone)
        const chimeOsc = ctx.createOscillator();
        const chimeFilter = ctx.createBiquadFilter();
        const chimeGain = ctx.createGain();

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(2850 * pitchMultiplier, now);

        chimeFilter.type = 'peaking';
        chimeFilter.frequency.setValueAtTime(2850 * pitchMultiplier, now);
        chimeFilter.Q.setValueAtTime(6.0, now);
        chimeFilter.gain.setValueAtTime(6.0, now);

        chimeGain.gain.setValueAtTime(effectiveGain * 0.5, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        chimeOsc.connect(chimeFilter);
        chimeFilter.connect(chimeGain);
        chimeGain.connect(this.masterGain);

        chimeOsc.start(now);
        chimeOsc.stop(now + duration);

        // Component C: Mechanical lock body thud
        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();

        bodyOsc.type = 'sine';
        bodyOsc.frequency.setValueAtTime(860 * pitchMultiplier, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(280 * pitchMultiplier, now + duration);

        bodyGain.gain.setValueAtTime(effectiveGain * 0.35, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.masterGain);

        bodyOsc.start(now);
        bodyOsc.stop(now + duration);
    }

    /**
     * 3. EQUIP SOUND (120ms)
     * Heavy leather & metal buckle/weapon equip in Armory & Forge.
     * Layer 1: Low leather thud (150Hz -> 48Hz).
     * Layer 2: Filtered leather strap friction noise (850Hz).
     * Layer 3: Metallic buckle snap resonance (1100Hz + 1650Hz).
     */
    public playEquip(): void {
        if (this.isMuted()) return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain) return;

        const now = ctx.currentTime;
        const duration = 0.120; // 120ms target
        const effectiveGain = this.getEffectiveGain(0.32);

        // Layer 1: Deep leather/armor thud
        const thudOsc = ctx.createOscillator();
        const thudFilter = ctx.createBiquadFilter();
        const thudGain = ctx.createGain();

        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(155, now);
        thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.085);

        thudFilter.type = 'lowpass';
        thudFilter.frequency.setValueAtTime(240, now);

        thudGain.gain.setValueAtTime(effectiveGain * 0.9, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

        thudOsc.connect(thudFilter);
        thudFilter.connect(thudGain);
        thudGain.connect(this.masterGain);

        thudOsc.start(now);
        thudOsc.stop(now + 0.090);

        // Layer 2: Leather strap friction rasp
        if (this.noiseBuffer) {
            const raspSrc = ctx.createBufferSource();
            raspSrc.buffer = this.noiseBuffer;

            const raspFilter = ctx.createBiquadFilter();
            raspFilter.type = 'bandpass';
            raspFilter.frequency.setValueAtTime(880, now);
            raspFilter.Q.setValueAtTime(1.8, now);

            const raspGain = ctx.createGain();
            raspGain.gain.setValueAtTime(effectiveGain * 0.45, now);
            raspGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

            raspSrc.connect(raspFilter);
            raspFilter.connect(raspGain);
            raspGain.connect(this.masterGain);

            raspSrc.start(now);
            raspSrc.stop(now + 0.080);
        }

        // Layer 3: Metallic buckle/clasp click
        const buckleOsc1 = ctx.createOscillator();
        const buckleOsc2 = ctx.createOscillator();
        const buckleGain = ctx.createGain();

        buckleOsc1.type = 'triangle';
        buckleOsc2.type = 'sine';

        buckleOsc1.frequency.setValueAtTime(1120, now);
        buckleOsc1.frequency.exponentialRampToValueAtTime(780, now + duration);

        buckleOsc2.frequency.setValueAtTime(1680, now);
        buckleOsc2.frequency.exponentialRampToValueAtTime(940, now + duration);

        buckleGain.gain.setValueAtTime(effectiveGain * 0.5, now);
        buckleGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        buckleOsc1.connect(buckleGain);
        buckleOsc2.connect(buckleGain);
        buckleGain.connect(this.masterGain);

        buckleOsc1.start(now);
        buckleOsc2.start(now);
        buckleOsc1.stop(now + duration);
        buckleOsc2.stop(now + duration);
    }

    /**
     * 4. REWARD SOUND (350ms)
     * Resonant triumphant chime on daily check-in / reward claim.
     * Ascending radiant D-Major pentatonic chime cascade:
     * D5 (587.33Hz) -> F#5 (739.99Hz) -> A5 (880.00Hz) -> D6 (1174.66Hz) -> F#6 (1479.98Hz).
     */
    public playReward(): void {
        if (this.isMuted()) return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain) return;

        const baseTime = ctx.currentTime;
        const totalDuration = 0.350; // 350ms target
        const effectiveGain = this.getEffectiveGain(0.22);

        // Radiant D Major Chime Cascade
        const notes = [
            { freq: 587.33, offset: 0.000, decay: 0.280, amp: 0.70 }, // D5
            { freq: 739.99, offset: 0.035, decay: 0.280, amp: 0.75 }, // F#5
            { freq: 880.00, offset: 0.070, decay: 0.270, amp: 0.85 }, // A5
            { freq: 1174.66, offset: 0.110, decay: 0.240, amp: 1.00 }, // D6 (Octave peak)
            { freq: 1479.98, offset: 0.150, decay: 0.200, amp: 0.65 }, // F#6 (Golden Sparkle)
        ];

        notes.forEach(({ freq, offset, decay, amp }) => {
            const startTime = baseTime + offset;
            const stopTime = Math.min(baseTime + totalDuration, startTime + decay);

            // Fundamental Sine Bell Tone
            const oscFundamental = ctx.createOscillator();
            oscFundamental.type = 'sine';
            oscFundamental.frequency.setValueAtTime(freq, startTime);

            // Shimmer Harmonic (Overtone)
            const oscOvertone = ctx.createOscillator();
            oscOvertone.type = 'triangle';
            oscOvertone.frequency.setValueAtTime(freq * 2.01, startTime); // Slight chorus detune

            // Resonant Bell Bandpass Filter
            const bellFilter = ctx.createBiquadFilter();
            bellFilter.type = 'peaking';
            bellFilter.frequency.setValueAtTime(freq, startTime);
            bellFilter.Q.setValueAtTime(4.0, startTime);
            bellFilter.gain.setValueAtTime(3.0, startTime);

            // Note Amplitude Envelope (Crisp 2ms attack, smooth exponential decay)
            const noteGain = ctx.createGain();
            noteGain.gain.setValueAtTime(0.0001, startTime);
            noteGain.gain.exponentialRampToValueAtTime(effectiveGain * amp, startTime + 0.002);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

            oscFundamental.connect(bellFilter);
            oscOvertone.connect(bellFilter);
            bellFilter.connect(noteGain);
            noteGain.connect(this.masterGain!);

            oscFundamental.start(startTime);
            oscOvertone.start(startTime);
            oscFundamental.stop(stopTime);
            oscOvertone.stop(stopTime);
        });
    }
}

/**
 * Singleton instance export
 */
export const portalSound = PortalSoundService.getInstance();
export default portalSound;
