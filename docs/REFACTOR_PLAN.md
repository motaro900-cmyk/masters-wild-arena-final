# REFACTOR_PLAN.md — Masters of the Wild
*Сгенерировано: 2026-06-03. Только анализ — код не трогать до подтверждения.*

---

## ШАГ 1 — Список файлов свыше 1000 строк

```
Lines  File
-----  ----
1695   src\engine\entities\HeroUnit.ts
1499   src\engine\systems\EffectsManager.ts
1449   src\engine\core\BattleEngine.ts
1392   src\ui\components\hud\Matchmaking\MatchmakingFound.tsx
1306   src\main.tsx
1173   src\ui\components\hud\HeroScene\components\HeroList\index.tsx
1053   src\ui\components\hud\BattlePassScene.tsx
1015   src\ui\components\hud\Admin\AdminServerTab.tsx
```

Итого: **8 файлов** требуют рефакторинга.

---

## ШАГ 2 + 3 — Анализ и план разбивки каждого файла

---

### AdminServerTab.tsx (1015 строк)

**Что делает:** Администраторская вкладка — список реальных игроков, поиск/фильтры, инспектор ресурсов, чит-хелперы разработчика, панель модерации (бан/мут/кик/вайп).

**Логические блоки:**
1. `handleRemoteUpdate` — хелпер обновления данных в Firebase (стр. 64–75)
2. Левая колонка: поиск + фильтры по статусу и типу аккаунта (стр. 80–208)
3. Прокручиваемый список игроков (стр. 209–304)
4. Профиль игрока + инспектор ресурсов, энергии, VIP (стр. 316–435)
5. Инспектор инвентаря и gear dump (стр. 437–453, 712–791)
6. Формы быстрого редактирования (золото/кристаллы/уровень) (стр. 455–504)
7. Панель чит-хелперов (скины, герои, ресурсы, энергия) (стр. 506–710)
8. Панель модерации (бан, мут, кик, сброс рейтинга, вайп, логи жалоб) (стр. 793–997)

**Зависимости:**
- Блоки 4–8 зависят от `selectedPlayer` (выбранный игрок из списка слева)
- Чит-хелперы и модерация используют `syncService.updateRemotePlayerData`

**Предлагаемые новые файлы:**
| Новый файл | Что переносится | Примерно строк |
|---|---|---|
| `Admin/components/ServerPlayersList.tsx` | Строка поиска, фильтры, прокручиваемый список | ~230 |
| `Admin/components/PlayerInspector.tsx` | Инспектор ресурсов, инвентаря, gear dump | ~230 |
| `Admin/components/DevCheatsPanel.tsx` | Чит-хелперы (скины, герои, ресурсы, энергия) | ~210 |
| `Admin/components/PlayerModerationPanel.tsx` | Бан, мут, кик, сброс рейтинга, вайп, логи жалоб | ~200 |

**Порядок переноса:**
1. `ServerPlayersList.tsx` — изолирован, принимает `realPlayers`, `selectedPlayerId`, коллбеки
2. `PlayerInspector.tsx` — пассивное отображение, зависит только от `selectedPlayer`
3. `DevCheatsPanel.tsx` — прямые вызовы `syncService`, минимальный стейт
4. `PlayerModerationPanel.tsx` — локальные стейты `banDuration`, `muteDuration`, `modReason`

**Риски:**
- Потеря реактивного обновления списка после `refreshPlayers` — нужно пробросить коллбек
- `confirm()` диалоги в кнопках вайпа/кика могут мешать HMR
- **Импортируют:** `src/ui/components/hud/AdminPanel.tsx`

---

### MatchmakingFound.tsx (1392 строки)

**Что делает:** VS-синематик найденного противника — анимированные карточки игрока и врага с круговой раскладкой экипировки, сравнение характеристик, прогноз победы, таблица наград, кнопки "Начать бой" / "Назад".

