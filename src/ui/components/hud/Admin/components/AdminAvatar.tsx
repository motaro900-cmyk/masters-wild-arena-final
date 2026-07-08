import React, { useState, useEffect } from 'react';

interface AdminAvatarProps {
    photo: string | null | undefined;
    name: string;
    style?: React.CSSProperties;
}

const GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Indigo/Purple
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', // Pink
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', // Peach
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // Teal
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Light Blue
    'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', // Red
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Emerald
];

export const AdminAvatar: React.FC<AdminAvatarProps> = ({ photo, name, style }) => {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    const cleanName = name
        ? name
              .replace(/\s*\(Я\)\s*$/, '')
              .replace(/\s*\(Вы\)\s*$/, '')
              .trim()
        : 'Unknown';
    const firstLetter = cleanName.charAt(0).toUpperCase() || '?';

    // Pick a deterministic gradient based on name character code
    const charCodeSum = cleanName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const gradient = GRADIENTS[charCodeSum % GRADIENTS.length];

    useEffect(() => {
        if (!photo || photo === 'none' || photo.includes('camera_100') || photo.startsWith('sprite:')) {
            setStatus('error');
            return;
        }

        setStatus('loading');
        const img = new Image();
        img.src = photo;
        img.onload = () => {
            setImgSrc(photo);
            setStatus('loaded');
        };
        img.onerror = () => {
            setStatus('error');
        };
    }, [photo]);

    const baseStyle: React.CSSProperties = {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
    };

    if (status === 'error') {
        return (
            <div
                style={{
                    ...baseStyle,
                    background: gradient,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: style?.width ? `calc(${style.width}px * 0.45)` : '16px',
                    fontFamily: "'Outfit', 'Cinzel', sans-serif",
                    textShadow: '0 2px 4px rgba(0,0,0,0.25)',
                }}
            >
                {firstLetter}
            </div>
        );
    }

    return (
        <div style={baseStyle}>
            {/* CSS placeholder gradient in the background */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: gradient,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: style?.width ? `calc(${style.width}px * 0.45)` : '16px',
                    fontFamily: "'Outfit', 'Cinzel', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: status === 'loading' ? 1 : 0,
                    transition: 'opacity 0.3s ease-out',
                    textShadow: '0 2px 4px rgba(0,0,0,0.25)',
                }}
            >
                {firstLetter}
            </div>

            {/* Loaded image */}
            {imgSrc && (
                <img
                    src={imgSrc}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: status === 'loaded' ? 1 : 0,
                        transition: 'opacity 0.3s ease-in',
                    }}
                    alt=""
                />
            )}
        </div>
    );
};
