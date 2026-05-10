/**
 * AssetsMap — Центральный реестр всех путей к ассетам игры.
 * Предотвращает ошибки опечаток и упрощает рефакторинг путей.
 */
import { resolveAssetPath } from '../utils/assetPath';

const rawAssetsMap = {
    UI: {
        SIDEBAR_LEFT: '/assets/images/ui/sidebar_left1_full_v2.png',
        PANEL_PARCHMENT: '/assets/images/ui/btn_panel_mis12c.png',
        PANEL_TASK: '/assets/images/ui/panel_task.png',
        PANEL_PROFILE: '/assets/images/ui/profile_panel_full.png',
        PANEL_CHAT: '/assets/images/ui/chat_panel_full.png',
        PANEL_QUEST: '/assets/images/ui/Zadanie.png',

        // Кнопки
        BTN_BATTLE_RANKED: '/assets/images/ui/btn_ranked_v2.png',
        BTN_BATTLE_RANKED_HOVER: '/assets/images/ui/btn_ranked_v21.png',
        BTN_BATTLE_NORMAL: '/assets/images/ui/btn_normal.png',
        BTN_TRAINING: '/assets/images/ui/btn_training.png',

        // Ресурсы (Бары)
        BAR_GOLD: '/assets/images/ui/bar_gold.png',
        BAR_GEM: '/assets/images/ui/bar_gem.png',
        BAR_ENERGY: '/assets/images/ui/bar_energy.png',

        // Иконки ресурсов
        ICON_GOLD_FULL: '/assets/images/ui/icons/Gold.png',
        ICON_ALMAZ_FULL: '/assets/images/ui/icons/almaz.png',
        ICON_ENERGY_FULL: '/assets/images/ui/icons/energy.png',

        // Сундук подарка (Новый!)
        ICON_DAILY_CHEST: '/assets/images/ui/iconrgy.png',

        // Иконки HUD
        ICON_FRIENDS: '/assets/images/ui/friends_icon.png',
        ICON_MAIL: '/assets/images/ui/mail_icon.png',
        ICON_SETTINGS: '/assets/images/ui/settings_icon.png',
        ICON_GIFT: '/assets/images/ui/daily_gift_v2.png',
        ICON_BEAST_PASS: '/assets/images/ui/battle_pass_full.png',
        BTN_BATTLE_GROUP: '/assets/images/ui/battle_btn_group.png',

        // Магазин / Звери
        SHOP_ITEM_BG: '/assets/images/ui/btn_panel_mis12c.png',
        SHOP_TITLE_BG: '/assets/images/ui/btn_panel_mis12c.png',
        BEAST_CARD_BG: '/assets/images/ui/btn_panel_mis12c.png',
        
        // Новые иконки вкладок
        TAB_ARSENAL: '/assets/images/ui/tab_arsenal.png',
        TAB_ALCHEMY: '/assets/images/ui/tab_alchemy.png',
        TAB_BANK: '/assets/images/ui/tab_bank.png',
        TAB_SKINS: '/assets/images/ui/tab_skins.png',
        ICON_EXIT: '/assets/images/ui/Exit.png',
        
        // Иконки Банка (Золото)
        BANK_GOLD_SMALL: '/assets/images/shop/bank_gold_small.png',
        BANK_GOLD_MEDIUM: '/assets/images/shop/bank_gold_medium.png',
        BANK_GOLD_LARGE: '/assets/images/shop/bank_gold_large.png',

        // Иконки Банка (Энергия)
        BANK_ENERGY_SMALL: '/assets/images/shop/bank_energy_1.png',
        BANK_ENERGY_MEDIUM: '/assets/images/shop/bank_energy_2.png',
        BANK_ENERGY_LARGE: '/assets/images/shop/bank_energy_3.png',
        SLOT_BG: '/assets/images/ui/slot_bg.png',
        EQUIPMENT_PANEL: '/assets/images/ui/equipment_panel.png',
        HERO_PEDESTAL: '/assets/images/ui/hero_pedestal.png',
    },
    BACKGROUNDS: {
        MAIN_MENU: '/assets/images/backgrounds/bg_main.png',
        BATTLE_ARENA: '/assets/images/backgrounds/battle/bg_1.png',
        SHOP: '/assets/images/ui/Shop.png',
        HEROES_HALL: '/assets/images/backgrounds/зал героев.png',
        SHOP_NAV_BG: '/assets/images/ui/Shoping.png',
        SHOP_GRID_FRAME: '/assets/images/ui/ChatGPT Image 5  4otoom-port.png',
        SHOP_ITEM_FRAME: '/assets/images/ui/Shop phone.png',
        SHOP_BANNER_RED: '/assets/images/ui/icons/banner_red_tab.png',
        SHOP_BANNER_BLACK: '/assets/images/ui/icons/ChatGPT Imaport.png',
        SHOP_DIVIDER: '/assets/images/ui/ChatGPT Image 5  213_457-Photoroom-export.png',
        BATTLE_PASS: '/assets/images/backgrounds/боевойпропуска.png',
    },
    CHARACTERS: {
        PANDA_AVATAR: '/assets/images/avatars/панда.png',
        PANDA_FULL: '/assets/images/avatars/панда.png',
        PANDA_ATLAS: '/assets/characters/panda/pandapanda_atlas.png',
        SKINS: {
            DEFAULT: '/assets/characters/panda/pandapanda_atlas.png',
            FROST: '/assets/characters/panda/frost_panda_atlas.png'
        }
    },
    ITEMS: {
        MOON_SWORD: '/assets/images/items/moon_sword.png',
        MOON_SWORD_PREMIUM: '/assets/images/items/weapon_moon_sword.png',
        AXE: '/assets/images/items/axe.png',
        VOID_STAFF: '/assets/images/items/void_staff.png',
        BONE_ARMOR: '/assets/images/items/armor_bone.png',
        LION_ARMOR: '/assets/images/items/armor_lion.png',
        PHOENIX_ARMOR: '/assets/images/items/armor_phoenix.png'
    },
    AUDIO: {
        MUSIC_MAIN: '/assets/audio/music/Dawn_of_the_Siege.mp3',
        SFX_CLICK: '/assets/audio/sfx/click.mp3',
        SFX_BUY: '/assets/audio/sfx/buy_success.mp3',
        SFX_ERROR: '/assets/audio/sfx/error.mp3',
        SFX_LEVEL_UP: '/assets/audio/sfx/level_up.mp3',
        SFX_EQUIP: '/assets/audio/sfx/equip_item.mp3',
        SFX_ATTACK: '/assets/audio/sfx/attack_swing.mp3',
        SFX_HIT: '/assets/audio/sfx/impact_hit.mp3'
    }
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
            Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, resolvePaths(val)])
        );
    }
    return value;
};

export const AssetsMap = resolvePaths(rawAssetsMap) as typeof rawAssetsMap;
