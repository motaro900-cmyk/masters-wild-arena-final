import React from 'react';
import { motion } from 'framer-motion';
import { resolveAssetPath } from '../../../utils/assetPath';
import { getRankInfo } from '../../../configs/RankSystem';

interface ClanMember {
    name: string;
    role: 'LEADER' | 'OFFICER' | 'MEMBER';
    trophies: number;
    lastSeen: string;
    isOnline: boolean;
    avatar: string;
}

const CLAN_MEMBERS: ClanMember[] = [
    { name: 'Motar', role: 'LEADER', trophies: 2850, lastSeen: 'Online', isOnline: true, avatar: '🐺' },
    { name: 'Alex_Great', role: 'OFFICER', trophies: 3100, lastSeen: '2m ago', isOnline: true, avatar: '🐻' },
    { name: 'DarkKnight', role: 'MEMBER', trophies: 2450, lastSeen: '1h ago', isOnline: false, avatar: '🦅' },
    { name: 'Slayer99', role: 'MEMBER', trophies: 1900, lastSeen: '15h ago', isOnline: false, avatar: '🦁' },
    { name: 'GreenLeaf', role: 'MEMBER', trophies: 2200, lastSeen: 'Online', isOnline: true, avatar: 'FOX' },
];

export const ClanWindow: React.FC = () => {
    const [clanName, setClanName] = React.useState('ЗОЛОТЫЕ ЛЬВЫ');
    const [clanMotto, setClanMotto] = React.useState('"Сила в единстве, ярость в бою. Мы не отступаем!"');
    const [isEditing, setIsEditing] = React.useState(false);
    const [selectedMember, setSelectedMember] = React.useState<ClanMember | null>(null);
    const [members, setMembers] = React.useState(CLAN_MEMBERS);

    const handlePromote = (name: string) => {
        setMembers(prev => prev.map(m => m.name === name ? { ...m, role: m.role === 'MEMBER' ? 'OFFICER' : m.role } : m));
        setSelectedMember(null);
    };

    const handleDemote = (name: string) => {
        setMembers(prev => prev.map(m => m.name === name ? { ...m, role: m.role === 'OFFICER' ? 'MEMBER' : m.role } : m));
        setSelectedMember(null);
    };

    const handleKick = (name: string) => {
        setMembers(prev => prev.filter(m => m.name !== name));
        setSelectedMember(null);
    };

    return (
        <div style={{
            width: '100%',
            height: '650px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '10px',
            position: 'relative'
        }}>
            {/* ШАПКА КЛАНА */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                padding: '25px',
                background: 'linear-gradient(90deg, rgba(240,192,64,0.15) 0%, rgba(0,0,0,0.4) 100%)',
                borderRadius: '15px',
                border: '1px solid rgba(240,192,64,0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* ГЕРБ */}
                <div style={{
                    width: '100px',
                    height: '120px',
                    background: `url(${resolveAssetPath('/assets/images/ui/clan_shield_placeholder.png')}) center/contain no-repeat`,
                    filter: 'drop-shadow(0 0 15px rgba(240,192,64,0.3))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '50px',
                    backgroundColor: 'rgba(240,192,64,0.05)',
                    borderRadius: '10px',
                    border: '2px solid #f0c040'
                }}>
                    🦁
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isEditing ? (
                            <input 
                                value={clanName} 
                                onChange={e => setClanName(e.target.value)}
                                style={{ 
                                    background: 'rgba(0,0,0,0.5)', 
                                    border: '1px solid #f0c040', 
                                    color: '#f0c040', 
                                    fontSize: '24px',
                                    fontFamily: "'Cinzel', serif",
                                    padding: '5px 10px',
                                    width: '300px'
                                }}
                            />
                        ) : (
                            <h2 style={{ 
                                margin: 0, 
                                color: '#f0c040', 
                                fontFamily: "'Cinzel', serif", 
                                fontSize: '32px',
                                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                            }}>{clanName}</h2>
                        )}
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '18px' }}
                        >
                            {isEditing ? '✅' : '✏️'}
                        </button>
                    </div>

                    {isEditing ? (
                        <input 
                            value={clanMotto} 
                            onChange={e => setClanMotto(e.target.value)}
                            style={{ 
                                background: 'rgba(0,0,0,0.3)', 
                                border: '1px solid #c8a870', 
                                color: '#c8a870', 
                                fontSize: '14px',
                                width: '100%',
                                marginTop: '5px',
                                padding: '3px 10px'
                            }}
                        />
                    ) : (
                        <p style={{ color: '#c8a870', margin: '5px 0', fontSize: '14px', fontStyle: 'italic' }}>
                            {clanMotto}
                        </p>
                    )}
                    
                    <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                        <StatBlock label="УРОВЕНЬ" value="12" />
                        <StatBlock label="УЧАСТНИКИ" value={`${members.length}/50`} />
                        <StatBlock label="ТРОФЕИ" value="48.5K" />
                    </div>
                </div>

                {/* КНОПКА ПРИГЛАШЕНИЯ */}
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        padding: '12px 25px',
                        background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 0 15px rgba(240,192,64,0.4)'
                    }}
                >
                    ПРИГЛАСИТЬ
                </motion.button>
            </div>

            {/* СПИСОК УЧАСТНИКОВ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ 
                    display: 'flex', 
                    padding: '0 20px', 
                    color: '#c8a870', 
                    fontSize: '12px', 
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    <span style={{ width: '60px' }}>Аватар</span>
                    <span style={{ flex: 1 }}>Имя и Роль</span>
                    <span style={{ width: '120px', textAlign: 'center' }}>Статус</span>
                    <span style={{ width: '100px', textAlign: 'right' }}>Трофеи</span>
                </div>
                
                <div className="leaderboard-scroll" style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    paddingRight: '5px'
                }}>
                    {members.map((member, i) => (
                        <MemberRow 
                            key={i} 
                            member={member} 
                            onClick={() => member.name !== 'Motar' && setSelectedMember(member)} 
                        />
                    ))}
                </div>
            </div>

            {/* МЕНЮ УПРАВЛЕНИЯ УЧАСТНИКОМ */}
            {selectedMember && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            width: '400px',
                            background: '#1a1510',
                            border: '2px solid #f0c040',
                            borderRadius: '15px',
                            padding: '30px',
                            textAlign: 'center',
                            boxShadow: '0 0 50px rgba(0,0,0,0.9)'
                        }}
                    >
                        <h3 style={{ color: '#f0c040', fontSize: '24px', marginBottom: '5px' }}>{selectedMember.name}</h3>
                        <p style={{ color: '#c8a870', marginBottom: '25px' }}>Управление участником</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedMember.role === 'MEMBER' && (
                                <ActionButton label="ПОВЫСИТЬ ДО ОФИЦЕРА" color="#a855f7" onClick={() => handlePromote(selectedMember.name)} />
                            )}
                            {selectedMember.role === 'OFFICER' && (
                                <ActionButton label="ПОНИЗИТЬ ДО ВОИНА" color="#c8a870" onClick={() => handleDemote(selectedMember.name)} />
                            )}
                            <ActionButton label="ИСКЛЮЧИТЬ ИЗ КЛАНА" color="#ef4444" onClick={() => handleKick(selectedMember.name)} />
                            <ActionButton label="ОТМЕНА" color="#444" onClick={() => setSelectedMember(null)} />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const ActionButton: React.FC<{ label: string, color: string, onClick: () => void }> = ({ label, color, onClick }) => (
    <motion.button
        whileHover={{ backgroundColor: color, color: '#fff' }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${color}`,
            borderRadius: '8px',
            color: color,
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        }}
    >
        {label}
    </motion.button>
);

const StatBlock: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div>
        <div style={{ color: '#c8a870', fontSize: '10px', fontWeight: 800 }}>{label}</div>
        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900 }}>{value}</div>
    </div>
);

const MemberRow: React.FC<{ member: ClanMember, onClick: () => void }> = ({ member, onClick }) => (
    <motion.div 
        whileHover={{ backgroundColor: 'rgba(240,192,64,0.08)' }}
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(240,192,64,0.05)',
            cursor: 'pointer'
        }}
    >
        <div style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '50%', 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid #444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            marginRight: '15px'
        }}>
            {member.avatar}
        </div>

        <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>{member.name}</div>
            <div style={{ 
                color: getRankInfo(member.trophies).color, 
                fontSize: '11px', 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <span>{getRankInfo(member.trophies).icon}</span>
                {getRankInfo(member.trophies).name} • {member.role}
            </div>
        </div>

        <div style={{ width: '120px', textAlign: 'center' }}>
            <div style={{ 
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                background: member.isOnline ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)',
                color: member.isOnline ? '#4ade80' : '#888',
                border: `1px solid ${member.isOnline ? '#4ade8044' : '#ffffff22'}`
            }}>
                {member.lastSeen}
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px', justifyContent: 'flex-end' }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>{member.trophies.toLocaleString()}</span>
            <span style={{ fontSize: '14px' }}>🏆</span>
        </div>
    </motion.div>
);
