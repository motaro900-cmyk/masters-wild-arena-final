import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMBLEMS, CurrencyIcon } from './ClanShared';

interface ClanCreateTabProps {
    colors: any;
    error: string | null;
    setError: (error: string | null) => void;
    onCancel: () => void;
    onCreate: (name: string, motto: string, emblem: string) => void;
}

export const ClanCreateTab: React.FC<ClanCreateTabProps> = ({ colors, error, setError, onCancel, onCreate }) => {
    const [newClanName, setNewClanName] = useState('');
    const [newClanMotto, setNewClanMotto] = useState('');
    const [selectedEmblem, setSelectedEmblem] = useState(EMBLEMS[0]);

    const handleSubmit = () => {
        if (!newClanName.trim()) {
            setError('Введите название клана!');
            return;
        }
        onCreate(newClanName, newClanMotto, selectedEmblem);
    };

    return (
        <motion.div
            key="create"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '30px',
                padding: '40px',
                background: colors.card,
                borderRadius: '20px',
                border: `1px solid ${colors.border}`,
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <h2
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: colors.accent,
                        fontSize: '32px',
                        margin: 0,
                    }}
                >
                    Основание Клана
                </h2>
                <p style={{ opacity: 0.7, marginTop: '5px' }}>Создайте свой союз и ведите его к славе!</p>
            </div>

            <div style={{ display: 'flex', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div
                        style={{
                            width: '150px',
                            height: '150px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '20px',
                            border: `2px solid ${colors.accent}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            className={`sprite-clan clan-${selectedEmblem}`}
                            style={{
                                transform: 'scale(2)',
                                filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))',
                            }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {EMBLEMS.map((e) => (
                            <button
                                key={e}
                                onClick={() => setSelectedEmblem(e)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    padding: 0,
                                    background: selectedEmblem === e ? colors.accent : 'rgba(0,0,0,0.3)',
                                    border: `1px solid ${selectedEmblem === e ? colors.accent : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                <div className={`sprite-clan clan-${e}`} style={{ transform: 'scale(0.5)' }} />
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label
                            style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                opacity: 0.6,
                                textTransform: 'uppercase',
                            }}
                        >
                            Название клана
                        </label>
                        <input
                            value={newClanName}
                            onChange={(e) => {
                                setNewClanName(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Введите легендарное имя..."
                            maxLength={20}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: `1px solid ${colors.border}`,
                                borderRadius: '10px',
                                padding: '15px',
                                color: '#fff',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label
                            style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                opacity: 0.6,
                                textTransform: 'uppercase',
                            }}
                        >
                            Девиз клана
                        </label>
                        <textarea
                            value={newClanMotto}
                            onChange={(e) => {
                                setNewClanMotto(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Какая ваша цель?"
                            maxLength={60}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: `1px solid ${colors.border}`,
                                borderRadius: '10px',
                                padding: '15px',
                                color: '#fff',
                                outline: 'none',
                                resize: 'none',
                                height: '80px',
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                padding: '10px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                fontSize: '13px',
                                fontWeight: 700,
                            }}
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: 'none',
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            borderRadius: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                        }}
                    >
                        ОТМЕНА
                    </button>
                    <button
                        onClick={handleSubmit}
                        style={{
                            flex: 2,
                            padding: '15px',
                            background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                            border: 'none',
                            color: '#000',
                            borderRadius: '12px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: '0 5px 15px rgba(240,192,64,0.3)',
                        }}
                    >
                        ОСНОВАТЬ КЛАН (200 <CurrencyIcon type="ALMAZ" />)
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
