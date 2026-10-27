/**
 * PORTAL CONSTANTS (Единый канонический источник правды для официального портала игры)
 * Согласно эталонному аудиту кодовой базы Masters of the Wild (559 коммитов).
 */

export const OFFICIAL_DOMAIN = 'mastersofthewild.ru';
export const GAME_TITLE = 'Masters of the Wild';
export const GAME_TITLE_RU = 'Мастера Дикой природы';
export const GAME_VERSION = 'v1.0 (HD)';
export const GAME_STATUS_TEXT = 'Zero-Server • Мгновенный запуск 60 FPS';

// Архитектурные метаданные
export const ARCHITECTURE_TITLE = 'Zero-Server Client-Side Engine';
export const ENGINE_STACK = 'React 19 + PixiJS v8 + Zustand';
export const STORAGE_BACKEND = 'VK Cloud Storage (4 шарда) + LocalStorage';
export const COMPLIANCE_LAW = 'Федеральный закон № 152-ФЗ «О персональных данных»';

// Аудио метаданные
export const AUDIO_TRACKS_COUNT = 18;
export const AUDIO_STANDARD = 'EBU R128 (-14 LUFS)';

// Экономика и экипировка
export const GEAR_SLOTS_COUNT = 7;
export const GEAR_DATABASE_SIZE = '188 КБ';
export const GEAR_SLOTS = [
  'Оружие',
  'Шлем',
  'Нагрудный доспех',
  'Штаны',
  'Сапоги',
  'Наплечники',
  'Щит',
] as const;

export const GEAR_RARITIES = [
  { id: 'COMMON', name: 'Обычный', color: '#9ca3af' },
  { id: 'RARE', name: 'Редкий', color: '#3b82f6' },
  { id: 'EPIC', name: 'Эпический', color: '#a855f7' },
  { id: 'LEGENDARY', name: 'Легендарный', color: '#eab308' },
  { id: 'MYTHIC', name: 'Мифический', color: '#ef4444' },
] as const;

// Каноническая ранговая система PvP (9 Лиг)
export const PVP_RANKS = [
  { name: 'Новичок', range: '0 – 499 кубков', color: '#8d5d1a' },
  { name: 'Боец', range: '500 – 999 кубков', color: '#b7791f' },
  { name: 'Ветеран', range: '1000 – 1999 кубков', color: '#a0aec0' },
  { name: 'Элита', range: '2000 – 2999 кубков', color: '#10b981' },
  { name: 'Мастер', range: '3000 – 3999 кубков', color: '#d69e2e' },
  { name: 'Гроссмейстер', range: '4000 – 4999 кубков', color: '#00f2ff' },
  { name: 'Чемпион', range: '5000 – 5999 кубков', color: '#3b82f6' },
  { name: 'Легенда', range: '6000 – 7499 кубков', color: '#f59e0b' },
  { name: 'Владыка', range: '7500+ кубков', color: '#ef4444' },
] as const;
