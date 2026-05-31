export const DetailStat = ({
    icon,
    label,
    value,
    color,
}: {
    icon: string;
    label: string;
    value: any;
    color: string;
}) => (
    <div
        style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '15px',
            borderRadius: '15px',
            borderLeft: `4px solid ${color}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        }}
    >
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>
            {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
                style={{
                    fontSize: '40px',
                    lineHeight: 1,
                    filter: `drop-shadow(0 0 8px ${color}88)`,
                }}
            >
                {icon}
            </div>
            <span style={{ color: '#fff', fontSize: '32px', fontWeight: 900 }}>{value}</span>
        </div>
    </div>
);
