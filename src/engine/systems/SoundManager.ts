/**
 * @class SoundManager
 * Процедурный генератор звуков (Web Audio API).
 * Создает сочные 8-bit/Indie звуки без загрузки аудиофайлов.
 */
export class SoundManager {
    private static instance: SoundManager | null = null;
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;

    private constructor() {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            } else {
                this.enabled = false;
            }
        } catch (e) {
            console.warn('🔊 Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private playTone(type: OscillatorType, freq: number, duration: number, vol: number = 0.1, slideFreq?: number) {
        if (!this.ctx || !this.enabled) return;
        // Политика браузеров: нужно возобновить контекст после первого клика
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(freq, now);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideFreq), now + duration);
        }

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    public playClick() {
        this.playTone('sine', 600, 0.1, 0.1);
    }

    public playHit() {
        this.playTone('square', 150, 0.15, 0.1, 40);
    }

    public playCrit() {
        this.playTone('sawtooth', 200, 0.3, 0.15, 50);
        setTimeout(() => this.playTone('square', 100, 0.3, 0.15, 30), 50);
    }

    public playVictory() {
        if (!this.ctx || !this.enabled) return;
        const freqs = [440, 554.37, 659.25, 880]; // Мажорное арпеджио
        freqs.forEach((f, i) => {
            setTimeout(() => this.playTone('sine', f, 0.4, 0.1), i * 150);
        });
    }

    public playDefeat() {
        if (!this.ctx || !this.enabled) return;
        const freqs = [300, 280, 260, 200]; // Нисходящие грустные ноты
        freqs.forEach((f, i) => {
            setTimeout(() => this.playTone('sawtooth', f, 0.5, 0.1), i * 300);
        });
    }
}
