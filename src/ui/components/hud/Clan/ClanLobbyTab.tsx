import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClanData, ClanMember, StatBlock } from './ClanShared';
import { ClanEmblemIcon } from '../../GameIcons';
import { useGameStore } from '../../../../store/useGameStore';

interface ClanLobbyTabProps {
    colors: any;
    clanData: ClanData | null;
    newClanName: string;
    newClanMotto: string;
    selectedEmblem: string;
    clanLevelData: { level: number; xp: number; maxXp: number };
    members: ClanMember[];
    rating: number;
    onEditClan: () => void;
    onLeave: () => void;
}

export const ClanLobbyTab: React.FC<ClanLobbyTabProps> = ({
    colors,
    clanData,
    newClanName,
    newClanMotto,
    selectedEmblem,
    clanLevelData,
    members,
    rating,
    onEditClan,
    onLeave,
}) => {
    const clanId = useGameStore((state) => state.clanId);
    const isMock = clanId?.startsWith('clan_');
    const defaultMOTD = isMock
        ? 'Внимание, Мастера! Завтра в 20:00 стартует Клановая Осада.'
        : 'Приветствуем в нашем клане! Будьте вежливы и помогайте соратникам.';
    const [clanMOTD, setClanMOTD] = useState(defaultMOTD);
    const [isEditingMOTD, setIsEditingMOTD] = useState(false);

    // Чат клана
    const name = useGameStore((state) => state.name);
    const vkUser = useGameStore((state) => state.vkUser);
    const rawClanMessages = useGameStore((state) => state.clanMessages) || [];
    const clanMessages = isMock
        ? rawClanMessages
        : rawClanMessages.filter((m: any) => !m.id?.toString().startsWith('mock-'));
    const addMessage = useGameStore((state) => state.addMessage);

    const currentUserName =
        name && name !== 'Мастер' && name !== 'undefined' && name !== 'undefined undefined'
            ? name
            : vkUser
              ? `${vkUser.firstName || vkUser.first_name || 'Игрок'} ${vkUser.lastName || vkUser.last_name || ''}`.trim()
              : 'Воин';

    const playerMember = members.find((m) => m.name === currentUserName);
    const playerRole = playerMember ? playerMember.role : 'MEMBER';
    const isLeaderOrOfficer = playerRole === 'LEADER' || playerRole === 'OFFICER';
    const onlineCount = members.filter((m) => m.isOnline).length;

    const [newMessageText, setNewMessageText] = useState('');

    const handleSendMessage = () => {
        if (!newMessageText.trim()) return;
        addMessage(newMessageText.trim(), currentUserName, 'clan');
        setNewMessageText('');
    };

    const formatTime = (ts: any) => {
        if (!ts) return '';
        if (typeof ts === 'string') return ts;
        try {
            const date = new Date(ts);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
            <style>{`
                input[type=number]::-webkit-outer-spin-button,
                input[type=number]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '30px',
                    padding: '25px',
                    background: 'linear-gradient(90deg, rgba(240,192,64,0.15) 0%, rgba(0,0,0,0.4) 100%)',
                    borderRadius: '15px',
                    border: `1px solid ${colors.border}`,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: '120px',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '15px',
                        border: `2px solid ${colors.accent}`,
                    }}
                >
                    <ClanEmblemIcon emblem={clanData?.emblem || selectedEmblem} size={64} />
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h2
                            style={{
                                margin: 0,
                                color: colors.accent,
                                fontFamily: "'Cinzel', serif",
                                fontSize: '32px',
                            }}
                        >
                            {clanData?.name || newClanName || 'ЗОЛОТЫЕ ЛЬВЫ'}
                        </h2>
                        <span
                            style={{
                                padding: '4px 10px',
                                background: colors.accent,
                                color: '#000',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 900,
                            }}
                        >
                            LVL {clanLevelData.level}
                        </span>
                    </div>
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            height: '18px',
                            borderRadius: '9px',
                            marginTop: '10px',
                            position: 'relative',
                            overflow: 'hidden',
                            width: '250px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: `${(clanLevelData.xp / clanLevelData.maxXp) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #f0c040, #fffae0)',
                                boxShadow: '0 0 10px rgba(240,192,64,0.5)',
                            }}
                        />
                        <span
                            style={{
                                position: 'absolute',
                                width: '100%',
                                textAlign: 'center',
                                fontSize: '11px',
                                fontWeight: 900,
                                color: '#fff',
                                textShadow: '1px 1px 2px #000',
                                pointerEvents: 'none',
                            }}
                        >
                            {clanLevelData.xp} / {clanLevelData.maxXp} XP
                        </span>
                    </div>
                    <p
                        style={{
                            color: colors.text,
                            margin: '15px 0',
                            fontSize: '14px',
                            fontStyle: 'italic',
                            opacity: 0.8,
                        }}
                    >
                        "{clanData?.motto || newClanMotto || 'Сила в единстве, ярость в бою.'}"
                    </p>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <StatBlock label="ОНЛАЙН" value={`${onlineCount}/${members.length}`} />
                        <StatBlock
                            label="ТРОФЕИ КЛАНА"
                            value={clanData?.totalTrophies?.toLocaleString() || rating.toLocaleString() || '0'}
                        />
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {isLeaderOrOfficer && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onEditClan}
                                style={{
                                    background: 'rgba(240, 192, 64, 0.08)',
                                    border: `1.5px solid ${colors.accent}`,
                                    color: colors.accent,
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 15px rgba(240,192,64,0.15)',
                                    outline: 'none',
                                }}
                            >
                                ⚙️ НАСТРОЙКИ
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.05, opacity: 1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onLeave}
                            style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1.5px solid #ef4444',
                                color: '#ef4444',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                cursor: 'pointer',
                                opacity: 0.9,
                                boxShadow: '0 4px 15px rgba(239,68,68,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                outline: 'none',
                            }}
                        >
                            🚪 {playerRole === 'LEADER' ? 'РАСПУСТИТЬ КЛАН' : 'ПОКИНУТЬ КЛАН'}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* CHAT / MOTD SECTION */}
            <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
                {/* CLAN CHAT PANEL */}
                <div
                    style={{
                        flex: 1.8,
                        background: colors.card,
                        borderRadius: '15px',
                        border: `1px solid ${colors.border}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '280px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: colors.accent,
                            textTransform: 'uppercase',
                            marginBottom: '10px',
                        }}
                    >
                        Чат клана
                    </div>

                    {/* Messages scroll */}
                    <div
                        className="leaderboard-scroll"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            marginBottom: '12px',
                            paddingRight: '4px',
                            minHeight: '140px',
                        }}
                    >
                        {clanMessages.map((msg: any, idx: number) => {
                            const isUser = msg.author === currentUserName;
                            const msgMember = members.find((m) => m.name === msg.author);
                            const msgRole = msg.role || (msgMember ? msgMember.role : 'MEMBER');
                            const timestampStr = formatTime(msg.timestamp);
                            return (
                                <div
                                    key={msg.id || idx}
                                    style={{
                                        padding: '8px 12px',
                                        background: isUser ? 'rgba(240, 192, 64, 0.06)' : 'rgba(255,255,255,0.02)',
                                        borderRadius: '8px',
                                        border: `1px solid ${isUser ? 'rgba(240,192,64,0.15)' : 'rgba(255,255,255,0.04)'}`,
                                        alignSelf: 'stretch',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '2px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                    color: isUser ? colors.accent : '#60a5fa',
                                                }}
                                            >
                                                {msg.author}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '7px',
                                                    fontWeight: 800,
                                                    padding: '1px 4px',
                                                    borderRadius: '2px',
                                                    background:
                                                        msgRole === 'LEADER'
                                                            ? 'rgba(240,192,64,0.15)'
                                                            : msgRole === 'OFFICER'
                                                              ? 'rgba(59,130,246,0.15)'
                                                              : 'rgba(255,255,255,0.03)',
                                                    color:
                                                        msgRole === 'LEADER'
                                                            ? colors.accent
                                                            : msgRole === 'OFFICER'
                                                              ? '#60a5fa'
                                                              : 'rgba(255,255,255,0.4)',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {msgRole === 'LEADER'
                                                    ? 'Глава'
                                                    : msgRole === 'OFFICER'
                                                      ? 'Офицер'
                                                      : 'Рядовой'}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '10px', opacity: 0.4 }}>{timestampStr}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.4' }}>{msg.text}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Chat Input */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Напишите сообщение в чат клана..."
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMessage();
                            }}
                            style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.4)',
                                border: `1.5px solid ${colors.border}`,
                                borderRadius: '10px',
                                color: '#fff',
                                padding: '10px 14px',
                                outline: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = colors.accent)}
                            onBlur={(e) => (e.target.style.borderColor = colors.border)}
                        />
                        <button
                            onClick={handleSendMessage}
                            style={{
                                padding: '10px 16px',
                                background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            ОТПРАВИТЬ
                        </button>
                    </div>
                </div>

                {/* MOTD PANEL */}
                <div
                    style={{
                        flex: 1,
                        background: colors.card,
                        borderRadius: '15px',
                        border: `1px solid ${colors.border}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        minHeight: '280px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: colors.accent,
                                textTransform: 'uppercase',
                            }}
                        >
                            Сообщение дня
                        </div>
                        {isLeaderOrOfficer && (
                            <button
                                onClick={() => setIsEditingMOTD(!isEditingMOTD)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                }}
                            >
                                📝
                            </button>
                        )}
                    </div>

                    {isEditingMOTD ? (
                        <textarea
                            autoFocus
                            value={clanMOTD}
                            onChange={(e) => setClanMOTD(e.target.value)}
                            onBlur={() => setIsEditingMOTD(false)}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: `1px solid ${colors.accent}`,
                                borderRadius: '10px',
                                color: '#fff',
                                padding: '10px',
                                outline: 'none',
                                resize: 'none',
                                flex: 1,
                                fontStyle: 'italic',
                                fontSize: '13px',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                color: colors.text,
                                fontStyle: 'italic',
                                opacity: 0.9,
                                lineHeight: '1.6',
                                fontSize: '13px',
                            }}
                        >
                            {clanMOTD}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
