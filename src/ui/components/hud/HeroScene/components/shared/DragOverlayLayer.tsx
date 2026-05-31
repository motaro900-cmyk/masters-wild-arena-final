import { DragOverlay } from '@dnd-kit/core';

interface DragOverlayLayerProps {
    activeId: string | null;
    activeItemData: any;
}

export const DragOverlayLayer: React.FC<DragOverlayLayerProps> = ({ activeId, activeItemData }) => {
    const container = typeof document !== 'undefined' ? document.getElementById('hero-scene-root') : null;

    return (
        <DragOverlay dropAnimation={null} portalContainer={container || undefined}>
            {activeId && activeItemData ? (
                <div
                    style={{
                        width: '90px',
                        height: '90px',
                        background: 'rgba(240,192,64,0.3)',
                        borderRadius: '12px',
                        border: '2px solid #f0c040',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                        cursor: 'grabbing',
                        zIndex: 10000,
                    }}
                >
                    {activeItemData.spriteClass ? (
                        <div className={activeItemData.spriteClass} style={{ width: '120px', height: '120px' }} />
                    ) : (
                        <img
                            src={activeItemData.image}
                            style={{
                                width: '80%',
                                height: '80%',
                                objectFit: 'contain',
                                filter:
                                    activeItemData.id === 'pan' ||
                                    activeItemData.id === 'stick' ||
                                    activeItemData.id.toString().includes('starter')
                                        ? 'url(#remove-white)'
                                        : 'none',
                            }}
                        />
                    )}
                </div>
            ) : null}
        </DragOverlay>
    );
};


