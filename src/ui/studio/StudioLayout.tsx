import React from 'react';
import { StudioTheme } from './StudioTheme';


/**
 * STUDIO LAYOUT SHELL
 * Grid-based layout for the professional game editor.
 */
export const StudioLayout: React.FC<{
    topBar?: React.ReactNode;
    hierarchy?: React.ReactNode;
    viewport?: React.ReactNode;
    inspector?: React.ReactNode;
    assets?: React.ReactNode;
}> = ({ topBar, hierarchy, viewport, inspector, assets }) => {
    return (
        <div 
            className="fixed inset-0 w-full h-full flex flex-col overflow-hidden select-none pointer-events-auto"
            style={{ 
                backgroundColor: StudioTheme.colors.bg_primary,
                fontFamily: StudioTheme.font.ui,
                color: StudioTheme.colors.text_primary,
                zIndex: 100000 
            }}
        >
            {/* ── TOP BAR (Figma Style) ───────────────────────────────────── */}
            <div 
                className="h-12 w-full flex items-center px-4 border-b shrink-0"
                style={{ 
                    backgroundColor: StudioTheme.colors.bg_secondary,
                    borderColor: StudioTheme.colors.border 
                }}
            >
                {topBar}
            </div>

            {/* ── MIDDLE AREA (Hierarchy | Viewport | Inspector) ───────────── */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                
                {/* LEFT: HIERARCHY */}
                <div 
                    className="w-64 border-r flex flex-col shrink-0"
                    style={{ 
                        backgroundColor: StudioTheme.colors.bg_secondary,
                        borderColor: StudioTheme.colors.border 
                    }}
                >
                    {hierarchy}
                </div>

                {/* CENTER: VIEWPORT */}
                <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                    {viewport}
                </div>

                {/* RIGHT: INSPECTOR */}
                <div 
                    className="w-72 border-l flex flex-col shrink-0"
                    style={{ 
                        backgroundColor: StudioTheme.colors.bg_secondary,
                        borderColor: StudioTheme.colors.border 
                    }}
                >
                    {inspector}
                </div>
            </div>

            {/* ── BOTTOM AREA (Asset Browser) ─────────────────────────────── */}
            <div 
                className="h-64 w-full border-t flex flex-col shrink-0"
                style={{ 
                    backgroundColor: StudioTheme.colors.bg_secondary,
                    borderColor: StudioTheme.colors.border 
                }}
            >
                {assets}
            </div>
        </div>
    );
};
