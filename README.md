# 🐼 Masters of the Wild

**Браузерная PvE-игра с автоматическими боями, прокачкой и лутом.**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-in%20development-yellow)

---

## 🎮 Геймплей

### Концепция
- **30-60 секунд бой** — быстрые и динамичные сражения
- **Автоматический боевой движок** — персонажи атакуют сами
- **Простая прокачка** — улучшай урон, HP, скорость
- **Система крита** — процент шанса для повышенного урона
- **Лут и награды** — получай золото, опыт, предметы

### Игровой loop
```
1. Выбрать зверя + оружие
2. Нажать "В БОЙ!"
3. Автоматический бой (60 сек)
4. Получить награду
5. Прокачать персонажа
6. Новый бой
```

---

## 👥 Персонажи

| Персонаж | Тип | HP | ATK | SPD | Крит | Особенность |
|----------|-----|----|-----|-----|------|------------|
| 🐼 Панда | Баланс | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Универсальный |
| 🦌 Лось | Танк | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ | Защита |
| 🦆 Гусь | Быстрый | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Ловкость |
| 🐱 Кот | Крит | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Крит-дамаж |
| 🐗 Кабан | Урон | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | Мощь |

---

## ⚔️ Оружие

| Оружие | Редкость | ATK | CRT | SPD | Описание |
|--------|----------|-----|-----|-----|---------|
| 🩴 Тапок | Common | +15 | +5% | -10% | Легкий, быстрый |
| 🔨 Лопата | Rare | +75 | +10% | +15% | Универсальное |
| 🏋️ Гантеля | Rare | +100 | +2% | +50% | Максимум урона |
| 🐟 Рыба | Epic | +30 | +20% | -5% | Высокий крит |
| 🍳 Сковорода | Epic | +50 | +15% | +20% | Баланс |
| 🌳 Палка | Common | +20 | +3% | +0% | Базовое |

---

## 🏗️ Архитектура

### Слои (Z-Index)

```
UI Layer (z=4)         ← Меню, HP bars, эффекты
├─ Dialog/Popups
└─ HUD

Effects Layer (z=3)    ← Частицы, цифры урона
├─ Particle Burst
├─ Damage Numbers
└─ Screen Shake

Game Layer (z=2)       ← Персонажи, враги
├─ Player
├─ Enemy
└─ Objects

Background Layer (z=1) ← Фоны, ландшафт
└─ Background Sprites

Debug Layer (z=5)      ← Дебага информация
```

### Системы

#### 1. **PixiApp** (Ядро)
- Инициализация PixiJS
- Управление слоями (Layer Management)
- Screen Shake эффект
- Y-Sorting для глубины
- Update loop управление

```typescript
const app = PixiApp.getInstance();
await app.init({ width: 1280, height: 720 });
app.addUpdateLoop((dt) => console.log('FPS:', app.getFps()));
```

#### 2. **AssetLoader** (Ресурсы)
- Кэширование текстур
- Загрузка ассетов
- Object Pooling
- Поддержка плейсхолдеров

```typescript
const loader = AssetLoader.getInstance();
loader.createPlaceholders(); // Дебага без текстур
const texture = loader.getTexture('panda');
```

#### 3. **EffectsManager** (Эффекты AAA)
- Screen Shake с затуханием
- Color Flash вспышка
- Particle Burst взрывы
- Slow Motion замедление
- Fade In/Out переходы
- Lerp интерполяция
- Critical Hit combo эффект

```typescript
const fx = EffectsManager.getInstance();
fx.screenShake(10, 0.95, 400);
fx.criticalHit(targetSprite, 1.3);
fx.particleBurst(x, y, 20, 0xffdd00, 250);
```

#### 4. **BattleState** (Боевой движок)
- State Machine (ACTIVE, FINISHED, ERROR)
- Object Pooling для цифр урона
- Y-Sorting персонажей
- Расчет урона и крита
- Награды и статистика

```typescript
const battle = new BattleState();
await battle.startBattle('panda', 'moose');
pixiApp.addUpdateLoop((dt) => battle.update(dt));
```

#### 5. **useGameStore** (Zustand Store)
- Управление состоянием игры
- Система модификаторов оружия
- Расчет финальных статов (база + оружие)
- Управление ресурсами (gold, diamonds)

```typescript
const store = useGameStore.getState();
store.equipWeapon('pan');
const stats = store.getCalculatedStats('panda');
// stats = { hp: 3250, attack: 570, speed: 2.2, ... }
```

#### 6. **BaseEntity** (Персонаж)
- State Machine (IDLE, ATTACK, TAKE_DAMAGE, DIE)
- Socket System для оружия
- Lerp интерполяция движений
- Анимации GSAP
- HP управление

```typescript
const entity = new BaseEntity(texture, stats, weaponTexture);
entity.setState(EntityState.ATTACK);
entity.setHp(entity.getHp() - 50);
```

---

## 🎯 Senior-уровень оптимизация

### ✅ Object Pooling
- Пул цифр урона (30 объектов)
- Пул частиц (100 объектов)
- Переиспользование вместо создания/удаления

