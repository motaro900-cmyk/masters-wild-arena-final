import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClanData, ClanMember, CurrencyIcon } from './ClanShared';
import { useGameStore } from '../../../../store/useGameStore';

interface ClanBankTabProps {
    colors: any;
    clanData: ClanData | null;
    clanLevelData: { level: number; xp: number; maxXp: number };
    members: ClanMember[];
    gold: number;
    crystals: number;
    playerRole: 'LEADER' | 'OFFICER' | 'MEMBER';
    onDonate: (amount: number, currency: 'GOLD' | 'ALMAZ') => void;
    onWithdraw: (amount: number, currency: 'GOLD' | 'ALMAZ') => void;
    onUpgradeBank: () => void;
    onToggleOfficersWithdraw: (enabled: boolean) => void;
    error: string | null;
    setError: (err: string | null) => void;
}

export const ClanBankTab: React.FC<ClanBankTabProps> = ({
    colors,
    clanData,
    gold,
    crystals,
    playerRole,
    onDonate,
    onWithdraw,
    onUpgradeBank,
    onToggleOfficersWithdraw,
    error,
    setError,
}) => {
    const [donateCurrency, setDonateCurrency] = useState<'GOLD' | 'ALMAZ'>('GOLD');
    const [withdrawCurrency, setWithdrawCurrency] = useState<'GOLD' | 'ALMAZ'>('GOLD');
    
    const [donateAmount, setDonateAmount] = useState<number>(100);
    const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);

    const handleQuickPreset = (amount: number) => {
        setDonateAmount(amount);
    };

    const handleLocalDonate = () => {
        if (donateCurrency === 'GOLD') {
            if (donateAmount < 1 || donateAmount > 500) {
                useGameStore.getState().showAlert('Взнос золота должен быть в пределах от 1 до 500!');
                return;
            }
        } else {
            if (donateAmount < 1 || donateAmount > 100) {
                useGameStore.getState().showAlert('Взнос алмазов должен быть в пределах от 1 до 100!');
                return;
            }
        }
        onDonate(donateAmount, donateCurrency);
    };

    const handleLocalWithdraw = () => {
        if (withdrawAmount < 1) {
            useGameStore.getState().showAlert('Сумма снятия должна быть больше 0!');
            return;
        }
        if (withdrawCurrency === 'GOLD') {
            const bankVal = clanData?.goldBank !== undefined ? clanData.goldBank : 5000;
            if (withdrawAmount > bankVal) {
                setError(`В казне недостаточно золота (доступно ${bankVal})!`);
                return;
            }
        } else {
            const bankVal = clanData?.crystalsBank !== undefined ? clanData.crystalsBank : 250;
            if (withdrawAmount > bankVal) {
                setError(`В казне недостаточно алмазов (доступно ${bankVal})!`);
                return;
            }
        }
        onWithdraw(withdrawAmount, withdrawCurrency);
    };

    const goldBank = clanData?.goldBank !== undefined ? clanData.goldBank : 5000;
    const crystalsBank = clanData?.crystalsBank !== undefined ? clanData.crystalsBank : 250;
    const bankLevel = clanData?.bankLevel || 1;
    const officersCanWithdraw = clanData?.officersCanWithdraw || false;
    const transactions = clanData?.bankTransactions || [];

    const upgradeCost = bankLevel * 10000;
    const canUpgrade = goldBank >= upgradeCost && bankLevel < 5;

    const hasWithdrawPermission = playerRole === 'LEADER' || (playerRole === 'OFFICER' && officersCanWithdraw);

    // Perks definitions based on bank level
    const perks = [
        { lvl: 1, desc: 'Начальный уровень казны. Ставка: +0.1% золота / +0.05% алмазов в час.' },
        { lvl: 2, desc: '+5% золота во всех боях. Ставка: +0.2% золота / +0.10% алмазов в час.' },
        { lvl: 3, desc: '+10% золота во всех боях. Ставка: +0.3% золота / +0.15% алмазов в час.' },
        { lvl: 4, desc: '+5% алмазов в PvE боях. Ставка: +0.4% золота / +0.20% алмазов в час.' },
        { lvl: 5, desc: '+10% опыта в клановых рейдах. Ставка: +0.5% золота / +0.25% алмазов в час.' },
    ];

    return (
        <motion.div
            key="bank"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}
        >
            {/* LEFT SIDE: Treasury Vault Box & Upgrades */}
            <div
                style={{
                    flex: 1.3,
                    background: colors.card,
                    borderRadius: '15px',
                    border: `1.5px solid ${colors.border}`,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    minHeight: '400px',
                    overflowY: 'auto',
                }}
                className="leaderboard-scroll"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>🛡️</div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Казна Клана (Ур. {bankLevel})
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>
                            Взносы игроков открывают бонусы и улучшения для всего клана
                        </div>
                    </div>
                </div>

                {/* Vault Visual Card - Gold & Crystals */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(20, 12, 6, 0.9) 0%, rgba(40, 25, 10, 0.6) 100%)',
                        border: `2px dashed ${colors.border}`,
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        position: 'relative',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        {/* Gold Reserve */}
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                ЗОЛОТОЙ ЗАПАС
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                                <CurrencyIcon type="GOLD" size={20} />
                                <span style={{ fontSize: '24px', fontWeight: 900, color: '#f0c040', textShadow: '0 0 10px rgba(240,192,64,0.2)' }}>
                                    {goldBank.toLocaleString()}
                                </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: 800, marginTop: '4px', textShadow: '0 0 4px rgba(74,222,128,0.2)' }}>
                                +{((0.001 + (bankLevel - 1) * 0.001) * 100).toFixed(2)}% в час
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

                        {/* Crystals Reserve */}
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                АЛМАЗНЫЙ ФОНД
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                                <CurrencyIcon type="ALMAZ" size={20} />
                                <span style={{ fontSize: '24px', fontWeight: 900, color: '#60a5fa', textShadow: '0 0 10px rgba(96,165,250,0.2)' }}>
                                    {crystalsBank.toLocaleString()}
                                </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 800, marginTop: '4px', textShadow: '0 0 4px rgba(96,165,250,0.2)' }}>
                                +{(0.0005 * bankLevel * 100).toFixed(2)}% в час
                            </div>
                        </div>
                    </div>
                </div>

                {/* Treasury Upgrades Section */}
                <div
                    style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: colors.accent, textTransform: 'uppercase' }}>
                            Улучшения Казны
                        </span>
                        <span style={{ fontSize: '11px', opacity: 0.6 }}>
                            Уровень {bankLevel} / 5
                        </span>
                    </div>

                    {/* Perks List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {perks.map((p) => {
                            const isUnlocked = bankLevel >= p.lvl;
                            return (
                                <div
                                    key={p.lvl}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px 10px',
                                        background: isUnlocked ? 'rgba(74, 222, 128, 0.05)' : 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px',
                                        border: `1.5px solid ${isUnlocked ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                        opacity: isUnlocked ? 1 : 0.4,
                                    }}
                                >
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: isUnlocked ? '#4ade80' : 'rgba(255,255,255,0.1)',
                                        color: '#000',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {p.lvl}
                                    </div>
                                    <span style={{ fontSize: '11px', color: isUnlocked ? '#fff' : '#ccc' }}>
                                        {p.desc}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Upgrade trigger */}
                    {bankLevel < 5 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                            <div>
                                <div style={{ fontSize: '10px', opacity: 0.5 }}>Стоимость улучшения:</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 900, color: '#f0c040' }}>
                                    <CurrencyIcon type="GOLD" size={14} />
                                    {upgradeCost.toLocaleString()}
                                </div>
                            </div>

                            {(playerRole === 'LEADER' || playerRole === 'OFFICER') ? (
                                <button
                                    onClick={onUpgradeBank}
                                    disabled={!canUpgrade}
                                    style={{
                                        padding: '8px 16px',
                                        background: canUpgrade ? 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)' : 'rgba(255,255,255,0.05)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: canUpgrade ? '#000' : 'rgba(255,255,255,0.3)',
                                        fontWeight: 900,
                                        fontSize: '11px',
                                        cursor: canUpgrade ? 'pointer' : 'not-allowed',
                                        textTransform: 'uppercase',
                                        boxShadow: canUpgrade ? '0 2px 8px rgba(240,192,64,0.2)' : 'none',
                                    }}
                                >
                                    Улучшить
                                </button>
                            ) : (
                                <span style={{ fontSize: '10px', opacity: 0.5, fontStyle: 'italic' }}>
                                    Только руководство может улучшать казну
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDE: Deposit, Withdraw & History */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    minHeight: '400px',
                }}
            >
                {/* Make Contribution Section */}
                <div
                    style={{
                        background: colors.card,
                        borderRadius: '15px',
                        border: `1.5px solid ${colors.border}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                            Сделать Взнос
                        </span>
                        
                        {/* Currency switcher */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '2px' }}>
                            <button
                                onClick={() => {
                                    setDonateCurrency('GOLD');
                                    setDonateAmount(100);
                                }}
                                style={{
                                    padding: '4px 10px',
                                    background: donateCurrency === 'GOLD' ? 'rgba(240,192,64,0.15)' : 'none',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: donateCurrency === 'GOLD' ? '#f0c040' : '#fff',
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                }}
                            >
                                ЗОЛОТО
                            </button>
                            <button
                                onClick={() => {
                                    setDonateCurrency('ALMAZ');
                                    setDonateAmount(10);
                                }}
                                style={{
                                    padding: '4px 10px',
                                    background: donateCurrency === 'ALMAZ' ? 'rgba(96,165,250,0.15)' : 'none',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: donateCurrency === 'ALMAZ' ? '#60a5fa' : '#fff',
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                }}
                            >
                                АЛМАЗЫ
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', opacity: 0.6 }}>
                        <span>
                            Взнос {donateCurrency === 'GOLD' ? 'золота (1-500)' : 'алмазов (1-100)'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            У вас: {donateCurrency === 'GOLD' ? gold.toLocaleString() : crystals.toLocaleString()}
                            <CurrencyIcon type={donateCurrency} size={11} />
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <input
                                type="number"
                                min="1"
                                max={donateCurrency === 'GOLD' ? 500 : 100}
                                value={donateAmount || ''}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    const maxVal = donateCurrency === 'GOLD' ? 500 : 100;
                                    if (isNaN(val)) {
                                        setDonateAmount(0);
                                    } else {
                                        setDonateAmount(Math.min(maxVal, Math.max(0, val)));
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: `1.5px solid ${colors.border}`,
                                    borderRadius: '8px',
                                    color: '#fff',
                                    padding: '10px 40px 10px 14px',
                                    outline: 'none',
                                    fontSize: '14px',
                                    fontWeight: 900,
                                }}
                            />
                            <div style={{ position: 'absolute', right: '14px', display: 'flex', alignItems: 'center' }}>
                                <CurrencyIcon type={donateCurrency} size={16} />
                            </div>
                        </div>

                        <button
                            onClick={handleQuickPreset.bind(null, donateCurrency === 'GOLD' ? 500 : 100)}
                            style={{
                                padding: '10px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: colors.accent,
                                fontWeight: 800,
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            МАКС
                        </button>

                        <button
                            onClick={handleLocalDonate}
                            style={{
                                padding: '10px 24px',
                                background: donateCurrency === 'GOLD' ? 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)' : 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: donateCurrency === 'GOLD' ? '#000' : '#fff',
                                fontWeight: 900,
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: donateCurrency === 'GOLD' ? '0 2px 8px rgba(240,192,64,0.25)' : '0 2px 8px rgba(96,165,250,0.25)',
                                textTransform: 'uppercase',
                            }}
                        >
                            Вложить
                        </button>
                    </div>

                    {/* Presets and details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {(donateCurrency === 'GOLD' ? [50, 100, 250, 500] : [10, 25, 50, 100]).map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handleQuickPreset(preset)}
                                    style={{
                                        padding: '4px 8px',
                                        background: donateAmount === preset ? (donateCurrency === 'GOLD' ? 'rgba(240,192,64,0.15)' : 'rgba(96,165,250,0.15)') : 'rgba(0,0,0,0.3)',
                                        border: `1px solid ${donateAmount === preset ? (donateCurrency === 'GOLD' ? '#f0c040' : '#60a5fa') : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '6px',
                                        color: donateAmount === preset ? (donateCurrency === 'GOLD' ? '#f0c040' : '#60a5fa') : '#fff',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    +{preset}
                                </button>
                            ))}
                        </div>
                        {donateAmount > 0 && (
                            <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>
                                {donateCurrency === 'GOLD' ? (
                                    `+${Math.floor(donateAmount / 10)} монет клана • +${Math.floor(donateAmount / 20)} XP клана`
                                ) : (
                                    `+${donateAmount * 2} монет клана • +${donateAmount} XP клана`
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {/* Withdraw Section */}
                <div
                    style={{
                        background: colors.card,
                        borderRadius: '15px',
                        border: `1.5px solid ${colors.border}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: colors.danger, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            💸 Снятие Средств
                        </span>

                        {hasWithdrawPermission && (
                            /* Currency switcher */
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '2px' }}>
                                <button
                                    onClick={() => {
                                        setWithdrawCurrency('GOLD');
                                        setWithdrawAmount(1000);
                                    }}
                                    style={{
                                        padding: '4px 10px',
                                        background: withdrawCurrency === 'GOLD' ? 'rgba(240,192,64,0.15)' : 'none',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: withdrawCurrency === 'GOLD' ? '#f0c040' : '#fff',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ЗОЛОТО
                                </button>
                                <button
                                    onClick={() => {
                                        setWithdrawCurrency('ALMAZ');
                                        setWithdrawAmount(50);
                                    }}
                                    style={{
                                        padding: '4px 10px',
                                        background: withdrawCurrency === 'ALMAZ' ? 'rgba(96,165,250,0.15)' : 'none',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: withdrawCurrency === 'ALMAZ' ? '#60a5fa' : '#fff',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                    }}
                                >
                                    АЛМАЗЫ
                                </button>
                            </div>
                        )}
                    </div>

                    {playerRole === 'LEADER' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <input
                                type="checkbox"
                                id="toggle-officers"
                                checked={officersCanWithdraw}
                                onChange={(e) => onToggleOfficersWithdraw(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            <label htmlFor="toggle-officers" style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>
                                Разрешить заместителям (офицерам) снимать средства
                            </label>
                        </div>
                    )}

                    {hasWithdrawPermission ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={withdrawAmount || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setWithdrawAmount(isNaN(val) ? 0 : val);
                                        }}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.4)',
                                            border: '1.5px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            padding: '8px 32px 8px 12px',
                                            outline: 'none',
                                            fontSize: '13px',
                                            fontWeight: 900,
                                        }}
                                    />
                                    <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center' }}>
                                        <CurrencyIcon type={withdrawCurrency} size={14} />
                                    </div>
                                </div>

                                <button
                                    onClick={handleLocalWithdraw}
                                    style={{
                                        padding: '8px 20px',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid #ef4444',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        fontWeight: 900,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase',
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#ef4444';
                                        e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                        e.currentTarget.style.color = '#ef4444';
                                    }}
                                >
                                    Снять
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '11px', opacity: 0.5, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                            Снятие средств доступно только Главе и уполномоченным Офицерам.
                        </div>
                    )}
                </div>

                {/* History list */}
                <div
                    style={{
                        flex: 1,
                        background: colors.card,
                        borderRadius: '15px',
                        border: `1.5px solid ${colors.border}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '200px',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ fontSize: '12px', fontWeight: 800, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        История Операций
                    </div>

                    <div
                        className="leaderboard-scroll"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            paddingRight: '2px',
                        }}
                    >
                        {transactions.length > 0 ? (
                            transactions.map((tx: any) => (
                                <div
                                    key={tx.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.02)',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {tx.author}
                                            {tx.type === 'UPGRADE' && (
                                                <span style={{ fontSize: '9px', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>
                                                    УЛУЧШЕНИЕ
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '10px', opacity: 0.5 }}>
                                            {tx.time}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 900,
                                            color: tx.type === 'DEPOSIT' ? '#4ade80' : (tx.type === 'WITHDRAW' ? '#ef4444' : '#3b82f6'),
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount}
                                        <CurrencyIcon type={tx.currency || 'GOLD'} size={12} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ fontSize: '11px', opacity: 0.4, textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
                                История операций пуста. Сделайте первый вклад!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error message global */}
            {error && (
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(239, 68, 68, 0.95)',
                    border: '1.5px solid #ef4444',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '8px 24px',
                    fontSize: '12px',
                    fontWeight: 900,
                    zIndex: 999,
                }}>
                    ⚠️ {error}
                </div>
            )}
        </motion.div>
    );
};
