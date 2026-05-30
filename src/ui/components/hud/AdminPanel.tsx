import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { MOBS_DB } from '../../../configs/MobsConfig';
import { syncService } from '../../../services/SyncService';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { BattleEngine } from '../../../engine/core/BattleEngine';

import { AdminPlayersTab } from './Admin/AdminPlayersTab';
import { AdminServerTab } from './Admin/AdminServerTab';
import { AdminMailTab } from './Admin/AdminMailTab';
import {
    RealPlayer,
    Section,
    ToggleRow,
    btnStyle,
    inputStyle,
    applyBtn,
    bigBtnStyle,
    terminalStyle,
    statLabel,
    contentGrid,
} from './Admin/AdminShared';

const ADMIN_VK_IDS = [212359386, 1035794378];

type AdminTab = 'ИГРОК' | 'БОЙ' | 'СЕРВЕР' | 'ПОЧТА' | 'ЧАТ' | 'ОТЗЫВЫ' | 'СИСТЕМА';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const store = useGameStore();
    const [activeTab, setActiveTab] = useState<AdminTab>('ИГРОК');
    const logEndRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (БОЙ) ---
    const [selectedMobId, setSelectedMobId] = useState(MOBS_DB[0]?.id || '');

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (СЕРВЕР/ПОЧТА ШАРИНГ) ---
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [mailRecipient, setMailRecipient] = useState<'ALL' | string>('ALL');
    const [realPlayers, setRealPlayers] = useState<RealPlayer[]>([]);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (ЧАТ) ---
    const [adminChatMessage, setAdminChatMessage] = useState('');

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (ОТЗЫВЫ) ---
    const [feedbackList, setFeedbackList] = useState<any[]>([]);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

    useEffect(() => {
        if (activeTab === 'ЧАТ') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (activeTab === 'БОЙ') logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [store.messages, store.combatLogs, activeTab]);

    const refreshFeedback = async () => {
        setIsLoadingFeedback(true);
        try {
            const list = await syncService.getAllFeedback();
            setFeedbackList(list);
        } catch (e) {
            console.error('Failed to refresh feedback:', e);
        } finally {
            setIsLoadingFeedback(false);
        }
    };

    const refreshPlayers = async () => {
        setIsLoadingPlayers(true);
        try {
            const players = await syncService.getAllPlayers();
            const mappedPlayers: RealPlayer[] = players.map((p) => {
                const nameVal = p.имя || p.name || 'Unknown';
                const photoVal = p.фото || p.avatar || p.photo || 'https://vk.com/images/camera_100.png';
                const activeScreenVal = p.активныйЭкран || p.activeScreen || 'MAP';
                const lastSeenMillis = p.былВСети?.toMillis?.() || p.lastSeen?.toMillis?.() || 0;
                const statusVal = activeScreenVal === 'BATTLE'
                    ? 'BATTLE'
                    : Date.now() - lastSeenMillis < 300000
                        ? 'ONLINE'
                        : 'OFFLINE';

                // Парсим полноеСостояниеJSON для получения актуальных значений ресурсов игрока в реальном времени
                let parsedState: any = {};
                if (p.полноеСостояниеJSON) {
                    try {
                        parsedState = JSON.parse(p.полноеСостояниеJSON);
                    } catch (e) {
                        console.error('Failed to parse полноеСостояниеJSON in AdminPanel', e);
                    }
                }

                return {
                    id: p.id,
                    vkId: p.vkId || 0,
                    name: nameVal,
                    photo: photoVal,
                    status: p.status === 'BANNED' ? 'BANNED' : statusVal,
                    screen: activeScreenVal,
                    level: parsedState.level !== undefined ? parsedState.level : (p.уровень || p.лев || p.level || 1),
                    gold: parsedState.gold !== undefined ? parsedState.gold : (p.золото !== undefined ? p.золото : (p.gold || 0)),
                    crystals: parsedState.crystals !== undefined ? parsedState.crystals : (p.кристаллы !== undefined ? p.кристаллы : (p.crystals || 0)),
                    regDate: (p.былВСети || p.lastSeen)?.toDate?.().toLocaleDateString() || '10.05.2026',
                    reports: p.reports || 0,
                    reportLogs: p.reportLogs || [],
                    gear: parsedState.heroEquipment || p.снаряжение || p.геройСнаряжение || {},
                    isTest: p.тестовый || false,
                    isDev: p.разработчик || false,
                };
            });
            setRealPlayers(mappedPlayers);
        } catch (e) {
            console.error('Failed to refresh players:', e);
        } finally {
            setIsLoadingPlayers(false);
        }
    };

    useEffect(() => {
        let timer: any;
        if (activeTab === 'СЕРВЕР') {
            timer = setTimeout(() => refreshPlayers(), 0);
        } else if (activeTab === 'ОТЗЫВЫ') {
            timer = setTimeout(() => refreshFeedback(), 0);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [activeTab]);

    const sendAdminChatMessage = () => {
        if (!adminChatMessage.trim()) return;
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        store.addMessage(adminChatMessage, 'СИСТЕМА', 'system');
        setAdminChatMessage('');
    };

    const userVkId = store.vkUser?.id || store.vkUser?.uid;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isAdmin = ADMIN_VK_IDS.includes(Number(userVkId)) || isLocal;

    if (!isAdmin) return null;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ИГРОК':
                return <AdminPlayersTab />;
            case 'БОЙ':
                return (
                    <div style={contentGrid}>
                        <Section title="УПРАВЛЕНИЕ ДВИЖКОМ">
                            <div style={statLabel}>СКОРОСТЬ ВРЕМЕНИ (Time Scale)</div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                                {[0.1, 1, 2, 5, 10].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => store.setTimeScale(s)}
                                        style={{
                                            ...btnStyle,
                                            flex: 1,
                                            border: store.timeScale === s ? '1px solid #ff4d4d' : '1px solid #222',
                                        }}
                                    >
                                        x{s}
                                    </button>
                                ))}
                            </div>
                            <ToggleRow
                                label="БЕССМЕРТИЕ (God Mode)"
                                active={store.isGodMode}
                                onToggle={() => store.setGodMode(!store.isGodMode)}
                            />
                            <ToggleRow
                                label="ONE-SHOT KILL"
                                active={store.isOneShot}
                                onToggle={() => store.setOneShot(!store.isOneShot)}
                            />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    onClick={() => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        BattleEngine.getInstance().instantWin();
                                    }}
                                    style={{ ...btnStyle, flex: 1, background: '#1b4332', padding: '12px' }}
                                >
                                    МГНОВЕННАЯ ПОБЕДА 🏆
                                </button>
                                <button
                                    onClick={() => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        BattleEngine.getInstance().instantLose();
                                    }}
                                    style={{ ...btnStyle, flex: 1, background: '#431b1b', padding: '12px' }}
                                >
                                    ПРОВАЛ БИТВЫ 💀
                                </button>
                            </div>
                            <ToggleRow
                                label="ЗАМОРОЗИТЬ ВРАГА (Freeze)"
                                active={store.isEnemyFrozen}
                                onToggle={() => store.setIsEnemyFrozen && store.setIsEnemyFrozen(!store.isEnemyFrozen)}
                            />
                        </Section>
                        <Section title="СПАВНЕР МОБОВ (Database Check)">
                            <div style={editRow}>
                                <select
                                    value={selectedMobId}
                                    onChange={(e) => setSelectedMobId(e.target.value)}
                                    style={inputStyle}
                                >
                                    {MOBS_DB.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} (HP: {m.baseStats.hp})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() =>
                                        store.addCombatLog(
                                            `ВЫЗВАН: ${MOBS_DB.find((m) => m.id === selectedMobId)?.name}`,
                                        )
                                    }
                                    style={applyBtn}
                                >
                                    SPAWN
                                </button>
                            </div>
                            <div style={statLabel}>ЛОГИ ТЕКУЩЕГО БОЯ:</div>
                            <div style={terminalStyle}>
                                {store.combatLogs?.map((log: string, i: number) => <div key={i}>&gt; {log}</div>) || (
                                    <div>Логи пусты</div>
                                )}
                                <div ref={logEndRef} />
                            </div>
                            <button
                                onClick={() => store.clearCombatLogs()}
                                style={{ ...btnStyle, width: '100%', marginTop: '5px' }}
                            >
                                ОЧИСТИТЬ ТЕРМИНАЛ
                            </button>
                        </Section>
                    </div>
                );
            case 'СЕРВЕР':
                return (
                    <AdminServerTab
                        realPlayers={realPlayers}
                        isLoadingPlayers={isLoadingPlayers}
                        refreshPlayers={refreshPlayers}
                        selectedPlayerId={selectedPlayerId}
                        setSelectedPlayerId={setSelectedPlayerId}
                        setMailRecipient={setMailRecipient}
                        setActiveTab={setActiveTab}
                    />
                );
            case 'ПОЧТА':
                return (
                    <AdminMailTab
                        mailRecipient={mailRecipient}
                        setMailRecipient={setMailRecipient}
                        realPlayers={realPlayers}
                    />
                );
            case 'ЧАТ':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '700px' }}>
                        <div
                            style={{
                                flex: 1,
                                background: '#0a0a0a',
                                border: '1px solid #222',
                                borderRadius: '10px',
                                padding: '20px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                            }}
                        >
                            {store.messages.map((msg: any) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        background: msg.type === 'system' ? 'rgba(255, 77, 77, 0.05)' : '#000',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border:
                                            msg.type === 'system'
                                                ? '1px solid rgba(255, 77, 77, 0.2)'
                                                : '1px solid #111',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: msg.type === 'system' ? '#ff4d4d' : '#3b82f6',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {msg.author} {msg.type === 'system' && '🛡️'}
                                        </span>
                                        <span style={{ color: '#333', fontSize: '10px' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#eee', lineHeight: '1.4' }}>{msg.text}</div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '15px',
                                            marginTop: '10px',
                                            borderTop: '1px solid #111',
                                            paddingTop: '8px',
                                        }}
                                    >
                                        <button
                                            onClick={() => {
                                                setSelectedPlayerId(msg.id);
                                                setActiveTab('СЕРВЕР');
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#555',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                padding: 0,
                                            }}
                                        >
                                            [ПРОФИЛЬ]
                                        </button>
                                        <button
                                            onClick={() => {
                                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                                store.removeMessage(msg.id);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#431b1b',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                padding: 0,
                                            }}
                                        >
                                            [УДАЛИТЬ]
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedPlayerId(msg.id);
                                                setActiveTab('СЕРВЕР');
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#555',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                padding: 0,
                                            }}
                                        >
                                            [МУТ]
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <Section title="ГЛОБАЛЬНОЕ ОБЪЯВЛЕНИЕ (System Broadcast)">
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Напишите сообщение всем игрокам онлайн..."
                                    style={inputStyle}
                                    value={adminChatMessage}
                                    onChange={(e) => setAdminChatMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendAdminChatMessage()}
                                />
                                <button
                                    onClick={sendAdminChatMessage}
                                    style={{
                                        ...applyBtn,
                                        height: 'auto',
                                        padding: '0 25px',
                                        background: '#ff4d4d',
                                        color: '#fff',
                                        fontSize: '12px',
                                    }}
                                >
                                    ОТПРАВИТЬ 📢
                                </button>
                            </div>
                        </Section>
                    </div>
                );
            case 'СИСТЕМА':
                return (
                    <div style={contentGrid}>
                        <Section title="ДВИЖОК & ПРОФАЙЛЕР">
                            <ToggleRow
                                label="SHOW FPS / MEMORY"
                                active={store.showFps}
                                onToggle={() => store.setShowFps(!store.showFps)}
                            />
                            <ToggleRow
                                label="SHOW HITBOXES (Debug Bounds)"
                                active={store.showHitboxes}
                                onToggle={() => store.setShowHitboxes(!store.showHitboxes)}
                            />
                            <div
                                style={{
                                    background: '#050505',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginTop: '15px',
                                    border: '1px solid #111',
                                }}
                            >
                                <div style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>
                                    LIVE ENGINE STATS:
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '10px',
                                        fontSize: '12px',
                                    }}
                                >
                                    <div style={{ color: '#2ecc71' }}>FPS: 60.0</div>
                                    <div style={{ color: '#3498db' }}>DRAW CALLS: 128</div>
                                    <div style={{ color: '#e67e22' }}>MEM: 142MB</div>
                                    <div style={{ color: '#9b59b6' }}>TEXTURES: 44</div>
                                </div>
                            </div>
                        </Section>
                        <Section title="ЭМУЛЯЦИЯ ДИСПЛЕЯ">
                            <div style={statLabel}>ПРЕСЕТЫ РАЗРЕШЕНИЙ:</div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px',
                                    marginBottom: '15px',
                                }}
                            >
                                <button style={btnStyle} onClick={() => alert('PC Preset 1920x1080')}>
                                    PC Full HD
                                </button>
                                <button style={btnStyle} onClick={() => alert('iPhone X Preset')}>
                                    iPhone X (Notch)
                                </button>
                                <button style={btnStyle} onClick={() => alert('iPad Air Preset')}>
                                    iPad Air (4:3)
                                </button>
                                <button style={btnStyle} onClick={() => alert('Android Low-End')}>
                                    Android (Low-Res)
                                </button>
                            </div>
                            <ToggleRow
                                label="SAFE ZONE OVERLAY (Mobile)"
                                active={store.showSafeZone}
                                onToggle={() => store.setShowSafeZone(!store.showSafeZone)}
                            />
                        </Section>
                        <Section title="СЕТЕВАЯ ОТЛАДКА">
                            <div style={statLabel}>СИМУЛЯЦИЯ ПИНГА (Latency):</div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                                {[0, 50, 150, 500, 2000].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => store.setDebugPing(p)}
                                        style={{
                                            ...btnStyle,
                                            flex: 1,
                                            border: store.debugPing === p ? '1px solid #ff4d4d' : '1px solid #222',
                                        }}
                                    >
                                        {p}ms
                                    </button>
                                ))}
                            </div>
                            <ToggleRow
                                label="OFFLINE MODE (Stop Sync)"
                                active={store.isOfflineMode}
                                onToggle={() => store.setOfflineMode(!store.isOfflineMode)}
                            />
                        </Section>
                        <Section title="СИСТЕМНЫЙ СЕРВИС">
                            <button onClick={() => store.copyDebugDump()} style={bigBtnStyle}>
                                СКОПИРОВАТЬ DEBUG DUMP (JSON) 📄
                            </button>
                            <button
                                onClick={() => confirm('ВЫПОЛНИТЬ ПОЛНЫЙ СБРОС?') && localStorage.clear()}
                                style={{ ...bigBtnStyle, background: '#431b1b', color: '#ff4d4d', marginTop: '10px' }}
                            >
                                HARD RESET LOCAL DATA
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('ВНИМАНИЕ! ВЫ ПОДТВЕРЖДАЕТЕ ПОЛНЫЙ СБРОС ВСЕЙ БАЗЫ ДАННЫХ (БЕТА-ВАЙП)?\nЭто действие безвозвратно удалит всех пользователей, чаты и отзывы из Firestore!')) {
                                        try {
                                            await syncService.wipeAllFirestoreCollections();
                                            alert('Вайп базы данных успешно завершен! 🎉');
                                        } catch (err) {
                                            alert('Произошла ошибка при вайпе базы данных: ' + err);
                                        }
                                    }
                                }}
                                style={{ ...bigBtnStyle, background: '#990000', color: '#fff', marginTop: '15px', fontWeight: 'bold' }}
                            >
                                СБРОСИТЬ ВСЮ БАЗУ ДАННЫХ (БЕТА-ВАЙП) 💥
                            </button>
                        </Section>
                    </div>
                );
            case 'ОТЗЫВЫ':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={statLabel}>ПОСЛЕДНИЕ СООБЩЕНИЯ ОТ ИГРОКОВ (Limit 50)</div>
                            <button
                                onClick={refreshFeedback}
                                style={{ ...applyBtn, padding: '5px 15px' }}
                                disabled={isLoadingFeedback}
                            >
                                {isLoadingFeedback ? 'ЗАГРУЗКА...' : 'ОБНОВИТЬ 🔄'}
                            </button>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                            }}
                            className="leaderboard-scroll"
                        >
                            {feedbackList.length > 0 ? (
                                feedbackList.map((f: any) => (
                                    <div
                                        key={f.id}
                                        style={{
                                            background: '#0a0a0a',
                                            border: '1px solid #222',
                                            borderRadius: '12px',
                                            padding: '20px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '12px',
                                                borderBottom: '1px solid #111',
                                                paddingBottom: '8px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <span
                                                    style={{
                                                        background:
                                                            f.category === 'BUG'
                                                                ? '#ef4444'
                                                                : f.category === 'IDEA'
                                                                  ? '#3b82f6'
                                                                  : '#f0c040',
                                                        color: '#fff',
                                                        fontSize: '9px',
                                                        fontWeight: 900,
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                    }}
                                                >
                                                    {f.category}
                                                </span>
                                                <span
                                                    style={{ color: '#f0c040', fontWeight: 'bold', fontSize: '13px' }}
                                                >
                                                    {f.userName || 'Мастер'}
                                                </span>
                                                <span style={{ color: '#444', fontSize: '10px' }}>ID: {f.userId}</span>
                                            </div>
                                            <span style={{ color: '#333', fontSize: '11px' }}>
                                                {new Date(f.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                color: '#ccc',
                                                fontSize: '14px',
                                                lineHeight: 1.6,
                                                whiteSpace: 'pre-wrap',
                                            }}
                                        >
                                            {f.text}
                                        </div>
                                        <div style={{ marginTop: '12px', display: 'flex', gap: '15px' }}>
                                            <div style={{ fontSize: '10px', color: '#444' }}>
                                                LVL: {f.level} | OS: {f.platform} | VER: {f.version}
                                            </div>
                                            <div style={{ flex: 1 }} />
                                            <button
                                                onClick={() => {
                                                    setSelectedPlayerId(f.userId);
                                                    setActiveTab('СЕРВЕР');
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#3b82f6',
                                                    fontSize: '10px',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                }}
                                            >
                                                [ПЕРЕЙТИ К ИГРОКУ]
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div
                                    style={{ textAlign: 'center', marginTop: '200px', opacity: 0.2, fontSize: '40px' }}
                                >
                                    🦉
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1 style={titleStyle}>
                        GOD HUB <span style={{ color: '#444' }}>v3.0 MAXIMUM STATION</span>
                    </h1>
                    <div
                        style={{
                            background: '#111',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            color: '#666',
                            border: '1px solid #222',
                        }}
                    >
                        INDUSTRIAL BUILD
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '25px' }}>
                    {(['ИГРОК', 'БОЙ', 'СЕРВЕР', 'ПОЧТА', 'ЧАТ', 'ОТЗЫВЫ', 'СИСТЕМА'] as AdminTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                setActiveTab(tab);
                            }}
                            style={{
                                ...tabButtonStyle,
                                borderBottom: activeTab === tab ? '2px solid #ff4d4d' : 'none',
                                color: activeTab === tab ? '#fff' : '#444',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        onClose();
                    }}
                    style={closeButtonStyle}
                >
                    ЗАКРЫТЬ
                </button>
            </div>
            <div style={scrollAreaStyle}>{renderTabContent()}</div>
        </div>
    );
};

// --- LAYOUT STYLES ---
const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: 'rgba(5, 5, 5, 0.98)',
    backdropFilter: 'blur(35px)',
    color: '#fff',
    padding: '30px 40px',
    fontFamily: 'monospace',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
};
const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #222',
    paddingBottom: '20px',
    marginBottom: '20px',
};
const titleStyle: React.CSSProperties = {
    margin: 0,
    color: '#ff4d4d',
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '1px',
};
const tabButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '10px 0',
    transition: 'color 0.2s',
};
const closeButtonStyle: React.CSSProperties = {
    background: '#ff4d4d',
    color: '#fff',
    border: 'none',
    padding: '12px 25px',
    cursor: 'pointer',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 4px 15px rgba(255, 77, 77, 0.3)',
};
const scrollAreaStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', paddingRight: '10px' };
const editRow: React.CSSProperties = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' };
