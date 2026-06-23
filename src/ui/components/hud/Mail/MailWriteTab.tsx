import React from 'react';
import { motion } from 'framer-motion';

const colors = {
    text: '#e8d8a8',
    accent: '#f0c040',
    card: 'rgba(255,255,255,0.03)',
    border: 'rgba(240,192,64,0.15)',
    danger: '#ef4444',
    success: '#22c55e',
    input: 'rgba(0,0,0,0.3)',
};

interface MailWriteTabProps {
    friends: any[];
    recipientId: string;
    setRecipientId: (id: string) => void;
    manualRecipientId: string;
    setManualRecipientId: (id: string) => void;
    writeSubject: string;
    setWriteSubject: (subj: string) => void;
    writeBody: string;
    setWriteBody: (body: string) => void;
    handleSendPersonalMail: () => void;
    isDropdownOpen: boolean;
    setIsDropdownOpen: (open: boolean) => void;
    dropdownRef: React.RefObject<HTMLDivElement>;
}

export const MailWriteTab: React.FC<MailWriteTabProps> = ({
    friends,
    recipientId,
    setRecipientId,
    manualRecipientId,
    setManualRecipientId,
    writeSubject,
    setWriteSubject,
    writeBody,
    setWriteBody,
    handleSendPersonalMail,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
}) => {
    return (
        <motion.div
            key="write"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                padding: '20px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '15px',
                border: `1px solid ${colors.border}`,
            }}
        >
            <h3
                style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '18px',
                    color: colors.accent,
                    letterSpacing: '1px',
                    margin: 0,
                }}
            >
                ОТПРАВИТЬ ПИСЬМО
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                    КОМУ:
                </label>
                {friends && friends.length > 0 ? (
                    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                padding: '12px 16px',
                                background: colors.input,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                userSelect: 'none',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                            }}
                        >
                            <span>
                                {recipientId === 'custom'
                                    ? 'Указать ID вручную...'
                                    : recipientId
                                    ? ((friends || []).find((f: any) => f.id === recipientId)?.name ||
                                       (friends || []).find((f: any) => f.id === recipientId)?.username ||
                                       recipientId) + ` (${recipientId})`
                                    : '-- Выберите друга --'}
                            </span>
                            <span style={{
                                fontSize: '10px',
                                color: colors.accent,
                                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                            }}>
                                ▼
                            </span>
                        </div>

                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 4px)',
                                left: 0,
                                width: '100%',
                                maxHeight: '220px',
                                overflowY: 'auto',
                                background: 'rgba(25, 20, 15, 0.98)',
                                border: `1.5px solid ${colors.border}`,
                                borderRadius: '8px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.85), 0 0 15px rgba(240,192,64,0.1)',
                                zIndex: 9999,
                            }}>
                                {friends.map((f: any) => (
                                    <div
                                        key={f.id}
                                        onClick={() => {
                                            setRecipientId(f.id);
                                            setManualRecipientId('');
                                            setIsDropdownOpen(false);
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(240,192,64,0.15)';
                                            e.currentTarget.style.color = colors.accent;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        style={{
                                            padding: '10px 16px',
                                            color: '#fff',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            transition: 'all 0.15s',
                                            textAlign: 'left',
                                        }}
                                    >
                                        {f.name || f.username || f.id} ({f.id})
                                    </div>
                                ))}

                                <div
                                    onClick={() => {
                                        setRecipientId('custom');
                                        setIsDropdownOpen(false);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(240,192,64,0.15)';
                                        e.currentTarget.style.color = colors.accent;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#ffd700';
                                    }}
                                    style={{
                                        padding: '10px 16px',
                                        color: '#ffd700',
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        textAlign: 'left',
                                    }}
                                >
                                    Указать ID вручную...
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                        Список друзей пуст. Вы можете ввести ID игрока вручную ниже.
                    </div>
                )}

                {(friends.length === 0 || recipientId === 'custom') && (
                    <input
                        type="text"
                        value={manualRecipientId}
                        onChange={(e) => setManualRecipientId(e.target.value)}
                        placeholder="Введите ID игрока (например: VK-12345)"
                        style={{
                            padding: '12px',
                            background: colors.input,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                            marginTop: '5px',
                        }}
                    />
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                    ТЕМА:
                </label>
                <input
                    type="text"
                    value={writeSubject}
                    onChange={(e) => setWriteSubject(e.target.value)}
                    placeholder="Тема письма..."
                    style={{
                        padding: '12px',
                        background: colors.input,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                    СООБЩЕНИЕ:
                </label>
                <textarea
                    value={writeBody}
                    onChange={(e) => setWriteBody(e.target.value)}
                    placeholder="Напишите послание..."
                    style={{
                        height: '110px',
                        padding: '12px',
                        background: colors.input,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none',
                        resize: 'none',
                        fontSize: '14px',
                        lineHeight: 1.5,
                    }}
                />
            </div>

            <button
                onClick={handleSendPersonalMail}
                style={{
                    padding: '16px',
                    background: 'linear-gradient(180deg, #f0c040, #c87820)',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 900,
                    color: '#1a1008',
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: '14px',
                    boxShadow: '0 4px 15px rgba(200, 120, 32, 0.3)',
                    marginTop: '5px',
                }}
            >
                ОТПРАВИТЬ ПИСЬМО
            </button>
        </motion.div>
    );
};
export default MailWriteTab;
