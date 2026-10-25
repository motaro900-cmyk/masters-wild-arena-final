/**
 * LEGAL COMPLIANCE MODAL (РФ)
 * Федеральные законы № 152-ФЗ, 436-ФЗ (12+), Пользовательское соглашение и Cookie-политика.
 */
import React from 'react';

interface PortalLegalModalProps {
    isOpen: boolean;
    tab: 'privacy' | 'terms' | 'cookies' | 'age' | null;
    onClose: () => void;
    onSelectTab: (tab: 'privacy' | 'terms' | 'cookies' | 'age') => void;
}

export const PortalLegalModal: React.FC<PortalLegalModalProps> = ({
    isOpen,
    tab,
    onClose,
    onSelectTab,
}) => {
    if (!isOpen) return null;
    const currentTab = tab || 'privacy';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 25000,
                backgroundColor: 'rgba(4, 3, 7, 0.95)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '840px',
                    maxHeight: '90vh',
                    background: 'linear-gradient(135deg, #14101c 0%, #0a0711 100%)',
                    border: '2px solid rgba(212, 175, 55, 0.4)',
                    borderRadius: '20px',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 40px rgba(212, 175, 55, 0.15)',
                    padding: '28px',
                    color: '#f5ede0',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>📜</span>
                        <div>
                            <h3 style={{ margin: 0, fontFamily: "'Philosopher', serif", fontSize: '20px', color: '#FFE07D' }}>
                                Правовой Реестр & Защита Прав (РФ)
                            </h3>
                            <div style={{ fontSize: '11px', color: '#8f8171' }}>
                                Федеральное законодательство Российской Федерации • Релиз 2026
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(212,175,55,0.3)',
                            color: '#e2d4c0',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'privacy' as const, label: '🛡️ 152-ФЗ Персональные данные' },
                        { id: 'terms' as const, label: '⚖️ Соглашение' },
                        { id: 'cookies' as const, label: '🍪 Cookies & Хранилище' },
                        { id: 'age' as const, label: '🔞 Рейтинг 12+ (436-ФЗ)' },
                    ].map((tabItem) => (
                        <button
                            key={tabItem.id}
                            onClick={() => onSelectTab(tabItem.id)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: currentTab === tabItem.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.04)',
                                border: currentTab === tabItem.id ? '1px solid #FFE07D' : '1px solid rgba(255,255,255,0.1)',
                                color: currentTab === tabItem.id ? '#FFE07D' : '#9ca3af',
                                transition: 'all 0.15s',
                            }}
                        >
                            {tabItem.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', fontSize: '13px', lineHeight: 1.65, color: '#c8bea9', maxHeight: '55vh' }}>
                    {currentTab === 'privacy' && (
                        <div>
                            <h4 style={{ color: '#FFE07D', margin: '0 0 8px 0' }}>1. Политика обработки данных в РФ (ФЗ № 152-ФЗ)</h4>
                            <p>
                                Настоящая Политика регламентирует порядок обработки данных в полном соответствии с Федеральным законом РФ от 27.07.2006 № 152-ФЗ «О персональных данных». Проект Masters of the Wild ставит цифровую безопасность пользователей своим безусловным приоритетом.
                            </p>
                            <h4 style={{ color: '#FFE07D', margin: '14px 0 8px 0' }}>2. Локальное хранение данных</h4>
                            <p>
                                Все игровые показатели (выбранный персонаж, уровень зачарования экипировки, инвентарь, баланс игрового золота и кристаллов) сохраняются исключительно в локальном хранилище браузера Пользователя (localStorage / IndexedDB). Администрация НЕ собирает и НЕ передает паспортные данные, реальные имена, адреса места жительства, номера телефонов или платежные реквизиты.
                            </p>
                            <h4 style={{ color: '#FFE07D', margin: '14px 0 8px 0' }}>3. Отсутствие трансграничной передачи</h4>
                            <p>
                                Трансграничная передача персональных данных пользователей на территорию иностранных государств полностью отсутствует. Сервисы функционируют в РФ.
                            </p>
                        </div>
                    )}

                    {currentTab === 'terms' && (
                        <div>
                            <h4 style={{ color: '#FFE07D', margin: '0 0 8px 0' }}>Пользовательское соглашение</h4>
                            <p>
                                Masters of the Wild является браузерной онлайн-RPG с элементами пошаговой арены и авто-батлера. Использование портала и игрового клиента предоставляется на условиях «как есть» (as is).
                            </p>
                            <p>
                                Виртуальные ценности (золото, кристаллы, реликвии) носят исключительно внутриигровой характер и не подлежат обмену на реальные денежные средства. Запрещено применение вредоносных скриптов, сетевых инъекций и ботов, нарушающих честный баланс соревновательной арены.
                            </p>
                        </div>
                    )}

                    {currentTab === 'cookies' && (
                        <div>
                            <h4 style={{ color: '#FFE07D', margin: '0 0 8px 0' }}>Положение об использовании Cookies и LocalStorage</h4>
                            <p>
                                Файлы cookie и локальное хранилище применяются исключительно для служебных технических целей: запоминание уровня громкости саундтреков, состояния заглушения звука, выбранного в Бестиарии зверя и статуса согласия на обработку данных.
                            </p>
                            <p>
                                Пользователь вправе в любой момент очистить кэш и хранилище сайта через настройки своего интернет-обозревателя.
                            </p>
                        </div>
                    )}

                    {currentTab === 'age' && (
                        <div>
                            <h4 style={{ color: '#FFE07D', margin: '0 0 8px 0' }}>Возрастная классификация информационной продукции (ФЗ № 436-ФЗ)</h4>
                            <p>
                                В соответствии с Федеральным законом РФ № 436-ФЗ «О защите детей от информации, причиняющей вред их здоровью и развитию», игровой проект Masters of the Wild классифицирован знаком информационной продукции «12+» (для детей старше 12 лет).
                            </p>
                            <p>
                                Игра содержит элементы фэнтезийных сражений без натуралистических сцен насилия, жестокости и ненормативной лексики. В чате и рейтинговых списках активен встроенный фильтр недопустимых выражений.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        marginTop: '20px',
                        paddingTop: '14px',
                        borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
                        <span>✓</span>
                        <span>Соответствие требованиям РКН и законодательства РФ</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                            color: '#110c03',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.35)',
                        }}
                    >
                        ✓ Понятно и согласен
                    </button>
                </div>
            </div>
        </div>
    );
};
