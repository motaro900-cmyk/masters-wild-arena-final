
import { AssetsMap } from '../../../../../configs/AssetsMap';
import { TabButton } from './shared/TabButton';
import { SceneTab } from '../types';

interface HeroSceneHeaderProps {
    activeTab: SceneTab;
    setActiveTab: (tab: SceneTab) => void;
    onExit: () => void;
}

export const HeroSceneHeader: React.FC<HeroSceneHeaderProps> = ({ activeTab, setActiveTab, onExit }) => {
    return (
        <div style={{
            width: '100%', height: '120px', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
            display: 'flex', alignItems: 'center', padding: '0 80px', gap: '40px', zIndex: 100
        }}>
            <TabButton active={activeTab === 'LIST'} onClick={() => setActiveTab('LIST')} label="ВСЕ ГЕРОИ" icon="👥" />
            <TabButton active={activeTab === 'HERO'} onClick={() => setActiveTab('HERO')} label="СНАРЯЖЕНИЕ" icon="⚔️" />
            <TabButton active={activeTab === 'TALENTS'} onClick={() => setActiveTab('TALENTS')} label="ТАЛАНТЫ" icon="🌟" />

            <div style={{ flex: 1 }} />

            <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={AssetsMap.UI.ICON_EXIT} style={{ width: '45px' }} alt="" />
                <span style={{ color: '#c8a870', fontSize: '20px', fontWeight: 900, fontFamily: "'Cinzel', serif" }}>ВЫХОД</span>
            </button>
        </div>
    );
};
