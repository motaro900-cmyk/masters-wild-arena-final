import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { MOBS_DB } from '../../../configs/MobsConfig';
import { syncService } from '../../../services/SyncService';

const ADMIN_VK_IDS = [212359386]; 

type AdminTab = 'ИГРОК' | 'БОЙ' | 'СЕРВЕР' | 'ПОЧТА' | 'ЧАТ' | 'СИСТЕМА';

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
    isAdmin?: boolean;
}

interface RealPlayer {
    id: string;
    vkId: number;
    name: string;
    photo: string;
    status: 'ONLINE' | 'OFFLINE' | 'BANNED' | 'BATTLE';
    screen: string;
    level: number;
    gold: number;
    crystals: number;
    regDate: string;
    reports: number;
    reportLogs: string[];
    gear: {
        weapon?: string;
        helm?: string;
        armor?: string;
        shield?: string;
    };
}

interface Attachment {
    id: string;
    name: string;
    icon: string;
    amount: number;
    rarity?: string;
}

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const store = useGameStore();
    const [activeTab, setActiveTab] = useState<AdminTab>('ИГРОК');
    const logEndRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (ИГРОК) ---
    const [customGold, setCustomGold] = useState(String(store.gold));
    const [customCrystals, setCustomCrystals] = useState(String(store.crystals));
    const [customLevel, setCustomLevel] = useState(String(store.level));
    const [customPoints, setCustomPoints] = useState(String(store.talentPoints));
    const [selectedItemId, setSelectedItemId] = useState('');

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (БОЙ) ---
    const [selectedMobId, setSelectedMobId] = useState(MOBS_DB[0]?.id || '');

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (СЕРВЕР) ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [banDuration, setBanDuration] = useState('24h');
    const [muteDuration, setMuteDuration] = useState('1h');
    const [modReason, setModReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'BANNED'>('ALL');
    const [realPlayers, setRealPlayers] = useState<RealPlayer[]>([]);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (СЕРВЕР - ПРАВКА ИГРОКА) ---
    const [serverPlayerGold, setServerPlayerGold] = useState('');
    const [serverPlayerCrystals, setServerPlayerCrystals] = useState('');
    const [serverPlayerLevel, setServerPlayerLevel] = useState('');

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (ПОЧТА) ---
    const [mailRecipient, setMailRecipient] = useState<'ALL' | string>('ALL');
    const [mailSubject, setMailSubject] = useState('');
    const [mailBody, setMailBody] = useState('');
    const [mailAttachments, setMailAttachments] = useState<Attachment[]>([]);
    const [mailAmount, setMailAmount] = useState('500');
    const [selectedMailItem, setSelectedMailItem] = useState('');
    const [isSendingMail, setIsSendingMail] = useState(false);

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (ЧАТ) ---
    const [adminChatMessage, setAdminChatMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: '1', senderId: 'MW-OFFLINE-TEST', senderName: 'Иван Иванов', text: 'Как получить легендарный меч?', timestamp: '23:45' },
        { id: '2', senderId: 'ADMIN-01', senderName: 'SYSTEM', text: 'Добро пожаловать в Админ-Центр v3.0!', timestamp: '23:46', isAdmin: true }
    ]);

    useEffect(() => {
        setCustomGold(String(store.gold));
        setCustomCrystals(String(store.crystals));
        setCustomLevel(String(store.level));
        setCustomPoints(String(store.talentPoints));
    }, [store.gold, store.crystals, store.level, store.talentPoints]);

    useEffect(() => {
        if (activeTab === 'ЧАТ') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (activeTab === 'БОЙ') logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, store.combatLogs, activeTab]);

    const selectedPlayer = realPlayers.find(p => p.id === selectedPlayerId);

    useEffect(() => {
        if (selectedPlayer) {
            setServerPlayerGold(String(selectedPlayer.gold));
            setServerPlayerCrystals(String(selectedPlayer.crystals));
            setServerPlayerLevel(String(selectedPlayer.level));
        }
    }, [selectedPlayerId, selectedPlayer]);

    useEffect(() => {
        if (activeTab === 'СЕРВЕР') {
            refreshPlayers();
        }
    }, [activeTab]);

    const refreshPlayers = async () => {
        setIsLoadingPlayers(true);
        try {
            const players = await syncService.getAllPlayers();
            // Маппим данные из Firebase в формат RealPlayer
            const mappedPlayers: RealPlayer[] = players.map(p => ({
                id: p.id,
                vkId: p.vkId || 0,
                name: p.name || 'Unknown',
                photo: p.photo || 'https://vk.com/images/camera_100.png',
                status: p.activeScreen === 'BATTLE' ? 'BATTLE' : (Date.now() - (p.lastSeen?.toMillis?.() || 0) < 300000 ? 'ONLINE' : 'OFFLINE'),
                screen: p.activeScreen || 'MAP',
                level: p.лев || 1,
                gold: p.золото || 0,
                crystals: p.кристаллы || 0,
                regDate: p.lastSeen?.toDate?.().toLocaleDateString() || '10.05.2026',
                reports: p.reports || 0,
                reportLogs: p.reportLogs || [],
                gear: p.геройСнаряжение || {}
            }));
            setRealPlayers(mappedPlayers);
        } catch (e) {
            console.error('Failed to refresh players:', e);
        } finally {
            setIsLoadingPlayers(false);
        }
    };

    const handleRemoteUpdate = async (field: string, value: any) => {
        if (!selectedPlayer) return;
        try {
            const updateData = { [field]: Number(value) };
            await syncService.updateRemotePlayerData(selectedPlayer.id, updateData);
            alert(`Успешно: ${field} установлено на ${value}`);
            refreshPlayers();
        } catch (e) {
            console.error('Remote update error:', e);
            alert('Ошибка при обновлении данных');
        }
    };

    const applyMailTemplate = (type: 'REWARD' | 'LAG' | 'WELCOME') => {
        if (type === 'REWARD') { setMailSubject('🏆 НАГРАДА ЗА ИВЕНТ'); setMailBody('Поздравляем! Вы проявили невероятную отвагу и мастерство. Вот ваша награда!'); setMailAmount('1000'); }
        if (type === 'LAG') { setMailSubject('⚙️ КОМПЕНСАЦИЯ'); setMailBody('Приносим извинения за временные неудобства на сервере. Примите этот небольшой подарок.'); setMailAmount('250'); }
        if (type === 'WELCOME') { setMailSubject('🐼 ДОБРО ПОЖАЛОВАТЬ!'); setMailBody('Рады видеть тебя в Masters of the Wild! Удачи в первых сражениях!'); setMailAmount('50'); }
    };

    const sendAdminChatMessage = () => {
        if (!adminChatMessage.trim()) return;
        setChatMessages([...chatMessages, {
            id: Date.now().toString(), senderId: 'ADMIN', senderName: 'SYSTEM', text: adminChatMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isAdmin: true
        }]);
        setAdminChatMessage('');
    };

    const userVkId = store.vkUser?.id || store.vkUser?.uid;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isAdmin = ADMIN_VK_IDS.includes(Number(userVkId)) || isLocal;

    if (!isAdmin) return null;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ИГРОК':
                return (
                    <div style={contentGrid}>
                        <Section title="РЕДАКТОР РЕСУРСОВ (Direct Input)">
                            <div style={editRow}>
                                <div style={{ flex: 1 }}><div style={statLabel}>ЗОЛОТО</div><input type="number" style={inputStyle} value={customGold} onChange={e => setCustomGold(e.target.value)} /></div>
                                <button onClick={() => store.setGold(Number(customGold))} style={applyBtn}>OK</button>
                            </div>
                            <div style={editRow}>
                                <div style={{ flex: 1 }}><div style={statLabel}>КРИСТАЛЛЫ</div><input type="number" style={inputStyle} value={customCrystals} onChange={e => setCustomCrystals(e.target.value)} /></div>
                                <button onClick={() => store.setCrystals(Number(customCrystals))} style={applyBtn}>OK</button>
                            </div>
                            <div style={editRow}>
                                <div style={{ flex: 1 }}><div style={statLabel}>УРОВЕНЬ</div><input type="number" style={inputStyle} value={customLevel} onChange={e => setCustomLevel(e.target.value)} /></div>
                                <button onClick={() => store.setLevel(Number(customLevel))} style={applyBtn}>OK</button>
                            </div>
                            <div style={editRow}>
                                <div style={{ flex: 1 }}><div style={statLabel}>ТАЛАНТЫ</div><input type="number" style={inputStyle} value={customPoints} onChange={e => setCustomPoints(e.target.value)} /></div>
                                <button onClick={() => store.setTalentPoints(Number(customPoints))} style={applyBtn}>OK</button>
                            </div>
                        </Section>
                        <Section title="ИНВЕНТАРЬ & ТЕЛЕПОРТ">
                            <div style={statLabel}>ГЕНЕРАТОР ПРЕДМЕТОВ</div>
                            <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} style={inputStyle}>
                                <option value="">Выбрать предмет...</option>
                                {Object.keys(ITEMS_DATABASE).map(id => <option key={id} value={id}>{id}</option>)}
                            </select>
                            <button onClick={() => selectedItemId && store.addItemToInventory({ id: selectedItemId, level: 1 })} style={{ ...bigBtnStyle, marginTop: '10px' }}>ДОБАВИТЬ В ИНВЕНТАРЬ</button>
                            <button onClick={() => confirm('Очистить инвентарь?') && store.clearInventory()} style={{ ...bigBtnStyle, marginTop: '5px', background: '#301010', color: '#ff4d4d' }}>WIPE INVENTORY</button>
                            
                            <div style={{ marginTop: '20px' }}>
                                <div style={statLabel}>МГНОВЕННЫЙ ПЕРЕХОД (Screens)</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                                    {['MAP', 'BOSS', 'ARENA', 'SHOP', 'HEROES', 'CLAN'].map(s => (
                                        <button key={s} onClick={() => store.setScreen(s)} style={{ ...btnStyle, background: store.activeScreen === s ? '#222' : '#111' }}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => { store.setGold(999999); store.setCrystals(99999); store.setLevel(100); }} style={{ ...bigBtnStyle, marginTop: '20px', background: '#1b4332', color: '#4dff4d' }}>БОЖЕСТВЕННЫЙ СТАРТ (Full Max Out)</button>
                        </Section>
                    </div>
                );
            case 'БОЙ':
                return (
                    <div style={contentGrid}>
                        <Section title="УПРАВЛЕНИЕ ДВИЖКОМ">
                            <div style={statLabel}>СКОРОСТЬ ВРЕМЕНИ (Time Scale)</div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                                {[0.1, 1, 2, 5, 10].map(s => (
                                    <button key={s} onClick={() => store.setTimeScale(s)} style={{ ...btnStyle, flex: 1, border: store.timeScale === s ? '1px solid #ff4d4d' : '1px solid #222' }}>x{s}</button>
                                ))}
                            </div>
                            <ToggleRow label="БЕССМЕРТИЕ (God Mode)" active={store.isGodMode} onToggle={() => store.setGodMode(!store.isGodMode)} />
                            <ToggleRow label="ONE-SHOT KILL" active={store.isOneShot} onToggle={() => store.setOneShot(!store.isOneShot)} />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button onClick={() => alert('WIN')} style={{ ...btnStyle, flex: 1, background: '#1b4332', padding: '12px' }}>МГНОВЕННАЯ ПОБЕДА 🏆</button>
                                <button onClick={() => alert('FAIL')} style={{ ...btnStyle, flex: 1, background: '#431b1b', padding: '12px' }}>ПРОВАЛ БИТВЫ 💀</button>
                            </div>
                        </Section>
                        <Section title="СПАВНЕР МОБОВ (Database Check)">
                            <div style={editRow}>
                                <select value={selectedMobId} onChange={e => setSelectedMobId(e.target.value)} style={inputStyle}>
                                    {MOBS_DB.map(m => <option key={m.id} value={m.id}>{m.name} (HP: {m.baseStats.hp})</option>)}
                                </select>
                                <button onClick={() => store.addCombatLog(`ВЫЗВАН: ${MOBS_DB.find(m => m.id === selectedMobId)?.name}`)} style={applyBtn}>SPAWN</button>
                            </div>
                            <div style={statLabel}>ЛОГИ ТЕКУЩЕГО БОЯ:</div>
                            <div style={terminalStyle}>
                                {store.combatLogs.map((log: string, i: number) => <div key={i}>&gt; {log}</div>)}
                                <div ref={logEndRef} />
                            </div>
                            <button onClick={() => store.clearCombatLogs()} style={{ ...btnStyle, width: '100%', marginTop: '5px' }}>ОЧИСТИТЬ ТЕРМИНАЛ</button>
                        </Section>
                    </div>
                );
            case 'СЕРВЕР':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', height: '700px' }}>
                        <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                    <input type="text" placeholder="Поиск по Имени/ID/VK..." style={{ ...inputStyle, flex: 1 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                    <button onClick={refreshPlayers} style={{ ...applyBtn, padding: '0 10px' }} disabled={isLoadingPlayers}>
                                        {isLoadingPlayers ? '...' : '🔄'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => setFilterStatus('ALL')} style={{ ...smallBtnStyle, background: filterStatus === 'ALL' ? '#222' : '#111' }}>Все</button>
                                    <button onClick={() => setFilterStatus('ONLINE')} style={{ ...smallBtnStyle, background: filterStatus === 'ONLINE' ? '#1b4332' : '#111' }}>Online</button>
                                    <button onClick={() => setFilterStatus('BANNED')} style={{ ...smallBtnStyle, background: filterStatus === 'BANNED' ? '#431b1b' : '#111' }}>Banned</button>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {realPlayers
                                    .filter(p => {
                                        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                            p.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                            String(p.vkId).includes(searchQuery);
                                        const matchesStatus = filterStatus === 'ALL' || 
                                                            (filterStatus === 'ONLINE' && p.status === 'ONLINE') || 
                                                            (filterStatus === 'BANNED' && p.status === 'BANNED');
                                        return matchesSearch && matchesStatus;
                                    })
                                    .map(p => (
                                        <div key={p.id} onClick={() => setSelectedPlayerId(p.id)} style={{ padding: '12px', borderBottom: '1px solid #111', cursor: 'pointer', background: selectedPlayerId === p.id ? '#1a1a1a' : 'transparent', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.status === 'ONLINE' ? '#4dff4d' : p.status === 'BATTLE' ? '#3b82f6' : '#555' }} />
                                            <img src={p.photo} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #333' }} alt="" />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{p.name}</div>
                                                <div style={{ fontSize: '8px', color: '#444' }}>ID: {p.id}</div>
                                            </div>
                                            {p.reports > 0 && <div style={{ background: '#ff4d4d', color: '#fff', fontSize: '8px', padding: '1px 4px', borderRadius: '3px' }}>{p.reports}!</div>}
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', padding: '20px', overflowY: 'auto' }}>
                            {selectedPlayer ? (
                                <>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                                        <img src={selectedPlayer.photo} style={{ width: '80px', height: '80px', borderRadius: '10px', border: '2px solid #222' }} alt="" />
                                        <div style={{ flex: 1 }}>
                                            <h2 style={{ margin: 0, color: '#f0c040', fontSize: '24px' }}>{selectedPlayer.name}</h2>
                                            <div style={{ fontSize: '12px', color: '#666' }}>VK ID: {selectedPlayer.vkId} | Регистрация: {selectedPlayer.regDate}</div>
                                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                                <a href={`https://vk.com/id${selectedPlayer.vkId}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}>ПРОФИЛЬ ВК 🔗</a>
                                                <button onClick={() => alert('SPECTATING')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', padding: 0 }}>СМОТРЕТЬ БОЙ 👁️</button>
                                            </div>
                                        </div>
                                    </div>

                                    <Section title="ИНСПЕКТОР СТАТИСТИКИ">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                            <div style={statBox}><div style={statLabel}>GOLD</div>{selectedPlayer.gold}</div>
                                            <div style={statBox}><div style={statLabel}>GEMS</div>{selectedPlayer.crystals}</div>
                                            <div style={statBox}><div style={statLabel}>LVL</div>{selectedPlayer.level}</div>
                                            <div style={statBox}><div style={statLabel}>REPORTS</div>{selectedPlayer.reports}</div>
                                        </div>
                                    </Section>

                                    <Section title="БЫСТРОЕ РЕДАКТИРОВАНИЕ ПАРАМЕТРОВ (Modify Selected Player)">
                                        <div style={editRow}>
                                            <div style={{ flex: 1 }}><div style={statLabel}>УСТАНОВИТЬ ЗОЛОТО</div><input type="number" style={inputStyle} value={serverPlayerGold} onChange={e => setServerPlayerGold(e.target.value)} /></div>
                                            <button onClick={() => handleRemoteUpdate('золото', serverPlayerGold)} style={applyBtn}>SET</button>
                                        </div>
                                        <div style={editRow}>
                                            <div style={{ flex: 1 }}><div style={statLabel}>УСТАНОВИТЬ КРИСТАЛЛЫ</div><input type="number" style={inputStyle} value={serverPlayerCrystals} onChange={e => setServerPlayerCrystals(e.target.value)} /></div>
                                            <button onClick={() => handleRemoteUpdate('кристаллы', serverPlayerCrystals)} style={applyBtn}>SET</button>
                                        </div>
                                        <div style={editRow}>
                                            <div style={{ flex: 1 }}><div style={statLabel}>УСТАНОВИТЬ УРОВЕНЬ</div><input type="number" style={inputStyle} value={serverPlayerLevel} onChange={e => setServerPlayerLevel(e.target.value)} /></div>
                                            <button onClick={() => handleRemoteUpdate('лев', serverPlayerLevel)} style={applyBtn}>SET</button>
                                        </div>
                                    </Section>

                                    <Section title="ИНСПЕКТОР (Stats & Gear)">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
                                            <div style={statBox}><div style={statLabel}>GOLD</div>{selectedPlayer.gold}</div>
                                            <div style={statBox}><div style={statLabel}>GEMS</div>{selectedPlayer.crystals}</div>
                                            <div style={statBox}><div style={statLabel}>LVL</div>{selectedPlayer.level}</div>
                                            <div style={statBox}><div style={statLabel}>LOCATION</div>{selectedPlayer.screen}</div>
                                        </div>
                                        <div style={statLabel}>GEAR DUMP:</div>
                                        <div style={{ display: 'flex', gap: '8px', background: '#050505', padding: '12px', borderRadius: '8px', border: '1px solid #111' }}>
                                            {['weapon', 'helm', 'armor', 'shield'].map(slot => (
                                                <div key={slot} style={{ flex: 1, height: '50px', background: '#111', border: '1px solid #222', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '7px', color: '#333', textTransform: 'uppercase' }}>{slot}</div>
                                                    <div style={{ fontSize: '8px', color: '#888' }}>{(selectedPlayer.gear as any)[slot] || 'EMPTY'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </Section>

                                    <Section title="КОНТЕКСТ ЖАЛОБ (Report Logs)">
                                        <div style={{ background: '#050505', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#888', maxHeight: '80px', overflowY: 'auto' }}>
                                            {selectedPlayer.reportLogs.length > 0 ? selectedPlayer.reportLogs.map((log, i) => (
                                                <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid #111' }}>• {log}</div>
                                            )) : 'История жалоб пуста'}
                                        </div>
                                    </Section>

                                    <Section title="МОДЕРАЦИЯ">
                                        <input type="text" placeholder="Укажите причину..." style={{ ...inputStyle, marginBottom: '10px' }} value={modReason} onChange={e => setModReason(e.target.value)} />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <select value={banDuration} onChange={e => setBanDuration(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                                                    <option value="1h">1 Час</option><option value="24h">1 День</option><option value="7d">7 Дней</option><option value="perm">Перманент</option>
                                                </select>
                                                <button onClick={() => alert('BANNED')} style={{ ...btnStyle, background: '#431b1b', color: '#ff4d4d', padding: '0 15px' }}>БАН</button>
                                            </div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <select value={muteDuration} onChange={e => setMuteDuration(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                                                    <option value="1h">1 Час</option><option value="24h">1 День</option>
                                                </select>
                                                <button onClick={() => alert('MUTED')} style={{ ...btnStyle, padding: '0 15px' }}>МУТ</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                            <button onClick={() => alert('KICKED')} style={{ ...btnStyle, flex: 1, background: '#301010', color: '#fff' }}>КИКНУТЬ (Disconnect)</button>
                                            <button onClick={() => alert('RESET RATING')} style={{ ...btnStyle, flex: 1 }}>СБРОСИТЬ РЕЙТИНГ</button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => confirm('WIPE EVERYTHING?') && alert('WIPED')} style={{ ...btnStyle, flex: 1.5, background: '#601010', color: '#fff', fontWeight: 'bold' }}>ПОЛНЫЙ ВАЙП АККАУНТА 🔥</button>
                                            <button onClick={() => { setMailRecipient(selectedPlayer.id); setActiveTab('ПОЧТА'); }} style={{ ...btnStyle, flex: 1, background: '#1b4332', color: '#4dff4d' }}>ОТПРАВИТЬ ПИСЬМО ✉️</button>
                                        </div>
                                    </Section>
                                </>
                            ) : <div style={{ color: '#222', textAlign: 'center', marginTop: '220px', fontSize: '14px' }}>Выберите игрока в списке слева для управления</div>}
                        </div>
                    </div>
                );
            case 'ПОЧТА':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', height: '700px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <Section title="ПОЛУЧАТЕЛЬ">
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setMailRecipient('ALL')} style={{ ...btnStyle, border: mailRecipient === 'ALL' ? '1px solid #ff4d4d' : '1px solid #222', flex: 1 }}>ВСЕМ ИГРОКАМ (Broadcast)</button>
                                    <input type="text" placeholder="MW-ID игрока..." style={{ ...inputStyle, flex: 1.2 }} value={mailRecipient === 'ALL' ? '' : mailRecipient} onChange={e => setMailRecipient(e.target.value)} />
                                </div>
                            </Section>
                            <Section title="СОДЕРЖАНИЕ ПИСЬМА">
                                <input type="text" placeholder="Тема письма..." style={{ ...inputStyle, marginBottom: '10px' }} value={mailSubject} onChange={e => setMailSubject(e.target.value)} />
                                <textarea placeholder="Текст сообщения..." style={{ ...inputStyle, height: '220px' }} value={mailBody} onChange={e => setMailBody(e.target.value)} />
                                <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                                    <button onClick={() => applyMailTemplate('LAG')} style={smallBtnStyle}>⚙️ Шаблон: Лаги</button>
                                    <button onClick={() => applyMailTemplate('REWARD')} style={smallBtnStyle}>🏆 Шаблон: Награда</button>
                                    <button onClick={() => applyMailTemplate('WELCOME')} style={smallBtnStyle}>🐼 Шаблон: Welcome</button>
                                </div>
                            </Section>
                            <button onClick={() => { setIsSendingMail(true); setTimeout(() => { setIsSendingMail(false); alert('Письма отправлены!'); }, 1000); }} disabled={isSendingMail} style={{ ...bigBtnStyle, height: '60px', background: '#ff4d4d', fontSize: '16px' }}>
                                {isSendingMail ? 'В ПРОЦЕССЕ ОТПРАВКИ...' : 'ОТПРАВИТЬ РАССЫЛКУ 🚀'}
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <Section title="ВЛОЖЕНИЯ (Attachments)">
                                <div style={editRow}>
                                    <input type="number" style={{ ...inputStyle, flex: 1 }} value={mailAmount} onChange={e => setMailAmount(e.target.value)} />
                                    <button onClick={() => setMailAttachments([...mailAttachments, { id: 'G'+Date.now(), name: 'Gold', icon: '🪙', amount: Number(mailAmount) }])} style={applyBtn}>+ GOLD</button>
                                    <button onClick={() => setMailAttachments([...mailAttachments, { id: 'C'+Date.now(), name: 'Gems', icon: '💎', amount: Number(mailAmount) }])} style={applyBtn}>+ GEMS</button>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <select value={selectedMailItem} onChange={e => setSelectedMailItem(e.target.value)} style={inputStyle}>
                                        <option value="">Выбрать предмет из базы...</option>
                                        {Object.keys(ITEMS_DATABASE).map(id => <option key={id} value={id}>{id}</option>)}
                                    </select>
                                    <button onClick={() => selectedMailItem && setMailAttachments([...mailAttachments, { id: 'I'+Date.now(), name: selectedMailItem, icon: '📦', amount: 1 }])} style={{ ...btnStyle, width: '100%', marginTop: '5px' }}>ПРИКРЕПИТЬ ПРЕДМЕТ</button>
                                </div>
                            </Section>
                            <Section title="СПИСОК НАГРАД">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {mailAttachments.length > 0 ? mailAttachments.map(a => (
                                        <div key={a.id} style={{ background: '#111', padding: '6px 12px', borderRadius: '4px', border: '1px solid #222', fontSize: '11px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <span>{a.icon} {a.name} x{a.amount}</span>
                                            <span onClick={() => setMailAttachments(mailAttachments.filter(x => x.id !== a.id))} style={{ color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                                        </div>
                                    )) : <div style={{ color: '#222', fontSize: '12px' }}>Вложения отсутствуют</div>}
                                </div>
                            </Section>
                            <Section title="ПРЕДПРОСМОТР ПИСЬМА">
                                <div style={{ background: '#050505', padding: '20px', borderRadius: '10px', border: '1px dashed #333' }}>
                                    <div style={{ color: '#f0c040', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{mailSubject || 'БЕЗ ТЕМЫ'}</div>
                                    <div style={{ color: '#888', fontSize: '12px', lineHeight: '1.4' }}>{mailBody || 'Текст письма не заполнен...'}</div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                        {mailAttachments.map(a => <div key={a.id} style={{ width: '30px', height: '30px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{a.icon}</div>)}
                                    </div>
                                </div>
                            </Section>
                        </div>
                    </div>
                );
            case 'ЧАТ':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '700px' }}>
                        <div style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {chatMessages.map(msg => (
                                <div key={msg.id} style={{ background: msg.isAdmin ? 'rgba(255, 77, 77, 0.05)' : '#000', padding: '12px', borderRadius: '10px', border: msg.isAdmin ? '1px solid rgba(255, 77, 77, 0.2)' : '1px solid #111' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <span style={{ color: msg.isAdmin ? '#ff4d4d' : '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>{msg.senderName} {msg.isAdmin && '🛡️'}</span>
                                        <span style={{ color: '#333', fontSize: '10px' }}>{msg.timestamp}</span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#eee', lineHeight: '1.4' }}>{msg.text}</div>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px', borderTop: '1px solid #111', paddingTop: '8px' }}>
                                        <button onClick={() => { setSelectedPlayerId(msg.senderId); setActiveTab('СЕРВЕР'); }} style={{ background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer', padding: 0 }}>[ПРОФИЛЬ]</button>
                                        <button onClick={() => alert('MESSAGE DELETED')} style={{ background: 'none', border: 'none', color: '#431b1b', fontSize: '10px', cursor: 'pointer', padding: 0 }}>[УДАЛИТЬ]</button>
                                        <button onClick={() => { setModReason('Нарушение в чате'); setSelectedPlayerId(msg.senderId); setActiveTab('СЕРВЕР'); }} style={{ background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer', padding: 0 }}>[МУТ]</button>
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
                                    onChange={e => setAdminChatMessage(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && sendAdminChatMessage()}
                                />
                                <button onClick={sendAdminChatMessage} style={{ ...applyBtn, height: 'auto', padding: '0 25px', background: '#ff4d4d', color: '#fff', fontSize: '12px' }}>ОТПРАВИТЬ 📢</button>
                            </div>
                        </Section>
                    </div>
                );
            case 'СИСТЕМА':
                return (
                    <div style={contentGrid}>
                        <Section title="ДВИЖОК & ПРОФАЙЛЕР">
                            <ToggleRow label="SHOW FPS / MEMORY" active={store.showFps} onToggle={() => store.setShowFps(!store.showFps)} />
                            <ToggleRow label="SHOW HITBOXES (Debug Bounds)" active={store.showHitboxes} onToggle={() => store.setShowHitboxes(!store.showHitboxes)} />
                            <div style={{ background: '#050505', padding: '15px', borderRadius: '8px', marginTop: '15px', border: '1px solid #111' }}>
                                <div style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>LIVE ENGINE STATS:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                                    <div style={{ color: '#2ecc71' }}>FPS: 60.0</div>
                                    <div style={{ color: '#3498db' }}>DRAW CALLS: 128</div>
                                    <div style={{ color: '#e67e22' }}>MEM: 142MB</div>
                                    <div style={{ color: '#9b59b6' }}>TEXTURES: 44</div>
                                </div>
                            </div>
                        </Section>
                        <Section title="ЭМУЛЯЦИЯ ДИСПЛЕЯ">
                            <div style={statLabel}>ПРЕСЕТЫ РАЗРЕШЕНИЙ:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
                                <button style={btnStyle} onClick={() => alert('PC Preset 1920x1080')}>PC Full HD</button>
                                <button style={btnStyle} onClick={() => alert('iPhone X Preset')}>iPhone X (Notch)</button>
                                <button style={btnStyle} onClick={() => alert('iPad Air Preset')}>iPad Air (4:3)</button>
                                <button style={btnStyle} onClick={() => alert('Android Low-End')}>Android (Low-Res)</button>
                            </div>
                            <ToggleRow label="SAFE ZONE OVERLAY (Mobile)" active={store.showSafeZone} onToggle={() => store.setShowSafeZone(!store.showSafeZone)} />
                        </Section>
                        <Section title="СЕТЕВАЯ ОТЛАДКА">
                            <div style={statLabel}>СИМУЛЯЦИЯ ПИНГА (Latency):</div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                                {[0, 50, 150, 500, 2000].map(p => (
                                    <button key={p} onClick={() => store.setDebugPing(p)} style={{ ...btnStyle, flex: 1, border: store.debugPing === p ? '1px solid #ff4d4d' : '1px solid #222' }}>{p}ms</button>
                                ))}
                            </div>
                            <ToggleRow label="OFFLINE MODE (Stop Sync)" active={store.isOfflineMode} onToggle={() => store.setOfflineMode(!store.isOfflineMode)} />
                        </Section>
                        <Section title="СИСТЕМНЫЙ СЕРВИС">
                            <button onClick={() => store.copyDebugDump()} style={bigBtnStyle}>СКОПИРОВАТЬ DEBUG DUMP (JSON) 📄</button>
                            <button onClick={() => confirm('ВЫПОЛНИТЬ ПОЛНЫЙ СБРОС?') && localStorage.clear()} style={{ ...bigBtnStyle, background: '#431b1b', color: '#ff4d4d', marginTop: '10px' }}>HARD RESET LOCAL DATA</button>
                        </Section>
                    </div>
                );
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1 style={titleStyle}>GOD HUB <span style={{ color: '#444' }}>v3.0 MAXIMUM STATION</span></h1>
                    <div style={{ background: '#111', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', color: '#666', border: '1px solid #222' }}>INDUSTRIAL BUILD</div>
                </div>
                <div style={{ display: 'flex', gap: '25px' }}>
                    {(['ИГРОК', 'БОЙ', 'СЕРВЕР', 'ПОЧТА', 'ЧАТ', 'СИСТЕМА'] as AdminTab[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...tabButtonStyle, borderBottom: activeTab === tab ? '2px solid #ff4d4d' : 'none', color: activeTab === tab ? '#fff' : '#444' }}>{tab}</button>
                    ))}
                </div>
                <button onClick={onClose} style={closeButtonStyle}>ЗАКРЫТЬ</button>
            </div>
            <div style={scrollAreaStyle}>{renderTabContent()}</div>
        </div>
    );
};

// --- STYLES (EXPLICIT & VERBOSE) ---
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(5, 5, 5, 0.98)', backdropFilter: 'blur(35px)', color: '#fff', padding: '30px 40px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', pointerEvents: 'auto' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '20px' };
const titleStyle: React.CSSProperties = { margin: 0, color: '#ff4d4d', fontSize: '22px', fontWeight: 900, letterSpacing: '1px' };
const tabButtonStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', padding: '10px 0', transition: 'color 0.2s' };
const closeButtonStyle: React.CSSProperties = { background: '#ff4d4d', color: '#fff', border: 'none', padding: '12px 25px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 15px rgba(255, 77, 77, 0.3)' };
const scrollAreaStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', paddingRight: '10px' };
const contentGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' };
const sectionStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid #1a1a1a', marginBottom: '15px' };
const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div style={sectionStyle}>
        <div style={{ fontSize: '11px', color: '#333', marginBottom: '15px', borderBottom: '1px solid #111', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{title}</div>
        {children}
    </div>
);
const editRow: React.CSSProperties = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' };
const applyBtn: React.CSSProperties = { background: '#1b4332', color: '#4dff4d', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', background: '#050505', border: '1px solid #222', color: '#fff', borderRadius: '8px', fontSize: '13px' };
const btnStyle: React.CSSProperties = { background: '#111', color: '#fff', border: '1px solid #222', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', textAlign: 'center', transition: 'background 0.2s' };
const bigBtnStyle: React.CSSProperties = { width: '100%', padding: '15px', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const terminalStyle: React.CSSProperties = { height: '150px', background: '#000', padding: '15px', fontSize: '11px', color: '#2ecc71', overflowY: 'auto', borderRadius: '8px', border: '1px solid #111', marginTop: '10px' };
const statBox: React.CSSProperties = { background: '#050505', padding: '15px', borderRadius: '10px', border: '1px solid #111', textAlign: 'center' };
const statLabel: React.CSSProperties = { fontSize: '10px', color: '#444', marginBottom: '6px', textTransform: 'uppercase' };
const smallBtnStyle: React.CSSProperties = { padding: '8px 15px', background: '#111', border: '1px solid #222', color: '#666', fontSize: '11px', borderRadius: '6px', cursor: 'pointer' };
const ToggleRow: React.FC<{ label: string, active: boolean, onToggle: () => void }> = ({ label, active, onToggle }) => (
    <div onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#080808', borderRadius: '10px', cursor: 'pointer', marginBottom: '8px', border: active ? '1px solid #ff4d4d' : '1px solid #1a1a1a', transition: 'border 0.2s' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: active ? '#fff' : '#666' }}>{label}</span>
        <div style={{ width: '40px', height: '20px', background: active ? '#ff4d4d' : '#222', borderRadius: '10px', position: 'relative', transition: 'background 0.3s' }}>
            <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: active ? '22px' : '2px', transition: 'left 0.3s' }} />
        </div>
    </div>
);
