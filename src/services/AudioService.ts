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

    private playlist: string[] = [];
    private currentTrackIndex: number = -1;

    /**
     * Загрузка и запуск фоновой музыки
     */
    public playMusic(url: string) {
        this.stopAllMusic();

        this.music = new Howl({
            src: [url],
            loop: true,
            volume: this.musicVolume,
            html5: true,
            onloaderror: (_id, err) => console.warn(`❌ Music Load Error: ${url}`, err)
        });

        this.music.play();
    }

    /**
     * Остановка всей текущей музыки
     */
    public stopAllMusic() {
        if (this.music) {
            console.log("⏹️ AudioService: Stopping and unloading music");
            this.music.stop();
            this.music.unload();
            this.music = null;
        }
    }

    /**
     * Запуск случайного плейлиста
     */
    public playPlaylist(urls: string[]) {
        console.log("📁 AudioService: Setting up playlist with", urls.length, "tracks");
        if (urls.length === 0) {
            console.error("❌ AudioService: Playlist is empty!");
            return;
        }
        // Перемешиваем список
        this.playlist = [...urls].sort(() => Math.random() - 0.5);
        this.currentTrackIndex = 0;
        this.playNextInPlaylist();
    }

    /**
     * Статус: играет ли сейчас музыка
     */
    public isPlaying(): boolean {
        return this.music !== null && this.music.playing();
    }

    /**
     * Переключить состояние: Играть / Пауза
     */
    public toggleMusic() {
        if (!this.music) {
            // Если музыка еще ни разу не запускалась — стартуем плейлист
            const { AssetsMap } = window as any;
            if (AssetsMap?.AUDIO?.MUSIC_LIST) {
                this.playPlaylist(AssetsMap.AUDIO.MUSIC_LIST);
            }
            return;
        }

        if (this.music.playing()) {
            this.music.pause();
        } else {
            this.music.play();
        }
    }

    /**
     * Переключение на следующий трек
     */
    public nextTrack() {
        if (this.playlist.length === 0) return;
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.playNextInPlaylist();
    }

    /**
     * Переключение на предыдущий трек
     */
    public prevTrack() {
        if (this.playlist.length === 0) return;
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playNextInPlaylist();
    }

    /**
     * Получить название текущего трека
     */
    public getCurrentTrackName(): string {
        if (this.currentTrackIndex === -1 || this.playlist.length === 0) return "Тишина";
        const url = this.playlist[this.currentTrackIndex];
        const fileName = url.split('/').pop() || "";
        return fileName.replace('.mp3', '').replace(/_/g, ' ');
    }

    private playNextInPlaylist() {
        if (this.playlist.length === 0) return;
        
        const url = this.playlist[this.currentTrackIndex];
        console.log(`🎵 AudioService: Attempting to play [${this.currentTrackIndex + 1}/${this.playlist.length}]: ${url}`);

        this.stopAllMusic();

        this.music = new Howl({
            src: [url],
            loop: false,
            volume: this.musicVolume,
            html5: true,
            onplay: () => {
                console.log(`▶️ AudioService: Now playing: ${url}`);
                // Можно добавить обновление в стор здесь, если нужно
            },
            onload: () => console.log(`✅ AudioService: Track loaded successfully: ${url}`),
            onend: () => {
                console.log(`🏁 AudioService: Track finished: ${url}`);
                this.nextTrack();
            },
            onloaderror: (_id, err) => {
                console.error(`❌ AudioService: Load Error for ${url}:`, err);
                setTimeout(() => this.nextTrack(), 1000);
            },
            onplayerror: (_id, err) => {
                console.error(`❌ AudioService: Play Error for ${url}:`, err);
                this.resumeContext();
            }
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
                onloaderror: (_id, err) => console.warn(`❌ SFX Load Error: ${url}`, err)
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
