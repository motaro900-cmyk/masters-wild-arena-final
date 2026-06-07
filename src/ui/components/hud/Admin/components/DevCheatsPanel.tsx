import React from 'react';
import { RealPlayer, Section, btnStyle } from '../AdminShared';
import { syncService } from '../../../../../services/SyncService';
import { audioService } from '../../../../../services/AudioService';
import { AssetsMap } from '../../../../../configs/AssetsMap';
import { useGameStore } from '../../../../../store/useGameStore';

interface DevCheatsPanelProps {
    selectedPlayer: RealPlayer;
    onRefresh: () => void;
}

export const DevCheatsPanel: React.FC<DevCheatsPanelProps> = ({ selectedPlayer, onRefresh }) => {
    return (
        <Section title="ПАНЕЛЬ БЫСТРЫХ ЧИТОВ / ХЕЛПЕРЫ РАЗРАБОТЧИКА">
            {/* Первый ряд: скины и герои */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    marginBottom: '15px',
                }}
            >
                <button
                    onClick={async () => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        try {
                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                ownedSkins: ['default', 'panda_frost', 'raccoon_default', 'skin_lava_golem'],
                            });
                            useGameStore.getState().showAlert('Все облики успешно открыты игроку!');
                            onRefresh();
                        } catch {
                            useGameStore.getState().showAlert('Ошибка при выдаче обликов');
                        }
                    }}
                    style={{
                        ...btnStyle,
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        borderColor: '#f59e0b',
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.2)';
                    }}
                >
                    👑 ВЫДАТЬ ВСЕ СКИНЫ
                </button>

                <button
                    onClick={async () => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        try {
                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                ownedHeroes: ['panda', 'raccoon'],
                            });
                            useGameStore.getState().showAlert('Все герои успешно разблокированы игроку!');
                            onRefresh();
                        } catch {
                            useGameStore.getState().showAlert('Ошибка при разблокировке героев');
                        }
                    }}
                    style={{
                        ...btnStyle,
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        borderColor: '#10b981',
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)';
                    }}
                >
                    👥 ОТКРЫТЬ ВСЕХ ГЕРОЕВ
                </button>
            </div>

            {/* Второй ряд: ресурсы, энергия, уровень */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                }}
            >
                <button
                    onClick={async () => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        try {
                            const newGold = selectedPlayer.gold + 100000;
                            const newCrystals = selectedPlayer.crystals + 5000;
                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                gold: newGold,
                                crystals: newCrystals,
                            });
                            useGameStore
                                .getState()
                                .showAlert('Ресурсный пак (+100к золота, +5к кристаллов) успешно начислен!');
                            onRefresh();
                        } catch {
                            useGameStore.getState().showAlert('Ошибка при начислении ресурсов');
                        }
                    }}
                    style={{
                        ...btnStyle,
                        background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)',
                        borderColor: '#eab308',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(234, 179, 8, 0.15)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(234, 179, 8, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.15)';
                    }}
                >
                    💰 +100к, 💎 +5к
                </button>

                <button
                    onClick={async () => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        try {
                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                energy: 9999,
                                maxEnergy: 9999,
                            });
                            useGameStore.getState().showAlert('Энергия игрока установлена на 9999/9999!');
                            onRefresh();
                        } catch {
                            useGameStore.getState().showAlert('Ошибка при установке энергии');
                        }
                    }}
                    style={{
                        ...btnStyle,
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        borderColor: '#0ea5e9',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(14, 165, 233, 0.15)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(14, 165, 233, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(14, 165, 233, 0.15)';
                    }}
                >
                    ⚡ 9999 ЭНЕРГИИ
                </button>

                <button
                    onClick={async () => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        try {
                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                level: 100,
                            });
                            useGameStore.getState().showAlert('Уровень игрока повышен до 100 LVL!');
                            onRefresh();
                        } catch {
                            useGameStore.getState().showAlert('Ошибка при повышении уровня');
                        }
                    }}
                    style={{
                        ...btnStyle,
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                        borderColor: '#8b5cf6',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(139, 92, 246, 0.15)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.15)';
                    }}
                >
                    🌟 УРОВЕНЬ 100
                </button>
            </div>
        </Section>
    );
};
