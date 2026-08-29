import { Howl, Howler } from 'howler';
import bridge from '@vkontakte/vk-bridge';
import { AssetsMap } from '../configs/AssetsMap';
// PixiApp is dynamically imported inside event handlers to prevent pixi.js (562 kB)
// from being pulled into the startup bundle via the static import chain.
import { SoundManager } from '../engine/systems/SoundManager';
import { AUDIO_DATABASE, AUDIO_BUS_VOLUMES, AudioBusType } from '../configs/AudioDatabase';

interface ActiveSoundInstance {
    howl: Howl;
    soundId: string;
    priority: number;
    bus: AudioBusType;
    playId: number;
    startTime: number;
}

/**
 * AudioService - Централизованная легендарная аудиосистема.
 * Управляет шинами громкости, лимитом голосов, приоритетами, кроссфейдами и вариациями.
 */
class AudioService {
    private static visibilityListenerAdded = false;

    // Глобальные менеджеры шин
    private sfxCache: Map<string, Howl> = new Map();
    private activeInstances: ActiveSoundInstance[] = [];
    private lastPlayedTimestamps: Map<string, number> = new Map();

    private music: Howl | null = null;
    private ambient: Howl | null = null;
    private ambientUrl: string | null = null;

    // Параметры громкости шин
    private masterVolume: number = 1.0;
    private musicBusVolume: number = AUDIO_BUS_VOLUMES.music;
    private ambientBusVolume: number = AUDIO_BUS_VOLUMES.ambient;
    private uiBusVolume: number = AUDIO_BUS_VOLUMES.ui;
    private combatBusVolume: number = AUDIO_BUS_VOLUMES.combat;
    private lootBusVolume: number = AUDIO_BUS_VOLUMES.loot;
    private voiceBusVolume: number = AUDIO_BUS_VOLUMES.voice;

    private isAppHidden: boolean = false;
    private loadErrorTimeoutId: any = null;

    private playlist: string[] = [];
    private currentTrackIndex: number = -1;

    // Лимиты производительности (AAA Performance Budget)
    private readonly MAX_CONCURRENT_VOICES = 24;

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

