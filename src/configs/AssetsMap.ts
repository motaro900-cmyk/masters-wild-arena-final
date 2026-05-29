/**
 * AssetsMap — Центральный реестр всех путей к ассетам игры.
 * Предотвращает ошибки опечаток и упрощает рефакторинг путей.
 */
import { resolveAssetPath } from '../utils/assetPath';

const rawAssetsMap = {
    UI: {
        SIDEBAR_LEFT: '/assets/images/ui/sidebar_left1_full_v2.webp',
        PANEL_PARCHMENT: '/assets/images/ui/btn_panel_mis12c.webp',
        PANEL_TASK: '/assets/images/ui/panel_task.webp',
        PANEL_PROFILE: '/assets/images/ui/panel_profile.png',
        PROFILE_PANEL_BASE: '/assets/images/ui/profilepanel.webp', // was .png
        AVATAR_FRAME_NEW: '/assets/images/ui/avatar_frame.png',
        VIP_PLAQUE: '/assets/images/ui/vip.webp', // was .png
        LVL_BADGE: '/assets/images/ui/lvl.webp', // was .png
        EXP_BAR_BG: '/assets/images/ui/exp.png',
        ICON_SETTINGS_PROFILE: '/assets/images/ui/settingprofile.webp', // was .png
        ICON_CROWN: '/assets/images/ui/ICON_CROWN.webp', // was .png
        HUB_BASE: '/assets/images/ui/hub_panel_base.png',
        HUB_FRAME: '/assets/images/ui/hub_avatar_frame.png',
        HUB_XP_EMPTY: '/assets/images/ui/hub_xp_bar_empty.png',
        HUB_XP_FILL: '/assets/images/ui/hub_xp_fill.png',
        HUB_VIP_BADGE: '/assets/images/ui/hub_vip_badge.png',
        HUB_ICON_EDIT: '/assets/images/ui/hub_icon_edit.png',
        PANEL_CHAT: '/assets/images/ui/chat_panel_full.webp',
        PANEL_CHAT_CLEAN: '/assets/images/ui/chat_panel_clean.png',
        PANEL_QUEST: '/assets/images/ui/Zadanie.webp',
        PROFILE_PLAQUE: '/assets/images/ui/profile_plaque.webp',

        // Кнопки
        BTN_BATTLE_RANKED: '/assets/images/ui/btn_ranked_v2.webp',
        BTN_BATTLE_RANKED_HOVER: '/assets/images/ui/btn_ranked_v21.webp',
        BTN_BATTLE_NORMAL: '/assets/images/ui/btn_normal.webp',
        BTN_TRAINING: '/assets/images/ui/btn_training.webp',

        // Ресурсы (Бары)
        BAR_GOLD: '/assets/images/ui/bar_gold.webp',
        BAR_GEM: '/assets/images/ui/bar_gem.webp',
        BAR_ENERGY: '/assets/images/ui/bar_energy.webp',

        // Иконки ресурсов
        ICON_GOLD_FULL: '/assets/images/ui/icons/Gold.webp',
        ICON_ALMAZ_FULL: '/assets/images/ui/icons/almaz.webp',
        ICON_ENERGY_FULL: '/assets/images/ui/icons/energy.webp',

        // Иконки сундуков / наград
        ICON_DAILY_CHEST: '/assets/images/ui/gift_premium.webp', // was daily_gift_v2.webp
        ICON_SEASON_CHEST: '/assets/images/ui/icons/season_chest.webp', // was .png
        ICON_SEASON_RATE: '/assets/images/ui/Seasonrate.png',
        ICON_PROMO: '/assets/images/ui/icons/promo_coin.webp',
        ICON_XP: '/assets/images/ui/exp_icon.png',
        TROPHY_PREMIUM: '/assets/images/ui/trophy_premium.webp', // was .png
        BTN_BATTLE_GROUP: '/assets/images/ui/battle_btn_group.webp',

        // Иконки HUD
        ICON_FRIENDS: '/assets/images/ui/friends_icon.webp',
        ICON_MAIL: '/assets/images/ui/mail_icon.webp',
        ICON_SETTINGS: '/assets/images/ui/settings_icon.webp',
        ICON_GIFT: '/assets/images/ui/daily_gift_v2.webp',
        ICON_BEAST_PASS: '/assets/images/ui/battle_pass_full.webp',

        // Магазин / Звери
        SHOP_ITEM_BG: '/assets/images/ui/btn_panel_mis12c.webp',
        SHOP_TITLE_BG: '/assets/images/ui/btn_panel_mis12c.webp',
        BEAST_CARD_BG: '/assets/images/ui/btn_panel_mis12c.webp',

        // Новые иконки вкладок
        TAB_ARSENAL: '/assets/images/ui/tab_arsenal.webp',
        TAB_ALCHEMY: '/assets/images/ui/tab_alchemy.webp',
        TAB_BANK: '/assets/images/ui/tab_bank.webp',
        TAB_SKINS: '/assets/images/ui/tab_skins.webp',
        ICON_EXIT: '/assets/images/ui/Exit.webp',

        // Иконки Банка (Золото)
        BANK_GOLD_SMALL: '/assets/images/shop/bank_gold_small.webp',
        BANK_GOLD_MEDIUM: '/assets/images/shop/bank_gold_medium.webp',
        BANK_GOLD_LARGE: '/assets/images/shop/bank_gold_large.webp',

        // Иконки Банка (Энергия)
        BANK_ENERGY_SMALL: '/assets/images/shop/bank_energy_1.webp',
        BANK_ENERGY_MEDIUM: '/assets/images/shop/bank_energy_2.webp',
        BANK_ENERGY_LARGE: '/assets/images/shop/bank_energy_3.webp',
        SLOT_BG: '/assets/images/ui/slot_bg.webp',
        EQUIPMENT_PANEL: '/assets/images/ui/equipment_panel.webp',
        HERO_PEDESTAL: '/assets/images/ui/hero_pedestal.webp',

        // Blueprint icons (moved to /assets/images/ui/blueprints/)
        BLUEPRINT_HELMET: '/assets/images/ui/blueprints/blueprint_helmet.webp',
        BLUEPRINT_ARMOR: '/assets/images/ui/blueprints/blueprint_armor.webp',
        BLUEPRINT_WEAPON: '/assets/images/ui/blueprints/blueprint_weapon.webp',
        BLUEPRINT_SHIELD: '/assets/images/ui/blueprints/blueprint_shield.webp',
        BLUEPRINT_SHOULDERS: '/assets/images/ui/blueprints/blueprint_shoulders.png',
        BLUEPRINT_PANTS: '/assets/images/ui/blueprints/blueprint_pants.png',
        BLUEPRINT_BOOTS: '/assets/images/ui/blueprints/blueprint_boots.png',
    },
    BACKGROUNDS: {
        MAIN_MENU: '/assets/images/backgrounds/bg_main.webp',
        MAIN_MENU_MOBILE: '/assets/images/backgrounds/bg_main_mobile.webp',
        FORGE: '/assets/images/backgrounds/bg_forge.webp',
        FORGE_MOBILE: '/assets/images/backgrounds/bg_forge_mobile.webp',
        BATTLE_ARENA: '/assets/images/backgrounds/battle/bg_1.webp',
        BATTLE_ARENAS: [
            '/assets/images/backgrounds/battle/bg_1.webp',
            '/assets/images/backgrounds/battle/bg_2.webp',
            '/assets/images/backgrounds/battle/bg_3.webp',
            '/assets/images/backgrounds/battle/bg_4.webp',
            '/assets/images/backgrounds/battle/bg_5.webp',
            '/assets/images/backgrounds/battle/bg_6.webp',
        ],
        BATTLE_ARENAS_MOBILE: [
            '/assets/images/backgrounds/battle/bg_1_mobile.webp',
            '/assets/images/backgrounds/battle/bg_2_mobile.webp',
            '/assets/images/backgrounds/battle/bg_3_mobile.webp',
            '/assets/images/backgrounds/battle/bg_4_mobile.webp',
            '/assets/images/backgrounds/battle/bg_5_mobile.webp',
            '/assets/images/backgrounds/battle/bg_6_mobile.webp',
        ],
        SHOP: '/assets/images/ui/Shop.webp',
        HEROES_HALL: '/assets/images/backgrounds/bg_heroes_hall.webp', // was кириллица
        HEROES_HALL_MOBILE: '/assets/images/backgrounds/bg_heroes_hall_mobile.webp', // was кириллица
        SHOP_NAV_BG: '/assets/images/ui/Shoping.webp',
        SHOP_GRID_FRAME: '/assets/images/ui/btn_panel_mis12c.webp', // was ChatGPT-мусор
        SHOP_ITEM_FRAME: '/assets/images/ui/Shop phone.webp',
        SHOP_BANNER_RED: '/assets/images/ui/icons/banner_red_tab.webp',
        SHOP_BANNER_BLACK: '/assets/images/ui/icons/promo_coin.webp', // was ChatGPT Imaport.webp
        SHOP_DIVIDER: '/assets/images/ui/power_icon.webp',
        BATTLE_PASS: '/assets/images/backgrounds/bg_battle_pass.webp', // was кириллица
        BATTLE_PASS_MOBILE: '/assets/images/backgrounds/bg_battle_pass_mobile.webp', // was кириллица
        CITY_HUB: '/assets/images/backgrounds/bg_city_hub.webp',
        CITY_HUB_MOBILE: '/assets/images/backgrounds/bg_city_hub_mobile.webp',
        RANKED_LOBBY: '/assets/images/backgrounds/bg_ranked_lobby.webp',
        RANKED_LOBBY_MOBILE: '/assets/images/backgrounds/bg_ranked_lobby_mobile.webp',
        SANCTUARY: '/assets/images/backgrounds/gemini-2026-05-22-001.webp',
        SANCTUARY_MOBILE: '/assets/images/backgrounds/gemini-2026-05-22-001_mobile.webp',
    },
    CHARACTERS: {
        PANDA_AVATAR: '/assets/images/avatars/panda.webp', // was кириллица
        PANDA_FULL: '/assets/images/avatars/panda.webp', // was кириллица
        PANDA_ATLAS: '/assets/characters/panda/panda_poses.png.png',
        SKINS: {
            DEFAULT: '/assets/characters/panda/panda_poses.png.png',
            FROST: '/assets/characters/panda/frost_panda_atlas.png',
        },
    },
    ITEMS: {
        MOON_SWORD: '/assets/images/items/weapons/moon_sword.webp',
        MOON_SWORD_PREMIUM: '/assets/images/items/weapons/moon_sword.webp',
        AXE: '/assets/images/items/weapons/axe.webp',
        VOID_STAFF: '/assets/images/items/weapons/void_staff.webp',
        BONE_ARMOR: '/assets/images/items/armor/armor_bone.webp',
        LION_ARMOR: '/assets/images/items/armor/armor_lion.webp',
        PHOENIX_ARMOR: '/assets/images/items/armor/armor_phoenix.webp',
    },
    AUDIO: {
        MUSIC_MAIN: '/assets/audio/music/Dawn_of_the_Siege.mp3',
        MUSIC_LIST: [
            '/assets/audio/music/A_Long_Road_Alone.mp3',
            '/assets/audio/music/Dawn_of_the_Siege.mp3',
            '/assets/audio/music/Scrolls_of_the_Mountain_Pass.mp3',
            '/assets/audio/music/Silent_Plains_of_Honor.mp3',
            '/assets/audio/music/Snow_on_the_Cedar_Path.mp3',
            '/assets/audio/music/The_Ironwood_Threshold.mp3',
            '/assets/audio/music/Where_the_Canopy_Weeps.mp3',
            '/assets/audio/music/Where_the_Steel_Rests.mp3',
        ],
        SFX_CLICK: '/assets/audio/sfx/click.mp3',
        SFX_BUY: '/assets/audio/sfx/buy_success.mp3',
        SFX_ERROR: '/assets/audio/sfx/click.mp3',
        SFX_LEVEL_UP: '/assets/audio/sfx/click.mp3',
        SFX_EQUIP: '/assets/audio/sfx/click.mp3',
        SFX_ATTACK: '/assets/audio/sfx/click.mp3',
        SFX_HIT: '/assets/audio/sfx/impact_hit.mp3',
    },
    SHEETS: {
        BOOTS: '/assets/images/sheets/boots_sprite.webp',
        PANTS: '/assets/images/sheets/pants_sprite.webp',
        WEAPONS: '/assets/images/sheets/weapons_sprite.webp',
    },
};

const resolvePaths = (value: unknown): unknown => {
    if (typeof value === 'string') {
        return value.startsWith('/assets/') ? resolveAssetPath(value) : value;
    }
    if (Array.isArray(value)) {
        return value.map(resolvePaths);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, resolvePaths(val)]),
        );
    }
    return value;
};

export const AssetsMap = resolvePaths(rawAssetsMap) as typeof rawAssetsMap;