**Логические блоки:**
1. `LaurelLeft`, `LaurelRight` — SVG-иконки декоративных венков (стр. 12–51)
2. `winRewards` memo — расчёт золота, XP и трофеев за победу (стр. 105–156)
3. `playerPower` / `opponentPower` memo — суммарная мощь экипировки (стр. 177–195)
4. Левая половина VS-сетки (карточка игрока + CircularGearLayout + мощь) (стр. 756–907)
5. Правая половина VS-сетки (карточка противника + CircularGearLayout + мощь) (стр. 909–1064)
6. Центральная панель (сравнение характеристик, шанс победы, награды, кнопки) (стр. 1065–1389)
7. Плашки имён — nameplate для игрока и противника (стр. 222–753)

**Зависимости:**
- Блоки 4/5 используют `playerPower`/`opponentPower` и `playerEq`/`enemyEq` memo
- Блок 6 использует `winRewards` memo

**Предлагаемые новые файлы:**
| Новый файл | Что переносится | Примерно строк |
|---|---|---|
| `Matchmaking/components/MatchmakingDecorations.tsx` | SVG-венки `LaurelLeft`, `LaurelRight` | ~45 |
| `Matchmaking/utils/matchmakingUtils.ts` | Хелперы `calculateWinRewards`, `calculateTotalPower` | ~90 |
| `Matchmaking/components/MatchmakingNameplate.tsx` | Плашки имён/рангов/кубков игрока и противника | ~550 |

**Порядок переноса:**
1. `MatchmakingDecorations.tsx` — нулевые зависимости
2. `matchmakingUtils.ts` — чистые функции, только `ITEMS_DATABASE` и `calculateBattleRewards`
3. `MatchmakingNameplate.tsx` — большой блок инлайн-стилей, слабо связанный с остальными

**Риски:**
- Inline-стили с `calc()` — при переносе в переменные могут ломаться расчёты
- `framer-motion` анимации — сохранить initial/animate пропсы
- **Импортируют:** `src/ui/components/hud/MatchmakingOverlay.tsx`

---

### HeroScene/components/HeroList/index.tsx (1173 строки)

**Что делает:** Каталог персонажей — сетка карточек с фильтрами, 3D-наклон при hover, детальная инфо-панель с характеристиками, выбором обликов/скинов, кнопками действий.

**Логические блоки:**
1. Константы: `RARITY_LABELS`, `RARITY_GLOWS`, `SOURCE_ICONS` (стр. 10–32)
2. `deriveStats` — расчёт боевых характеристик (стр. 34–42)
3. `HeroCard` — карточка с tilt-эффектом, рарити бейджем, аватаркой (стр. 45–286)
4. `StatBoxRow` — строка одной характеристики (стр. 289–340)
5. `HeroDetailPanel` — правая панель: детали, скины, кнопки действий (стр. 342–868)
6. `HeroList` — главный компонент с фильтрами и сборкой колонок (стр. 871–1173)

**Зависимости:**
- `HeroCard` и `HeroDetailPanel` используют `RARITY_LABELS`, `RARITY_GLOWS`
- `HeroDetailPanel` включает `StatBoxRow`
- `HeroList` собирает `HeroCard` и `HeroDetailPanel`

**Предлагаемые новые файлы:**
| Новый файл | Что переносится | Примерно строк |
|---|---|---|
| `HeroList/utils/heroUtils.ts` | Константы `RARITY_*`, `SOURCE_ICONS`, функция `deriveStats` | ~45 |
| `HeroList/components/HeroCard.tsx` | Компонент `HeroCard` с 3D tilt-эффектом | ~245 |
| `HeroList/components/HeroDetailPanel.tsx` | Компоненты `StatBoxRow` + `HeroDetailPanel` | ~535 |

**Порядок переноса:**
1. `heroUtils.ts` — чистые данные и функции, нулевые зависимости от DOM/React
2. `HeroCard.tsx` — presentational, зависит только от утилит и пропсов
3. `HeroDetailPanel.tsx` — крупный компонент, зависит от хелперов

