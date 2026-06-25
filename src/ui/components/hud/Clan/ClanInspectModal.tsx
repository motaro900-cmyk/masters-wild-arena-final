import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClanData, StatItem } from './ClanShared';
import { ClanEmblemIcon } from '../../GameIcons';
import { getRankInfo } from '../../../../configs/RankSystem';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { resolveAssetPath } from '../../../../utils/assetPath';
import { AvatarFrame } from '../SharedUI';

interface ClanInspectModalProps {
    isOpen: boolean;
    onClose: () => void;
    clan: ClanData | null;
    colors: any;
    playerTrophies: number;
    onJoin: (clan: ClanData) => void;
    isAlreadyApplied: boolean;
    onApply: (clan: ClanData) => void;
}

const MOCK_NAMES = [
    'Рагнар',
    'Сильвана',
    'Геральт',
    'Джайна',
    'Тралл',
    'Иллидан',
    'Лирой',
    'Утер',
    'Андуин',
    'Валира',
    'Гаррош',
    'Малфурион',
    'Тиранда',
    'Артас',
    'Кэрн',
    'Волджин',
    'Регар',
    'Чэнь',
    'Ли Ли',
    'Мурадин',
    'Фалстад',
    'Джараксус',
    'Гулдан',
    'Клэр',
    'Леон',
    'Ада',
    'Джилл',
    'Крис',
    'Альберт',
];

interface InspectMember {
    name: string;
    role: 'LEADER' | 'OFFICER' | 'MEMBER';
    trophies: number;
    lastSeen: string;
    isOnline: boolean;
    avatar: string;
    contribution: number;
    level: number;
    frame?: string;
}

const RoleBadge: React.FC<{ role: 'LEADER' | 'OFFICER' | 'MEMBER'; colors: any }> = ({ role, colors }) => {
    const text = role === 'LEADER' ? 'Глава' : role === 'OFFICER' ? 'Офицер' : 'Рядовой';
    const bg =
        role === 'LEADER'
            ? 'rgba(240, 192, 64, 0.12)'
            : role === 'OFFICER'
              ? 'rgba(59, 130, 246, 0.12)'
              : 'rgba(255, 255, 255, 0.03)';
    const color = role === 'LEADER' ? colors.accent : role === 'OFFICER' ? '#60a5fa' : 'rgba(255,255,255,0.5)';
    const border =
        role === 'LEADER'
            ? `1px solid ${colors.accent}44`
            : role === 'OFFICER'
              ? '1px solid #60a5fa44'
              : '1px solid rgba(255,255,255,0.1)';

    return (
        <span
            style={{
                fontSize: '8px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '3px',
                background: bg,
                color: color,
                border: border,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
            }}
        >
            {text}
        </span>
    );
};

