import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClanData, MOCK_CLANS, StatItem } from './ClanShared';
import { ClanEmblemIcon } from '../../GameIcons';
import { useGameStore } from '../../../../store/useGameStore';
import { resolveAssetPath } from '../../../../utils/assetPath';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { ClanInspectModal } from './ClanInspectModal';

interface ClanCardProps {
    clan: ClanData;
    onJoin: () => void;
    onInspect: () => void;
    colors: any;
    playerTrophies: number;
    isAlreadyApplied: boolean;
}

const ClanCard: React.FC<ClanCardProps> = ({ clan, onJoin, onInspect, colors, playerTrophies, isAlreadyApplied }) => {
    const isFull = clan.membersCount >= clan.maxMembers;
    const canJoin = playerTrophies >= clan.minTrophies && clan.type !== 'CLOSED' && !isFull && !isAlreadyApplied;

    return (
        <motion.div
            whileHover={{ 
                x: 4, 
                backgroundColor: 'rgba(240, 192, 64, 0.05)',
                borderColor: colors.accent,
                boxShadow: '0 4px 15px rgba(240, 192, 64, 0.12)'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onInspect}
            style={{
                padding: '16px 20px',
                background: `linear-gradient(135deg, ${colors.card} 0%, rgba(25, 15, 8, 0.85) 100%)`,
                borderRadius: '16px',
                border: `1.5px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <ClanEmblemIcon emblem={clan.emblem} size={64} />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div
                        style={{
                            fontSize: '20px',
                            fontWeight: 900,
                            color: colors.accent,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '0.5px',
                        }}
                    >
                        {clan.name}
                    </div>
                    <span
                        style={{
                            fontSize: '10px',
                            fontWeight: 900,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                            color: '#000',
                            boxShadow: '0 2px 4px rgba(240, 192, 64, 0.2)',
                            textTransform: 'uppercase',
                        }}
                    >
                        Ур. {clan.level}
                    </span>
                </div>
                
                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px', fontStyle: 'italic' }}>
                    «{clan.motto}»
                </div>

                {/* Теги направленности и бонусы */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {clan.tag && (
                        <span
                            style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: 'rgba(240, 192, 64, 0.12)',
                                border: `1px solid ${colors.accent}44`,
                                color: colors.accent,
                                fontWeight: 800,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                            }}
                        >
                            🎯 {clan.tag}
                        </span>
                    )}
                    {clan.bonus && (
                        <span
                            style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: 'rgba(74, 222, 128, 0.1)',
                                border: `1px solid ${colors.success}44`,
                                color: colors.success,
                                fontWeight: 800,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                            }}
                        >
                            ⚡ {clan.bonus}
                        </span>
                    )}
                </div>

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
                        В сети: {clan.onlineCount}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.3 }}>•</div>
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
                        <img
                            src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)}
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                            alt=""
                        />{' '}
                        Кубки: {clan.minTrophies}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', textAlign: 'center', flexShrink: 0 }}>
                <StatItem label="Участники" value={`${clan.membersCount}/${clan.maxMembers}`} />
                <StatItem label="Трофеи" value={(clan.totalTrophies / 1000).toFixed(1) + 'K'} />
            </div>

            <motion.button
                whileHover={canJoin ? { scale: 1.05, backgroundColor: colors.accent, color: '#000' } : {}}
                whileTap={canJoin ? { scale: 0.95 } : {}}
                onClick={canJoin ? (e) => { e.stopPropagation(); onJoin(); } : (e) => e.stopPropagation()}
                style={{
                    padding: '10px 18px',
                    background: canJoin ? 'rgba(240,192,64,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${canJoin ? colors.accent : (isAlreadyApplied ? '#d97706' : colors.border)}`,
                    color: canJoin ? colors.accent : (isAlreadyApplied ? '#fbbf24' : colors.border),
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: canJoin ? 'pointer' : (isAlreadyApplied ? 'default' : 'not-allowed'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    opacity: (canJoin || isAlreadyApplied) ? 1 : 0.5,
                    minWidth: '110px',
                    justifyContent: 'center',
                }}
            >
                {!canJoin && !isAlreadyApplied && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                )}
                {isFull 
                    ? 'ПОЛОН' 
                    : isAlreadyApplied 
                        ? 'ОТПРАВЛЕНО' 
                        : clan.type === 'INVITE' 
                            ? 'ЗАЯВКА' 
                            : clan.type === 'CLOSED' 
                                ? 'ЗАКРЫТ' 
                                : 'ВСТУПИТЬ'}
            </motion.button>
        </motion.div>
    );
};

interface ClanBrowseTabProps {
    colors: any;
    playerTrophies: number;
    onJoin: (clan: ClanData) => void;
    onCreateClick: () => void;
    appliedClans: string[];
    onApply: (clan: ClanData) => void;
}

export const ClanBrowseTab: React.FC<ClanBrowseTabProps> = ({ 
    colors, 
    playerTrophies, 
    onJoin, 
    onCreateClick,
    appliedClans,
    onApply,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'TROPHIES' | 'LEVEL' | 'MEMBERS'>('TROPHIES');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [inspectedClan, setInspectedClan] = useState<ClanData | null>(null);

    // Новые фильтры поиска
    const [hideFull, setHideFull] = useState(false);
    const [onlyOpen, setOnlyOpen] = useState(false);
    const [compatibleTrophies, setCompatibleTrophies] = useState(false);

    const filteredClans = useMemo(() => {
        return MOCK_CLANS.filter((c) => {
            const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesHideFull = !hideFull || c.membersCount < c.maxMembers;
            const matchesOnlyOpen = !onlyOpen || c.type === 'OPEN';
            const matchesCompatible = !compatibleTrophies || playerTrophies >= c.minTrophies;
            return matchesQuery && matchesHideFull && matchesOnlyOpen && matchesCompatible;
        }).sort((a, b) => {
            if (sortBy === 'TROPHIES') return b.totalTrophies - a.totalTrophies;
            if (sortBy === 'LEVEL') return b.level - a.level;
            if (sortBy === 'MEMBERS') return b.membersCount - a.membersCount;
            return 0;
        });
    }, [searchQuery, sortBy, hideFull, onlyOpen, compatibleTrophies, playerTrophies]);

    const handleQuickJoin = () => {
        // Находим лучший подходящий открытый клан
        const bestClan = MOCK_CLANS.find(
            (c) => c.type === 'OPEN' && c.membersCount < c.maxMembers && playerTrophies >= c.minTrophies
        );

        if (bestClan) {
            onJoin(bestClan);
            useGameStore.getState().showAlert(`Успешное вступление в клан ${bestClan.name}!`);
        } else {
            useGameStore.getState().showAlert("Не найдено подходящих открытых кланов для быстрого вступления.");
        }
    };

    return (
        <motion.div
            key="browse"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}
        >
            {/* Верхний ряд управления */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div
                    style={{
                        flex: 1,
                        background: 'rgba(20, 10, 5, 0.4)',
                        borderRadius: '12px',
                        border: `1.5px solid ${colors.border}`,
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        transition: 'border-color 0.2s',
                    }}
                    onFocusCapture={(e) => {
                        e.currentTarget.style.borderColor = colors.accent;
                    }}
                    onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
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
                            fontWeight: 600,
                        }}
                    />
                </div>

                {/* Сортировка */}
                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        style={{
                            padding: '12px 24px',
                            background: colors.card,
                            border: `1.5px solid ${colors.border}`,
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
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.85)',
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

                {/* Создать клан */}
                <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 6px 20px rgba(240,192,64,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCreateClick}
                    style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#000',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(240,192,64,0.25)',
                        textTransform: 'uppercase',
                        fontSize: '14px',
                        letterSpacing: '0.5px',
                    }}
                >
                    Создать
                </motion.button>
            </div>

            {/* Ряд с интерактивными фильтрами и кнопкой Быстрого Вступления */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', padding: '0 4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', userSelect: 'none', fontWeight: 600 }}>
                    <input 
                        type="checkbox" 
                        checked={hideFull} 
                        onChange={(e) => setHideFull(e.target.checked)}
                        style={{
                            accentColor: colors.accent,
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                        }}
                    />
                    Скрыть полные
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', userSelect: 'none', fontWeight: 600 }}>
                    <input 
                        type="checkbox" 
                        checked={onlyOpen} 
                        onChange={(e) => setOnlyOpen(e.target.checked)}
                        style={{
                            accentColor: colors.accent,
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                        }}
                    />
                    Только открытые
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', userSelect: 'none', fontWeight: 600 }}>
                    <input 
                        type="checkbox" 
                        checked={compatibleTrophies} 
                        onChange={(e) => setCompatibleTrophies(e.target.checked)}
                        style={{
                            accentColor: colors.accent,
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                        }}
                    />
                    Подходят мне
                </label>

                <div style={{ flex: 1 }} />

                <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(74, 222, 128, 0.25)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleQuickJoin}
                    style={{
                        padding: '10px 18px',
                        background: 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 8px rgba(74, 222, 128, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <span>⚡</span> БЫСТРЫЙ ВЫБОР
                </motion.button>
            </div>

            {/* Область списка / Заглушка */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <AnimatePresence mode="wait">
                    {filteredClans.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '16px',
                                background: 'rgba(20, 12, 6, 0.4)',
                                borderRadius: '16px',
                                border: `1.5px dashed ${colors.border}`,
                                padding: '40px',
                                textAlign: 'center',
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
                            }}
                        >
                            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={colors.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                            </svg>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: colors.accent, fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
                                    КЛАНЫ НЕ НАЙДЕНЫ
                                </div>
                                <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '6px', maxWidth: '320px', lineHeight: '1.4' }}>
                                    Попробуйте изменить поисковый запрос или сбросить активные фильтры поиска.
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="leaderboard-scroll"
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                paddingRight: '6px',
                                minHeight: 0,
                            }}
                        >
                            {filteredClans.map((clan) => (
                                <ClanCard
                                    key={clan.id}
                                    clan={clan}
                                    onJoin={() => onJoin(clan)}
                                    onInspect={() => setInspectedClan(clan)}
                                    colors={colors}
                                    playerTrophies={playerTrophies}
                                    isAlreadyApplied={appliedClans.includes(clan.id)}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {inspectedClan && (
                    <ClanInspectModal
                        isOpen={!!inspectedClan}
                        onClose={() => setInspectedClan(null)}
                        clan={inspectedClan}
                        colors={colors}
                        playerTrophies={playerTrophies}
                        onJoin={(c) => {
                            onJoin(c);
                            setInspectedClan(null);
                        }}
                        isAlreadyApplied={appliedClans.includes(inspectedClan.id)}
                        onApply={(c) => {
                            onApply(c);
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

