/**
 * AudioDatabase - Декларативная база данных звуков для игры.
 * Задает структуру, шины громкости, приоритеты, вариации и параметры воспроизведения.
 */

export type AudioBusType = 'master' | 'music' | 'ambient' | 'ui' | 'combat' | 'voice' | 'loot';

export interface SoundConfig {
    id: string;
    variants: string[];       // Пути к файлам (желательно .ogg, Howler сам подставит .mp3 как резерв)
    volume: number;           // Базовая громкость (0.0 - 1.0)
    bus: AudioBusType;        // К какой аудиошине относится
    priority: number;         // Приоритет (10 - эмбиент, 40 - UI, 80 - реплика, 90 - крит, 95 - легендарка, 100 - босс)
    cooldown?: number;        // Минимальный интервал между воспроизведениями (мс)
    pitchRange?: [number, number]; // Диапазон Pitch Randomization [min, max]
}

export const AUDIO_BUS_VOLUMES: Record<AudioBusType, number> = {
    master: 1.0,
    music: 0.6,
    ambient: 0.5,
    ui: 0.8,
    combat: 0.9,
    voice: 0.95,
    loot: 1.0
};

export const AUDIO_DATABASE: Record<string, SoundConfig> = {
    // === ИНТЕРФЕЙС (UI) ===
    ui_click: {
        id: 'ui_click',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_click_normal_01.ogg',
            '/assets/audio/sfx/click.mp3' // Резервный дефолтный звук, который есть в билде
        ],
        volume: 0.8,
        bus: 'ui',
        priority: 40,
        cooldown: 80,
        pitchRange: [0.95, 1.05]
    },
    ui_click_wooden: {
        id: 'ui_click_wooden',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_click_wooden_01.ogg',
            '/assets/audio/sfx/click.mp3'
        ],
        volume: 0.85,
        bus: 'ui',
        priority: 40,
        cooldown: 80,
        pitchRange: [0.93, 1.07]
    },
    ui_confirm: {
        id: 'ui_confirm',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_confirm_01.ogg',
            '/assets/audio/sfx/click.mp3'
        ],
        volume: 0.8,
        bus: 'ui',
        priority: 40,
        cooldown: 150,
        pitchRange: [0.97, 1.03]
    },
    ui_cancel: {
        id: 'ui_cancel',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_cancel_01.ogg',
            '/assets/audio/sfx/click.mp3'
        ],
        volume: 0.75,
        bus: 'ui',
        priority: 40,
        cooldown: 150,
        pitchRange: [0.95, 1.05]
    },
    ui_hover: {
        id: 'ui_hover',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_hover_01.ogg',
            '/assets/audio/sfx/click.mp3'
        ],
        volume: 0.5,
        bus: 'ui',
        priority: 10,
        cooldown: 50,
        pitchRange: [0.98, 1.02]
    },
    ui_buy_success: {
        id: 'ui_buy_success',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_buy_coins.ogg',
            '/assets/audio/sfx/buy_success.mp3'
        ],
        volume: 0.9,
        bus: 'ui',
        priority: 80,
        cooldown: 200,
        pitchRange: [0.96, 1.04]
    },
    ui_error_deny: {
        id: 'ui_error_deny',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_error_deny.ogg',
            '/assets/audio/sfx/click.mp3'
        ],
        volume: 0.75,
        bus: 'ui',
        priority: 40,
        cooldown: 200,
        pitchRange: [0.9, 1.0]
    },
    ui_level_up: {
        id: 'ui_level_up',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_level_up.ogg',
            '/assets/audio/sfx/click.mp3'
        ],
        volume: 0.95,
        bus: 'ui',
        priority: 90,
        cooldown: 1000,
        pitchRange: [0.98, 1.02]
    },
    ui_quest_complete: {
        id: 'ui_quest_complete',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_quest_complete.ogg',
            '/assets/audio/sfx/buy_success.mp3'
        ],
        volume: 0.9,
        bus: 'ui',
        priority: 85,
        cooldown: 500
    },
    ui_forge_hammer: {
        id: 'ui_forge_hammer',
        variants: [
            '/assets/audio/sfx/ui/sfx_ui_forge_hammer.ogg',
            '/assets/audio/sfx/impact_hit.mp3'
        ],
        volume: 0.85,
        bus: 'ui',
        priority: 80,
        cooldown: 200,
        pitchRange: [0.92, 1.08]
    },

    // === БОЙ (COMBAT) ===
    combat_hit_normal: {
        id: 'combat_hit_normal',
        variants: [
            '/assets/audio/sfx/combat/hits/sfx_hit_sword_flesh_01.ogg',
            '/assets/audio/sfx/impact_hit.mp3'
        ],
        volume: 0.9,
        bus: 'combat',
        priority: 80,
        cooldown: 100,
        pitchRange: [0.92, 1.08]
    },
    combat_hit_crit: {
        id: 'combat_hit_crit',
        variants: [
            '/assets/audio/sfx/combat/hits/sfx_hit_crit_01.ogg',
            '/assets/audio/sfx/impact_crit.mp3'
        ],
        volume: 0.95,
        bus: 'combat',
        priority: 90,
        cooldown: 150,
        pitchRange: [0.95, 1.05]
    },
    combat_block_shield: {
        id: 'combat_block_shield',
        variants: [
            '/assets/audio/sfx/combat/actions/sfx_block_shield.ogg',
            '/assets/audio/sfx/block.mp3'
        ],
        volume: 0.9,
        bus: 'combat',
        priority: 80,
        cooldown: 100,
        pitchRange: [0.94, 1.06]
    },
    combat_dodge_swoosh: {
        id: 'combat_dodge_swoosh',
        variants: [
            '/assets/audio/sfx/combat/actions/sfx_dodge_swoosh.ogg',
            '/assets/audio/sfx/miss.mp3'
        ],
        volume: 0.85,
        bus: 'combat',
        priority: 80,
        cooldown: 100,
        pitchRange: [0.95, 1.05]
    },
    combat_death_fall: {
        id: 'combat_death_fall',
        variants: [
            '/assets/audio/sfx/combat/actions/sfx_death_fall.ogg',
            '/assets/audio/sfx/impact_crit.mp3'
        ],
        volume: 0.9,
        bus: 'combat',
        priority: 90,
        cooldown: 1000
    },

    // === МАГИЯ (MAGIC) ===
    magic_heal: {
        id: 'magic_heal',
        variants: [
            '/assets/audio/sfx/combat/magic/sfx_spell_heal.ogg',
            '/assets/audio/sfx/strike_staff.mp3'
        ],
        volume: 0.85,
        bus: 'combat',
        priority: 80,
        cooldown: 200,
        pitchRange: [0.96, 1.04]
    },
    magic_buff_up: {
        id: 'magic_buff_up',
        variants: [
            '/assets/audio/sfx/combat/magic/sfx_spell_buff_up.ogg',
            '/assets/audio/sfx/strike_staff.mp3'
        ],
        volume: 0.85,
        bus: 'combat',
        priority: 80,
        cooldown: 200,
        pitchRange: [0.95, 1.05]
    },

    // === ЛУТ (LOOT) ===
    loot_gold_drop: {
        id: 'loot_gold_drop',
        variants: [
            '/assets/audio/sfx/loot/sfx_loot_gold_drop_01.ogg',
            '/assets/audio/sfx/buy_success.mp3'
        ],
        volume: 0.9,
        bus: 'loot',
        priority: 80,
        cooldown: 50,
        pitchRange: [0.95, 1.05]
    },
    loot_item_epic: {
        id: 'loot_item_epic',
        variants: [
            '/assets/audio/sfx/loot/sfx_loot_item_epic.ogg',
            '/assets/audio/sfx/buy_success.mp3'
        ],
        volume: 0.95,
        bus: 'loot',
        priority: 90,
        cooldown: 500
    },
    loot_item_mythic: {
        id: 'loot_item_mythic',
        variants: [
            '/assets/audio/sfx/loot/sfx_loot_item_mythic.ogg',
            '/assets/audio/sfx/buy_success.mp3'
        ],
        volume: 1.0,
        bus: 'loot',
        priority: 95,
        cooldown: 1000
    },

    // === ОКРУЖЕНИЕ (AMBIENT) ===
    amb_village: {
        id: 'amb_village',
        variants: [
            '/assets/audio/ambient/amb_village_loop.ogg',
            '/assets/audio/music/Where_the_Steel_Rests.mp3' // Резервный длинный файл
        ],
        volume: 0.5,
        bus: 'ambient',
        priority: 10
    }
};
export default AUDIO_DATABASE;
