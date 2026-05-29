import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClanData, ClanMember, CurrencyIcon, StatBlock, PerkItem } from './ClanShared';

interface ClanLobbyTabProps {
    colors: any;
    clanData: ClanData | null;
    newClanName: string;
    newClanMotto: string;
    selectedEmblem: string;
    clanLevelData: { level: number; xp: number; maxXp: number };
    members: ClanMember[];
    rating: number;
    onDonate: () => void;
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
    onDonate,
    onEditClan,
    onLeave,
}) => {
    const [clanMOTD, setClanMOTD] = useState('Внимание, Мастера! Завтра в 20:00 стартует Клановая Осада.');
    const [isEditingMOTD, setIsEditingMOTD] = useState(false);

    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
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
                    <div
                        className={`sprite-clan clan-${clanData?.emblem || selectedEmblem}`}
                        style={{ transform: 'scale(1.5)' }}
                    />
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
                            height: '10px',
                            borderRadius: '5px',
                            marginTop: '10px',
                            position: 'relative',
                            overflow: 'hidden',
                            width: '250px',
                            border: '1px solid rgba(255,255,255,0.1)',
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
                                fontSize: '8px',
                                top: 0,
                                fontWeight: 900,
                                color: '#fff',
                                textShadow: '1px 1px 2px #000',
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
                        <StatBlock label="ОНЛАЙН" value={`${clanData?.onlineCount || 1}/${members.length}`} />
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
                        gap: '10px',
                        alignItems: 'flex-end',
                    }}
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={onDonate}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(180deg, #4ade80 0%, #166534 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(74,222,128,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        ВКЛАД (1000 <CurrencyIcon type="GOLD" size={16} />)
                    </motion.button>
                    <button
                        onClick={onEditClan}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: `1px solid ${colors.border}`,
                            color: colors.accent,
                            padding: '6px 15px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                        }}
                    >
                        ⚙️ НАСТРОЙКИ
                    </button>
                    <button
                        onClick={onLeave}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            opacity: 0.7,
                        }}
                    >
                        ПОКИНУТЬ КЛАН
                    </button>
                </div>
            </div>

            {/* CHAT / MOTD SECTION */}
            <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
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
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                color: colors.text,
                                fontStyle: 'italic',
                                opacity: 0.9,
                                lineHeight: '1.6',
                            }}
                        >
                            {clanMOTD}
                        </div>
                    )}
                </div>
                <div
                    style={{
                        width: '300px',
                        background: colors.card,
                        borderRadius: '15px',
                        border: `1px solid ${colors.border}`,
                        padding: '20px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: colors.accent,
                            marginBottom: '15px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Бонусы уровня
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <PerkItem icon="💰" label="+5% Золота за бой" locked={(clanData?.level || 1) < 2} />
                        <PerkItem icon="❤️" label="+2% HP зверей" locked={(clanData?.level || 1) < 3} />
                        <PerkItem icon="⚡" label="-10% время сундуков" locked />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
