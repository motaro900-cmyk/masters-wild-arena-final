import React from 'react';
import { StudioLayout } from './StudioLayout';
import { StudioTheme } from './StudioTheme';
import { cn } from '../../utils/cn';
import { 
    Save, CloudUpload, Play, Eye, RotateCcw, RotateCw, 
    Layers, Search, Package, ChevronDown, 
    Box, Activity, DollarSign, Globe, LogOut, Layout
} from 'lucide-react';

/**
 * STUDIO v2.0 ROOT
 * Assembles all specialized modules for Autobattler production.
 */
export const StudioRoot: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    return (
        <StudioLayout
            topBar={<TopBar onExit={onExit} />}
            hierarchy={<Hierarchy />}
            inspector={<Inspector />}
            assets={<AssetBrowser />}
            viewport={<Viewport />}
        />
    );
};

// ─── MODULES ─────────────────────────────────────────────────────────────────

const TopBar: React.FC<{ onExit: () => void }> = ({ onExit }) => (
    <div className="flex items-center justify-between w-full h-full">
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-black text-black">P</div>
            <div className="flex flex-col">
                <span className="text-[10px] text-stone-500 uppercase font-black leading-none">Crouching Panda</span>
                <span className="text-xs font-bold leading-tight">Lobby_Main_v1.2</span>
            </div>
        </div>

        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-md">
            <ToolBtn icon={<RotateCcw size={14} />} label="Undo" />
            <ToolBtn icon={<RotateCw size={14} />} label="Redo" />
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/5">
                <ToolBtn icon={<Save size={14} />} label="Save" />
                <ToolBtn icon={<CloudUpload size={14} className="text-blue-400" />} label="Publish" />
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <ToolBtn icon={<Eye size={16} />} label="Preview" />
            <button className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-black flex items-center gap-2 transition-colors">
                <Play size={14} fill="currentColor" />
                PLAYTEST
            </button>
            <div className="w-[1px] h-6 bg-white/10" />
            <button 
                onClick={onExit}
                className="text-stone-500 hover:text-red-400 p-1 transition-colors"
            >
                <LogOut size={18} />
            </button>
        </div>
    </div>
);

const Hierarchy: React.FC = () => (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="p-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Hierarchy</span>
            <div className="flex gap-2">
                <Search size={12} className="text-stone-600" />
                <Layers size={12} className="text-stone-600" />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
            <Folder name="Lobby Scene" open>
                <Item name="Background_Main" type="sprite" />
                <Item name="Character_Panda" type="unit" active />
                <Folder name="HUD_Layer">
                    <Item name="TopBar" type="ui" />
                    <Item name="RightPanel_Tasks" type="ui" />
                </Folder>
            </Folder>
            <Folder name="Battle Arena" />
            <Folder name="Popups" />
        </div>
    </div>
);

const Inspector: React.FC = () => (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="p-2 border-b border-white/5">
            <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Inspector</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-6">
            <Section icon={<Layout size={14} />} title="Transform">
                <PropRow label="Position" x={0} y={150} />
                <PropRow label="Scale" x={1.2} y={1.2} />
                <PropRow label="Anchor" value="Center" />
            </Section>

            <Section icon={<Activity size={14} />} title="Combat Stats">
                <PropRow label="Health" value={2500} />
                <PropRow label="Mana" value={100} />
                <PropRow label="Armor" value={45} />
            </Section>

            <Section icon={<DollarSign size={14} />} title="Economy & Rarity">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-stone-500">Rarity</span>
                    <span className="text-xs font-black text-purple-400 uppercase">EPIC</span>
                </div>
                <PropRow label="Shop Cost" value={4} />
                <PropRow label="Drop Weight" value={15} />
            </Section>

            <Section icon={<Globe size={14} />} title="Localization">
                <PropRow label="RU" value="Крадущаяся Панда" />
                <PropRow label="EN" value="Crouching Panda" />
            </Section>
        </div>
    </div>
);

const AssetBrowser: React.FC = () => (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="p-2 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-4">
                <Tab label="Characters" active />
                <Tab label="UI Elements" />
                <Tab label="VFX" />
                <Tab label="Audio" />
            </div>
            <div className="flex items-center gap-2 bg-stone-800 px-2 py-1 rounded">
                <Search size={12} className="text-stone-500" />
                <input className="bg-transparent border-none text-[10px] outline-none w-32" placeholder="Search assets..." />
            </div>
        </div>
        <div className="flex-1 overflow-x-auto p-4 flex gap-4 bg-[#0d0d0d]">
            <AssetCard name="Panda_Hero" type="Unit" />
            <AssetCard name="Moose_Elite" type="Unit" />
            <AssetCard name="Task_Parchment" type="UI" />
            <AssetCard name="Gold_Icon" type="Icon" />
            <AssetCard name="Fire_Explosion" type="VFX" />
            <AssetCard name="Stone_Wall" type="Env" />
        </div>
    </div>
);

