import React, { useState } from 'react';
import { RealPlayer, Section, inputStyle, btnStyle } from '../AdminShared';
import { syncService } from '../../../../../services/SyncService';
import { audioService } from '../../../../../services/AudioService';
import { AssetsMap } from '../../../../../configs/AssetsMap';
import { useGameStore } from '../../../../../store/useGameStore';

interface PlayerModerationPanelProps {
    selectedPlayer: RealPlayer;
    onRefresh: () => void;
    onSendMail: () => void;
}

export const PlayerModerationPanel: React.FC<PlayerModerationPanelProps> = ({
    selectedPlayer,
    onRefresh,
    onSendMail,
}) => {
    const [banDuration, setBanDuration] = useState('24h');
    const [muteDuration, setMuteDuration] = useState('1h');
    const [modReason, setModReason] = useState('');

    return (
        <>
            {/* Логи жалоб */}
            <Section title="КОНТЕКСТ ЖАЛОБ (Report Logs)">
                <div
                    style={{
                        background: '#050505',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#888',
                        maxHeight: '80px',
                        overflowY: 'auto',
                    }}
                >
                    {selectedPlayer.reportLogs.length > 0
                        ? selectedPlayer.reportLogs.map((log, i) => (
                              <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid #111' }}>
                                  • {log}
                              </div>
                          ))
                        : 'История жалоб пуста'}
                </div>
            </Section>

            {/* Панель модерации */}
            <Section title="МОДЕРАЦИЯ">
                <input
                    type="text"
                    placeholder="Укажите причину..."
                    style={{ ...inputStyle, marginBottom: '10px' }}
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                />

                {/* Бан и Мут */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        marginBottom: '10px',
                    }}
                >
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <select
                            value={banDuration}
                            onChange={(e) => setBanDuration(e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                        >
                            <option value="1h">1 Час</option>
                            <option value="24h">1 День</option>
                            <option value="7d">7 Дней</option>
                            <option value="perm">Перманент</option>
                        </select>
                        <button
                            onClick={async () => {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                try {
                                    await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                        status: 'BANNED',
                                        banReason: modReason,
                                        banUntil: banDuration,
                                    });
                                    useGameStore.getState().showAlert(`Игрок ${selectedPlayer.name} ЗАБАНЕН`);
                                    onRefresh();
                                } catch {
                                    useGameStore.getState().showAlert('Ошибка при бане');
                                }
                            }}
                            style={{
                                ...btnStyle,
                                background: '#431b1b',
                                color: '#ff4d4d',
                                padding: '0 15px',
                            }}
                        >
                            БАН
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <select
                            value={muteDuration}
                            onChange={(e) => setMuteDuration(e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                        >
                            <option value="1h">1 Час</option>
                            <option value="24h">1 День</option>
                        </select>
                        <button
                            onClick={async () => {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                try {
                                    await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                        isMuted: true,
                                        muteReason: modReason,
                                        muteUntil: muteDuration,
                                    });
                                    useGameStore.getState().showAlert(`Игрок ${selectedPlayer.name} получил МУТ`);
                                    onRefresh();
                                } catch {
                                    useGameStore.getState().showAlert('Ошибка при муте');
                                }
                            }}
                            style={{ ...btnStyle, padding: '0 15px' }}
                        >
                            МУТ
                        </button>
                    </div>
                </div>

                {/* Кик и сброс рейтинга */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button
                        onClick={async () => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore.getState().showConfirm(`Кикнуть игрока ${selectedPlayer.name}?`, async () => {
                                try {
                                    await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                        status: 'KICKED',
                                    });
                                    useGameStore.getState().showAlert('Игрок кикнут');
                                    onRefresh();
                                } catch {
                                    useGameStore.getState().showAlert('Ошибка при кике');
                                }
                            });
                        }}
                        style={{ ...btnStyle, flex: 1, background: '#301010', color: '#fff' }}
                    >
                        КИКНУТЬ (Disconnect)
                    </button>
                    <button
                        onClick={async () => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore.getState().showConfirm('Сбросить рейтинг игрока?', async () => {
                                try {
                                    await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                        rating: 0,
                                    });
                                    useGameStore.getState().showAlert('Рейтинг сброшен');
                                    onRefresh();
                                } catch {
                                    useGameStore.getState().showAlert('Ошибка сброса');
                                }
                            });
                        }}
                        style={{ ...btnStyle, flex: 1 }}
                    >
                        СБРОСИТЬ РЕЙТИНГ
                    </button>
                </div>

                {/* Вайп и письмо */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={async () => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore
                                .getState()
                                .showConfirm(
                                    `ВНИМАНИЕ: Выполнить полный вайп игрока ${selectedPlayer.name}?`,
                                    async () => {
                                        try {
                                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                gold: 0,
                                                crystals: 0,
                                                level: 1,
                                                rating: 0,
                                                inventory: [],
                                                equipment: {
                                                    WEAPONS: null,
                                                    HELMETS: null,
                                                    ARMOR: null,
                                                    SHIELDS: null,
                                                    SHOULDERS: null,
                                                    PANTS: null,
                                                    BOOTS: null,
                                                },
                                                fullStateJSON: '',
                                            });
                                            useGameStore.getState().showAlert('Аккаунт полностью очищен');
                                            onRefresh();
                                        } catch {
                                            useGameStore.getState().showAlert('Ошибка при вайпе');
                                        }
                                    },
                                );
                        }}
                        style={{
                            ...btnStyle,
                            flex: 1.5,
                            background: '#601010',
                            color: '#fff',
                            fontWeight: 'bold',
                        }}
                    >
                        ПОЛНЫЙ ВАЙП АККАУНТА 🔥
                    </button>
                    <button
                        onClick={onSendMail}
                        style={{
                            ...btnStyle,
                            flex: 1,
                            background: '#1b4332',
                            color: '#4dff4d',
                        }}
                    >
                        ОТПРАВИТЬ ПИСЬМО ✉️
                    </button>
                </div>
            </Section>
        </>
    );
};
