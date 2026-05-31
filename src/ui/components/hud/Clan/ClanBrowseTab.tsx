import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClanData, MOCK_CLANS, StatItem } from './ClanShared';

interface ClanCardProps {
    clan: ClanData;
    onJoin: () => void;
    colors: any;
    playerTrophies: number;
}

const ClanCard: React.FC<ClanCardProps> = ({ clan, onJoin, colors, playerTrophies }) => {
    const canJoin = playerTrophies >= clan.minTrophies && clan.type !== 'CLOSED';

    return (
        <motion.div
            whileHover={{ x: 5, backgroundColor: 'rgba(240,192,64,0.08)' }}
            style={{
                padding: '20px',
                background: colors.card,
                borderRadius: '15px',
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
            }}
        >
            <div
                style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${colors.accent}44`,
                }}
            >
                <div className={`sprite-clan clan-${clan.emblem}`} style={{ transform: 'scale(1)' }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                        style={{
                            fontSize: '20px',
                            fontWeight: 900,
                            color: colors.accent,
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        {clan.name}
                    </div>
                    <span
                        style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            opacity: 0.7,
                        }}
                    >
                        LVL {clan.level}
                    </span>
                </div>
                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>{clan.motto}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: colors.success,
                        }}
                    >
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.success }} />
                        Онлайн: {clan.onlineCount}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.5 }}>•</div>
                    <div
                        style={{
                            fontSize: '11px',
                            color: playerTrophies >= clan.minTrophies ? colors.text : colors.danger,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                        }}
                    >
                        <div
                            className="sprite-trophy"
                            style={{ width: '14px', height: '14px', backgroundSize: '300% 100%' }}
                        />{' '}
                        Мин: {clan.minTrophies}
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '30px', textAlign: 'center' }}>
                <StatItem label="Участники" value={`${clan.membersCount}/${clan.maxMembers}`} />
                <StatItem label="Трофеи" value={(clan.totalTrophies / 1000).toFixed(1) + 'K'} />
            </div>
            <button
                onClick={canJoin ? onJoin : undefined}
                style={{
                    padding: '10px 20px',
                    background: canJoin ? 'rgba(240,192,64,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${canJoin ? colors.accent : colors.border}`,
                    color: canJoin ? colors.accent : colors.border,
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: canJoin ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                {!canJoin && <span>🔒</span>}
                {clan.type === 'INVITE' ? 'Заявка' : clan.type === 'CLOSED' ? 'Закрыт' : 'Вступить'}
            </button>
        </motion.div>
    );
};

interface ClanBrowseTabProps {
    colors: any;
    playerTrophies: number;
    onJoin: (clan: ClanData) => void;
    onCreateClick: () => void;
}

export const ClanBrowseTab: React.FC<ClanBrowseTabProps> = ({ colors, playerTrophies, onJoin, onCreateClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'TROPHIES' | 'LEVEL' | 'MEMBERS'>('TROPHIES');
    const [isSortOpen, setIsSortOpen] = useState(false);

    const filteredClans = useMemo(() => {
        return MOCK_CLANS.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => {
            if (sortBy === 'TROPHIES') return b.totalTrophies - a.totalTrophies;
            if (sortBy === 'LEVEL') return b.level - a.level;
            if (sortBy === 'MEMBERS') return b.membersCount - a.membersCount;
            return 0;
        });
    }, [searchQuery, sortBy]);

    return (
        <motion.div
            key="browse"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div
                    style={{
                        flex: 1,
                        background: colors.card,
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                    }}
                >
                    <span style={{ fontSize: '20px', opacity: 0.5 }}>🔍</span>
                    <input
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: colors.text,
                            outline: 'none',
                            width: '100%',
                            fontSize: '16px',
                        }}
                    />
                </div>

                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        style={{
                            padding: '12px 24px',
                            background: colors.card,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '12px',
                            color: colors.accent || '#f0c040',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            userSelect: 'none',
                            fontSize: '15px',
                            fontWeight: 700,
                            minWidth: '160px',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>
                            {sortBy === 'TROPHIES' && 'По трофеям'}
                            {sortBy === 'LEVEL' && 'По уровню'}
                            {sortBy === 'MEMBERS' && 'По участникам'}
                        </span>
                        <span
                            style={{
                                fontSize: '10px',
                                transition: 'transform 0.2s',
                                transform: isSortOpen ? 'rotate(180deg)' : 'none',
                                opacity: 0.8,
                            }}
                        >
                            ▼
                        </span>
                    </div>

                    {isSortOpen && (
                        <>
                            <div
                                onClick={() => setIsSortOpen(false)}
                                style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    right: 0,
                                    width: '180px',
                                    background: '#1c150c',
                                    border: `1.5px solid ${colors.border}`,
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                                    zIndex: 1000,
                                    overflow: 'hidden',
                                    padding: '4px 0',
                                }}
                            >
                                {[
                                    { value: 'TROPHIES', label: 'По трофеям' },
                                    { value: 'LEVEL', label: 'По уровню' },
                                    { value: 'MEMBERS', label: 'По участникам' },
                                ].map((opt) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            setSortBy(opt.value as any);
                                            setIsSortOpen(false);
                                        }}
                                        style={{
                                            padding: '10px 16px',
                                            color: sortBy === opt.value ? colors.accent || '#f0c040' : colors.text,
                                            background: sortBy === opt.value ? 'rgba(240,192,64,0.1)' : 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: sortBy === opt.value ? 700 : 500,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(240,192,64,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background =
                                                sortBy === opt.value ? 'rgba(240,192,64,0.1)' : 'transparent';
                                        }}
                                    >
                                        {opt.label}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onCreateClick}
                    style={{
                        padding: '15px 30px',
                        background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#000',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: '0 5px 15px rgba(240,192,64,0.3)',
                        textTransform: 'uppercase',
                        fontSize: '14px',
                    }}
                >
                    Создать
                </motion.button>
            </div>

            <div
                className="leaderboard-scroll"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingRight: '10px',
                }}
            >
                {filteredClans.map((clan) => (
                    <ClanCard
                        key={clan.id}
                        clan={clan}
                        onJoin={() => onJoin(clan)}
                        colors={colors}
                        playerTrophies={playerTrophies}
                    />
                ))}
            </div>
        </motion.div>
    );
};
