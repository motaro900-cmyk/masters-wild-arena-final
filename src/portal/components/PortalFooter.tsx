import { TelegramGlyph, VkGlyph, ShieldGlyph } from './PortalGlyphs';
/**
 * PORTAL FOOTER (Подвал Портала & Юридический Блок 152-ФЗ / 436-ФЗ)
 * Правовые документы, возрастная маркировка 12+, ссылки на сообщества
 * и телеметрия игрового сервера.
 */
import React from 'react';
import { proceduralAudio } from '../../utils/ProceduralAudio';

interface PortalFooterProps {
  onLaunchGame: () => void;
  onOpenLegal?: (tab: 'privacy' | 'terms' | 'cookies' | 'age') => void;
}

export const PortalFooter: React.FC<PortalFooterProps> = ({ onLaunchGame, onOpenLegal }) => {
  const scrollTo = (id: string) => {
    proceduralAudio.playClick(1.0);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      id="footer"
      style={{
        position: 'relative',
        backgroundColor: '#040306',
        borderTop: '1px solid rgba(200, 168, 112, 0.2)',
        color: '#9c8e7e',
        padding: '60px 24px 30px',
        fontSize: '13px',
        lineHeight: 1.6,
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Top Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
            marginBottom: '50px',
          }}
        >
          {/* Col 1: Studio & Game Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0d0903',
                  fontWeight: 900,
                  fontSize: '16px',
                }}
              >
                
              </div>
              <span
                style={{
                  fontFamily: "'Philosopher', 'Cinzel', serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#FFE07D',
                }}
              >
                MASTERS OF THE WILD
              </span>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#8c7e6f' }}>
              Полноценная браузерная AAA-RPG нового поколения. Кроссплатформенная боевая вселенная,
              где каждый зверь обладает душой и силой древних предков.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Сервер S1: Wild Lands (Онлайн 1,482)
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#d4af37',
                fontWeight: 700,
              }}
            >
              Разделы Портала
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <button
                  onClick={() => scrollTo('hero')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Главная & Промокод
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('beasts')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Интерактивный Бестиарий
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('music')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Святилище Звука (OST)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('rewards')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Благословение Леса (Награды)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('leaderboard')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Чертоги Славы (PvP)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Community & Direct Play */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#d4af37',
                fontWeight: 700,
              }}
            >
              Сообщество & Вход
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="https://t.me/MastersoftheWildGamebot"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: '13px',
                }}
              >
                <TelegramGlyph size={16} color="#38bdf8" /> Telegram Бот & Чат
              </a>
              <a href="https://vk.com" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3b82f6", textDecoration: "none", fontSize: "13px" }}><VkGlyph size={16} color="#3b82f6" /> Сообщество ВКонтакте
              </a>
              <button
                onClick={onLaunchGame}
                style={{
                  marginTop: '8px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                  color: '#120d04',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                 Запустить Игру Сейчас
              </button>
            </div>
          </div>

          {/* Col 4: Legal & 152-ФЗ Compliance */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#d4af37',
                fontWeight: 700,
              }}
            >
              Правовая Информация
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => onOpenLegal?.('privacy')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#9c8e7e', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}
              >
                Политика конфиденциальности (152-ФЗ)
              </button>
              <button
                onClick={() => onOpenLegal?.('terms')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#9c8e7e', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}
              >
                Пользовательское соглашение
              </button>
              <button
                onClick={() => onOpenLegal?.('cookies')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#9c8e7e', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}
              >
                Использование файлов cookie
              </button>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1.5px solid #d4af37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFE07D',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  12+
                </div>
                <button
                  onClick={() => onOpenLegal?.('age')}
                  style={{ background: 'none', border: 'none', padding: 0, fontSize: '11px', color: '#73685c', cursor: 'pointer', textAlign: 'left' }}
                >
                  Знак информационной продукции (ФЗ № 436-ФЗ)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '12px',
            color: '#6b6053',
          }}
        >
          <div>
            Wild Games Studio © 2026. Все товарные знаки и персонажи являются собственностью студии.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Версия портала: v1.2.4</span>
            <span>•</span>
            <span>WebGL 2.0 / PixiJS v8 Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