### ✅ Lerp интерполяция
- Плавные движения персонажей
- Easing функции (power2.inOut, power2.out)
- Smooth transitions между состояниями

### ✅ State Machine
- 4 состояния для персонажей (IDLE, ATTACK, TAKE_DAMAGE, DIE)
- 4 статуса для боя (PREPARING, ACTIVE, FINISHED, ERROR)
- Четкие переходы между состояниями

### ✅ Y-Sorting
- Правильная глубина для 2D персонажей
- Автоматическая сортировка по Y координате
- Работает каждый кадр

### ✅ Screen Shake с затуханием
- Интенсивность затухает плавно
- Коэффициент damping (0.95)
- Применяется к gameLayer

### ✅ Система модификаторов
- Базовые статы персонажа
- Бонусы от оружия
- Финальные статы = база + оружие

```typescript
// Финальные статы Панды с Сковородой
{
  hp: 3250,        // Базовое HP
  attack: 570,     // 520 (база) + 50 (сковорода)
  speed: 2.2,      // 2.0 (база) + 0.2 (сковорода)
  critChance: 0.25 // 0.1 (база) + 0.15 (сковорода)
}
```

### ✅ AAA-Инди Эффекты
- Screen Shake при крите
- Color Flash вспышка урона
- Particle Burst золотые искры
- Slow Motion на крит
- Death Effect на смерть

---

## 📦 Установка и запуск

### Требования
- Node.js 16+
- npm или yarn

### Шаг 1: Инициализация
```bash
npm install
```

### Шаг 2: Разработка (Hot Reload)
```bash
npm run dev
```

### Шаг 3: Продакшн
```bash
npm run build
npm run preview
```

---

## 📁 Структура проекта

```
.
├── src/
│   ├── App.ts                           # Главное приложение
│   ├── engine/
│   │   ├── core/
│   │   │   └── PixiApp.ts              # Ядро движка
│   │   └── systems/
│   │       ├── AssetLoader.ts          # Загрузка ассетов
│   │       └── EffectsManager.ts       # Эффекты
│   ├── game/
│   │   ├── configs/
│   │   │   └── ItemsConfig.ts          # БД оружия
│   │   ├── entities/
│   │   │   └── BaseEntity.ts           # Персонаж
│   │   └── states/
│   │       └── BattleState.ts          # Боевой движок
│   └── store/
│       └── useGameStore.ts             # Zustand store
├── index.html                           # HTML точка входа
├── package.json
└── README.md
```

---

## 🎨 Визуальный стиль

### Цветовая палитра
- **Background**: `#1a1a2e` (Темно-синий)
- **Primary**: `#ffdd00` (Желтый)
- **Success**: `#00ff00` (Зеленый)
- **Danger**: `#ff0000` (Красный)
- **Accent**: `#00ffff` (Голубой)

### Шрифты
- **Заголовки**: Arial Black, 48-64px
- **UI**: Arial Bold, 24-32px
- **Текст**: Arial, 16-20px
- **Debug**: Courier New, 12px

---

## 🚀 Дорожная карта

### MVP (v1.0.0) ✅
- [x] Боевая система
- [x] 5 персонажей
- [x] 6 оружий
- [x] EffectsManager
- [x] Store + модификаторы

### Phase 2 (v1.1.0) 🔄
- [ ] UI экраны (меню, инвентарь, прокачка)
- [ ] Система прокачки
- [ ] Сохранение прогресса
- [ ] Звуки и музыка

### Phase 3 (v1.2.0) 📅
- [ ] Система способностей (Abilities)
- [ ] Рейтинг и лидерборд
- [ ] Скины персонажей
- [ ] Премиум контент

### Phase 4 (v2.0.0) 🎯
- [ ] Мультиплеер PvP
- [ ] Клан система
- [ ] Сезоны и события

---

## 🐛 Известные проблемы

- [ ] TextStyle.strokeThickness может быть Text.stroke
- [ ] Нужно переименовать приватные слои в PixiApp
- [ ] Требуется реальная загрузка текстур

---

## 📖 Дополнительная документация

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Полная архитектура системы
- [DEBUG.md](./DEBUG.md) — Гайд по отладке (в разработке)

---

## 👨‍💻 Разработка

### Правила кодирования
- **Senior-стандарты**: 200-400+ строк на файл
- **JSDoc документация**: Все функции и классы
- **try-catch**: Обработка всех ошибок
- **State Machine**: Все сущности
- **Object Pooling**: Для оптимизации

### Тестирование
```bash
npm run test
npm run lint
```

### Дебага
- Нажми **D** в игре для показа/скрытия дебага информации
- Открой Developer Console (F12) для логов

---

## 📄 Лицензия

MIT © 2026 Masters of the Wild Team

---

## 🤝 Автор

**Senior Full-Stack Game Developer**
- Специализация: PixiJS, Vite, React
- Опыт: AAA-инди стандарты, оптимизация, архитектура

---

## 📞 Контакты

- 🐾 **Discord**: (в разработке)
- 📧 **Email**: (в разработке)

---

**Спасибо за интерес к Masters of the Wild! 🐼🐿️🦌**
