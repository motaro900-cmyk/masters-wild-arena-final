

export const SkillItem = ({ icon, name, desc }: any) => (
    <div style={{ width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            {icon}
        </div>
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 900 }}>{name}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', lineHeight: '1.4' }}>{desc}</div>
    </div>
);
