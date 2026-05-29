import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getRankInfo } from '../../../../configs/RankSystem';
import { ClanMember, ActionButton } from './ClanShared';

interface MemberRowProps {
    member: ClanMember;
    onClick: () => void;
    colors: any;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, onClick, colors }) => (
    <motion.div
        whileHover={{ backgroundColor: 'rgba(240,192,64,0.08)' }}
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            background: colors.card,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
        }}
    >
        <div
            style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid #444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginRight: '15px',
            }}
        >
            {member.avatar}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>{member.name}</div>
            <div
                style={{
                    color: getRankInfo(member.trophies).color,
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }}
            >
                <span>{getRankInfo(member.trophies).icon}</span>
                {getRankInfo(member.trophies).name} • {member.role}
            </div>
        </div>
        <div style={{ width: '120px', textAlign: 'center', color: colors.accent, fontWeight: 800 }}>
            {member.contribution}
        </div>
        <div style={{ width: '120px', textAlign: 'center' }}>
            <div
                style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: member.isOnline ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)',
                    color: member.isOnline ? '#4ade80' : '#888',
                    border: `1px solid ${member.isOnline ? '#4ade8044' : '#ffffff22'}`,
                }}
            >
                {member.lastSeen}
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px', justifyContent: 'flex-end' }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>{member.trophies.toLocaleString()}</span>
            <span style={{ fontSize: '14px' }}>🏆</span>
        </div>
    </motion.div>
);

interface ClanMembersTabProps {
    colors: any;
    members: ClanMember[];
    isLight: boolean;
    onKickMember: (name: string) => void;
}

export const ClanMembersTab: React.FC<ClanMembersTabProps> = ({ colors, members, isLight, onKickMember }) => {
    const [selectedMember, setSelectedMember] = useState<ClanMember | null>(null);

    const handleKick = () => {
        if (selectedMember) {
            onKickMember(selectedMember.name);
            setSelectedMember(null);
        }
    };

    return (
        <motion.div
            key="members"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
            <div
                style={{
                    display: 'flex',
                    padding: '0 20px',
                    color: colors.accent,
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    opacity: 0.7,
                }}
            >
                <span style={{ width: '60px' }}>Аватар</span>
                <span style={{ flex: 1 }}>Участник</span>
                <span style={{ width: '120px', textAlign: 'center' }}>Вклад (нед.)</span>
                <span style={{ width: '120px', textAlign: 'center' }}>Статус</span>
                <span style={{ width: '100px', textAlign: 'right' }}>Трофеи</span>
            </div>

            <div
                className="leaderboard-scroll"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingRight: '5px',
                }}
            >
                {members.map((member, i) => (
                    <MemberRow
                        key={i}
                        member={member}
                        onClick={() => member.name !== 'Motar' && setSelectedMember(member)}
                        colors={colors}
                    />
                ))}
            </div>

            {selectedMember && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            width: '400px',
                            background: isLight ? '#f5f0e1' : '#1a1510',
                            border: `2px solid ${colors.accent}`,
                            borderRadius: '20px',
                            padding: '40px',
                            textAlign: 'center',
                        }}
                    >
                        <h3
                            style={{
                                color: colors.accent,
                                fontSize: '28px',
                                marginBottom: '5px',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            {selectedMember.name}
                        </h3>
                        <p style={{ color: colors.text, marginBottom: '30px', opacity: 0.7 }}>Управление участником</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <ActionButton label="ИСКЛЮЧИТЬ ИЗ КЛАНА" color="#ef4444" onClick={handleKick} />
                            <ActionButton label="ОТМЕНА" color={colors.text} onClick={() => setSelectedMember(null)} />
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};
