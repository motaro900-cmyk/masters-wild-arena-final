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
              Официальный сайт браузерной темной RPG Masters of the Wild (mastersofthewild.ru). Издатель и разработчик: Wild Games Studio (wildgames.ru).
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
              Сервер {SERVER_NAME} (s1.mastersofthewild.ru • Онлайн {SERVER_ONLINE_STRING})
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#FFE07D',
                fontFamily: "'Philosopher', serif",
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              РАЗДЕЛЫ
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => scrollTo('hero')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#e5e7eb', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
              >
                Главная & Регистрация
              </button>
              <button
                onClick={() => scrollTo('about')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#e5e7eb', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
              >
                Об игре & Скриншоты
              </button>
              <button
                onClick={() => scrollTo('beasts')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#e5e7eb', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
              >
                Звери и Чемпионы
              </button>
              <button
                onClick={() => scrollTo('music')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#e5e7eb', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
              >
                Саундтреки (OST)
              </button>
              <button
                onClick={() => scrollTo('rewards')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#e5e7eb', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
              >
                Награды
              </button>
              <button
                onClick={() => scrollTo('leaderboard')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#e5e7eb', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
              >
                Зал Славы
              </button>
            </div>
          </div>

          {/* Col 3: Community & Play */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#FFE07D',
                fontFamily: "'Philosopher', serif",
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              СООБЩЕСТВО
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href="https://t.me/motw_arena_bot"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                <TelegramGlyph size={18} color="#60a5fa" />
                <span>Telegram Бот</span>
              </a>
              <a
                href="https://vk.com/club238197449"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                <VkGlyph size={18} color="#3b82f6" />
                <span>Сообщество ВКонтакте</span>
              </a>

              <button
                onClick={onLaunchGame}
                style={{
                  marginTop: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 100%)',
                  color: '#120d04',
                  fontSize: '13px',
                  fontWeight: 900,
                  fontFamily: "'Philosopher', serif",
                  cursor: 'pointer',
                  letterSpacing: '0.8px',
                }}
              >
                ЗАПУСТИТЬ ИГРУ
              </button>
            </div>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#FFE07D',
                fontFamily: "'Philosopher', serif",
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              ПРАВОВАЯ ИНФОРМАЦИЯ
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
            Wild Games Studio © 2026. mastersofthewild.ru / wildgames.ru. Все права защищены.
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>WebGL 2.0 / PixiJS v8 Engine (60 FPS)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
