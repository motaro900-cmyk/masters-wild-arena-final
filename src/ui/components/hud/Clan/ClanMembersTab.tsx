import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getRankInfo } from '../../../../configs/RankSystem';
import { ClanMember, ActionButton } from './ClanShared';
import { resolveAssetPath } from '../../../../utils/assetPath';
import { useGameStore } from '../../../../store/useGameStore';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { AvatarFrame } from '../SharedUI';



// Знак роли в клане
const RoleBadge: React.FC<{ role: 'LEADER' | 'OFFICER' | 'MEMBER'; colors: any }> = ({ role, colors }) => {
    const text = role === 'LEADER' ? 'Глава' : role === 'OFFICER' ? 'Офицер' : 'Участник';
    const bg = role === 'LEADER' 
        ? 'rgba(240, 192, 64, 0.12)' 
        : role === 'OFFICER' 
            ? 'rgba(59, 130, 246, 0.12)' 
            : 'rgba(255, 255, 255, 0.03)';
    const color = role === 'LEADER' 
        ? colors.accent 
        : role === 'OFFICER' 
            ? '#60a5fa' 
            : 'rgba(255,255,255,0.5)';
    const border = role === 'LEADER' 
        ? `1.5px solid ${colors.accent}44` 
        : role === 'OFFICER' 
            ? '1.5px solid #60a5fa44' 
            : '1.5px solid rgba(255,255,255,0.1)';

    return (
        <span style={{
            fontSize: '9px',
            fontWeight: 900,
            padding: '2px 6px',
            borderRadius: '4px',
            background: bg,
            color: color,
            border: border,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        }}>
            {text}
        </span>
    );
};

interface MemberRowProps {
    member: ClanMember;
    onClick: () => void;
    colors: any;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, onClick, colors }) => {
    const frame = member.frame || (member.role === 'LEADER' ? 'emerald_dragon_frame.webp' : member.role === 'OFFICER' ? 'frost_ice_frame.webp' : 'none');
    return (
        <motion.div
            whileHover={{ x: 3, backgroundColor: 'rgba(240,192,64,0.04)', borderColor: colors.accent + '33' }}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                background: colors.card,
                borderRadius: '12px',
                border: `1.5px solid ${colors.border}`,
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                <AvatarFrame
                    avatarFilename={member.avatar || 'panda'}
                    frameFilename={frame}
                    size={64}
                />
                <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '17px', fontFamily: "'Cinzel', serif" }}>{member.name}</div>
                    <div
                        style={{
                            color: getRankInfo(member.trophies).color,
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '2px',
                        }}
                    >
                        <img 
                            src={resolveAssetPath(getRankInfo(member.trophies).icon)} 
                            style={{ width: '16px', height: '16px', objectFit: 'contain' }} 
                            alt="" 
                        />
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>
                            {getRankInfo(member.trophies).name}
                        </span>
                        <span style={{ opacity: 0.3 }}>•</span>
                        <RoleBadge role={member.role} colors={colors} />
                    </div>
                </div>
            </div>

        {/* Уровень участника */}
        <div style={{ width: '80px', textAlign: 'center', fontWeight: 900, color: '#fff' }}>
            {member.level || 1}
        </div>

        <div style={{ width: '120px', textAlign: 'center', color: colors.accent, fontWeight: 900, fontSize: '15px' }}>
            {member.contribution}
        </div>

        <div style={{ width: '120px', textAlign: 'center' }}>
            <div
                style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: member.isOnline ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255,255,255,0.02)',
                    color: member.isOnline ? '#4ade80' : 'rgba(255,255,255,0.4)',
                    border: `1.5px solid ${member.isOnline ? '#4ade8022' : 'rgba(255,255,255,0.05)'}`,
                }}
            >
                {member.isOnline ? 'В сети' : member.lastSeen}
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px', justifyContent: 'flex-end' }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 900 }}>{member.trophies.toLocaleString()}</span>
            <img
                src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)}
                style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }}
                alt=""
            />
        </div>
    </motion.div>
    );
};

interface ClanMembersTabProps {
    colors: any;
    members: ClanMember[];
    isLight: boolean;
    clanData: any;
    onKickMember: (name: string) => void;
    onPromoteMember?: (name: string) => void;
    onDemoteMember?: (name: string) => void;
    onTransferLeadership?: (name: string) => void;
    onPaySalary?: (name: string, amount: number, currency: 'GOLD' | 'ALMAZ') => void;
}

