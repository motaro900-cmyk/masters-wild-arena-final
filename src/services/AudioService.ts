import { Howl, Howler } from 'howler';

/**
 * AudioService - Централизованное управление музыкой и звуками.
 */
class AudioService {
    private music: Howl | null = null;
    private ambient: Howl | null = null;
    private ambientUrl: string | null = null;
    private sfx: Map<string, Howl> = new Map();
    private musicVolume: number = 0.7;
    private sfxVolume: number = 0.85;

    constructor() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('🤫 App hidden - Muting audio');
                Howler.mute(true);
            } else {
                console.log('🔊 App visible - Unmuting audio');
                import('../store/useGameStore')
                    .then(({ useGameStore }) => {
                        const isMuted = useGameStore.getState().isMuted;
                        if (!isMuted) {
                            Howler.mute(false);
                        }
                    })
                    .catch((err) => {
                        console.warn('Could not read mute state on visibility change:', err);
                        Howler.mute(false);
                    });
            }
        });
        // Run background assets verification check
        this.verifyIntegrity();
    }

    /**
     * Проверка существования медиа-файлов
     */
    public async verifyIntegrity() {
        const criticalUrls = [
            '/assets/audio/sfx/click.mp3',
            '/assets/audio/sfx/buy_success.mp3',
            '/assets/audio/sfx/impact_hit.mp3',
            '/assets/audio/sfx/block.mp3',
            '/assets/audio/sfx/miss.mp3',
            '/assets/audio/sfx/strike_staff.mp3',
        ];

        console.log('🔍 AudioService: Checking audio assets integrity...');
        for (const url of criticalUrls) {
            try {
                const res = await fetch(url, { method: 'HEAD' });
                if (!res.ok) {
                    console.error(`⚠️ AudioService Asset Missing (Status ${res.status}): ${url}`);
                }
            } catch (err) {
                console.warn(`⚠️ AudioService Asset Verification Failed for ${url}:`, err);
            }
        }
    }

    /**
     * Принудительное возобновление аудио-контекста (для обхода блокировок браузера)
     */
    public resumeContext() {
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume().then(() => {
                console.log('🔊 AudioContext Resumed Successfully');
            });
        }
    }

    private playlist: string[] = [];
    private currentTrackIndex: number = -1;

    /**
     * Загрузка и запуск фоновой музыки
     */
    public playMusic(url: string) {
        if (this.music) {
            const oldMusic = this.music;
            oldMusic.fade(this.musicVolume, 0, 1000);
            oldMusic.once('fade', () => {
                oldMusic.stop();
                oldMusic.unload();
            });
        }

        this.music = new Howl({
            src: [url],
            loop: true,
            volume: 0,
            html5: true,
            onloaderror: (_id, err) => console.warn(`❌ Music Load Error: ${url}`, err),
        });

        this.music.play();
        this.music.fade(0, this.musicVolume, 1000);
    }

    /**
     * Остановка всей текущей музыки
     */
    public stopAllMusic() {
        if (this.music) {
            console.log('⏹️ AudioService: Fading out and stopping music');
            const oldMusic = this.music;
            this.music = null;
            oldMusic.fade(oldMusic.volume(), 0, 800);
            oldMusic.once('fade', () => {
                oldMusic.stop();
                oldMusic.unload();
            });
        }
    }

    /**
     * Запуск случайного плейлиста
     */
    public playPlaylist(urls: string[]) {
        console.log('📁 AudioService: Setting up playlist with', urls.length, 'tracks');
        if (urls.length === 0) {
            console.error('❌ AudioService: Playlist is empty!');
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
        if (this.currentTrackIndex === -1 || this.playlist.length === 0) return 'Тишина';
        const url = this.playlist[this.currentTrackIndex];
        const fileName = url.split('/').pop() || '';
        return fileName.replace('.mp3', '').replace(/_/g, ' ');
    }

    private playNextInPlaylist() {
        if (this.playlist.length === 0) return;

        const url = this.playlist[this.currentTrackIndex];
        console.log(
            `🎵 AudioService: Attempting to play [${this.currentTrackIndex + 1}/${this.playlist.length}]: ${url}`,
        );

        if (this.music) {
            const oldMusic = this.music;
            oldMusic.fade(this.musicVolume, 0, 1000);
            oldMusic.once('fade', () => {
                oldMusic.stop();
                oldMusic.unload();
            });
        }

        this.music = new Howl({
            src: [url],
            loop: false,
            volume: 0,
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
            },
        });

        this.music.play();
        this.music.fade(0, this.musicVolume, 1000);
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
                onloaderror: (_id, err) => console.warn(`❌ SFX Load Error: ${url}`, err),
            });
            this.sfx.set(url, sound);
        }

        // Всегда обновляем громкость перед проигрыванием (на случай если она менялась в Map)
        sound.volume(this.sfxVolume);
        sound.play();
    }

    /**
     * Запуск цикличного эмбиента (фонового звука окружения)
     */
    public playAmbient(url: string) {
        if (this.ambientUrl === url && this.ambient && this.ambient.playing()) {
            return;
        }
        this.stopAmbient();

        this.ambientUrl = url;
        this.ambient = new Howl({
            src: [url],
            loop: true,
            volume: this.musicVolume * 0.6,
            html5: true,
            onloaderror: (_id, err) => console.warn(`❌ Ambient Load Error: ${url}`, err),
        });
        this.ambient.play();
        console.log(`🔊 Ambient started: ${url}`);
    }

    /**
     * Остановка эмбиента
     */
    public stopAmbient() {
        if (this.ambient) {
            console.log('⏹️ Stopping ambient audio');
            this.ambient.stop();
            this.ambient.unload();
            this.ambient = null;
            this.ambientUrl = null;
        }
    }

    /**
     * Воспроизведение звука критического удара (с увеличенным объемом/эффектом)
     */
    public playCritSFX() {
        const critUrl = '/assets/audio/sfx/impact_crit.mp3';
        const hitFallbackUrl = '/assets/audio/sfx/impact_hit.mp3';
        let sound = this.sfx.get(critUrl);

        if (!sound) {
            sound = new Howl({
                src: [critUrl, hitFallbackUrl],
                volume: this.sfxVolume * 1.25,
                onloaderror: (_id, err) => console.warn(`❌ Crit SFX Load Error, using fallback`, err),
            });
            this.sfx.set(critUrl, sound);
        }

        sound.volume(this.sfxVolume * 1.25);
        sound.play();
    }

    /**
     * Воспроизведение звука атаки в зависимости от типа оружия
     */
    public playStrikeSFX(weaponArchetype: 'SWORD' | 'BOW' | 'STAFF' | 'DAGGER' | 'OTHER') {
        let url = '/assets/audio/sfx/impact_hit.mp3';
        switch (weaponArchetype) {
            case 'SWORD':
                url = '/assets/audio/sfx/strike_sword.mp3';
                break;
            case 'BOW':
                url = '/assets/audio/sfx/strike_bow.mp3';
                break;
            case 'STAFF':
                url = '/assets/audio/sfx/strike_staff.mp3';
                break;
            case 'DAGGER':
                url = '/assets/audio/sfx/strike_dagger.mp3';
                break;
        }

        const hitFallbackUrl = '/assets/audio/sfx/impact_hit.mp3';
        let sound = this.sfx.get(url);
        if (!sound) {
            sound = new Howl({
                src: [url, hitFallbackUrl],
                volume: this.sfxVolume,
                onloaderror: () => console.log(`SFX ${url} not found, using hit fallback.`),
            });
            this.sfx.set(url, sound);
        }

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
        if (this.ambient) {
            this.ambient.volume(volume * 0.6);
        }
    }

    /**
     * Обновление громкости эффектов (0.0 - 1.0)
     */
    public setSFXVolume(volume: number) {
        this.sfxVolume = volume;
        this.sfx.forEach((sound) => sound.volume(volume));
    }

    /**
     * Остановка всех проигрываемых эффектов
     */
    public stopAllSFX() {
        this.sfx.forEach((sound) => {
            sound.stop();
        });
    }
}

export const audioService = new AudioService();
