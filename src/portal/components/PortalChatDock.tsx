import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { censorText } from '../../utils/censor';
import { SwordGlyph, FlameGlyph, TrophyGlyph, CrystalGlyph, ShieldGlyph } from './PortalGlyphs';

/**
 * PORTAL CHAT DOCK (Коммьюнити-док и лента активности игроков)
 * Плавающая компактная панель в правом нижнем углу:
 * - Свернутый режим: бейдж онлайна (1,482 в сети) + тикер последних побед и дропов.
 * - Развернутый режим: стеклянная карточка с фильтрами («Все», «Чат», «Дропы & Арена»).
 * - Симуляция живого игрового мира (лут мифических реликвий, дуэли в Зале Чемпионов).
 * - Отправка пользовательских сообщений с анти-спам кулдауном и цензурным фильтром (152/436-ФЗ).
 */

export interface IChatActivityItem {
  id: string;
  type: 'chat' | 'loot' | 'duel' | 'system';
  author: string;
  avatar?: string;
  role?: 'игрок' | 'ветеран' | 'чемпион' | 'система';
  text: string;
  itemHighlight?: string;
  itemRarityColor?: string;
  timestamp: string;
}

const INITIAL_ACTIVITIES: IChatActivityItem[] = [
  {
    id: 'act-1',
    type: 'loot',
    author: 'Аурелиус',
    role: 'чемпион',
    text: 'получил из реликтового сундука',
    itemHighlight: 'Золотой Клинок Солнца [MYTHIC]',
    itemRarityColor: '#ef4444',
    timestamp: '1 мин назад',
  },
  {
    id: 'act-2',
    type: 'duel',
    author: 'Варкан',
    role: 'ветеран',
    text: 'сокрушил оппонента в Зале Чемпионов (+28 рейтинга)',
    timestamp: '2 мин назад',
  },
  {
    id: 'act-3',
    type: 'chat',
    author: 'Громм',
    role: 'игрок',
    text: 'Кто собирает рейд на Болотного Змея? Танк 45 уровня готов!',
    timestamp: '4 мин назад',
  },
  {
    id: 'act-4',
    type: 'loot',
    author: 'Рикки',
    role: 'ветеран',
    text: 'заточил в кузнице предков',
    itemHighlight: 'Парные Костяные Клинки +8',
    itemRarityColor: '#38bdf8',
    timestamp: '6 мин назад',
  },
  {
    id: 'act-5',
    type: 'system',
    author: 'Владыка Арены',
    role: 'система',
    text: 'Через 45 минут начнется Турнир Зари. Награды утроены!',
    timestamp: '10 мин назад',
  },
];

const SIMULATED_EVENTS = [
  {
    type: 'loot' as const,
    author: 'Радомир',
    role: 'игрок' as const,
    text: 'нашел в Древних Руинах',
    itemHighlight: 'Лунная Секира Теней [LEGENDARY]',
    itemRarityColor: '#f59e0b',
  },
  {
    type: 'duel' as const,
    author: 'Снежный Барс',
    role: 'чемпион' as const,
    text: 'защитил титул Мастера Арены (Серия 5 побед!)',
  },
  {
    type: 'chat' as const,
    author: 'Altai_Warrior',
    role: 'ветеран' as const,
    text: 'Качайте защиту от яда, у василиска на 3 фазе дикий урон!',
  },
  {
    type: 'loot' as const,
    author: 'Kael',
    role: 'игрок' as const,
    text: 'получил благословение духа',
    itemHighlight: 'Оперение Феникса [MYTHIC]',
    itemRarityColor: '#ef4444',
  },
  {
    type: 'chat' as const,
    author: 'Zhenya_Wild',
    role: 'игрок' as const,
    text: 'Грац с мификом! Где сундук выбил?',
  },
];