**Риски:**
- Некорректный биндинг `ref` у 3D-эффекта — `cardRef` должен остаться внутри компонента
- Пути до `getSkinsForHero` и `resolveAssetPath` — проверить после переноса
- **Импортируют:** `src/ui/components/hud/HeroScene/HeroScene.tsx`

---

### BattlePassScene.tsx (1053 строки)

**Что делает:** Экран Боевого Пропуска — анимированный фон, шапка с уровнем/XP/таймером, вкладки "Награды" / "Задания", постраничная навигация дорожек наград, секции дневных/недельных квестов, модалки покупки premium и предпросмотра наград.

**Логические блоки:**
1. `handleClaimAll` / `handleClaim` — логика получения наград (стр. 37–71)
2. Таймер обратного отсчёта сезона (стр. 76–92)
3. `currentDailyQuests` / `currentWeeklyQuests` — маппинг данных квестов в UI-формат (стр. 97–149)
4. Фоновые слои (blur-фон + радиальный градиент + анимированные угольки) (стр. 175–265)
5. Шапка: герб уровня, прогресс-бар XP, таймер, кнопки вкладок, "Купить уровень", X (стр. 267–565)
6. Вкладка REWARDS — дорожки + постраничные колонки наград + навигация (стр. 570–975)
7. Вкладка QUESTS — секции дневных и недельных квестов (стр. 976–1001)
8. Модалки: `PurchaseModal`, `RewardPreviewModal`, `BpLevelUpOverlay` (стр. 1032–1049)

**Зависимости:**
- Блок 6 зависит от `currentPage` и `BATTLE_PASS_REWARDS`
- Блок 7 зависит от `currentDailyQuests` / `currentWeeklyQuests`
- Шапка зависит от `timeLeft`, `bpLevel`, `bpExp`

**Предлагаемые новые файлы:**
| Новый файл | Что переносится | Примерно строк |
|---|---|---|
| `BattlePass/useBattlePassQuests.ts` | Хук: маппинг `dailyQuests`/`weeklyQuests` в UI-формат | ~60 |
| `BattlePass/components/BattlePassSidePanel.tsx` | Левая панель дорожек ("Королевский/Воинский путь") | ~155 |
| `BattlePass/components/BattlePassHeader.tsx` | Шапка: герб уровня, прогресс-бар XP, таймер, кнопки | ~150 |

**Порядок переноса:**
1. `useBattlePassQuests.ts` — чистая логика, нет JSX
2. `BattlePassSidePanel.tsx` — статический декоративный блок без стейтов
3. `BattlePassHeader.tsx` — зависит от `activeTab`, `bpLevel`, `bpExp`, `timeLeft`

**Риски:**
- Нарушение `AnimatePresence` переходов при вынесении шапки
- Получение BP-наград с сайд-эффектом `setEquippedWeapon` — не потерять в `handleClaim`
- **Импортируют:** `src/main.tsx` (lazy), `src/ui/components/SceneSwitcher.tsx` (lazy)

---

### main.tsx (1306 строк)

**Что делает:** Точка входа — Sentry-телеметрия, ленивая загрузка сцен, масштабируемый контейнер 1920×1080, ErrorBoundary, SceneSwitcher, асинхронная инициализация VK Bridge + Firestore + GameApp + аудио + подписки.

**Логические блоки:**
1. Инициализация Sentry (стр. 19–35)
2. Lazy-импорты сцен (стр. 39–61)
3. `ErrorBoundary` — React-класс перехвата ошибок (стр. 88–146)
4. `SafeGameLayout` — масштабирование, resize/orientation listeners, ban overlay, energy timer, PIXI-контейнер (стр. 150–535)
5. `SceneSwitcher` — роутер экранов по `activeScreen` (стр. 537–589)
6. `Root` — асинхронная инициализация: VK, Firebase, GameApp, audio, subscriptions (стр. 593–1294)

