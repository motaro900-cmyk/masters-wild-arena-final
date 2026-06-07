import React from 'react';

interface ChatInputAreaProps {
    inputText: string;
    setInputText: (val: string) => void;
    inputRef: any;
    isFocused: boolean;
    setIsFocused: (val: boolean) => void;
    activeChatTab: 'all' | 'system' | 'clan' | 'private';
    privateRecipient: string | null;
    setPrivateRecipient: (val: string | null) => void;
    showEmoji: boolean;
    setShowEmoji: (val: boolean) => void;
    handleSendMessage: () => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
    inputText,
    setInputText,
    inputRef,
    isFocused,
    setIsFocused,
    activeChatTab,
    privateRecipient,
    setPrivateRecipient,
    showEmoji,
    setShowEmoji,
    handleSendMessage,
    handleKeyDown,
}) => {
    return (
        <div
            style={{
                marginTop: 15,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                    className={isFocused ? 'input-glow' : ''}
                    style={{
                        flex: 1,
                        height: 42,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(240, 192, 64, 0.3)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                        transition: 'all 0.3s',
                    }}
                >
                    {activeChatTab === 'private' && privateRecipient && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background:
                                    'linear-gradient(135deg, rgba(240, 192, 64, 0.25), rgba(138, 90, 16, 0.15))',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(240, 192, 64, 0.5)',
                                marginRight: '12px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 0 15px rgba(240, 192, 64, 0.1)',
                                animation: 'pulse-glow 2s infinite',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '10px',
                                    color: '#f0c040',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {privateRecipient}
                            </span>
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPrivateRecipient(null);
                                }}
                                style={{
                                    cursor: 'pointer',
                                    color: '#fff',
                                    fontSize: '14px',
                                    opacity: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                ✕
                            </span>
                        </div>
                    )}

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        maxLength={150}
                        placeholder={privateRecipient ? `Написать ${privateRecipient}...` : 'Введите сообщение...'}
                        style={{
                            flex: 1,
                            height: '100%',
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: 13,
                            fontFamily: "'Cinzel', serif",
                        }}
                    />

                    <div
                        onClick={() => setShowEmoji(!showEmoji)}
                        style={{
                            fontSize: 20,
                            cursor: 'pointer',
                            filter: showEmoji ? 'drop-shadow(0 0 5px #f0c040)' : 'grayscale(0.5)',
                            opacity: showEmoji ? 1 : 0.6,
                            transition: 'all 0.2s',
                            marginLeft: 8,
                        }}
                    >
                        😊
                    </div>
                </div>

                <button
                    onClick={handleSendMessage}
                    style={{
                        width: 50,
                        height: 42,
                        background: inputText.trim()
                            ? 'linear-gradient(180deg, #f0c040, #8a5a10)'
                            : 'rgba(240, 192, 64, 0.1)',
                        border: '1px solid rgba(240, 192, 64, 0.4)',
                        borderRadius: '10px',
                        cursor: inputText.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: inputText.trim() ? '0 4px 15px rgba(0,0,0,0.4)' : 'none',
                    }}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={inputText.trim() ? '#000' : 'rgba(240, 192, 64, 0.4)'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    );
};
