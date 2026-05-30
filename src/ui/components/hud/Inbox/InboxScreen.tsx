import React from 'react';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { OfflineSummary, PendingResult } from '../../../../services/PlayerSnapshotService';

interface InboxScreenProps {
    summary: OfflineSummary;
    onClose: () => void;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({ summary, onClose }) => {
    const colors = {
        text: '#e8d8a8',
        accent: '#f0c040',
        card: 'rgba(255,255,255,0.03)',
        border: 'rgba(240,192,64,0.15)',
        danger: '#ef4444',
        success: '#22c55e',
    };

    return (
        <div
            style={{
                width: '100%',
                maxHeight: '520px',
                padding: '20px 30px',
                display: 'flex',
                flexDirection: 'column',
                color: colors.text,
                fontFamily: "'Cinzel', 'Philosopher', serif",
            }}
        >
            {/* Вводное сообщение */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>⚔️</div>
                <p
                    style={{
                        fontSize: '14px',
                        fontFamily: "'Montserrat', sans-serif",
                        opacity: 0.8,
                        lineHeight: 1.6,
                        maxWidth: '600px',
                        margin: '0 auto',
                    }}
                >
                    Пока вы отсутствовали в игре, другие искатели приключений бросали вызов вашему герою на Арене!
                </p>
            </div>

            {/* Прокручиваемый список сражений */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxHeight: '260px',
                }}
                className="leaderboard-scroll"
            >
                {summary.attacks.map((a: PendingResult, idx: number) => {
                    const isWin = a.defenderResult === 'WIN';
                    const resultColor = isWin ? colors.success : colors.danger;
                    const resultBg = isWin ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)';
                    const resultBorder = isWin ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';

                    return (
                        <div
                            key={a.id || idx}
                            style={{
                                background: resultBg,
                                border: `1px solid ${resultBorder}`,
                                borderRadius: '12px',
                                padding: '14px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '15px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <span style={{ fontSize: '24px' }}>{isWin ? '🛡️' : '💥'}</span>
                                <div>
                                    <div
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            color: '#fff',
                                        }}
                                    >
                                        {a.attackerName}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            fontFamily: "'Montserrat', sans-serif",
                                            opacity: 0.5,
                                            marginTop: '2px',
                                        }}
                                    >
                                        Рейтинг нападавшего: {a.attackerRating} 🏆
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                {/* Результат */}
                                <span
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 900,
                                        color: resultColor,
                                        letterSpacing: '1px',
                                    }}
                                >
                                    {isWin ? 'УСПЕШНАЯ ЗАЩИТА' : 'ПОРАЖЕНИЕ'}
                                </span>

                                {/* Награды */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Кубки */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <img
                                            src={AssetsMap.UI.TROPHY_PREMIUM}
                                            style={{ width: 18, height: 18, objectFit: 'contain' }}
                                            alt="cups"
                                        />
                                        <span
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: 900,
                                                color: a.cupsChange >= 0 ? colors.success : colors.danger,
                                            }}
                                        >
                                            {a.cupsChange >= 0 ? `+${a.cupsChange}` : a.cupsChange}
                                        </span>
                                    </div>

                                    {/* Золото */}
                                    {isWin && a.goldChange > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <img
                                                src={AssetsMap.UI.ICON_GOLD_FULL}
                                                style={{ width: 18, height: 18, objectFit: 'contain' }}
                                                alt="gold"
                                            />
                                            <span
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 900,
                                                    color: colors.accent,
                                                }}
                                            >
                                                +{a.goldChange}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Итоговая панель */}
            <div
                style={{
                    background: 'rgba(240,192,64,0.04)',
                    border: '1.5px dashed rgba(240,192,64,0.3)',
                    borderRadius: '16px',
                    padding: '16px 24px',
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '10px', opacity: 0.5, fontFamily: "'Montserrat', sans-serif" }}>Всего атак</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{summary.totalAttacks}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', opacity: 0.5, fontFamily: "'Montserrat', sans-serif" }}>Победы</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: colors.success }}>{summary.wins}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', opacity: 0.5, fontFamily: "'Montserrat', sans-serif" }}>Поражения</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: colors.danger }}>{summary.losses}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    {/* Суммарные кубки */}
                    <div>
                        <div style={{ fontSize: '10px', opacity: 0.5, fontFamily: "'Montserrat', sans-serif", textAlign: 'right' }}>Итог кубков</div>
                        <div
                            style={{
                                fontSize: '22px',
                                fontWeight: 900,
                                color: summary.totalCupsChange >= 0 ? colors.success : colors.danger,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                justifyContent: 'flex-end',
                                marginTop: '2px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.TROPHY_PREMIUM}
                                style={{ width: 22, height: 22, objectFit: 'contain' }}
                                alt="cups"
                            />
                            {summary.totalCupsChange >= 0 ? `+${summary.totalCupsChange}` : summary.totalCupsChange}
                        </div>
                    </div>

                    {/* Суммарное золото */}
                    {summary.totalGoldChange > 0 && (
                        <div>
                            <div style={{ fontSize: '10px', opacity: 0.5, fontFamily: "'Montserrat', sans-serif", textAlign: 'right' }}>Награда золотом</div>
                            <div
                                style={{
                                    fontSize: '22px',
                                    fontWeight: 900,
                                    color: colors.accent,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    justifyContent: 'flex-end',
                                    marginTop: '2px',
                                }}
                            >
                                <img
                                    src={AssetsMap.UI.ICON_GOLD_FULL}
                                    style={{ width: 22, height: 22, objectFit: 'contain' }}
                                    alt="gold"
                                />
                                +{summary.totalGoldChange}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Кнопка "Принять" */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '12px 40px',
                        background: 'linear-gradient(180deg, #f0c040, #c87820)',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 900,
                        color: '#1a1008',
                        cursor: 'pointer',
                        fontSize: '14px',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 15px rgba(200, 120, 32, 0.3)',
                    }}
                >
                    ОТЛИЧНО
                </button>
            </div>
        </div>
    );
};
