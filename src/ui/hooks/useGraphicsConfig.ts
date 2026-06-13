/**
 * useGraphicsConfig — centralized hook that returns visual style parameters
 * based on the current graphicsQuality setting (LOW / MEDIUM / ULTRA).
 *
 * LOW:    No blur, no glow, minimal shadows, solid dark backgrounds
 * MEDIUM: Light blur, subtle glow, moderate shadows, slight transparency
 * ULTRA:  Full blur, deep glow, rich shadows, glass-morphism transparency
 */
import { useGameStore } from '../../store/useGameStore';

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'ULTRA';

export interface GraphicsConfig {
    quality: GraphicsQuality;
    isLow: boolean;
    isMedium: boolean;
    isUltra: boolean;

    /** backdrop-filter: blur for glass panels */
    backdropBlur: string;

    /** Background for chat / HUD panels */
    panelBg: string;

    /** Box shadow for HUD panels */
    panelShadow: string;

    /** Border for HUD panels */
    panelBorder: string;

    /** CSS filter applied to decorative sprites (sidebar, buttons) */
    spriteFilter: string;

    /** Glow / text-shadow for icons and labels */
    iconGlow: string;

    /** Background overlay dimming for ULTRA (darkens edges for vignette) */
    vignetteOverlay: string;

    /** Whether animated particles / glow effects should show */
    showParticles: boolean;

    /** Opacity for decorative elements */
    decorOpacity: number;
}

export const useGraphicsConfig = (): GraphicsConfig => {
    const quality = (useGameStore((s) => s.graphicsQuality) || 'MEDIUM') as GraphicsQuality;

    switch (quality) {
        case 'LOW':
            return {
                quality,
                isLow: true,
                isMedium: false,
                isUltra: false,
                backdropBlur: 'none',
                panelBg: 'rgba(8, 6, 4, 0.92)',
                panelShadow: 'none',
                panelBorder: '1px solid rgba(240,192,64,0.15)',
                spriteFilter: 'none',
                iconGlow: 'none',
                vignetteOverlay: 'none',
                showParticles: false,
                decorOpacity: 0.6,
            };

        case 'MEDIUM':
            return {
                quality,
                isLow: false,
                isMedium: true,
                isUltra: false,
                backdropBlur: 'blur(8px)',
                panelBg: 'rgba(12, 9, 6, 0.82)',
                panelShadow: '0 8px 30px rgba(0,0,0,0.55)',
                panelBorder: '1px solid rgba(240,192,64,0.22)',
                spriteFilter: 'contrast(1.05) saturate(1.1) brightness(1.0)',
                iconGlow: 'drop-shadow(0 0 4px rgba(240,192,64,0.3))',
                vignetteOverlay: 'none',
                showParticles: true,
                decorOpacity: 0.85,
            };

        case 'ULTRA':
        default:
            return {
                quality,
                isLow: false,
                isMedium: false,
                isUltra: true,
                backdropBlur: 'blur(20px)',
                panelBg: 'rgba(6, 4, 2, 0.65)',
                panelShadow:
                    '0 15px 50px rgba(0,0,0,0.8), 0 0 30px rgba(240,192,64,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                panelBorder: '1px solid rgba(240,192,64,0.35)',
                spriteFilter: 'contrast(1.1) saturate(1.2) brightness(1.05)',
                iconGlow: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                vignetteOverlay:
                    'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
                showParticles: true,
                decorOpacity: 1.0,
            };
    }
};
