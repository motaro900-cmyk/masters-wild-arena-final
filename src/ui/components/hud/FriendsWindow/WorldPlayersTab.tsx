import React from 'react';
import { motion } from 'framer-motion';
import { resolveAssetPath } from '../../../../utils/assetPath';
import { useGameStore } from '../../../../store/useGameStore';

interface WorldPlayersTabProps {
    isLoadingWorld: boolean;
    colors: any;
    paginatedWorldPlayers: any[];
    totalPages: number;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    handleSendFriendRequest: (targetPlayerId: string, targetPlayerName: string) => Promise<boolean>;
}

export const WorldPlayersTab: React.FC<WorldPlayersTabProps> = ({
    isLoadingWorld,
    colors,
    paginatedWorldPlayers,
    totalPages,
    currentPage,
    setCurrentPage,
    handleSendFriendRequest,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: '400px' }}>
            {isLoadingWorld ? (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.accent, fontWeight: 800 }}>
                    ЗАГРУЗКА ИГРОКОВ...
                </div>
            ) : (
                <>
                    {paginatedWorldPlayers.map((p: any) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                background: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 12,
                                padding: '10px 15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    width: 45,
                                    height: 45,
                                    background: '#1a1008',
                                    borderRadius: 8,
                                    border: `2px solid ${colors.border}`,
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `url(${(p.фото || p.avatar || '').startsWith('http') ? p.фото || p.avatar : resolveAssetPath(`/assets/images/avatars/${(p.фото || p.avatar || 'панда.webp').replace(/\.(png|webp)$/, '')}.webp`)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
                                {/* Зеленый индикатор ОНЛАЙН */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 2,
                                        right: 2,
                                        width: 10,
                                        height: 10,
                                        background: '#22c55e',
                                        borderRadius: '50%',
                                        border: '1.5px solid #1a1008',
                                        boxShadow: '0 0 5px rgba(34,197,94,0.8)',
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: '#fff',
                                    }}
                                >
                                    {p.имя || p.name ? (p.имя || p.name).split(' ')[0] : 'Мастер'}
                                </div>
                                <div style={{ fontSize: 9, opacity: 0.6 }}>
                                    ID: {p.id} • LVL {p.уровень || p.level || 1}
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={async () => {
                                    const ok = await handleSendFriendRequest(p.id, p.name);
                                    if (ok) useGameStore.getState().showAlert('Запрос отправлен!');
                                }}
                                style={{
                                    width: 32,
                                    height: 32,
                                    background: colors.accent,
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    color: '#000',
                                    fontWeight: 900,
                                }}
                            >
                                +
                            </motion.button>
                        </motion.div>
                    ))}

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 15,
                                marginTop: '15px',
                                padding: '10px 0',
                            }}
                        >
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${colors.border}`,
                                    color: colors.accent,
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    opacity: currentPage === 1 ? 0.3 : 1,
                                    fontSize: 11,
                                    fontWeight: 900,
                                }}
                            >
                                НАЗАД
                            </button>
                            <span style={{ fontSize: 12, color: '#fff', opacity: 0.8, fontWeight: 700 }}>
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${colors.border}`,
                                    color: colors.accent,
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    opacity: currentPage === totalPages ? 0.3 : 1,
                                    fontSize: 11,
                                    fontWeight: 900,
                                }}
                            >
                                ВПЕРЕД
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
