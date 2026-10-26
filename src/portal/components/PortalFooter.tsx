import React from 'react';
import { SwordGlyph, TelegramGlyph, VkGlyph } from './PortalGlyphs';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { SERVER_NAME, SERVER_ONLINE_STRING } from '../portalConstants';

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
        borderTop: '1px solid rgba(212, 175, 55, 0.25)',
        color: '#9c8e7e',
        padding: '60px 24px 30px',
        fontSize: '13px',
        lineHeight: 1.6,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Top Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          {/* Col 1: Studio & Game Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0d0903',
                  fontWeight: 900,
                  fontSize: '16px',
                }}
              >
                <SwordGlyph size={18} color="#0d0903" />
              </div>
              <span
                style={{
                  fontFamily: "'Philosopher', serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#FFE07D',
                }}
              >
                MASTERS OF THE WILD
              </span>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#c5b8a5', fontSize: '13px' }}>
              Официальный портал браузерной арены Masters of the Wild. Сражения чемпионов, дуэли и прокачка навыков.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                color: '#4ade80',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              Сервер {SERVER_NAME} (Онлайн {SERVER_ONLINE_STRING})
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#FFE07D',
                fontWeight: 700,
                fontFamily: "'Philosopher', serif",
              }}
            >
              Разделы
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <button
                  onClick={() => scrollTo('hero')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Главная
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('beasts')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Звери и Чемпионы
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('music')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Саундтреки (OST)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('rewards')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Награды
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('leaderboard')}
                  style={{ background: 'none', border: 'none', color: '#c4b5a2', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  Зал Славы
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Community & Direct Play */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#FFE07D',
                fontWeight: 700,
                fontFamily: "'Philosopher', serif",
              }}
            >
              Сообщество
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
                <TelegramGlyph size={16} color="#38bdf8" /> Telegram Бот
              </a>
              <a
                href="https://vk.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '13px',
                }}
              >
                <VkGlyph size={16} color="#3b82f6" /> Сообщество ВКонтакте
              </a>
              <button
                onClick={onLaunchGame}
                style={{
                  marginTop: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 100%)',
                  color: '#120d04',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  cursor: 'pointer',
                  fontFamily: "'Philosopher', serif",
                }}
              >
                Запустить Игру
              </button>
            </div>
          </div>

          {/* Col 4: Legal & 152-ФЗ Compliance */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#FFE07D',
                fontWeight: 700,
                fontFamily: "'Philosopher', serif",
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
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
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
                  Возрастная классификация (436-ФЗ)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#73685c',
          }}
        >
          <div>
            Masters of the Wild © 2026. Все права защищены.
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>WebGL 2.0 / PixiJS v8 Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
