/**
 * STUDIO THEME CONFIGURATION
 * 70% Figma | 20% Unreal | 10% Blender
 */
export const StudioTheme = {
    colors: {
        // Base Graphite
        bg_primary: '#0e0e0e', // Deepest background (Canvas)
        bg_secondary: '#181818', // Sidebars, panels
        bg_tertiary: '#242424', // Headers, button background

        // Borders & Lines
        border: '#2a2a2a',
        border_light: '#3a3a3a',

        // Accents
        accent: '#007aff', // Cyber Blue (Selection, Active)
        accent_gold: '#d4af37', // Fantasy Gold (Prefabs, Rarity)
        accent_success: '#28c76f',
        accent_error: '#ea5455',

        // Text
        text_primary: '#e0e0e0',
        text_secondary: '#a0a0a0',
        text_muted: '#606060',
        text_gold: '#ffcf40',
    },

    spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
    },

    font: {
        ui: "'Inter', 'Segoe UI', Roboto, sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', monospace",
    },

    shadows: {
        sm: '0 2px 4px rgba(0,0,0,0.5)',
        lg: '0 10px 30px rgba(0,0,0,0.8)',
    },
};

export type IStudioTheme = typeof StudioTheme;
