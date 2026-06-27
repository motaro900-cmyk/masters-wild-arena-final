import { useGameStore } from '../../store/useGameStore';

/**
 * @class SoundManager
 * Процедурный генератор звуков (Web Audio API).
 * Создает сочные 8-bit/Indie звуки без загрузки аудиофайлов.
 *
 * [iOS Fix] AudioContext создаётся лениво — только при первом вызове playTone(),
 * уже после пользовательского взаимодействия. Это обязательно для iOS Safari,
 * который запрещает создание AudioContext без user gesture.
 */
export class SoundManager {
    private static instance: SoundManager | null = null;
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;
    private isSuspended: boolean = false;
    private contextCreationFailed: boolean = false;

    private constructor() {
        // [iOS Fix]: Не создаём AudioContext в конструкторе.
        // На iOS Safari это вызывает NotAllowedError / InvalidStateError
        // если нет активного пользовательского жеста.
        // Контекст будет создан лениво в ensureContext() при первом звуке.
        if (typeof window === 'undefined') {
            this.enabled = false;
        }
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Лениво создаёт AudioContext при первом обращении.
     * Безопасно вызывать только из пользовательского обработчика события.
     */
    private ensureContext(): boolean {
        if (this.ctx) return true;
        if (this.contextCreationFailed || !this.enabled) return false;

        try {
            const AudioContextClass =
                (typeof window !== 'undefined' && window.AudioContext) ||
                (typeof window !== 'undefined' && (window as any).webkitAudioContext);

            if (AudioContextClass) {
                this.ctx = new (AudioContextClass as typeof AudioContext)();
                return true;
            } else {
                this.enabled = false;
                return false;
            }
        } catch (e) {
            console.warn('🔊 Web Audio API not supported or not allowed yet:', e);
            this.contextCreationFailed = true;
            this.enabled = false;
            return false;
        }
    }

    public suspend() {
        this.isSuspended = true;
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
        }
    }

    public resume() {
        this.isSuspended = false;
        // Попытаться возобновить контекст если он был suspend()'нут
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    private playTone(type: OscillatorType, freq: number, duration: number, vol: number = 0.1, slideFreq?: number) {
        if (this.isSuspended || (typeof document !== 'undefined' && document.hidden)) return;

        // [iOS Fix]: Контекст создаётся здесь — уже в рамках user gesture (клика/тапа)
        if (!this.ensureContext()) return;

        const { soundVolume, isMuted } = useGameStore.getState() as any;
        if (isMuted) return; // тишина

        const finalVol = vol * (soundVolume / 100);

        // Политика браузеров: нужно возобновить контекст после первого клика
        if (this.ctx!.state === 'suspended') this.ctx!.resume().catch(() => {});

        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = type;
        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        const now = this.ctx!.currentTime;
        osc.frequency.setValueAtTime(freq, now);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideFreq), now + duration);
        }

        gain.gain.setValueAtTime(finalVol, now);
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
        if (!this.enabled) return;
        const freqs = [440, 554.37, 659.25, 880]; // Мажорное арпеджио
        freqs.forEach((f, i) => {
            setTimeout(() => this.playTone('sine', f, 0.4, 0.1), i * 150);
        });
    }

    public playDefeat() {
        if (!this.enabled) return;
        const freqs = [300, 280, 260, 200]; // Нисходящие грустные ноты
        freqs.forEach((f, i) => {
            setTimeout(() => this.playTone('sawtooth', f, 0.5, 0.1), i * 300);
        });
    }
}