export const ClanInspectModal: React.FC<ClanInspectModalProps> = ({
    isOpen,
    onClose,
    clan,
    colors,
    playerTrophies,
    onJoin,
    isAlreadyApplied,
    onApply,
}) => {
    const inspectMembers = useMemo(() => {
        if (!clan) return [];

        const count = clan.membersCount;
        const members: InspectMember[] = [];

        // Лидер клана
        const leaderTrophies = Math.max(clan.minTrophies + 500, Math.floor(clan.totalTrophies * 0.12));
        members.push({
            name: `${clan.name.split(' ')[0]}Глава`,
            role: 'LEADER',
            trophies: leaderTrophies,
            lastSeen: 'В сети',
            isOnline: true,
            avatar: 'sprite:sprite-avatar avatar-pos-1',
            contribution: Math.floor(Math.random() * 300) + 300,
            level: Math.max(15, Math.floor(clan.level * 2.2) + Math.floor(Math.random() * 8)),
        });

        const officersCount = Math.min(4, Math.max(1, Math.floor(count / 10)));
        const regularCount = count - 1 - officersCount;

        // Офицеры
        for (let i = 0; i < officersCount; i++) {
            const name = MOCK_NAMES[i % MOCK_NAMES.length];
            const isOnline = Math.random() > 0.45;
            members.push({
                name,
                role: 'OFFICER',
                trophies: Math.max(
                    clan.minTrophies,
                    Math.floor(leaderTrophies * 0.85) - i * 250 - Math.floor(Math.random() * 150),
                ),
                lastSeen: isOnline ? 'В сети' : `${Math.floor(Math.random() * 23) + 1}ч назад`,
                isOnline,
                avatar: `sprite:sprite-avatar avatar-pos-${(i + 2) % 9}`,
                contribution: Math.floor(Math.random() * 250) + 150,
                level: Math.max(10, Math.floor(clan.level * 1.8) + Math.floor(Math.random() * 6)),
            });
        }

        // Рядовые
        for (let i = 0; i < regularCount; i++) {
            const nameIdx = (officersCount + i) % MOCK_NAMES.length;
            const name =
                i >= MOCK_NAMES.length
                    ? `${MOCK_NAMES[nameIdx]} ${Math.floor(i / MOCK_NAMES.length) + 1}`
                    : MOCK_NAMES[nameIdx];
            const isOnline = Math.random() > 0.75;
            const minT = clan.minTrophies;
            const baseT = Math.floor(clan.totalTrophies / count);
            const trophies = Math.max(minT, baseT + Math.floor((Math.random() - 0.4) * 400));
            members.push({
                name,
                role: 'MEMBER',
                trophies,
                lastSeen: isOnline ? 'В сети' : `${Math.floor(Math.random() * 6) + 1}д назад`,
                isOnline,
                avatar: `sprite:sprite-avatar avatar-pos-${(i + 5) % 9}`,
                contribution: Math.floor(Math.random() * 150),
                level: Math.max(1, Math.floor(clan.level * 1.3) + Math.floor((Math.random() - 0.5) * 4)),
            });
        }

        return members.sort((a, b) => b.trophies - a.trophies);
    }, [clan]);

    if (!isOpen || !clan) return null;

    const canJoin = playerTrophies >= clan.minTrophies && clan.type !== 'CLOSED' && clan.membersCount < clan.maxMembers;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 1100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
            }}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '750px',
                    height: '80vh',
                    maxHeight: '700px',
                    background: 'linear-gradient(135deg, #1e150d 0%, #110c07 100%)',
                    border: `2px solid ${colors.accent}`,
                    borderRadius: '24px',
                    padding: '24px',
                    cursor: 'default',
                    boxShadow: '0 10px 45px rgba(0,0,0,0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                {/* Кнопка закрытия */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: colors.accent,
                        fontSize: '22px',
                        cursor: 'pointer',
                        opacity: 0.8,
                        fontWeight: 'bold',
                        transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                >
                    ✖
                </button>

                {/* Шапка осмотра */}
                <div
                    style={{
                        display: 'flex',
                        gap: '20px',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(240, 192, 64, 0.15)',
                        paddingBottom: '16px',
                        marginBottom: '16px',
                    }}
                >
                    <ClanEmblemIcon emblem={clan.emblem} size={72} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '26px',
                                    color: colors.accent,
                                    fontWeight: 900,
                                }}
                            >
                                {clan.name}
                            </h3>
                            <span
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                    color: '#000',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Ур. {clan.level}
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', opacity: 0.7, fontSize: '14px' }}>
                            «{clan.motto}»
                        </p>
                    </div>
                </div>

                {/* Основные статы клана */}
                <div
                    style={{
                        display: 'flex',
                        gap: '15px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        marginBottom: '16px',
                    }}
                >
                    <StatItem label="Трофеи" value={clan.totalTrophies.toLocaleString()} />
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <StatItem label="Участники" value={`${clan.membersCount}/${clan.maxMembers}`} />
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <StatItem label="Требование" value={`${clan.minTrophies} кубков`} />
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase' }}>
                            Тип доступа
                        </div>
                        <div
                            style={{
                                fontSize: '15px',
                                fontWeight: 900,
                                color:
                                    clan.type === 'OPEN'
                                        ? colors.success
                                        : clan.type === 'INVITE'
                                          ? '#f59e0b'
                                          : colors.danger,
                            }}
                        >
                            {clan.type === 'OPEN' ? 'ОТКРЫТЫЙ' : clan.type === 'INVITE' ? 'ПО ЗАЯВКЕ' : 'ЗАКРЫТЫЙ'}
                        </div>
                    </div>
                </div>

                {/* Заголовок списка участников */}
                <h4
                    style={{
                        margin: '0 0 10px 0',
                        fontFamily: "'Cinzel', serif",
                        color: colors.accent,
                        fontSize: '16px',
                        letterSpacing: '0.5px',
                    }}
                >
                    УЧАСТНИКИ КЛАНА ({clan.membersCount})
                </h4>

                {/* Список участников */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        overflow: 'hidden',
                        minHeight: 0,
                    }}
                >
                    {/* Шапка таблицы */}
                    <div
                        style={{
                            display: 'flex',
                            padding: '0 16px',
                            color: colors.accent,
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            opacity: 0.6,
                            letterSpacing: '0.5px',
                            marginBottom: '4px',
                        }}
                    >
                        <span style={{ flex: 1 }}>Участники</span>
                        <span style={{ width: '60px', textAlign: 'center' }}>Уровень</span>
                        <span style={{ width: '100px', textAlign: 'center' }}>Вклад (всего)</span>
                        <span style={{ width: '90px', textAlign: 'center' }}>Статус</span>
                        <span style={{ width: '110px', textAlign: 'right' }}>Трофеи</span>
                    </div>

                    {/* Скролл участников */}
                    <div
                        className="leaderboard-scroll"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            paddingRight: '4px',
                            minHeight: 0,
                        }}
                    >
                        {inspectMembers.map((member, index) => {
                            const frame =
                                member.frame ||
                                (member.role === 'LEADER'
                                    ? 'emerald_dragon_frame.webp'
                                    : member.role === 'OFFICER'
                                      ? 'frost_ice_frame.webp'
                                      : 'none');
                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 16px',
                                        background: 'rgba(25, 18, 12, 0.4)',
                                        borderRadius: '10px',
                                        border: '1.5px solid rgba(240, 192, 64, 0.08)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        <AvatarFrame
                                            avatarFilename={member.avatar || 'panda'}
                                            frameFilename={frame}
                                            size={38}
                                        />
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px' }}>
                                                {member.name}
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    marginTop: '1px',
                                                }}
                                            >
                                                <img
                                                    src={resolveAssetPath(getRankInfo(member.trophies).icon)}
                                                    style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                                                    alt=""
                                                />
                                                <span
                                                    style={{
                                                        fontSize: '9px',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 800,
                                                        color: getRankInfo(member.trophies).color,
                                                    }}
                                                >
                                                    {getRankInfo(member.trophies).name}
                                                </span>
                                                <span style={{ opacity: 0.3, fontSize: '8px', color: '#fff' }}>•</span>
                                                <RoleBadge role={member.role} colors={colors} />
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                width: '60px',
                                                textAlign: 'center',
                                                fontWeight: 900,
                                                color: '#fff',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {member.level}
                                        </div>
                                        <div
                                            style={{
                                                width: '100px',
                                                textAlign: 'center',
                                                color: colors.accent,
                                                fontWeight: 900,
                                                fontSize: '13px',
                                            }}
                                        >
                                            {member.contribution}
                                        </div>
                                        <div style={{ width: '90px', textAlign: 'center' }}>
                                            <div
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '9px',
                                                    fontWeight: 800,
                                                    background: member.isOnline
                                                        ? 'rgba(74, 222, 128, 0.08)'
                                                        : 'rgba(255,255,255,0.02)',
                                                    color: member.isOnline ? '#4ade80' : 'rgba(255,255,255,0.4)',
                                                    border: `1px solid ${member.isOnline ? '#4ade8022' : 'rgba(255,255,255,0.05)'}`,
                                                }}
                                            >
                                                {member.isOnline ? 'В сети' : member.lastSeen}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            width: '110px',
                                            justifyContent: 'flex-end',
                                        }}
                                    >
                                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 900 }}>
                                            {member.trophies.toLocaleString()}
                                        </span>
                                        <img
                                            src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)}
                                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                            alt=""
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Действия внизу */}
                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '16px',
                        borderTop: '1px solid rgba(240, 192, 64, 0.15)',
                        paddingTop: '16px',
                    }}
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1.5px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: colors.text,
                            fontWeight: 800,
                            cursor: 'pointer',
                        }}
                    >
                        ЗАКРЫТЬ
                    </motion.button>

                    {clan.membersCount >= clan.maxMembers ? (
                        <button
                            disabled
                            style={{
                                flex: 2,
                                padding: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                border: `1.5px solid ${colors.border}`,
                                borderRadius: '12px',
                                color: 'rgba(255,255,255,0.3)',
                                fontWeight: 800,
                                cursor: 'not-allowed',
                            }}
                        >
                            МЕСТ НЕТ
                        </button>
                    ) : clan.type === 'CLOSED' ? (
                        <button
                            disabled
                            style={{
                                flex: 2,
                                padding: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                border: `1.5px solid ${colors.border}`,
                                borderRadius: '12px',
                                color: 'rgba(255,255,255,0.3)',
                                fontWeight: 800,
                                cursor: 'not-allowed',
                            }}
                        >
                            КЛАН ЗАКРЫТ
                        </button>
                    ) : clan.type === 'INVITE' ? (
                        <motion.button
                            whileHover={!isAlreadyApplied ? { scale: 1.02, backgroundColor: '#d97706' } : {}}
                            whileTap={!isAlreadyApplied ? { scale: 0.98 } : {}}
                            onClick={() => !isAlreadyApplied && onApply(clan)}
                            style={{
                                flex: 2,
                                padding: '12px',
                                background: isAlreadyApplied ? 'rgba(217, 119, 6, 0.15)' : '#d97706',
                                border: '1.5px solid #d97706',
                                borderRadius: '12px',
                                color: isAlreadyApplied ? '#fbbf24' : '#fff',
                                fontWeight: 800,
                                cursor: isAlreadyApplied ? 'default' : 'pointer',
                            }}
                        >
                            {isAlreadyApplied ? 'ЗАЯВКА ОТПРАВЛЕНА' : 'ПОДАТЬ ЗАЯВКУ'}
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={
                                canJoin
                                    ? { scale: 1.02, background: 'linear-gradient(180deg, #f0c040 0%, #d9a21b 100%)' }
                                    : {}
                            }
                            whileTap={canJoin ? { scale: 0.98 } : {}}
                            onClick={() => canJoin && onJoin(clan)}
                            disabled={!canJoin}
                            style={{
                                flex: 2,
                                padding: '12px',
                                background: canJoin
                                    ? 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)'
                                    : 'rgba(255,255,255,0.02)',
                                border: `1.5px solid ${canJoin ? colors.accent : colors.border}`,
                                borderRadius: '12px',
                                color: canJoin ? '#000' : 'rgba(255,255,255,0.3)',
                                fontWeight: 900,
                                cursor: canJoin ? 'pointer' : 'not-allowed',
                            }}
                        >
                            ВСТУПИТЬ
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
