import React from 'react';

interface FloatingStatRowProps {
    label: string;
    value: string;
    icon: string;
}

export const FloatingStatRow: React.FC<FloatingStatRowProps> = ({ label, value, icon }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span style={{ color: '#c8a870', fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px' }}>{label}</span>
        </div>
        <span style={{ color: '#fff', fontWeight: 900 }}>{value}</span>
    </div>
);