const Viewport: React.FC = () => (
    <div className="w-full h-full relative flex items-center justify-center">
        {/* Grid Background */}
        <div 
            className="absolute inset-0"
            style={{ 
                backgroundImage: `radial-gradient(${StudioTheme.colors.border} 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }}
        />
        
        {/* Placeholder Scene Content */}
        <div className="text-stone-800 font-black text-8xl uppercase select-none opacity-20">VIEWPORT</div>
        
        {/* Safe Zones Overlay */}
        <div className="absolute inset-10 border border-blue-500/20 rounded-xl pointer-events-none">
            <div className="absolute top-2 left-2 text-[10px] text-blue-500/40 font-bold">DESKTOP SAFE ZONE (16:9)</div>
        </div>
    </div>
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const ToolBtn: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; className?: string }> = ({ icon, label, className }) => (
    <button title={label} className={cn("p-1.5 hover:bg-white/10 rounded transition-colors text-stone-400 hover:text-white", className)}>
        {icon}
    </button>
);

const Folder: React.FC<{ name: string; open?: boolean; children?: React.ReactNode }> = ({ name, open, children }) => (
    <div className="mb-1">
        <div className="flex items-center gap-1 py-1 px-1 hover:bg-white/5 rounded cursor-pointer transition-colors group">
            <ChevronDown size={14} className={cn("text-stone-600 group-hover:text-stone-400", !open && "-rotate-90")} />
            <Package size={14} className="text-blue-500" />
            <span className="text-[11px] font-bold text-stone-300">{name}</span>
        </div>
        {open && <div className="pl-4 mt-1 border-l border-white/5 ml-2">{children}</div>}
    </div>
);

const Item: React.FC<{ name: string; type: string; active?: boolean }> = ({ name, type, active }) => (
    <div className={cn(
        "flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-all mb-0.5",
        active ? "bg-blue-600 text-white" : "hover:bg-white/5 text-stone-400"
    )}>
        <Box size={12} />
        <span className="text-[11px] font-medium truncate">{name}</span>
    </div>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 border-b border-white/5 pb-1">
            <div className="text-amber-500">{icon}</div>
            <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">{title}</span>
        </div>
        <div className="flex flex-col gap-1.5 pl-1">{children}</div>
    </div>
);

const PropRow: React.FC<{ label: string; x?: any; y?: any; value?: any }> = ({ label, x, y, value }) => (
    <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-stone-500 w-20 truncate">{label}</span>
        {value !== undefined ? (
            <div className="flex-1 bg-stone-800 rounded px-2 py-0.5 text-[11px] font-mono text-stone-300 border border-white/5">
                {value}
            </div>
        ) : (
            <div className="flex gap-1 flex-1">
                <div className="flex-1 bg-stone-800 rounded px-1.5 py-0.5 text-[11px] font-mono text-stone-300 border border-white/5 flex gap-1">
                    <span className="text-stone-600">X</span> {x}
                </div>
                <div className="flex-1 bg-stone-800 rounded px-1.5 py-0.5 text-[11px] font-mono text-stone-300 border border-white/5 flex gap-1">
                    <span className="text-stone-600">Y</span> {y}
                </div>
            </div>
        )}
    </div>
);

const Tab: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
    <div className={cn(
        "text-[10px] font-black uppercase tracking-widest px-2 py-1 cursor-pointer transition-all border-b-2",
        active ? "text-amber-500 border-amber-500" : "text-stone-500 border-transparent hover:text-stone-300"
    )}>
        {label}
    </div>
);

const AssetCard: React.FC<{ name: string; type: string }> = ({ name, type }) => (
    <div className="w-24 h-32 bg-stone-900 border border-white/5 rounded-lg overflow-hidden flex flex-col shrink-0 hover:border-amber-500/50 transition-all group cursor-grab">
        <div className="flex-1 bg-stone-800 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package size={32} className="text-stone-700" />
        </div>
        <div className="p-1.5 bg-black/40">
            <div className="text-[9px] font-black text-stone-300 truncate">{name}</div>
            <div className="text-[8px] font-bold text-stone-600 uppercase">{type}</div>
        </div>
    </div>
);
