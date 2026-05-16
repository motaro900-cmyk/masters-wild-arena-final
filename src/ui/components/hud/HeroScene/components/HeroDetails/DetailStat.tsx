export const DetailStat = ({ iconClass, label, value, color }: any) => (
    <div
        style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '15px',
            borderRadius: '15px',
            borderLeft: `4px solid ${color}`,
        }}
    >
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 900, marginBottom: '5px' }}>
            {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className={iconClass} style={{ width: '80px', height: '80px', backgroundSize: '400% 200%' }} />
            <span style={{ color: '#fff', fontSize: '36px', fontWeight: 900 }}>{value}</span>
        </div>
    </div>
);