**Зависимости:**
- `Root` рендерит `SafeGameLayout`, `LoadingOverlay`, `ErrorBoundary`
- `SafeGameLayout` содержит `SceneSwitcher` и `GameHUD`
- `SceneSwitcher` использует все lazy-сцены

**Предлагаемые новые файлы:**
| Новый файл | Что переносится | Примерно строк |
|---|---|---|
| `src/services/TelemetryService.ts` | Инициализация Sentry | ~20 |
| `src/ui/components/ErrorBoundary.tsx` | Класс `ErrorBoundary` с fallback UI | ~60 |
| `src/ui/components/SafeGameLayout.tsx` | Весь `SafeGameLayout` со всеми оверлеями | ~390 |
| *(удалить дубликат)* | `SceneSwitcher` уже есть в `SceneSwitcher.tsx` — убрать из `main.tsx` | ~55 |

**Порядок переноса:**
1. `TelemetryService.ts` — инициализируется один раз, не меняет поведение компонентов
2. `ErrorBoundary.tsx` — изолированный React-класс
3. Удалить дубликат `SceneSwitcher` из `main.tsx`
4. `SafeGameLayout.tsx` — большой компонент с хуками resize/orientation

**Риски:**
- Порядок инициализации критичен: Firebase load → Zustand.setState → GameApp.init
- `isAppInitialized` флаг защищает от двойной инициализации при HMR — нельзя потерять
- **Импортируют:** нет (точка входа, `index.html`)

---

### engine/entities/HeroUnit.ts (1695 строк)

**Что делает:** PIXI.js-класс рендеринга юнита — загрузка текстур и построение PIXI-дерева, позиционирование экипировки на сокетах с pixel-математикой, GSAP-анимации атак/перемещений/смертей, визуальные статус-эффекты.

**Логические блоки:**
1. `WEAPON_VISUAL_CONFIGS`, `SLOT_CONFIG` — конфиги экипировки (стр. 13–72)
2. `loadHero` — асинхронная загрузка текстур и построение PIXI-дерева (стр. 197–320)
3. Методы экипировки: `equipWeapon`, `equipHelmet`, `equipArmor`, `equipShield`, `updateEquipment` (стр. 330–590)
4. Геттеры: `getVisualCenter`, `getSocketGlobalPosition` (стр. 592–630)
5. `playAttackAnimation`, `playHitEffect` (стр. 632–887)
6. `update` — трейл оружия, обновление статус-частиц (стр. 929–1030)
7. GSAP-анимации: `teleportTo`, `jumpSlam`, `animateLunge*`, `animateTeleport*`, `animateDeath`, `animateHitReaction`, `animateDodge` (стр. 1070–1694)

**Зависимости:**
- Анимации (7) вызывают `EffectsManager`
- Методы экипировки (3) используют конфиги (1)
- `playAttackAnimation` (5) связана с экипировкой через `this.weaponSprite`

**Предлагаемые новые файлы:**
| Новый файл | Что переносится | Примерно строк |
|---|---|---|
| `engine/entities/HeroUnitConfigs.ts` | `WEAPON_VISUAL_CONFIGS`, `SLOT_CONFIG`, `getWeaponVisualConfig` | ~80 |
| `engine/entities/HeroUnitAnimations.ts` | Все GSAP-анимации: `teleportTo`, `jumpSlam`, `animateLunge*`, `animateTeleport*`, `animateDeath`, `animateHitReaction`, `animateDodge` | ~650 |
| `engine/entities/HeroEquipmentManager.ts` | `equipWeapon`, `equipHelmet`, `equipArmor`, `equipShield`, `updateEquipment` | ~280 |

**Порядок переноса:**
1. `HeroUnitConfigs.ts` — статические данные без `this`-зависимостей
2. `HeroUnitAnimations.ts` — функции принимают `unit: HeroUnit` как аргумент
3. `HeroEquipmentManager.ts` — менеджер с ссылкой на конфиги

