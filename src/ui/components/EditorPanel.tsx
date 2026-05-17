import React, { useState, useEffect } from 'react';
import { useDebugStore } from '../../store/useDebugStore';

interface EditorPanelProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ id, children, className = '' }) => {
    const isEditorMode = useDebugStore((state: any) => state.isEditorMode);
    const savedPos = useDebugStore((state: any) => state.elements?.find((e: any) => e.id === id)) || { x: 0, y: 0 };
    const isSelected = useDebugStore((state: any) => state.selectedId === id);

    const [pos, setPos] = useState(savedPos);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setTimeout(() => setPos({ x: savedPos.x || 0, y: savedPos.y || 0 }), 0);
    }, [savedPos.x, savedPos.y]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isEditorMode) return;
        e.stopPropagation();
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        useDebugStore.setState({ selectedId: id, selectedProps: savedPos });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !isEditorMode) return;

        const wrapper = document.getElementById('game-wrapper');
        const zoom = wrapper ? wrapper.getBoundingClientRect().width / 1920 : 1;

        setPos((p: { x: number; y: number }) => {
            const newPos = { x: p.x + e.movementX / zoom, y: p.y + e.movementY / zoom };
            useDebugStore.setState((s: any) => ({
                elements: s.elements.map((el: any) => (el.id === id ? { ...el, ...newPos } : el)),
                selectedProps: s.selectedId === id ? { ...s.selectedProps, ...newPos } : s.selectedProps,
            }));
            return newPos;
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const editorStyles = isEditorMode
        ? `cursor-move z-[100] pointer-events-auto bg-white/5 backdrop-blur-sm transition-shadow [&_*]:pointer-events-none ${isSelected ? 'ring-4 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'ring-2 ring-dashed ring-yellow-400 hover:ring-orange-400'}`
        : 'pointer-events-none';

    return (
        <div
            className={`absolute ${className} ${editorStyles}`}
            style={{ left: 0, top: 0, transform: `translate(${pos.x}px, ${pos.y}px)`, touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {children}
        </div>
    );
};