            // Visibility API
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.isAppHidden = true;
                    safeMute(true);
                    try {
                        SoundManager.getInstance().suspend();
                    } catch (e) {}
                    import('../engine/core/PixiApp')
                        .then(({ PixiApp }) => {
                            try {
                                PixiApp.getInstance().getApp()?.ticker.stop();
                            } catch (err) {}
                        })
                        .catch(() => {});
                } else {
                    this.isAppHidden = false;
                    try {
                        SoundManager.getInstance().resume();
                    } catch (e) {}
                    import('../engine/core/PixiApp')
                        .then(({ PixiApp }) => {
                            try {
                                PixiApp.getInstance().getApp()?.ticker.start();
                            } catch (err) {}
                        })
                        .catch(() => {});
                    import('../store/useGameStore')
                        .then(({ useGameStore }) => {
                            if (!useGameStore.getState().isMuted) {
                                safeMute(false);
                            }
                        })
                        .catch(() => safeMute(false));
                }
            });

            // VK Bridge Lifecycle
            try {
                bridge.subscribe((event) => {
                    if (!event || !event.detail) return;
                    const { type } = event.detail;
                    if (type === 'VKWebAppViewHide') {
                        this.isAppHidden = true;
                        safeMute(true);
                        try {
                            SoundManager.getInstance().suspend();
                        } catch (e) {}
                        import('../engine/core/PixiApp')
                            .then(({ PixiApp }) => {
                                try {
                                    PixiApp.getInstance().getApp()?.ticker.stop();
                                } catch (err) {}
                            })
                            .catch(() => {});
                    } else if (type === 'VKWebAppViewRestore') {
                        this.isAppHidden = false;
                        try {
                            SoundManager.getInstance().resume();
                        } catch (e) {}
                        import('../engine/core/PixiApp')
                            .then(({ PixiApp }) => {
                                try {
                                    PixiApp.getInstance().getApp()?.ticker.start();
                                } catch (err) {}
                            })
                            .catch(() => {});
                        import('../store/useGameStore')
                            .then(({ useGameStore }) => {
                                if (!useGameStore.getState().isMuted) {
                                    safeMute(false);
                                }
                            })
                            .catch(() => safeMute(false));
                    }
                });
            } catch (err) {
                console.warn('Failed to subscribe to VK Bridge lifecycle events:', err);
            }
        }
    }

    public resumeContext() {
        try {
            if (Howler.ctx && typeof Howler.ctx.resume === 'function' && Howler.ctx.state === 'suspended') {
                Howler.ctx.resume().catch(() => {});
            }
        } catch (err) {
            console.warn('AudioContext.resume failed safely:', err);
        }
    }

    /**
     * Запуск музыки по URL
     */
    public playMusic(url: string) {
        if (this.music) {
            const oldMusic = this.music;
            try {
                oldMusic.fade(oldMusic.volume(), 0, 1000);
                oldMusic.once('fade', () => {
                    try {
                        oldMusic.stop();
                        oldMusic.unload();
                    } catch (e) {}
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
            this.music.fade(0, this.musicVolumeTotal(), 1000);
        } catch (err) {
            console.warn(`❌ Failed to play music: ${url}`, err);
            this.music = null;
        }
    }

    public stopAllMusic() {
        if (this.loadErrorTimeoutId) {
            clearTimeout(this.loadErrorTimeoutId);
            this.loadErrorTimeoutId = null;
        }
        if (this.music) {
            const oldMusic = this.music;
            this.music = null;
            try {
                oldMusic.fade(oldMusic.volume(), 0, 800);
                oldMusic.once('fade', () => {
                    try {
                        oldMusic.stop();
                        oldMusic.unload();
                    } catch (e) {}
                });
            } catch (err) {}
        }
    }

    public playPlaylist(urls: string[]) {
        if (urls.length === 0) return;
        this.playlist = [...urls].sort(() => Math.random() - 0.5);
        this.currentTrackIndex = 0;
        this.playNextInPlaylist();
    }

    public isPlaying(): boolean {
        try {
            return this.music !== null && this.music.playing();
        } catch {
            return false;
        }
    }

    public toggleMusic() {
        if (!this.music) {
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

    public nextTrack() {
        if (this.playlist.length === 0) return;
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.playNextInPlaylist();
    }

    public prevTrack() {
        if (this.playlist.length === 0) return;
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playNextInPlaylist();
    }

    public getCurrentTrackName(): string {
        if (this.currentTrackIndex === -1 || this.playlist.length === 0) return 'Тишина';
        const url = this.playlist[this.currentTrackIndex];
        const fileName = url.split('/').pop() || '';
        return fileName.replace('.mp3', '').replace(/_/g, ' ');
    }

    private playNextInPlaylist() {
        if (this.playlist.length === 0) return;
        const url = this.playlist[this.currentTrackIndex];

        if (this.loadErrorTimeoutId) {
            clearTimeout(this.loadErrorTimeoutId);
            this.loadErrorTimeoutId = null;
        }

        if (this.music) {
            const oldMusic = this.music;
            try {
                oldMusic.fade(oldMusic.volume(), 0, 1000);
                oldMusic.once('fade', () => {
                    try {
                        oldMusic.stop();
                        oldMusic.unload();
                    } catch (e) {}
                });
            } catch (err) {}
        }

        try {
            this.music = new Howl({
                src: [url],
                loop: false,
                volume: 0,
                html5: true,
                onend: () => this.nextTrack(),
                onloaderror: () => {
                    if (this.loadErrorTimeoutId) clearTimeout(this.loadErrorTimeoutId);
                    this.loadErrorTimeoutId = setTimeout(() => this.nextTrack(), 1000);
                },
                onplayerror: () => this.resumeContext(),
            });

            this.music.play();
            this.music.fade(0, this.musicVolumeTotal(), 1000);
        } catch (err) {
            this.music = null;
            if (this.loadErrorTimeoutId) clearTimeout(this.loadErrorTimeoutId);
            this.loadErrorTimeoutId = setTimeout(() => this.nextTrack(), 1000);
        }
    }

    /**
     * Воспроизведение звукового эффекта по его ID в AudioDatabase.
     * Реализует приоритеты, лимиты голосов, кулдауны и случайные вариации.
     */
    public playSFXById(soundId: string) {
        if (this.isAppHidden) return;

        const config = AUDIO_DATABASE[soundId];
        if (!config) {
            // Если звука нет в базе данных, пытаемся сыграть его как обычный SFX (fallback)
            this.playSFX(`/assets/audio/sfx/${soundId}.mp3`);
            return;
        }

        // 1. Проверка Concurrency Group (кулдауны)
        const now = Date.now();
        const lastPlayed = this.lastPlayedTimestamps.get(soundId) || 0;
        if (config.cooldown && now - lastPlayed < config.cooldown) {
            return; // Отклоняем вызов для предотвращения какофонии
        }

        // 2. Лимит одновременно воспроизводимых звуков (Voice Limiting)
        this.cleanFinishedInstances();
        if (this.activeInstances.length >= this.MAX_CONCURRENT_VOICES) {
            // Ищем наименее приоритетный звук
            let lowestPriorityIndex = -1;
            let lowestPriority = Infinity;
            let oldestStartTime = Infinity;

            for (let i = 0; i < this.activeInstances.length; i++) {
                const instance = this.activeInstances[i];
                if (instance.priority < lowestPriority) {
                    lowestPriority = instance.priority;
                    lowestPriorityIndex = i;
                    oldestStartTime = instance.startTime;
                } else if (instance.priority === lowestPriority && instance.startTime < oldestStartTime) {
                    lowestPriorityIndex = i;
                    oldestStartTime = instance.startTime;
                }
            }

            // Если новый звук имеет приоритет выше или такой же, прерываем старый
            if (lowestPriorityIndex !== -1 && config.priority >= lowestPriority) {
                const victim = this.activeInstances[lowestPriorityIndex];
                try {
                    victim.howl.stop(victim.playId);
                } catch (e) {}
                this.activeInstances.splice(lowestPriorityIndex, 1);
            } else {
                // Иначе отбрасываем текущий звук (приоритет нового слишком мал)
                return;
            }
        }

        // 3. Выбор случайной вариации
        if (config.variants.length === 0) return;
        const randomVariantUrl = config.variants[Math.floor(Math.random() * config.variants.length)];

        // 4. Получение / создание Howl-объекта
        let sound = this.sfxCache.get(randomVariantUrl);
        if (!sound) {
            try {
                // Поддерживаем Web-оптимальный OGG Opus с фоллбеком на MP3
                const isOgg = randomVariantUrl.endsWith('.ogg');
                const sources = isOgg
                    ? [randomVariantUrl, randomVariantUrl.replace('.ogg', '.mp3')]
                    : [randomVariantUrl];

                sound = new Howl({
                    src: sources,
                    volume: this.getBusVolume(config.bus),
                    onloaderror: (_id, err) => console.warn(`❌ SFX Load Error: ${randomVariantUrl}`, err),
                });
                this.sfxCache.set(randomVariantUrl, sound);
            } catch (err) {
                console.warn(`❌ Failed to create sound for ${randomVariantUrl}:`, err);
                return;
            }
        }

        // 5. Запуск воспроизведения с рандомизацией
        try {
            // Pitch Randomization
            const pitchRange = config.pitchRange || [0.95, 1.05];
            const randomPitch = pitchRange[0] + Math.random() * (pitchRange[1] - pitchRange[0]);
            sound.rate(randomPitch);

            // Volume Randomization (90% - 100%)
            const randomVolumeCoef = 0.9 + Math.random() * 0.1;
            const finalVolume = config.volume * this.getBusVolume(config.bus) * randomVolumeCoef;
            sound.volume(finalVolume);

            // Регистрация инстанса
            const playId = sound.play();
            this.activeInstances.push({
                howl: sound,
                soundId: soundId,
                priority: config.priority,
                bus: config.bus,
                playId: playId,
                startTime: now,
            });

            this.lastPlayedTimestamps.set(soundId, now);

            // Дополнительно: Sidechain (Ducking)
            if (config.priority >= 90) {
                this.applyDucking();
            }
        } catch (err) {
            console.warn(`❌ Failed to play SFX ${soundId}:`, err);
        }
    }

    /**
     * Воспроизведение звукового эффекта по прямому URL (fallback)
     */
    public playSFX(url: string) {
        if (this.isAppHidden) return;
        let sound = this.sfxCache.get(url);

        if (!sound) {
            try {
                sound = new Howl({
                    src: [url],
                    volume: this.uiBusVolume * this.masterVolume,
                    onloaderror: (_id, err) => console.warn(`❌ SFX Load Error: ${url}`, err),
                });
                this.sfxCache.set(url, sound);
            } catch (err) {
                console.warn(`❌ Failed to create Howl for ${url}:`, err);
                return;
            }
        }

        try {
            // Рандомизация питча по умолчанию
            const randomRate = 0.92 + Math.random() * 0.16;
            sound.rate(randomRate);
            sound.volume(this.uiBusVolume * this.masterVolume);
            sound.play();
        } catch (err) {
            console.warn(`❌ Failed to play SFX: ${url}`, err);
        }
    }

    /**
     * Фоновый цикличный эмбиент
     */
    public playAmbient(url: string) {
        if (this.isAppHidden) return;
        try {
            if (this.ambientUrl === url && this.ambient && this.ambient.playing()) {
                return;
            }
        } catch {}

        this.stopAmbient();
        this.ambientUrl = url;

        try {
            const isOgg = url.endsWith('.ogg');
            const sources = isOgg ? [url, url.replace('.ogg', '.mp3')] : [url];

            this.ambient = new Howl({
                src: sources,
                loop: true,
                volume: this.ambientBusVolume * this.masterVolume * 0.6,
                html5: true,
                onloaderror: (_id, err) => console.warn(`❌ Ambient Load Error: ${url}`, err),
            });
            this.ambient.play();
        } catch (err) {
            console.warn(`❌ Failed to play Ambient: ${url}`, err);
            this.ambient = null;
        }
    }

    public stopAmbient() {
        if (this.ambient) {
            try {
                this.ambient.stop();
                this.ambient.unload();
            } catch (err) {}
            this.ambient = null;
            this.ambientUrl = null;
        }
    }

    // Сокращенные хелперы для совместимости с кодовой базой
    public playDeathSFX() {
        this.playSFXById('combat_death_fall');
    }

    public playCritSFX() {
        this.playSFXById('combat_hit_crit');
    }

    public playStrikeSFX(weaponArchetype: 'SWORD' | 'BOW' | 'STAFF' | 'DAGGER' | 'OTHER') {
        switch (weaponArchetype) {
            case 'SWORD':
                this.playSFXById('combat_hit_normal');
                break;
            case 'BOW':
                this.playSFXById('combat_dodge_swoosh'); // или специфический звук лука
                break;
            case 'STAFF':
                this.playSFXById('magic_heal');
                break;
            case 'DAGGER':
                this.playSFXById('combat_hit_normal');
                break;
            default:
                this.playSFXById('combat_hit_normal');
        }
    }

    public setMusicVolume(volume: number) {
        this.musicBusVolume = volume;
        if (this.music) {
            this.music.volume(this.musicVolumeTotal());
        }
        if (this.ambient) {
            this.ambient.volume(this.ambientBusVolume * this.masterVolume * 0.6);
        }
    }

    public setSFXVolume(volume: number) {
        this.combatBusVolume = volume;
        this.uiBusVolume = volume;
        this.lootBusVolume = volume;
        this.voiceBusVolume = volume;
        this.sfxCache.forEach((sound) => {
            try {
                sound.volume(volume * this.masterVolume);
            } catch (e) {}
        });
    }

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
        } catch (err) {}
    }

    public stopAllSFX() {
        this.activeInstances.forEach((inst) => {
            try {
                inst.howl.stop(inst.playId);
            } catch (e) {}
        });
        this.activeInstances = [];
    }

    // === ВНУТРЕННИЕ СИСТЕМНЫЕ МЕТОДЫ ===

    private musicVolumeTotal(): number {
        return this.musicBusVolume * this.masterVolume;
    }

    private getBusVolume(bus: AudioBusType): number {
        switch (bus) {
            case 'music':
                return this.musicBusVolume * this.masterVolume;
            case 'ambient':
                return this.ambientBusVolume * this.masterVolume;
            case 'ui':
                return this.uiBusVolume * this.masterVolume;
            case 'combat':
                return this.combatBusVolume * this.masterVolume;
            case 'loot':
                return this.lootBusVolume * this.masterVolume;
            case 'voice':
                return this.voiceBusVolume * this.masterVolume;
            default:
                return this.masterVolume;
        }
    }

    private cleanFinishedInstances() {
        this.activeInstances = this.activeInstances.filter((instance) => {
            try {
                return instance.howl.playing(instance.playId);
            } catch {
                return false;
            }
        });
    }

    /**
     * Sidechain / Ducking (приглушение музыки при касте ульт/критов)
     */
    private applyDucking() {
        if (!this.music) return;
        const targetVol = this.musicVolumeTotal() * 0.4;
        const originalVol = this.musicVolumeTotal();

        try {
            this.music.fade(originalVol, targetVol, 200);
            setTimeout(() => {
                if (this.music) {
                    this.music.fade(targetVol, originalVol, 800);
                }
            }, 1500);
        } catch (e) {}
    }
}

export const audioService = new AudioService();
export default audioService;
