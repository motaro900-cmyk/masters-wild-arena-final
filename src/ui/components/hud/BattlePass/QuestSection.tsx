import React from 'react';
import { motion } from 'framer-motion';

export const QuestSection: React.FC<{
    title: string;
    quests: any[];
    onClaim: (questId: string) => void;
}> = ({ title, quests, onClaim }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
            maxHeight: '640px',
            paddingRight: '10px',
        }}
        className="custom-scrollbar"
    >
        <h3
            style={{
                fontSize: '24px',
                color: '#f0c040',
                fontFamily: "'Cinzel', serif",
                margin: '0 0 10px 0',
                letterSpacing: '2px',
                textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                borderBottom: '2px solid #5c4033',
                paddingBottom: '8px',
            }}
        >
            {title}
        </h3>
        {quests.map((quest) => (
            <motion.div
                key={quest.id}
                className={!quest.isClaimed ? 'bp-quest-card-hover' : ''}
                style={{
                    padding: '20px',
                    background: quest.isClaimed
                        ? 'radial-gradient(circle at center, #110b08 0%, #050302 100%)'
                        : 'radial-gradient(circle at center, #1b120c 0%, #0a0604 100%)',
                    borderRadius: '10px',
                    border: quest.isClaimed
                        ? '2px solid #251810'
                        : quest.canClaim
                          ? '2px solid #ffd700'
                          : '2px solid #5c4033',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    opacity: quest.isClaimed ? 0.5 : 1,
                    boxShadow: quest.canClaim && !quest.isClaimed ? '0 0 15px rgba(240,192,64,0.15)' : 'none',
                }}
            >
                <div
                    style={{
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        filter: quest.isClaimed ? 'grayscale(1)' : 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
                    }}
                >
                    {quest.icon.startsWith('sprite-') ? (
                        <div
                            className={quest.icon}
                            style={{ width: '40px', height: '40px', backgroundSize: '300% 100%' }}
                        />
                    ) : (
                        <span style={{ fontSize: '36px' }}>{quest.icon}</span>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontSize: '18px',
                            fontWeight: 900,
                            marginBottom: '4px',
                            color: quest.canClaim && !quest.isClaimed ? '#ffd700' : '#fff',
                            fontFamily: "'Cinzel', serif",
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                    >
                        {quest.title}
                    </div>
                    <div
                        style={{
                            fontSize: '13px',
                            color: '#c8a870',
                            marginBottom: '12px',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        {quest.description}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div
                            style={{
                                flex: 1,
                                height: '8px',
                                background: '#0d0805',
                                border: '1px solid rgba(240,192,64,0.15)',
                                borderRadius: '4px',
                                padding: '1px',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: `${(quest.progress / quest.target) * 100}%`,
                                    height: '100%',
                                    background:
                                        quest.canClaim || quest.isClaimed
                                            ? 'linear-gradient(90deg, #f0c040 0%, #ffea80 100%)'
                                            : 'linear-gradient(90deg, #8a640f 0%, #ffd700 100%)',
                                    boxShadow: quest.canClaim && !quest.isClaimed ? '0 0 5px #f0c040' : 'none',
                                    borderRadius: '2px',
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: '12px',
                                fontWeight: 900,
                                color: '#ffd700',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            {quest.progress} / {quest.target}
                        </span>
                    </div>
                </div>
                <div
                    style={{
                        textAlign: 'right',
                        minWidth: '110px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '6px',
                    }}
                >
                    <div style={{ fontSize: '16px', fontWeight: 950, color: '#f0c040', fontFamily: "'Cinzel', serif" }}>
                        +{quest.rewardXp} XP
                    </div>
                    {quest.isClaimed ? (
                        <div
                            style={{
                                fontSize: '11px',
                                color: '#10b981',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                            }}
                        >
                            ВЫПОЛНЕНО ✅
                        </div>
                    ) : quest.canClaim ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onClaim(quest.id)}
                            style={{
                                padding: '8px 20px',
                                background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
                                border: '1px solid #ffffff',
                                borderRadius: '4px',
                                color: '#1a0d00',
                                fontWeight: 900,
                                fontSize: '12px',
                                fontFamily: "'Cinzel', serif",
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            }}
                        >
                            ЗАБРАТЬ
                        </motion.button>
                    ) : (
                        <div
                            style={{
                                fontSize: '10px',
                                color: 'rgba(200, 168, 112, 0.4)',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                            }}
                        >
                            В ПРОЦЕССЕ
                        </div>
                    )}
                </div>
            </motion.div>
        ))}
    </div>
);
