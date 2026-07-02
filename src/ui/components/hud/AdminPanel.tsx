import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    mapRawPlayerToRealPlayer,
} from './Admin/AdminShared';

type AdminTab = 'ИГРОК' | 'БОЙ' | 'СЕРВЕР' | 'ПОЧТА' | 'ЧАТ' | 'ОТЗЫВЫ' | 'СИСТЕМА';

// ─── Feedback Tab ─────────────────────────────────────────────────────────────

interface FeedbackTabProps {
    feedbackList: any[];
    isLoadingFeedback: boolean;
    onRefresh: () => void;
    onDelete: (id: string) => void;
    onGoToPlayer: (userId: string) => void;
}

const FEEDBACK_COLUMNS = [
    {
        key: 'BUG',
        label: '🐞 БАГИ',
        color: '#ef4444',
        dimColor: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.25)',
    },
    {
        key: 'IDEA',
        label: '💡 ПРЕДЛОЖЕНИЯ',
        color: '#f59e0b',
        dimColor: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
    },
    {
        key: 'QUESTION',
        label: '💬 ВОПРОСЫ / ДРУГОЕ',
        color: '#3b82f6',
        dimColor: 'rgba(59,130,246,0.08)',
        border: 'rgba(59,130,246,0.25)',
    },
] as const;