**Риски:**
- GSAP твины ссылаются на PIXI-объекты через замыкание — передавать `this.body`, `this.weaponSprite` явно
- `calculatedBaseScale` зависит от `this` и устанавливается в `loadHero` — передавать контекст
- **Импортируют:** `src/engine/core/BattleEngine.ts`, `src/engine/systems/EffectsManager.ts`, `src/engine/systems/HeroSyncSystem.ts`

---

### engine/systems/EffectsManager.ts (1499 строк)

**Что делает:** Синглтон визуальных эффектов — screenshake, color flash, slow-motion, freeze-frame, объектный пул частиц, боевые эффекты (crits, dodges, blocks, deaths), магические заклинания (молнии, огненные шары, взрывы).

**Логические блоки:**
1. `initParticlePool`, `getParticle`, `releaseParticle` — объектный пул PIXI-графики (стр. 99–162)
2. `screenShake`, `colorFlash`, `slowMotion`, `freezeFrame`, `knockback` — системные эффекты (стр. 165–439)
3. `applyHitResolution`, `criticalHit`, `normalHit` — составные триггеры урона (стр. 442–553)
4. `dodgeEffect`, `blockEffect`, `deathEffect`, `slashEffect` — специальные боевые эффекты (стр. 562–989)
5. `spawnGhostTrail`, `spawnDustPuff`, `spawnBlockSparks`, `spawnSmokePuff`, `spawnImpactParticles` — частицы и следы (стр. 992–1303)
6. `spawnLightningStrike`, `spawnFireballProjectile`, `spawnExplosion` — магия (стр. 1306–1482)

**Зависимости:**
- `criticalHit` (3) вызывает `slowMotion` + `freezeFrame` (2) + `particleBurst`
- `deathEffect` (4) вызывает `screenShake` (2) + `spawnImpactParticles` (5)
- Все блоки используют пул частиц (1)

**Предлагаемые новые файлы:**
| Новый файл | Что переносится | Примерно строк |
|---|---|---|
| `engine/systems/effects/ParticlePool.ts` | `initParticlePool`, `getParticle`, `releaseParticle` | ~80 |
| `engine/systems/effects/SpellEffects.ts` | `spawnLightningStrike`, `spawnFireballProjectile`, `spawnExplosion` | ~180 |
| `engine/systems/effects/CombatEffects.ts` | Hit resolution, dodge, block, death, slash, все spawn*-функции | ~800 |

**Порядок переноса:**
1. `ParticlePool.ts` — нулевые зависимости, только PIXI Graphic
2. `SpellEffects.ts` — автономные GSAP цепочки, зависят только от PIXI/GSAP
3. `CombatEffects.ts` — зависят от пула и системных эффектов `EffectsManager`

**Риски:**
- Object Pooling: некорректный `releaseParticle` → утечки PIXI-объектов на сцене
- Прерывание активных GSAP твинов при `stopAllEffects()` — собрать все твины в общий массив
- **Импортируют:** `src/GameApp.ts`, `src/engine/core/BattleEngine.ts`, `src/engine/entities/HeroUnit.ts`, `src/ui/components/hud/BattleScene.tsx`

---

### engine/core/BattleEngine.ts (1449 строк)

**Что делает:** Синглтон боевого движка — инициализация PIXI-сцены боя, ATB-цикл ходов, расчёт атак (крит/блок/уворот/статусы), суперудары, симуляция быстрого завершения боя, система дебаффов (Stun/Burn/Freeze/Poison).

**Логические блоки:**
1. `getWeaponArchetype` — хелпер определения типа оружия (стр. 11–26)
2. `init` — инициализация PIXI-сцены, загрузка юнитов (стр. 122–237)
3. `runCombatLoop`, `checkCombatEnd` — главный ATB-цикл (стр. 238–383)
4. `executeAttack` — полная логика удара (атака/уворот/блок/крит/статусы/анимации) (стр. 385–868)
5. `skipToEndOfBattle` — JS-симулятор быстрого завершения без рендеринга (стр. 880–1123)
6. `castActiveAbility` — применение суперудара при 100 мане (стр. 1125–1256)
7. `updateStatusesState`, `applyStatus`, `resolvePeriodicDamage`, `decrementStatusDurations` — система дебаффов (стр. 1258–1409)