export const PortalChatDock: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chat' | 'events'>('all');
  const [messages, setMessages] = useState<IChatActivityItem[]>(INITIAL_ACTIVITIES);
  const [inputText, setInputText] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);

  const feedEndRef = useRef<HTMLDivElement | null>(null);

  // Ротация бегущей строки в свернутом режиме каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Симуляция пульса живого сервера каждые 12 секунд
  useEffect(() => {
    const timer = setInterval(() => {
      const randomEvent = SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)];
      const newAct: IChatActivityItem = {
        id: `sim-${Date.now()}`,
        type: randomEvent.type,
        author: randomEvent.author,
        role: randomEvent.role,
        text: randomEvent.text,
        itemHighlight: (randomEvent as any).itemHighlight,
        itemRarityColor: (randomEvent as any).itemRarityColor,
        timestamp: 'только что',
      };

      setMessages((prev) => [...prev.slice(-25), newAct]);
      if (!isExpanded) {
        setUnreadCount((c) => Math.min(c + 1, 9));
      }
    }, 12000);

    return () => clearInterval(timer);
  }, [isExpanded]);

  // Автопрокрутка вниз при новых сообщениях, если окно открыто
  useEffect(() => {
    if (isExpanded) {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || cooldown) return;

    proceduralAudio.playClick(1.2);
    const filtered = censorText(trimmed);

    const newMsg: IChatActivityItem = {
      id: `user-${Date.now()}`,
      type: 'chat',
      author: 'Вы (Странник)',
      role: 'ветеран',
      text: filtered,
      timestamp: 'только что',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setCooldown(true);

    setTimeout(() => setCooldown(false), 2000);
  };

  const handleQuickEmote = (emote: string) => {
    setInputText((prev) => prev + emote);
  };

  const toggleOpen = () => {
    proceduralAudio.playClick(1.0);
    setIsExpanded((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  };

  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'chat') return m.type === 'chat';
    if (activeTab === 'events') return m.type === 'loot' || m.type === 'duel' || m.type === 'system';
    return true;
  });

  const activeTicker = messages[tickerIndex] || messages[0];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 90,
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <AnimatePresence>
        {/* 1. РАЗВЕРНУТЫЙ РЕЖИМ (Glassmorphism Window) */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              width: 'min(380px, calc(100vw - 32px))',
              height: '520px',
              maxHeight: 'calc(100vh - 120px)',
              backgroundColor: 'rgba(12, 10, 18, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(212, 175, 55, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              marginBottom: '12px',
            }}
          >
            {/* Шапка Дока */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                background:
                  'linear-gradient(90deg, rgba(212, 175, 55, 0.12) 0%, rgba(20, 16, 28, 0.8) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                    display: 'inline-block',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#f5edd8',
                      fontFamily: "'Philosopher', serif",
                      letterSpacing: '0.5px',
                    }}
                  >
                    Мировой Эфир
                  </div>
                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                    248 игроков онлайн
                  </div>
                </div>
              </div>

              <button
                onClick={toggleOpen}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a3988c',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'color 0.15s ease',
                }}
                title="Свернуть панель"
              >
                ✕
              </button>
            </div>

            {/* Переключатель вкладок */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              {[
                { id: 'all', label: 'Все' },
                { id: 'chat', label: 'Чат' },
                { id: 'events', label: 'Дропы & Арена' },
              ].map((tab) => {
                const isSel = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      proceduralAudio.playClick(1.0);
                      setActiveTab(tab.id as any);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isSel ? '#d4af37' : '#7d7265',
                      border: 'none',
                      borderBottom: isSel ? '2px solid #d4af37' : '2px solid transparent',
                      background: isSel ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Лента сообщений */}
            <div
              style={{
                flex: 1,
                padding: '12px 14px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {filteredMessages.map((item) => (
                <div
                  key={item.id}
                  style={{
                    fontSize: '12px',
                    lineHeight: 1.45,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor:
                      item.type === 'loot'
                        ? 'rgba(212, 175, 55, 0.08)'
                        : item.type === 'duel'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : item.type === 'system'
                        ? 'rgba(168, 85, 247, 0.08)'
                        : 'rgba(255, 255, 255, 0.03)',
                    borderLeft: `3px solid ${
                      item.type === 'loot'
                        ? '#d4af37'
                        : item.type === 'duel'
                        ? '#ef4444'
                        : item.type === 'system'
                        ? '#c084fc'
                        : 'rgba(255, 255, 255, 0.15)'
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '3px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#f5edd8' }}>{item.author}</span>
                      {item.role && (
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(212, 175, 55, 0.15)',
                            color: '#d4af37',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.role}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: '#6e6457' }}>{item.timestamp}</span>
                  </div>

                  <div style={{ color: '#d1c7bc' }}>
                    {item.text}{' '}
                    {item.itemHighlight && (
                      <span
                        style={{
                          fontWeight: 800,
                          color: item.itemRarityColor || '#d4af37',
                        }}
                      >
                        {item.itemHighlight}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={feedEndRef} />
            </div>

            {/* Быстрые тактические фразы с векторными иконками (без эмодзи) */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                overflowX: 'auto',
              }}
            >
              {[
                { label: 'Клич', icon: <SwordGlyph size={12} color="#ef4444" />, text: 'К оружию!' },
                { label: 'Огонь', icon: <FlameGlyph size={12} color="#f97316" />, text: 'В пламя битвы!' },
                { label: 'Слава', icon: <TrophyGlyph size={12} color="#eab308" />, text: 'Слава чемпионам!' },
                { label: 'Мана', icon: <CrystalGlyph size={12} color="#60a5fa" />, text: 'Сила с нами!' },
              ].map((act) => (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => handleQuickEmote(act.text)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#c5b8a5',
                    fontWeight: 700,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {act.icon}
                  <span>{act.label}</span>
                </button>
              ))}
            </div>

            {/* Поле ввода сообщения */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '10px 14px',
                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                gap: '8px',
                backgroundColor: 'rgba(10, 8, 14, 0.95)',
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={cooldown ? 'Подождите 2 сек...' : 'Сообщение в эфир...'}
                disabled={cooldown}
                maxLength={140}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  color: '#f5edd8',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || cooldown}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: inputText.trim()
                    ? 'linear-gradient(135deg, #d4af37 0%, #aa8420 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: inputText.trim() ? '#07050a' : '#73685c',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: inputText.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
              >
                Отправить
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. СВЕРНУТЫЙ РЕЖИМ (Floating Status Pill) */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={toggleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '24px',
          backgroundColor: 'rgba(14, 11, 20, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(212, 175, 55, 0.18)',
          color: '#f5edd8',
          cursor: 'pointer',
          outline: 'none',
          maxWidth: '380px',
        }}
      >
        {/* Пульсирующий зеленый индикатор онлайна */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              animation: 'ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
              opacity: 0.75,
            }}
          />
        </div>

        <div style={{ textAlign: 'left', minWidth: '110px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#d4af37' }}>
            1,482 онлайн
          </div>
          {/* Бегущий микро-тикер событий */}
          <div
            style={{
              fontSize: '10px',
              color: '#9c8e7e',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '190px',
            }}
          >
            {activeTicker ? `${activeTicker.author}: ${activeTicker.text}` : 'Эфир Диких Земель'}
          </div>
        </div>

        {/* Счетчик непрочитанных сообщений */}
        {unreadCount > 0 && (
          <span
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '10px',
              boxShadow: '0 0 8px #ef4444',
            }}
          >
            +{unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
};