const formatFeedbackTime = (ts: number) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const FeedbackTab: React.FC<FeedbackTabProps> = ({
    feedbackList,
    isLoadingFeedback,
    onRefresh,
    onDelete,
    onGoToPlayer,
}) => {
    const [replyingItem, setReplyingItem] = useState<any | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSendingReply, setIsSendingReply] = useState(false);

    const handleSendReply = async () => {
        if (!replyingItem || !replyText.trim()) return;
        setIsSendingReply(true);
        try {
            const mailData = {
                from: 'Поддержка',
                subject: 'Ответ на обращение',
                body: replyText,
                date: new Date().toLocaleDateString('ru-RU'),
                tab: 'INBOX',
                rewards: [],
            };
            await syncService.sendMail(replyingItem.userId, mailData);
            await syncService.deleteFeedback(replyingItem.id);
            useGameStore.getState().showAlert('Ответ отправлен, отзыв закрыт! ✉️✅');
            setReplyingItem(null);
            setReplyText('');
            onRefresh();
        } catch (e) {
            console.error('Failed to send reply:', e);
            useGameStore.getState().showAlert('Ошибка при отправке ответа ❌');
        } finally {
            setIsSendingReply(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: 'auto', position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px', color: '#aaa' }}>
                    ОТЗЫВЫ ИГРОКОВ
                    <span style={{ marginLeft: '10px', fontSize: '11px', color: '#555', fontWeight: 400 }}>
                        (всего: {feedbackList.length})
                    </span>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={isLoadingFeedback}
                    style={{
                        ...applyBtn,
                        padding: '5px 16px',
                        background: isLoadingFeedback ? '#1a1a1a' : undefined,
                        cursor: isLoadingFeedback ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isLoadingFeedback ? 'ЗАГРУЗКА...' : 'ОБНОВИТЬ 🔄'}
                </button>
            </div>

            {/* 3-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', alignItems: 'start' }}>
                {FEEDBACK_COLUMNS.map((col) => {
                    const items = feedbackList.filter((f: any) => f.category === col.key);
                    return (
                        <div
                            key={col.key}
                            style={{
                                background: col.dimColor,
                                border: `1px solid ${col.border}`,
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0',
                                maxHeight: '640px',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Column header */}
                            <div
                                style={{
                                    padding: '12px 14px',
                                    borderBottom: `1px solid ${col.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span
                                    style={{ fontSize: '12px', fontWeight: 900, color: col.color, letterSpacing: '0.5px' }}
                                >
                                    {col.label}
                                </span>
                                <span
                                    style={{
                                        background: col.color,
                                        color: '#000',
                                        fontWeight: 900,
                                        fontSize: '10px',
                                        borderRadius: '20px',
                                        padding: '1px 8px',
                                        minWidth: '22px',
                                        textAlign: 'center',
                                    }}
                                >
                                    {items.length}
                                </span>
                            </div>

                            {/* Cards list */}
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {items.length === 0 ? (
                                    <div
                                        style={{
                                            padding: '30px 14px',
                                            textAlign: 'center',
                                            color: '#444',
                                            fontSize: '12px',
                                        }}
                                    >
                                        Отзывов нет
                                    </div>
                                ) : (
                                    items.map((f: any) => (
                                        <div
                                            key={f.id}
                                            style={{
                                                padding: '12px 14px',
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                            }}
                                        >
                                            {/* Sender row */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '6px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        flex: 1,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <img
                                                        src={f.vkAvatar || f.avatar || '/assets/images/avatars/panda.webp'}
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                        }}
                                                        alt=""
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <span
                                                            style={{
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                color: '#e2e2e2',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {f.userName || 'Игрок'}
                                                        </span>
                                                        {f.realName && (
                                                            <span
                                                                style={{
                                                                    fontSize: '9px',
                                                                    color: '#888',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {f.realName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {f.level > 0 && (
                                                        <span style={{ fontSize: '9px', color: '#888', flexShrink: 0 }}>
                                                            Ур.{f.level}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '9px', color: '#555', flexShrink: 0 }}>
                                                    {formatFeedbackTime(f.timestamp)}
                                                </span>
                                            </div>

                                            {/* Platform / version / vkId */}
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {f.platform && (
                                                    <span
                                                        style={{
                                                            fontSize: '9px',
                                                            color: '#666',
                                                            background: 'rgba(255,255,255,0.04)',
                                                            padding: '1px 6px',
                                                            borderRadius: '4px',
                                                        }}
                                                    >
                                                        {f.platform}
                                                    </span>
                                                )}
                                                {f.version && (
                                                    <span
                                                        style={{
                                                            fontSize: '9px',
                                                            color: '#666',
                                                            background: 'rgba(255,255,255,0.04)',
                                                            padding: '1px 6px',
                                                            borderRadius: '4px',
                                                        }}
                                                    >
                                                        {f.version}
                                                    </span>
                                                )}
                                                {f.vkId && (
                                                    <a
                                                        href={`https://vk.com/away.php?to=https://vk.com/id${f.vkId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            fontSize: '9px',
                                                            color: '#60a5fa',
                                                            background: 'rgba(96,165,250,0.1)',
                                                            border: '1px solid rgba(96,165,250,0.2)',
                                                            padding: '1px 6px',
                                                            borderRadius: '4px',
                                                            textDecoration: 'none',
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        🔗 VK ID: {f.vkId}
                                                    </a>
                                                )}
                                            </div>

                                            {/* Feedback text */}
                                            <div
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#ccc',
                                                    lineHeight: '1.5',
                                                    background: 'rgba(0,0,0,0.25)',
                                                    padding: '8px 10px',
                                                    borderRadius: '7px',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {f.text}
                                            </div>

                                            {f.debugDump && (
                                                <details style={{ marginTop: '2px' }}>
                                                    <summary style={{ fontSize: '9px', color: '#f59e0b', cursor: 'pointer', outline: 'none', userSelect: 'none', fontWeight: 700 }}>
                                                        📄 ДИАГНОСТИКА
                                                    </summary>
                                                    <pre style={{
                                                        fontSize: '9px',
                                                        fontFamily: 'monospace',
                                                        color: '#aaa',
                                                        background: '#050505',
                                                        padding: '6px',
                                                        borderRadius: '4px',
                                                        marginTop: '4px',
                                                        maxHeight: '100px',
                                                        overflowY: 'auto',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-all',
                                                        border: '1px solid #222'
                                                    }}>
                                                        {JSON.stringify(f.debugDump, null, 2)}
                                                    </pre>
                                                </details>
                                            )}

                                            {/* Action buttons */}
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                                <button
                                                    onClick={() => onDelete(f.id)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '5px 0',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(74,222,128,0.3)',
                                                        background: 'rgba(74,222,128,0.07)',
                                                        color: '#4ade80',
                                                        fontSize: '9px',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        letterSpacing: '0.5px',
                                                    }}
                                                >
                                                    ✅ РЕШЕНО
                                                </button>
                                                {f.userId && (
                                                    <button
                                                        onClick={() => setReplyingItem(f)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '5px 0',
                                                            borderRadius: '6px',
                                                            border: '1px solid rgba(245,158,11,0.3)',
                                                            background: 'rgba(245,158,11,0.07)',
                                                            color: '#f59e0b',
                                                            fontSize: '9px',
                                                            fontWeight: 800,
                                                            cursor: 'pointer',
                                                            letterSpacing: '0.5px',
                                                        }}
                                                    >
                                                        ✉️ ОТВЕТИТЬ
                                                    </button>
                                                )}
                                                {f.userId && (
                                                    <button
                                                        onClick={() => onGoToPlayer(f.userId)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '5px 0',
                                                            borderRadius: '6px',
                                                            border: '1px solid rgba(96,165,250,0.3)',
                                                            background: 'rgba(96,165,250,0.07)',
                                                            color: '#60a5fa',
                                                            fontSize: '9px',
                                                            fontWeight: 800,
                                                            cursor: 'pointer',
                                                            letterSpacing: '0.5px',
                                                        }}
                                                    >
                                                        👤 ИГРОК
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {replyingItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100000,
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: '#0e0e10',
                                border: '1px solid #c8952a',
                                borderRadius: '12px',
                                width: '480px',
                                padding: '24px',
                                boxShadow: '0 0 25px rgba(200, 149, 42, 0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.5px' }}>
                                    ОТВЕТИТЬ ИГРОКУ: {replyingItem.userName}
                                </span>
                                <button
                                    onClick={() => setReplyingItem(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#666',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        padding: '4px',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>ОТЗЫВ ИГРОКА:</div>
                                <div style={{ fontSize: '12px', color: '#ccc', fontStyle: 'italic' }}>
                                    "{replyingItem.text}"
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: '#aaa', fontWeight: 700 }}>ТЕКСТ ОТВЕТА (ПИСЬМО В ИГРЕ):</label>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={4}
                                    placeholder="Привет! Спасибо за отзыв. Мы проверили ваше обращение..."
                                    style={{
                                        background: '#050505',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        padding: '10px',
                                        fontSize: '12px',
                                        outline: 'none',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button
                                    onClick={() => setReplyingItem(null)}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        color: '#aaa',
                                        padding: '8px 16px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ОТМЕНА
                                </button>
                                <button
                                    onClick={handleSendReply}
                                    disabled={isSendingReply || !replyText.trim()}
                                    style={{
                                        background: '#f59e0b',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: '#000',
                                        padding: '8px 20px',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        cursor: isSendingReply || !replyText.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isSendingReply || !replyText.trim() ? 0.5 : 1,
                                    }}
                                >
                                    {isSendingReply ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ ОТВЕТ ✉️'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AdminPanelContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const messages = useGameStore((state) => state.messages);
    const combatLogs = useGameStore((state) => state.combatLogs);
    const timeScale = useGameStore((state) => state.timeScale);
    const isGodMode = useGameStore((state) => state.isGodMode);
    const isOneShot = useGameStore((state) => state.isOneShot);
    const isEnemyFrozen = useGameStore((state) => state.isEnemyFrozen);
    const showFps = useGameStore((state) => state.showFps);
    const showHitboxes = useGameStore((state) => state.showHitboxes);
    const showSafeZone = useGameStore((state) => state.showSafeZone);
    const debugPing = useGameStore((state) => state.debugPing);
    const isOfflineMode = useGameStore((state) => state.isOfflineMode);

    const [activeTab, setActiveTab] = useState<AdminTab>('ИГРОК');
    const logEndRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [selectedMobId, setSelectedMobId] = useState(MOBS_DB[0]?.id || '');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [mailRecipient, setMailRecipient] = useState<'ALL' | string>('ALL');
    const [realPlayers, setRealPlayers] = useState<RealPlayer[]>([]);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
    const [adminChatMessage, setAdminChatMessage] = useState('');
    const [feedbackList, setFeedbackList] = useState<any[]>([]);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

    useEffect(() => {
        if (activeTab === 'ЧАТ') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (activeTab === 'БОЙ') logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, combatLogs, activeTab]);

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
            const mappedPlayers = players.map(mapRawPlayerToRealPlayer);
            setRealPlayers(mappedPlayers);
        } catch (e) {
            console.error('Failed to refresh players:', e);
        } finally {
            setIsLoadingPlayers(false);
        }
    };

    useEffect(() => {
        let timer: any;
        let unsubscribePlayers: (() => void) | null = null;

        if (activeTab === 'ИГРОК' || activeTab === 'СЕРВЕР') {
            timer = setTimeout(() => refreshPlayers(), 0);
            unsubscribePlayers = syncService.subscribeToAllPlayers((players) => {
                const mappedPlayers = players.map(mapRawPlayerToRealPlayer);
                setRealPlayers(mappedPlayers);
            });
        } else if (activeTab === 'ОТЗЫВЫ') {
            timer = setTimeout(() => refreshFeedback(), 0);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (unsubscribePlayers) unsubscribePlayers();
        };
    }, [activeTab]);

    const sendAdminChatMessage = () => {
        if (!adminChatMessage.trim()) return;
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        useGameStore.getState().addMessage(adminChatMessage, 'СИСТЕМА', 'system');
        setAdminChatMessage('');
    };

    const handleDeleteFeedback = async (id: string) => {
        try {
            await syncService.deleteFeedback(id);
            setFeedbackList((prev) => prev.filter((f: any) => f.id !== id));
        } catch (e) {
            console.error('Failed to delete feedback:', e);
            useGameStore.getState().showAlert('Ошибка при удалении отзыва ❌');
        }
    };

    const handleGoToPlayer = (userId: string) => {
        if (!userId) return;
        setSelectedPlayerId(userId);
        setActiveTab('ИГРОК');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ИГРОК':
                return (
                    <AdminPlayersTab
                        selectedPlayerId={selectedPlayerId}
                        onSelectPlayer={setSelectedPlayerId}
                        realPlayers={realPlayers}
                        isLoadingPlayers={isLoadingPlayers}
                        refreshPlayers={refreshPlayers}
                        setMailRecipient={setMailRecipient}
                        setActiveTab={setActiveTab}
                    />
                );
            case 'БОЙ':
                return (
                    <div style={contentGrid}>
                        <Section title="УПРАВЛЕНИЕ ДВИЖКОМ">
                            <div style={statLabel}>СКОРОСТЬ ВРЕМЕНИ (Time Scale)</div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                                {[0.1, 1, 2, 5, 10].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => useGameStore.getState().setTimeScale(s)}
                                        style={{
                                            ...btnStyle,
                                            flex: 1,
                                            border: timeScale === s ? '1px solid #ff4d4d' : '1px solid #222',
                                        }}
                                    >
                                        x{s}
                                    </button>
                                ))}
                            </div>
                            <ToggleRow
                                label="БЕССМЕРТИЕ (God Mode)"
                                active={isGodMode}
                                onToggle={() => useGameStore.getState().setGodMode(!isGodMode)}
                            />
                            <ToggleRow
                                label="ONE-SHOT KILL"
                                active={isOneShot}
                                onToggle={() => useGameStore.getState().setOneShot(!isOneShot)}
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
                                active={isEnemyFrozen}
                                onToggle={() => {
                                    const action = useGameStore.getState().setIsEnemyFrozen;
                                    if (action) action(!isEnemyFrozen);
                                }}
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
                                        useGameStore
                                            .getState()
                                            .addCombatLog(
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
                                {combatLogs?.map((log: string, i: number) => <div key={i}>&gt; {log}</div>) || (
                                    <div>Логи пусты</div>
                                )}
                                <div ref={logEndRef} />
                            </div>
                            <button
                                onClick={() => useGameStore.getState().clearCombatLogs()}
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
                    <div
                        className="h-[500px] lg:h-[700px]"
                        style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
                    >
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
                            {messages.map((msg: any) => (
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
                                                useGameStore.getState().removeMessage(msg.id);
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
                                active={showFps}
                                onToggle={() => useGameStore.getState().setShowFps(!showFps)}
                            />
                            <ToggleRow
                                label="SHOW HITBOXES (Debug Bounds)"
                                active={showHitboxes}
                                onToggle={() => useGameStore.getState().setShowHitboxes(!showHitboxes)}
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
                                <button
                                    style={btnStyle}
                                    onClick={() => useGameStore.getState().showAlert('PC Preset 1920x1080')}
                                >
                                    PC Full HD
                                </button>
                                <button
                                    style={btnStyle}
                                    onClick={() => useGameStore.getState().showAlert('iPhone X Preset')}
                                >
                                    iPhone X (Notch)
                                </button>
                            </div>
                            <ToggleRow
                                label="SAFE ZONE OVERLAY (Mobile)"
                                active={showSafeZone}
                                onToggle={() => useGameStore.getState().setShowSafeZone(!showSafeZone)}
                            />
                        </Section>
                        <Section title="СЕТЕВАЯ ОТЛАДКА">
                            <div style={statLabel}>СИМУЛЯЦИЯ ПИНГА (Latency):</div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                                {[0, 50, 150, 500, 2000].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => useGameStore.getState().setDebugPing(p)}
                                        style={{
                                            ...btnStyle,
                                            flex: 1,
                                            border: debugPing === p ? '1px solid #ff4d4d' : '1px solid #222',
                                        }}
                                    >
                                        {p}ms
                                    </button>
                                ))}
                            </div>
                            <ToggleRow
                                label="OFFLINE MODE (Stop Sync)"
                                active={isOfflineMode}
                                onToggle={() => useGameStore.getState().setOfflineMode(!isOfflineMode)}
                            />
                        </Section>
                        <Section title="СИСТЕМНЫЙ СЕРВИС">
                            <button onClick={() => useGameStore.getState().copyDebugDump()} style={bigBtnStyle}>
                                СКОПИРОВАТЬ DEBUG DUMP (JSON) 📄
                            </button>
                            <button
                                onClick={() => {
                                    useGameStore.getState().showConfirm('ВЫПОЛНИТЬ ПОЛНЫЙ СБРОС?', () => {
                                        localStorage.clear();
                                        useGameStore.getState().resetStore();
                                        window.location.reload();
                                    });
                                }}
                                style={{ ...bigBtnStyle, background: '#431b1b', color: '#ff4d4d', marginTop: '10px' }}
                            >
                                HARD RESET LOCAL DATA
                            </button>
                        </Section>
                    </div>
                );
            case 'ОТЗЫВЫ':
                return (
                    <FeedbackTab
                        feedbackList={feedbackList}
                        isLoadingFeedback={isLoadingFeedback}
                        onRefresh={refreshFeedback}
                        onDelete={handleDeleteFeedback}
                        onGoToPlayer={handleGoToPlayer}
                    />
                );
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>
                    GOD HUB <span style={{ color: '#444' }}>v3.0</span>
                </h1>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
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
                                color: activeTab === tab ? '#fff' : '#888',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} style={closeButtonStyle}>
                    ЗАКРЫТЬ
                </button>
            </div>
            <div style={scrollAreaStyle}>{renderTabContent()}</div>
        </div>
    );
};

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const isAdmin = useGameStore((state) => state.isAdmin);

    if (!isAdmin) return null;

    return <AdminPanelContent onClose={onClose} />;
};

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: 'rgba(5, 5, 5, 0.98)',
    color: '#fff',
    padding: '20px 20px',
    fontFamily: 'monospace',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
    overflowY: 'auto',
};
const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #222',
    paddingBottom: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px',
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
    fontSize: '16px',
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
    fontSize: '16px',
    boxShadow: '0 4px 15px rgba(255, 77, 77, 0.3)',
};
const scrollAreaStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', paddingRight: '10px' };
const editRow: React.CSSProperties = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' };