**Зависимости:**
- `executeAttack` (4) вызывает `applyStatus` (7)
- `skipToEndOfBattle` (5) дублирует логику (4) и (7) в чистой математике
- `castActiveAbility` (6) вызывает `applyStatus` (7)
- `runCombatLoop` (3) вызывает `executeAttack` (4) и `resolvePeriodicDamage` (7)

**Предлагаемые новые файлы:**
| Новый файл | Что переносится | Примерно строк |
|---|---|---|
| `engine/core/battle/BattleSimulation.ts` | `skipToEndOfBattle` + внутренние хелперы симуляции | ~260 |
| `engine/core/battle/BattleAbilitySystem.ts` | `castActiveAbility` + визуальные эффекты суперудара | ~140 |
| `engine/core/battle/BattleStatusSystem.ts` | `applyStatus`, `resolvePeriodicDamage`, `decrementStatusDurations`, `updateStatusesState` | ~170 |

**Порядок переноса:**
1. `BattleSimulation.ts` — чистая математика без PIXI/GSAP
2. `BattleAbilitySystem.ts` — изолированная логика ультимейтов
3. `BattleStatusSystem.ts` — менеджер дебаффов

**Риски:**
- `skipToEndOfBattle` дублирует логику `executeAttack` — нарушение DRY, изменения нужно синхронизировать
- Синхронизация `this.state` между основным движком и вынесенными системами — единый объект состояния
- **Импортируют:** `src/ui/components/BattleCanvas.tsx`, `src/ui/components/hud/AdminPanel.tsx`, `src/ui/components/hud/BattleScene.tsx`, `src/ui/screens/BattleCanvas.tsx`

---

## ШАГ 4 — Сводная таблица приоритетов

| Файл | Строк | Новых файлов | Импортируют | Сложность | Приоритет |
|---|---|---|---|---|---|
| `Admin/AdminServerTab.tsx` | 1015 | 4 | 1 файл | Средняя | **1** |
| `Matchmaking/MatchmakingFound.tsx` | 1392 | 3 | 1 файл | Средняя | **2** |
| `HeroList/index.tsx` | 1173 | 3 | 1 файл | Средняя | **3** |
| `BattlePassScene.tsx` | 1053 | 3 | 2 файла | Средняя | **4** |
| `main.tsx` | 1306 | 4 | 0 (точка входа) | Высокая | **5** |
| `entities/HeroUnit.ts` | 1695 | 3 | 3 файла | Высокая | **6** |
| `systems/EffectsManager.ts` | 1499 | 3 | 4 файла | Высокая | **7** |
| `core/BattleEngine.ts` | 1449 | 3 | 4 файла | Высокая | **8** |

**Критерии приоритетов:**
- React UI-файлы (1–4) → **выше приоритет**: изолированные компоненты, горячая замена, нет связи с PIXI/GSAP
- `main.tsx` (5) → важная точка входа, строгий порядок инициализации
- Engine-файлы (6–8) → **ниже приоритет**: тесная связь с PIXI.js / GSAP, высокий риск регрессии

---

## Правила рефакторинга (применять при получении подтверждения)

> ⚠️ ЖДАТЬ ПОДТВЕРЖДЕНИЯ ПЕРЕД НАЧАЛОМ РЕФАКТОРИНГА.

```
1. Начинать строго с файла Приоритет 1 (AdminServerTab.tsx)
2. Создать ветку: git checkout -b refactor/AdminServerTab
3. Переносить блоки строго в порядке из плана (безопасное → сложное)
4. После каждого переноса: npm run build — проверить, что сборка не сломана
5. Если сборка упала — откатить последний перенос и разобраться в причине
6. Каждый перенесённый блок = отдельный коммит
7. В конце: npm run build финально, затем мёрдж в main
8. Никогда не рефакторить два больших файла одновременно
```
