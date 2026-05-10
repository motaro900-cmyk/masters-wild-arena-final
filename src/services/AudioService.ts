import { Howl, Howler } from 'howler';

/**
 * AudioService - Централизованное управление музыкой и звуками.
 */
class AudioService {
    private music: Howl | null = null;
    private sfx: Map<string, Howl> = new Map();
    private musicVolume: number = 0.7;
    private sfxVolume: number = 0.85;

    constructor() {
        // Инициализация при создании
    }

    /**
     * Принудительное возобновление аудио-контекста (для обхода блокировок браузера)
     */
    public resumeContext() {
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume().then(() => {
                console.log("🔊 AudioContext Resumed Successfully");
            });
        }
    }

    /**
     * Загрузка и запуск фоновой музыки
     */
    public playMusic(url: string) {
        if (this.music) {
            this.music.stop();
            this.music.unload(); // Освобождаем память
        }

        this.music = new Howl({
            src: [url],
            loop: true,
            volume: this.musicVolume,
            html5: true,
            onloaderror: (id, err) => console.warn(`❌ Music Load Error: ${url}`, err)
        });

        this.music.play();
    }

    /**
     * Воспроизведение звукового эффекта
     */
    public playSFX(url: string) {
        let sound = this.sfx.get(url);
        
        if (!sound) {
            sound = new Howl({
                src: [url],
                volume: this.sfxVolume,
                onloaderror: (id, err) => console.warn(`❌ SFX Load Error: ${url}`, err)
            });
            this.sfx.set(url, sound);
        }

        // Всегда обновляем громкость перед проигрыванием (на случай если она менялась в Map)
        sound.volume(this.sfxVolume);
        sound.play();
    }

    /**
     * Обновление громкости музыки (0.0 - 1.0)
     */
    public setMusicVolume(volume: number) {
        this.musicVolume = volume;
        if (this.music) {
            this.music.volume(volume);
        }
    }

    /**
     * Обновление громкости эффектов (0.0 - 1.0)
     */
    public setSFXVolume(volume: number) {
        this.sfxVolume = volume;
        this.sfx.forEach(sound => sound.volume(volume));
    }
}

export const audioService = new AudioService();
