import React, { useState } from 'react';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { syncService } from '../../../../services/SyncService';
import { ITEMS_DATABASE } from '../../../../game/configs/ItemsConfig';
import { useGameStore } from '../../../../store/useGameStore';
import {
    RealPlayer,
    Section,
    inputStyle,
    smallBtnStyle,
    applyBtn,
    btnStyle,
    bigBtnStyle,
    editRow,
    statLabel,
} from './AdminShared';

interface Attachment {
    id: string;
    name: string;
    icon: string;
    amount: number;
    rarity?: string;
}

interface AdminMailTabProps {
    mailRecipient: string;
    setMailRecipient: (id: string) => void;
    realPlayers: RealPlayer[];
}

export const AdminMailTab: React.FC<AdminMailTabProps> = ({ mailRecipient, setMailRecipient, realPlayers }) => {
    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (ПОЧТА) ---
    const [mailSubject, setMailSubject] = useState('');
    const [mailBody, setMailBody] = useState('');
    const [mailAttachments, setMailAttachments] = useState<Attachment[]>([]);
    const [mailAmount, setMailAmount] = useState('500');
    const [selectedMailItem, setSelectedMailItem] = useState('');
    const [isSendingMail, setIsSendingMail] = useState(false);

    const applyMailTemplate = (type: 'REWARD' | 'LAG' | 'WELCOME' | 'MAINTENANCE' | 'GIFT' | 'UPDATE') => {
        if (type === 'REWARD') {
            setMailSubject('🏆 НАГРАДА ЗА ИВЕНТ');
            setMailBody('Поздравляем! Вы проявили невероятную отвагу и мастерство. Вот ваша награда!');
            setMailAmount('1000');
        }
        if (type === 'LAG') {
            setMailSubject('⚙️ КОМПЕНСАЦИЯ');
            setMailBody('Приносим извинения за временные неудобства на сервере. Примите этот небольшой подарок.');
            setMailAmount('250');
        }
        if (type === 'WELCOME') {
            setMailSubject('🐼 ДОБРО ПОЖАЛОВАТЬ!');
            setMailBody('Рады видеть тебя в Masters of the Wild! Удачи в первых сражениях!');
            setMailAmount('50');
        }
        if (type === 'MAINTENANCE') {
            setMailSubject('🛠️ ТЕХНИЧЕСКИЕ РАБОТЫ');
            setMailBody('Сервер был обновлен. Мы исправили ошибки и добавили новый контент. Приятной игры!');
            setMailAmount('500');
        }
        if (type === 'GIFT') {
            setMailSubject('🎁 ПОДАРОК ОТ РАЗРАБОТЧИКОВ');
            setMailBody('Просто так! Потому что вы — лучший игрок. Увидимся в лесу!');
            setMailAmount('100');
        }
        if (type === 'UPDATE') {
            setMailSubject('🆕 ГЛОБАЛЬНОЕ ОБНОВЛЕНИЕ');
            setMailBody('Мастера! Мир изменился. Новые герои, новые враги и новые сокровища ждут вас!');
            setMailAmount('300');
        }
    };

    const handleSendMail = async () => {
        if (!mailSubject || !mailBody) {
            useGameStore.getState().showAlert('Заполните тему и текст!');
            return;
        }
        setIsSendingMail(true);
        try {
            const mailData = {
                from: 'GOD HUB',
                subject: mailSubject,
                body: mailBody,
                date: new Date().toLocaleDateString(),
                tab: 'INBOX',
                rewards: mailAttachments.map((a) => ({
                    type:
                        a.name.toUpperCase() === 'ENERGY'
                            ? 'ENERGY'
                            : a.name.toUpperCase() === 'GEMS'
                              ? 'CRYSTALS'
                              : a.name.toUpperCase() === 'GOLD'
                                ? 'GOLD'
                                : 'ITEM',
                    amount: a.amount,
                    itemId: a.id.startsWith('I') ? a.name : undefined,
                })),
            };

            if (mailRecipient === 'ALL') {
                await syncService.sendBroadcastMail(mailData);
            } else {
                await syncService.sendMail(mailRecipient, mailData);
            }

            useGameStore.getState().showAlert('Письма успешно отправлены! 🚀');
            setMailSubject('');
            setMailBody('');
            setMailAttachments([]);
        } catch (e) {
            console.error('Mail send error:', e);
            useGameStore.getState().showAlert('Ошибка при отправке почты');
        } finally {
            setIsSendingMail(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', height: '700px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Section title="ПОЛУЧАТЕЛЬ">
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button
                            onClick={() => setMailRecipient('ALL')}
                            style={{
                                ...btnStyle,
                                border: mailRecipient === 'ALL' ? '1px solid #ff4d4d' : '1px solid #222',
                                flex: 1,
                            }}
                        >
                            ВСЕМ ИГРОКАМ (Broadcast)
                        </button>
                        <input
                            type="text"
                            placeholder="MW-ID игрока..."
                            style={{ ...inputStyle, flex: 1.2 }}
                            value={mailRecipient === 'ALL' ? '' : mailRecipient}
                            onChange={(e) => setMailRecipient(e.target.value)}
                        />
                    </div>
                    <div style={statLabel}>БЫСТРЫЙ ВЫБОР ИЗ ОНЛАЙНА:</div>
                    <select style={inputStyle} value={mailRecipient} onChange={(e) => setMailRecipient(e.target.value)}>
                        <option value="ALL">-- ВЫБРАТЬ ИГРОКА --</option>
                        {realPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} (LVL {p.level})
                            </option>
                        ))}
                    </select>
                </Section>
                <Section title="СОДЕРЖАНИЕ ПИСЬМА">
                    <input
                        type="text"
                        placeholder="Тема письма..."
                        style={{ ...inputStyle, marginBottom: '10px' }}
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                    />
                    <textarea
                        placeholder="Текст сообщения..."
                        style={{ ...inputStyle, height: '220px' }}
                        value={mailBody}
                        onChange={(e) => setMailBody(e.target.value)}
                    />
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '5px',
                            marginTop: '10px',
                        }}
                    >
                        <button onClick={() => applyMailTemplate('LAG')} style={smallBtnStyle}>
                            ⚙️ Шаблон: Лаги
                        </button>
                        <button
                            onClick={() => applyMailTemplate('REWARD')}
                            style={{ ...smallBtnStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                            <img
                                src={AssetsMap.UI.TROPHY_PREMIUM}
                                style={{ width: '12px', height: '12px', objectFit: 'contain' }}
                                alt="trophy"
                            />
                            Шаблон: Награда
                        </button>
                        <button onClick={() => applyMailTemplate('WELCOME')} style={smallBtnStyle}>
                            🐼 Шаблон: Welcome
                        </button>
                        <button onClick={() => applyMailTemplate('MAINTENANCE')} style={smallBtnStyle}>
                            🛠️ Шаблон: Техработы
                        </button>
                        <button onClick={() => applyMailTemplate('GIFT')} style={smallBtnStyle}>
                            🎁 Шаблон: Подарок
                        </button>
                        <button onClick={() => applyMailTemplate('UPDATE')} style={smallBtnStyle}>
                            🆕 Шаблон: Обнова
                        </button>
                    </div>
                </Section>
                <button
                    onClick={handleSendMail}
                    disabled={isSendingMail}
                    style={{ ...bigBtnStyle, height: '60px', background: '#ff4d4d', fontSize: '16px' }}
                >
                    {isSendingMail ? 'В ПРОЦЕССЕ ОТПРАВКИ...' : 'ОТПРАВИТЬ РАССЫЛКУ 🚀'}
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Section title="ВЛОЖЕНИЯ (Attachments)">
                    <div style={editRow}>
                        <input
                            type="number"
                            style={{ ...inputStyle, flex: 1 }}
                            value={mailAmount}
                            onChange={(e) => setMailAmount(e.target.value)}
                        />
                        <button
                            onClick={() =>
                                setMailAttachments([
                                    ...mailAttachments,
                                    {
                                        id: 'G' + Date.now(),
                                        name: 'Gold',
                                        icon: AssetsMap.UI.ICON_GOLD_FULL,
                                        amount: Number(mailAmount),
                                    },
                                ])
                            }
                            style={applyBtn}
                        >
                            + GOLD
                        </button>
                        <button
                            onClick={() =>
                                setMailAttachments([
                                    ...mailAttachments,
                                    {
                                        id: 'C' + Date.now(),
                                        name: 'Gems',
                                        icon: AssetsMap.UI.ICON_ALMAZ_FULL,
                                        amount: Number(mailAmount),
                                    },
                                ])
                            }
                            style={applyBtn}
                        >
                            + GEMS
                        </button>
                        <button
                            onClick={() =>
                                setMailAttachments([
                                    ...mailAttachments,
                                    {
                                        id: 'E' + Date.now(),
                                        name: 'Energy',
                                        icon: AssetsMap.UI.ICON_ENERGY_FULL,
                                        amount: Number(mailAmount),
                                    },
                                ])
                            }
                            style={applyBtn}
                        >
                            + ENERGY
                        </button>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <select
                            value={selectedMailItem}
                            onChange={(e) => setSelectedMailItem(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">Выбрать предмет из базы...</option>
                            {Object.keys(ITEMS_DATABASE).map((id) => (
                                <option key={id} value={id}>
                                    {id}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() =>
                                selectedMailItem &&
                                setMailAttachments([
                                    ...mailAttachments,
                                    { id: 'I' + Date.now(), name: selectedMailItem, icon: '📦', amount: 1 },
                                ])
                            }
                            style={{ ...btnStyle, width: '100%', marginTop: '5px' }}
                        >
                            ПРИКРЕПИТЬ ПРЕДМЕТ
                        </button>
                    </div>
                </Section>
                <Section title="СПИСОК НАГРАД">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {mailAttachments.length > 0 ? (
                            mailAttachments.map((a) => (
                                <div
                                    key={a.id}
                                    style={{
                                        background: '#111',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #222',
                                        fontSize: '11px',
                                        display: 'flex',
                                        gap: '10px',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        {a.icon && (a.icon.includes('/assets/') || a.icon.endsWith('.webp')) ? (
                                            <img
                                                src={a.icon}
                                                alt=""
                                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            a.icon
                                        )}
                                        <span>
                                            {a.name} x{a.amount}
                                        </span>
                                    </span>
                                    <span
                                        onClick={() => setMailAttachments(mailAttachments.filter((x) => x.id !== a.id))}
                                        style={{ color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        ×
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#222', fontSize: '12px' }}>Вложения отсутствуют</div>
                        )}
                    </div>
                </Section>
                <Section title="ПРЕДПРОСМОТР ПИСЬМА">
                    <div
                        style={{
                            background: '#050505',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '1px dashed #333',
                        }}
                    >
                        <div
                            style={{
                                color: '#f0c040',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginBottom: '8px',
                            }}
                        >
                            {mailSubject || 'БЕЗ ТЕМЫ'}
                        </div>
                        <div style={{ color: '#888', fontSize: '12px', lineHeight: '1.4' }}>
                            {mailBody || 'Текст письма не заполнен...'}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                            {mailAttachments.map((a) => (
                                <div
                                    key={a.id}
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                    }}
                                >
                                    {a.icon && (a.icon.includes('/assets/') || a.icon.endsWith('.webp')) ? (
                                        <img
                                            src={a.icon}
                                            alt=""
                                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        a.icon
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
};
