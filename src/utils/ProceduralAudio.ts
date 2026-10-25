/**
 * PROCEDURAL WEB AUDIO SYNTHESIZER
 * Zero-latency, zero-asset Web Audio API sound design for standalone web play.
 * Generates tactile UI clicks, hover whooshes, heroic duel horns, and victory fanfares.
 */
import { audioService } from '../services/AudioService';

class ProceduralAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    private isMuted(): boolean {
        return audioService.isMuted();
    }

    /**
     * Tactile UI click - crisp wooden / mechanical transient (40ms)
     */
    public playClick(pitchMultiplier: number = 1.0): void {
        if (this.isMuted()) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(140 * pitchMultiplier, now + 0.045);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Subtle UI hover - air swoosh / soft frequency lift (35ms)
     */
    public playHover(): void {
        if (this.isMuted()) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.035);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    /**
     * Epic Arena Duel Horn - twin detuned saw oscillators with low-pass sweep
     */
    public playDuelHorn(): void {
        if (this.isMuted()) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(110, now);
        osc2.frequency.setValueAtTime(112.5, now); // 2.5Hz beating detune

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.85);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.45, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.95);
        osc2.stop(now + 0.95);
    }

    /**
     * Heroic Level Up / Victory Fanfare - ascending arpeggio
     */
    public playFanfare(): void {
        if (this.isMuted()) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
            const start = ctx.currentTime + idx * 0.09;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            const duration = idx === notes.length - 1 ? 0.45 : 0.12;
            gain.gain.setValueAtTime(0.25, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

            osc.connect(gain);
            gain.connect(this.masterGain || ctx.destination);

            osc.start(start);
            osc.stop(start + duration + 0.02);
        });
    }

    /**
     * Beast Codex / Card Foil Shimmer - sparkling high-frequency sweep
     */
    public playShimmer(): void {
        if (this.isMuted()) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.12);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }
}

export const proceduralAudio = new ProceduralAudioEngine();