export const ClanMembersTab: React.FC<ClanMembersTabProps> = ({
    colors,
    members,
    isLight,
    clanData,
    onKickMember,
    onPromoteMember,
    onDemoteMember,
    onTransferLeadership,
    onPaySalary,
}) => {
    const [selectedMember, setSelectedMember] = useState<ClanMember | null>(null);
    const [showSalaryDialog, setShowSalaryDialog] = useState(false);
    const [salaryCurrency, setSalaryCurrency] = useState<'GOLD' | 'ALMAZ'>('GOLD');
    const [salaryAmount, setSalaryAmount] = useState<number>(500);

    // Определяем имя и роль текущего игрока, чтобы разграничить права
    const name = useGameStore((state) => state.name);
    const vkUser = useGameStore((state) => state.vkUser);
    const currentUserName = name && name !== 'Мастер'
        ? name
        : (vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : 'Воин');
    const currentUserMember = members.find((m) => m.name === currentUserName);
    const currentUserRole = currentUserMember ? currentUserMember.role : 'MEMBER';

    const handleKick = () => {
        if (selectedMember) {
            onKickMember(selectedMember.name);
            setSelectedMember(null);
        }
    };

    const handlePromote = () => {
        if (selectedMember && onPromoteMember) {
            onPromoteMember(selectedMember.name);
            setSelectedMember((prev) => prev ? { ...prev, role: 'OFFICER' } : null);
        }
    };

    const handleDemote = () => {
        if (selectedMember && onDemoteMember) {
            onDemoteMember(selectedMember.name);
            setSelectedMember((prev) => prev ? { ...prev, role: 'MEMBER' } : null);
        }
    };

    const handleTransfer = () => {
        if (selectedMember && onTransferLeadership) {
            onTransferLeadership(selectedMember.name);
            setSelectedMember(null);
        }
    };

    const handleInspect = () => {
        if (selectedMember) {
            useGameStore.getState().setInspectPlayerName?.(selectedMember.name);
            setSelectedMember(null);
        }
    };

    // Проверка прав на действия управления
    const canManage = selectedMember && 
        selectedMember.name !== currentUserName && // Нельзя управлять собой
        selectedMember.role !== 'LEADER' && // Нельзя управлять главой
        (
            currentUserRole === 'LEADER' || // Глава может управлять всеми
            (currentUserRole === 'OFFICER' && selectedMember.role === 'MEMBER') // Офицер может управлять только рядовыми
        );

    return (
        <motion.div
            key="members"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}
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
                <span style={{ flex: 1 }}>Участники</span>
                <span style={{ width: '80px', textAlign: 'center' }}>Уровень</span>
                <span style={{ width: '120px', textAlign: 'center' }}>Вклад (всего)</span>
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
                    minHeight: 0,
                }}
            >
                {members.map((member, i) => (
                    <MemberRow
                        key={i}
                        member={member}
                        onClick={() => setSelectedMember(member)}
                        colors={colors}
                    />
                ))}
            </div>

            {selectedMember && (
                <div
                    onClick={() => {
                        setSelectedMember(null);
                        setShowSalaryDialog(false);
                    }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                    }}
                >
                    {!showSalaryDialog ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '420px',
                                background: isLight ? '#f5f0e1' : 'linear-gradient(135deg, #1e150d 0%, #110c07 100%)',
                                border: `2px solid ${colors.accent}`,
                                borderRadius: '24px',
                                padding: '30px',
                                textAlign: 'center',
                                cursor: 'default',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                            }}
                        >
                            <h3
                                style={{
                                    color: colors.accent,
                                    fontSize: '28px',
                                    marginBottom: '2px',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '1px',
                                }}
                            >
                                {selectedMember.name}
                            </h3>
                            <p style={{ color: colors.text, marginBottom: '24px', opacity: 0.6, fontSize: '14px', fontWeight: 600 }}>
                                {selectedMember.role === 'LEADER' ? 'Глава клана' : selectedMember.role === 'OFFICER' ? 'Офицер клана' : 'Участник клана'} • Ур. {selectedMember.level || 1}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Посмотреть профиль */}
                                <ActionButton label="ОСМОТРЕТЬ ПРОФИЛЬ" color={colors.accent} onClick={handleInspect} />

                                {/* Выплата зарплаты */}
                                {(currentUserRole === 'LEADER' || currentUserRole === 'OFFICER') && onPaySalary && (
                                    <ActionButton label="💸 ВЫПЛАТИТЬ ЗАРПЛАТУ" color="#10b981" onClick={() => setShowSalaryDialog(true)} />
                                )}

                                {/* Админ действия по управлению ролями */}
                                {canManage && currentUserRole === 'LEADER' && selectedMember.role === 'MEMBER' && onPromoteMember && (
                                    <ActionButton label="ПОВЫСИТЬ ДО ОФИЦЕРА" color="#3b82f6" onClick={handlePromote} />
                                )}

                                {canManage && currentUserRole === 'LEADER' && selectedMember.role === 'OFFICER' && onDemoteMember && (
                                    <ActionButton label="РАЗЖАЛОВАТЬ ДО РЯДОВОГО" color="#f59e0b" onClick={handleDemote} />
                                )}

                                {canManage && currentUserRole === 'LEADER' && onTransferLeadership && (
                                    <ActionButton label="ПЕРЕДАТЬ РУКОВОДСТВО" color="#a855f7" onClick={handleTransfer} />
                                )}

                                {/* Админ действие: Кик */}
                                {canManage && (
                                    <ActionButton label="ИСКЛЮЧИТЬ ИЗ КЛАНА" color="#ef4444" onClick={handleKick} />
                                )}

                                <ActionButton label="ЗАКРЫТЬ" color="rgba(255,255,255,0.4)" onClick={() => setSelectedMember(null)} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '420px',
                                background: isLight ? '#f5f0e1' : 'linear-gradient(135deg, #1e150d 0%, #110c07 100%)',
                                border: `2px solid ${colors.accent}`,
                                borderRadius: '24px',
                                padding: '30px',
                                textAlign: 'center',
                                cursor: 'default',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                            }}
                        >
                            <h3 style={{ color: colors.accent, fontSize: '24px', marginBottom: '8px', fontFamily: "'Cinzel', serif" }}>
                                Выплата Зарплаты
                            </h3>
                            <p style={{ color: colors.text, opacity: 0.7, fontSize: '13px', marginBottom: '20px' }}>
                                Вы собираетесь выплатить ресурсы из казны игроку <span style={{ color: colors.accent, fontWeight: 900 }}>{selectedMember.name}</span>
                            </p>

                            {/* Выбор валюты */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                                <button
                                    onClick={() => {
                                        setSalaryCurrency('GOLD');
                                        setSalaryAmount(500);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px',
                                        background: salaryCurrency === 'GOLD' ? 'rgba(240,192,64,0.15)' : 'rgba(0,0,0,0.4)',
                                        border: `1.5px solid ${salaryCurrency === 'GOLD' ? colors.accent : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '8px',
                                        color: salaryCurrency === 'GOLD' ? colors.accent : '#fff',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🪙 ЗОЛОТО
                                </button>
                                <button
                                    onClick={() => {
                                        setSalaryCurrency('ALMAZ');
                                        setSalaryAmount(20);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px',
                                        background: salaryCurrency === 'ALMAZ' ? 'rgba(96,165,250,0.15)' : 'rgba(0,0,0,0.4)',
                                        border: `1.5px solid ${salaryCurrency === 'ALMAZ' ? '#60a5fa' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '8px',
                                        color: salaryCurrency === 'ALMAZ' ? '#60a5fa' : '#fff',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    💎 АЛМАЗЫ
                                </button>
                            </div>

                            {/* Доступно в казне */}
                            <div style={{ fontSize: '12px', color: colors.text, opacity: 0.6, marginBottom: '12px', textAlign: 'left' }}>
                                Доступно в казне: {salaryCurrency === 'GOLD' 
                                    ? `${(clanData?.goldBank !== undefined ? clanData.goldBank : 5000).toLocaleString()} 🪙` 
                                    : `${(clanData?.crystalsBank !== undefined ? clanData.crystalsBank : 250).toLocaleString()} 💎`}
                            </div>

                            {/* Поле ввода */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px' }}>
                                <input
                                    type="number"
                                    min="1"
                                    max={salaryCurrency === 'GOLD' ? (clanData?.goldBank !== undefined ? clanData.goldBank : 5000) : (clanData?.crystalsBank !== undefined ? clanData.crystalsBank : 250)}
                                    value={salaryAmount || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        const maxVal = salaryCurrency === 'GOLD' ? (clanData?.goldBank !== undefined ? clanData.goldBank : 5000) : (clanData?.crystalsBank !== undefined ? clanData.crystalsBank : 250);
                                        if (isNaN(val)) {
                                            setSalaryAmount(0);
                                        } else {
                                            setSalaryAmount(Math.min(maxVal, Math.max(1, val)));
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(0,0,0,0.5)',
                                        border: `1.5px solid ${colors.border}`,
                                        borderRadius: '8px',
                                        color: '#fff',
                                        padding: '10px 14px',
                                        outline: 'none',
                                        fontSize: '14px',
                                        fontWeight: 900,
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const maxVal = salaryCurrency === 'GOLD' ? (clanData?.goldBank !== undefined ? clanData.goldBank : 5000) : (clanData?.crystalsBank !== undefined ? clanData.crystalsBank : 250);
                                        setSalaryAmount(maxVal);
                                    }}
                                    style={{
                                        padding: '10px 16px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: colors.accent,
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    МАКС
                                </button>
                            </div>

                            {/* Кнопки действия */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <ActionButton 
                                    label="ПОДТВЕРДИТЬ ВЫПЛАТУ" 
                                    color="#10b981" 
                                    onClick={() => {
                                        if (onPaySalary && salaryAmount > 0) {
                                            onPaySalary(selectedMember.name, salaryAmount, salaryCurrency);
                                        }
                                        setShowSalaryDialog(false);
                                        setSelectedMember(null);
                                    }} 
                                />
                                <ActionButton 
                                    label="ОТМЕНА" 
                                    color="rgba(255,255,255,0.4)" 
                                    onClick={() => setShowSalaryDialog(false)} 
                                />
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

