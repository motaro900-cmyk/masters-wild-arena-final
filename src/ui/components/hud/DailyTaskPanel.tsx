import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { QUESTS_POOL } from '../../../configs/QuestsConfig';
import { AssetsMap } from '../../../configs/AssetsMap';

export const DailyTaskPanel: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { dailyQuests, claimQuestReward, lastDailyRefresh } = useGameStore();

    const getTimeRemaining = () => {
        const nextRefresh = lastDailyRefresh + (24 * 60 * 60 * 1000);
        const diff = nextRefresh - Date.now();
        if (diff <= 0) return "0h 0m";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div style={{
            backgroundImage: `url(${AssetsMap.UI.PANEL_QUEST})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            width: 300,
            height: isCollapsed ? 60 : 380,
            padding: '15px 20px',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
            transition: 'height 0.3s ease-in-out',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* HEADER */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: isCollapsed ? 0 : 10,
                    position: 'relative'
                }}
            >
                <h3 style={{
                    margin: 0,
                    fontFamily: "'Cinzel', serif",
                    fontSize: 14,
                    fontWeight: 900,
                    color: '#3d2a10',
                    textAlign: 'center',
                    letterSpacing: '1px'
                }}>
                    ЕЖЕДНЕВНЫЕ ЗАДАНИЯ
                </h3>
                <span style={{
                    position: 'absolute',
                    right: 0,
                    fontSize: 12,
                    color: '#3d2a10',
                    transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                }}>
                    ▲
                </span>
            </div>

            {!isCollapsed && (
                <AnimatePresence>
                    <motion.div 
                        key="task-list-content"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, overflowY: 'auto' }}
                        className="custom-scrollbar"
                    >
                        {dailyQuests.filter(dq => dq.questId).map((dq, index) => {
                            const qData = QUESTS_POOL.find(q => q.id === dq.questId);
                            if (!qData) return null;

                            const isComplete = dq.progress >= qData.target;
                            
                            return (
                                <div key={`quest-item-${dq.questId}-${index}`} style={{
                                    padding: '8px 0',
                                    borderBottom: '1px solid rgba(61, 42, 16, 0.1)',
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <div style={{ color: '#3d2a10', fontWeight: 800, fontSize: '12px' }}>{qData.title}</div>
                                        <div style={{ color: isComplete ? '#208040' : '#7a5828', fontWeight: 900, fontSize: '11px' }}>
                                            {dq.progress}/{qData.target} {isComplete && "✓"}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <img src={AssetsMap.UI.ICON_GOLD_FULL} style={{ width: 16, height: 16, objectFit: 'contain' }} alt="" />
                                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#3d2a10' }}>{qData.rewardGold}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <img src={AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" />
                                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#3d2a10' }}>{qData.rewardGems}</span>
                                            </div>
                                        </div>

                                        <div style={{ flex: 1 }} />

                                        {dq.isClaimed ? (
                                            <span style={{ color: '#208040', fontWeight: 900, fontSize: '9px', textTransform: 'uppercase' }}>DONE</span>
                                        ) : isComplete ? (
                                            <button
                                                onClick={() => claimQuestReward(dq.questId)}
                                                style={{
                                                    padding: '3px 8px',
                                                    background: 'linear-gradient(180deg, #f0c040 0%, #c87820 100%)',
                                                    border: '1px solid #3d2a10',
                                                    borderRadius: '4px',
                                                    color: '#fff',
                                                    fontWeight: 900,
                                                    fontSize: '9px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                CLAIM
                                            </button>
                                        ) : (
                                            <div style={{ 
                                                width: '60px', height: '5px', background: 'rgba(0,0,0,0.1)', 
                                                borderRadius: '3px', overflow: 'hidden' 
                                            }}>
                                                <div style={{ 
                                                    width: `${(dq.progress / qData.target) * 100}%`, 
                                                    height: '100%', background: '#7a5828', transition: 'width 0.3s' 
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                    <div style={{ marginTop: '5px', textAlign: 'center', fontSize: '10px', color: '#7a5828', fontWeight: 700 }}>
                        Refresh in: {getTimeRemaining()}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};
