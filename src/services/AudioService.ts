import { Howl, Howler } from 'howler';
import bridge from '@vkontakte/vk-bridge';
import { AssetsMap } from '../configs/AssetsMap';
import { PixiApp } from '../engine/core/PixiApp';
import { SoundManager } from '../engine/systems/SoundManager';

/**
 * AudioService - Централизованное управление музыкой и звуками.
 */
class AudioService {
    private static visibilityListenerAdded = false;

    private music: Howl | null = null;
    private ambient: Howl | null = null;
    private ambientUrl: string | null = null;
    private sfx: Map<string, Howl> = new Map();
    private musicVolume: number = 0.7;
    private sfxVolume: number = 0.85;
    private loadErrorTimeoutId: any = null;
    private isAppHidden: boolean = false;

    constructor() {
        if (!AudioService.visibilityListenerAdded) {
            AudioService.visibilityListenerAdded = true;

            const safeMute = (muted: boolean) => {
                try {
                    Howler.mute(muted);
                    if (muted) {
                        if (Howler.ctx && Howler.ctx.state === 'running') {
                            Howler.ctx.suspend().catch((err) => console.warn('Ctx suspend failed:', err));
                        }
                    } else {
                        if (Howler.ctx && Howler.ctx.state === 'suspended') {
                            Howler.ctx.resume().catch((err) => console.warn('Ctx resume failed:', err));
                        }
                    }
                } catch (err) {
                    console.warn('Howler.mute failed safely:', err);
                }
            };

            // 1. Стандартный браузерный Visibility API
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    console.log('🤫 App hidden - Muting audio & stopping ticker');
                    this.isAppHidden = true;
                    safeMute(true);
                    try {
                        SoundManager.getInstance().suspend();
                    } catch (e) {}
                    try {
                        PixiApp.getInstance().getApp()?.ticker.stop();
                    } catch (err) {
                        console.warn('Could not stop PIXI ticker on visibilitychange:', err);
                    }
                } else {
                    console.log('🔊 App visible - Unmuting audio & starting ticker');
                    this.isAppHidden = false;
                    try {
                        SoundManager.getInstance().resume();
                    } catch (e) {}
                    try {
                        PixiApp.getInstance().getApp()?.ticker.start();
                    } catch (err) {
                        console.warn('Could not start PIXI ticker on visibilitychange:', err);
                    }
                    import('../store/useGameStore')
                        .then(({ useGameStore }) => {
                            const isMuted = useGameStore.getState().isMuted;
                            if (!isMuted) {
                                safeMute(false);
                            }
                        })
                        .catch((err) => {
                            console.warn('Could not read mute state on visibility change:', err);
                            safeMute(false);
                        });
                }
            });

            // 2. Жизненный цикл VK Bridge (Обязательно для прохождения модерации VK)
            try {
                bridge.subscribe((event) => {
                    if (!event || !event.detail) return;
                    const { type } = event.detail;

                    if (type === 'VKWebAppViewHide') {
                        console.log('🤫 VK Bridge: VKWebAppViewHide - Muting audio & stopping ticker');
                        this.isAppHidden = true;
                        safeMute(true);
                        try {
                            SoundManager.getInstance().suspend();
                        } catch (e) {}
                        try {
                            PixiApp.getInstance().getApp()?.ticker.stop();
                        } catch (err) {
                            console.warn('Could not stop PIXI ticker on VKWebAppViewHide:', err);
                        }
                    } else if (type === 'VKWebAppViewRestore') {
                        console.log('🔊 VK Bridge: VKWebAppViewRestore - Unmuting audio & starting ticker');
                        this.isAppHidden = false;
                        try {
                            SoundManager.getInstance().resume();
                        } catch (e) {}
                        try {
                            PixiApp.getInstance().getApp()?.ticker.start();
                        } catch (err) {
                            console.warn('Could not start PIXI ticker on VKWebAppViewRestore:', err);
                        }
                        import('../store/useGameStore')
                            .then(({ useGameStore }) => {
                                const isMuted = useGameStore.getState().isMuted;
                                if (!isMuted) {
                                    safeMute(false);
                                }
                            })
                            .catch((err) => {
                                console.warn('Could not read mute state on VKWebAppViewRestore:', err);
                                safeMute(false);
                            });
                    }
                });
            } catch (err) {
                console.warn('Failed to subscribe to VK Bridge lifecycle events:', err);
            }
        } // end if (!AudioService.visibilityListenerAdded)
        // Background assets verification check bypassed in production
    }

    /**
     * Проверка существования медиа-файлов
     */
    public async verifyIntegrity() {
        // Заглушка в продакшене для исключения блокирующих сетевых запросов при старте
    }

    public resumeContext() {
        try {
            if (Howler.ctx && typeof Howler.ctx.resume === 'function' && Howler.ctx.state === 'suspended') {
                Howler.ctx
                    .resume()
                    .then(() => {
                        console.log('🔊 AudioContext Resumed Successfully');
                    })
                    .catch((err) => {
                        console.warn('AudioContext.resume failed async:', err);
                    });
            }
        } catch (err) {
            console.warn('AudioContext.resume failed safely:', err);
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
            try {
                oldMusic.fade(this.musicVolume, 0, 1000);
                oldMusic.once('fade', () => {
                    try {
                        oldMusic.stop();
                        oldMusic.unload();
                    } catch (e) {
                        console.warn('Failed to stop/unload old music:', e);
                    }
                });
            } catch (err) {
                console.warn('Failed to fade old music:', err);
            }
        }

        try {
            this.music = new Howl({
                src: [url],
                loop: true,
                volume: 0,
                html5: true,
                onloaderror: (_id, err) => console.warn(`❌ Music Load Error: ${url}`, err),
            });

            this.music.play();
            this.music.fade(0, this.musicVolume, 1000);
        } catch (err) {
            console.warn(`❌ Failed to create/play music Howl for ${url}:`, err);
            this.music = null;
        }
    }

    public stopAllMusic() {
        if (this.loadErrorTimeoutId) {
            clearTimeout(this.loadErrorTimeoutId);
            this.loadErrorTimeoutId = null;
        }
        if (this.music) {
            console.log('⏹️ AudioService: Fading out and stopping music');
            const oldMusic = this.music;
            this.music = null;
            try {
                oldMusic.fade(oldMusic.volume(), 0, 800);
                oldMusic.once('fade', () => {
                    try {
                        oldMusic.stop();
                        oldMusic.unload();
                    } catch (e) {
                        console.warn('Failed to stop/unload old music in stopAllMusic:', e);
                    }
                });
            } catch (err) {
                console.warn('Failed to fade old music in stopAllMusic:', err);
            }
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
        try {
            return this.music !== null && this.music.playing();
        } catch {
            return false;
        }
    }

    /**
     * Переключить состояние: Играть / Пауза
     */
    public toggleMusic() {
        if (!this.music) {
            // Если музыка еще ни разу не запускалась — стартуем плейлист
            if (AssetsMap?.AUDIO?.MUSIC_LIST) {
                this.playPlaylist(AssetsMap.AUDIO.MUSIC_LIST);
            }
            return;
        }

        try {
            if (this.music.playing()) {
                this.music.pause();
            } else {
                this.music.play();
            }
        } catch (err) {
            console.warn('Failed to toggle music:', err);
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

        if (this.loadErrorTimeoutId) {
            clearTimeout(this.loadErrorTimeoutId);
            this.loadErrorTimeoutId = null;
        }

        if (this.music) {
            const oldMusic = this.music;
            try {
                oldMusic.fade(this.musicVolume, 0, 1000);
                oldMusic.once('fade', () => {
                    try {
                        oldMusic.stop();
                        oldMusic.unload();
                    } catch (e) {
                        console.warn('Failed to stop/unload old music in playlist:', e);
                    }
                });
            } catch (err) {
                console.warn('Failed to fade old music in playlist:', err);
            }
        }

        try {
            this.music = new Howl({
                src: [url],
                loop: false,
                volume: 0,
                html5: true,
                onplay: () => {
                    console.log(`▶️ AudioService: Now playing: ${url}`);
                },
                onload: () => console.log(`✅ AudioService: Track loaded successfully: ${url}`),
                onend: () => {
                    console.log(`🏁 AudioService: Track finished: ${url}`);
                    this.nextTrack();
                },
                onloaderror: (_id, err) => {
                    console.error(`❌ AudioService: Load Error for ${url}:`, err);
                    if (this.loadErrorTimeoutId) {
                        clearTimeout(this.loadErrorTimeoutId);
                    }
                    this.loadErrorTimeoutId = setTimeout(() => this.nextTrack(), 1000);
                },
                onplayerror: (_id, err) => {
                    console.error(`❌ AudioService: Play Error for ${url}:`, err);
                    this.resumeContext();
                },
            });

            this.music.play();
            this.music.fade(0, this.musicVolume, 1000);
        } catch (err) {
            console.warn(`❌ Failed to create/play playlist Howl for ${url}:`, err);
            this.music = null;
            if (this.loadErrorTimeoutId) {
                clearTimeout(this.loadErrorTimeoutId);
            }
            this.loadErrorTimeoutId = setTimeout(() => this.nextTrack(), 1000);
        }
    }

    /**
     * Воспроизведение звукового эффекта
     */
    public playSFX(url: string) {
        if (this.isAppHidden) return;
        let sound = this.sfx.get(url);

        if (!sound) {
            try {
                sound = new Howl({
                    src: [url],
                    volume: this.sfxVolume,
                    onloaderror: (_id, err) => console.warn(`❌ SFX Load Error: ${url}`, err),
                });
                this.sfx.set(url, sound);
            } catch (err) {
                console.warn(`❌ Failed to create SFX Howl for ${url}:`, err);
                return;
            }
        }

        try {
            sound?.volume(this.sfxVolume);
            // Вносим случайное изменение питча (скорости воспроизведения) для разнообразия звуков
            const randomRate = 0.92 + Math.random() * 0.16; // 0.92 - 1.08
            sound?.rate(randomRate);
            sound?.play();
        } catch (err) {
            console.warn(`❌ Failed to play SFX for ${url}:`, err);
        }
    }

    /**
     * Запуск цикличного эмбиента (фонового звука окружения)
     */
    public playAmbient(url: string) {
        if (this.isAppHidden) return;
        try {
            if (this.ambientUrl === url && this.ambient && this.ambient.playing()) {
                return;
            }
        } catch {
            // Игнорируем ошибки проверки воспроизведения
        }
        this.stopAmbient();

        this.ambientUrl = url;
        try {
            this.ambient = new Howl({
                src: [url],
                loop: true,
                volume: this.musicVolume * 0.6,
                html5: true,
                onloaderror: (_id, err) => console.warn(`❌ Ambient Load Error: ${url}`, err),
            });
            this.ambient.play();
            console.log(`🔊 Ambient started: ${url}`);
        } catch (err) {
            console.warn(`❌ Failed to create/play Ambient Howl for ${url}:`, err);
            this.ambient = null;
        }
    }

    /**
     * Остановка эмбиента
     */
    public stopAmbient() {
        if (this.ambient) {
            console.log('⏹️ Stopping ambient audio');
            try {
                this.ambient.stop();
                this.ambient.unload();
            } catch (err) {
                console.warn('Failed to stop/unload ambient:', err);
            }
            this.ambient = null;
            this.ambientUrl = null;
        }
    }

    /**
     * Воспроизведение звука смерти (падения) героя
     */
    public playDeathSFX() {
        this.playSFX('/assets/audio/sfx/impact_crit.mp3');
    }

    /**
     * Воспроизведение звука критического удара (с увеличенным объемом/эффектом)
     */
    public playCritSFX() {
        if (this.isAppHidden) return;
        const critUrl = '/assets/audio/sfx/impact_crit.mp3';
        const hitFallbackUrl = '/assets/audio/sfx/impact_hit.mp3';
        let sound = this.sfx.get(critUrl);

        if (!sound) {
            try {
                sound = new Howl({
                    src: [critUrl, hitFallbackUrl],
                    volume: Math.min(1.0, this.sfxVolume * 1.25),
                    onloaderror: (_id, err) => console.warn(`❌ Crit SFX Load Error, using fallback`, err),
                });
                this.sfx.set(critUrl, sound);
            } catch (err) {
                console.warn(`❌ Failed to create Crit SFX Howl:`, err);
                return;
            }
        }

        try {
            sound?.volume(Math.min(1.0, this.sfxVolume * 1.25));
            sound?.play();
        } catch (err) {
            console.warn(`❌ Failed to play Crit SFX:`, err);
        }
    }

    /**
     * Воспроизведение звука атаки в зависимости от типа оружия
     */
    public playStrikeSFX(weaponArchetype: 'SWORD' | 'BOW' | 'STAFF' | 'DAGGER' | 'OTHER') {
        if (this.isAppHidden) return;
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
            try {
                sound = new Howl({
                    src: [url, hitFallbackUrl],
                    volume: this.sfxVolume,
                    onloaderror: () => console.log(`SFX ${url} not found, using hit fallback.`),
                });
                this.sfx.set(url, sound);
            } catch (err) {
                console.warn(`❌ Failed to create Strike SFX Howl for ${url}:`, err);
                return;
            }
        }

        try {
            sound?.volume(this.sfxVolume);
            sound?.play();
        } catch (err) {
            console.warn(`❌ Failed to play Strike SFX:`, err);
        }
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
     * Установка режима тишины (mute) для Howler
     */
    public setMuted(muted: boolean) {
        try {
            Howler.mute(muted);
            if (muted) {
                if (Howler.ctx && Howler.ctx.state === 'running') {
                    Howler.ctx.suspend().catch(() => {});
                }
            } else {
                if (Howler.ctx && Howler.ctx.state === 'suspended') {
                    Howler.ctx.resume().catch(() => {});
                }
            }
        } catch (err) {
            console.warn('Howler.mute failed safely in setMuted:', err);
        }
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
