import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, USERS_COLLECTION } from '../../../../utils/firebase';
import { BaseWindow } from '../BaseWindow';

interface AdminSpectatorModalProps {
    playerId: string;
    playerName: string;
    onClose: () => void;
}

export const AdminSpectatorModal: React.FC<AdminSpectatorModalProps> = ({ playerId, playerName, onClose }) => {
    const [playerState, setPlayerState] = useState<any>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!playerId) return;

        const unsubscribe = onSnapshot(
            doc(db, USERS_COLLECTION, playerId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setPlayerState(docSnap.data());
                } else {
                    setPlayerState(null);
                }
            },
            (error) => {
                console.error('[AdminSpectator] onSnapshot error:', error);
            }
        );

        return () => unsubscribe();
    }, [playerId]);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [playerState?.logActions]);

    if (!playerState) {
        return (
            <BaseWindow title={`НАБЛЮДЕНИЕ: ${playerName}`} isOpen={true} onClose={onClose} width="800px">
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Ожидание данных игрока...</div>
            </BaseWindow>
        );
    }

    const logActions = playerState.logActions || [];
    const currentScreen = playerState.активныйЭкран || playerState.activeScreen || 'MAIN_MENU';

    return (
        <BaseWindow title={`НАБЛЮДЕНИЕ: ${playerName}`} isOpen={true} onClose={onClose} width="850px">
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    padding: '20px',
                    height: '600px',
                }}
            >
                {/* Левая часть - Визуализация состояния */}
                <div
                    style={{
                        background: '#0a0a0a',
                        border: '1px solid #222',
                        borderRadius: '10px',
                        padding: '15px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <h3
                        style={{
                            color: '#f0c040',
                            marginTop: 0,
                            borderBottom: '1px solid #222',
                            paddingBottom: '10px',
                        }}
                    >
                        ТЕКУЩИЙ ЭКРАН: <span style={{ color: '#4dff4d' }}>{currentScreen}</span>
                    </h3>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                        <div
                            style={{
                                background: '#111',
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #333',
                            }}
                        >
                            <div style={{ color: '#888', fontSize: '10px', marginBottom: '5px' }}>РЕСУРСЫ</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ color: '#ffd700', fontWeight: 'bold' }}>💰 {playerState.золото || 0}</div>
                                <div style={{ color: '#00ffff', fontWeight: 'bold' }}>
                                    💎 {playerState.кристаллы || 0}
                                </div>
                                <div style={{ color: '#0ea5e9', fontWeight: 'bold' }}>
                                    ⚡ {playerState.энергия || 0}/{playerState.максЭнергия || 50}
                                </div>
                                <div style={{ color: '#a78bfa', fontWeight: 'bold' }}>
                                    🌟 Ур. {playerState.уровень || 1}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                background: '#111',
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #333',
                            }}
                        >
                            <div style={{ color: '#888', fontSize: '10px', marginBottom: '5px' }}>СТАТИСТИКА БОЕВ</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ color: '#f0c040' }}>Рейтинг: {playerState.рейтинг || 0}</div>
                                <div style={{ color: '#f0c040' }}>Кубки: {playerState.кубки || 0}</div>
                                <div style={{ color: '#4dff4d' }}>Победы: {playerState.победы || 0}</div>
                                <div style={{ color: '#ff4d4d' }}>
                                    Поражения: {(playerState.всегоБоев || 0) - (playerState.победы || 0)}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                background: '#111',
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #333',
                                flex: 1,
                            }}
                        >
                            <div style={{ color: '#888', fontSize: '10px', marginBottom: '5px' }}>
                                ИНВЕНТАРЬ (Кол-во предметов)
                            </div>
                            <div style={{ color: '#bbb', fontSize: '14px' }}>
                                {Object.keys(playerState.инвентарь || {}).length} уникальных предметов
                            </div>
                        </div>
                    </div>
                </div>

                {/* Правая часть - Лог действий */}
                <div
                    style={{
                        background: '#0a0a0a',
                        border: '1px solid #222',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <h3 style={{ color: '#f0c040', margin: 0, padding: '15px', borderBottom: '1px solid #222' }}>
                        ЖУРНАЛ ДЕЙСТВИЙ ИГРОКА
                    </h3>
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '15px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}
                    >
                        {logActions.length === 0 ? (
                            <div style={{ color: '#555', textAlign: 'center', marginTop: '20px' }}>
                                Нет недавних действий...
                            </div>
                        ) : (
                            logActions.map((logStr: string, idx: number) => {
                                // Парсим строку лога (формат: [Время] Действие)
                                const match = logStr.match(/^\[(.*?)\] (.*)$/);
                                const time = match ? match[1] : '';
                                const actionText = match ? match[2] : logStr;

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            background: '#151515',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            borderLeft: '3px solid #3b82f6',
                                            fontSize: '13px',
                                        }}
                                    >
                                        {time && (
                                            <span style={{ color: '#60a5fa', fontSize: '10px', marginRight: '8px' }}>
                                                [{time}]
                                            </span>
                                        )}
                                        <span style={{ color: '#ddd' }}>{actionText}</span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </BaseWindow>
    );
};
