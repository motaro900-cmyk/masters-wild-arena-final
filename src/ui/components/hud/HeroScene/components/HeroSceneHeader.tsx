import { TabButton } from './shared/TabButton';
import { SceneTab } from '../types';

interface HeroSceneHeaderProps {
    activeTab: SceneTab;
    setActiveTab: (tab: SceneTab) => void;
}

export const HeroSceneHeader: React.FC<HeroSceneHeaderProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div
            style={{
                width: '100%',
                height: '120px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 80px',
                gap: '40px',
                zIndex: 100,
                position: 'relative',
            }}
        >
            <TabButton active={activeTab === 'LIST'} onClick={() => setActiveTab('LIST')} label="ВСЕ ГЕРОИ" icon="👥" />
            <TabButton
                active={activeTab === 'HERO'}
                onClick={() => setActiveTab('HERO')}
                label="СНАРЯЖЕНИЕ"
                icon="⚔️"
            />
            <TabButton
                active={activeTab === 'TALENTS'}
                onClick={() => setActiveTab('TALENTS')}
                label="ТАЛАНТЫ"
                icon="🌟"
            />

            <div style={{ flex: 1 }} />
        </div>
    );
};
