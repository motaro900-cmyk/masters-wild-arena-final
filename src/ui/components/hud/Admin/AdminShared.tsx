/* eslint-disable react-refresh/only-export-components */
import React from 'react';

// --- COMMON STYLES ---
export const contentGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' };
export const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    padding: '20px',
    borderRadius: '15px',
    border: '1px solid #1a1a1a',
    marginBottom: '15px',
};

export const editRow: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    marginBottom: '15px',
};
export const applyBtn: React.CSSProperties = {
    background: '#1b4332',
    color: '#4dff4d',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
};
export const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: '#050505',
    border: '1px solid #222',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
};
export const btnStyle: React.CSSProperties = {
    background: '#111',
    color: '#fff',
    border: '1px solid #222',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'center',
    transition: 'background 0.2s',
};
export const bigBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
};
export const terminalStyle: React.CSSProperties = {
    height: '150px',
    background: '#000',
    padding: '15px',
    fontSize: '11px',
    color: '#2ecc71',
    overflowY: 'auto',
    borderRadius: '8px',
    border: '1px solid #111',
    marginTop: '10px',
};
export const statBox: React.CSSProperties = {
    background: '#050505',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #111',
    textAlign: 'center',
};
export const statLabel: React.CSSProperties = {
    fontSize: '10px',
    color: '#444',
    marginBottom: '6px',
    textTransform: 'uppercase',
};
export const smallBtnStyle: React.CSSProperties = {
    padding: '8px 15px',
    background: '#111',
    border: '1px solid #222',
    color: '#666',
    fontSize: '11px',
    borderRadius: '6px',
    cursor: 'pointer',
};

// --- BASE COMPONENTS ---
export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={sectionStyle}>
        <div
            style={{
                fontSize: '11px',
                color: '#333',
                marginBottom: '15px',
                borderBottom: '1px solid #111',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 'bold',
            }}
        >
            {title}
        </div>
        {children}
    </div>
);

export const ToggleRow: React.FC<{ label: string; active: boolean; onToggle: () => void }> = ({
    label,
    active,
    onToggle,
}) => (
    <div
        onClick={onToggle}
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            background: '#080808',
            borderRadius: '10px',
            cursor: 'pointer',
            marginBottom: '8px',
            border: active ? '1px solid #ff4d4d' : '1px solid #1a1a1a',
            transition: 'border 0.2s',
        }}
    >
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: active ? '#fff' : '#666' }}>{label}</span>
        <div
            style={{
                width: '40px',
                height: '20px',
                background: active ? '#ff4d4d' : '#222',
                borderRadius: '10px',
                position: 'relative',
                transition: 'background 0.3s',
            }}
        >
            <div
                style={{
                    width: '16px',
                    height: '16px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: active ? '22px' : '2px',
                    transition: 'left 0.3s',
                }}
            />
        </div>
    </div>
);

export interface RealPlayer {
    id: string;
    vkId: number;
    name: string;
    photo: string;
    status: 'ONLINE' | 'OFFLINE' | 'BANNED' | 'BATTLE';
    screen: string;
    level: number;
    gold: number;
    crystals: number;
    regDate: string;
    reports: number;
    reportLogs: string[];
    gear: {
        weapon?: string;
        helm?: string;
        armor?: string;
        shield?: string;
    };
    isTest?: boolean;
    isDev?: boolean;
}
