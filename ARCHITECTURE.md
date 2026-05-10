# 🎮 Система Оружия и Инвентаря — Документация

## Обзор архитектуры

Реализована **Senior-уровня архитектура** с системой модификаторов, которая связывает статы персонажа, экипировку и боевой движок в единую систему.

```
┌─────────────────────────────────────┐
│     useGameStore (Zustand)          │
│  • Управление статами героев        │
│  • Система расчета модификаторов    │
│  • Хранение экипировки              │
└──────────────┬──────────────────────┘
               │
               ├─► ItemsConfig.ts (WEAPONS_DB)
               │   └─ Конфиги предметов с бонусами
               │
               └─► getCalculatedStats()
                   └─ ФИНАЛЬНЫЕ статы (база + оружие)
                       │
                       ├─► BaseEntity
                       │   └─ Socket System (вооружение)
                       │
                       └─► BattleState
                           └─ Боевая система
```

---

## 1. **ItemsConfig.ts** — База данных предметов

Определяет все доступные оружие с их модификаторами:

```typescript
export enum ItemRarity {
    COMMON = 'COMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    LEGENDARY = 'LEGENDARY'
}

interface IWeaponStats {
    id: string;
    name: string;
    attackBonus: number;      // Плоское увеличение атаки
    critBonus: number;        // +X% шанса крита (0.05 = +5%)
    speedBonus: number;       // Модификатор скорости атаки
    rarity: ItemRarity;
    textureKey: string;       // Ключ для загрузчика текстур
}
```

**Пример оружия:**
- **Тапок** (COMMON): Легкий, быстрые атаки, мало урона
- **Сковорода** (EPIC): Тяжелая, большой урон, медленнее
- **Гантеля** (RARE): Максимум урона, но очень медленно

---

## 2. **useGameStore.ts** — Состояние игры + Расчеты

### Структура Store:
```typescript
interface IGameState {
    // Ресурсы
    gold: number;
    diamonds: number;
    
    // Текущий герой и его оружие
    currentHeroId: string;
    equippedWeaponId: string | null;
    
    // База героев (без оружия)
    heroes: Record<string, IHeroStats>;
    
    // Методы
    getCalculatedStats(heroId: string): ICalculatedStats | null;
    equipWeapon(id: string): void;
}
```

### Главный метод: `getCalculatedStats()`

**Это сердце системы.** Он суммирует:
1. **Базовые статы** персонажа
2. **Бонусы** от экипированного оружия
3. **Гарантирует** финальные границы (крит не может быть >100%)

```typescript
getCalculatedStats: (heroId) => {
    const hero = heroes[heroId];
    const weapon = WEAPONS_DB[equippedWeaponId];
    
    return {
        hp: hero.baseHp,
        attack: hero.baseAttack + (weapon?.attackBonus || 0),
        speed: Math.max(0.5, hero.baseSpeed + weapon?.speedBonus),
        critChance: Math.min(1.0, hero.baseCrit + weapon?.critBonus),
        weaponTexture: weapon?.textureKey || null
    };
}
```

---

## 3. **BaseEntity.ts** — Визуализация + Socket System

### Socket System для оружия

Каждый персонаж может экипировать оружие, которое:
- Визуально отображается в руке
- Имеет анимацию покачивания (Idle)
- Анимируется при атаке (Dash)

```typescript
// Оружие крепится как отдельный спрайт
if (weaponTexture) {
    this.weaponSprite = new PIXI.Sprite(weaponTexture);
    this.weaponSprite.position.set(30, -60);  // Socket: на руку
    this.addChild(this.weaponSprite);
}
```

### State Machine (4 состояния)

| Состояние | Что происходит |
|-----------|----------------|
| **IDLE** | Дыхание, покачивание оружия |
| **ATTACK** | Замах → Dash → Возврат |
| **TAKE_DAMAGE** | Белая вспышка + тряска |
| **DIE** | Затухание + удаление |

### Методы взаимодействия

```typescript
setState(newState: EntityState)      // Изменить состояние
setHp(newHp: number)                // Установить HP
getHp(): number                     // Получить HP
isAlive(): boolean                  // Жив ли персонаж
```

---

## 4. **BattleState.ts** — Боевой движок

### Инициализация боя

```typescript
const battleState = new BattleState(app);

await battleState.startBattle(
    'panda',           // Герой игрока
    'moose',           // Врагом (AI)
    textureLoader      // Функция загрузки текстур
);

app.ticker.add((dt) => battleState.update(dt));
```

### Как работает боевой loop

1. **Каждый кадр** проверяется готовность к атаке
   ```
   playerAttackTimer += dt
   if (playerAttackTimer >= playerSpeed * 1000) {
       resolveHit(player, enemy)
   }
   ```

2. **При атаке**:
   - Проверяется **крит** (с вероятностью `critChance`)
   - Считается **урон**: базовый или x2 при крите
   - Вычитается из `target.hp`
   - Запускается анимация и эффект (тряска, цифра урона)

3. **Конец боя**: когда `hp <= 0`
   - Побеждённый переходит в `DIE`
   - Победитель получает награду

---

## 5. **Интеграция в действии**

### Пример: Панда с Сковородой

```typescript
// 1. Получить финальные статы
const stats = useGameStore.getState().getCalculatedStats('panda');

// Результат:
{
    hp: 3250,                  // Базовое HP Панды
    attack: 570,               // 520 (базовая) + 50 (сковорода)
    speed: 2.2,                // 2.0 (базовая) + 0.2 (сковорода тяжелая)
    critChance: 0.25,          // 0.1 (базовая) + 0.15 (сковорода)
    weaponTexture: 'weapon_pan'
}

// 2. Создать сущность с оружием
const panda = new BaseEntity(
    pandaTexture,
    stats,
    panWeaponTexture  // Сковорода визуально в руке!
);

// 3. В бою
// Панда атакует каждые 2.2 секунды
// Урон: 570 или 1140 (при крите 25%)
```

---

## 6. **Ключевые особенности**

### ✅ Модульность
- **ItemsConfig**: Легко добавить новое оружие
- **useGameStore**: Управляет всеми расчетами
- **BaseEntity**: Переиспользуемая сущность
- **BattleState**: Чистая боевая логика

### ✅ Масштабируемость
- Легко добавить модификаторы (HP бонус, скорость и т.д.)
- Легко создать новых врагов с разными сборками
- Легко реализовать PvP (сравнить два build'а)

### ✅ Производительность
- Object pooling для цифр урона
- Кэширование расчетов статов
- Нет лишних обновлений

---

## 7. **Дальнейшие расширения**

### Добавить модификаторы для разных слотов:
```typescript
interface IEquipment {
    weapon?: IWeaponStats;
    armor?: IArmorStats;
    accessory?: IAccessoryStats;
}
```

### Система прокачки:
```typescript
interface IHeroUpgrades {
    baseHp: number;
    baseAttack: number;
    baseSpeed: number;
    // ... и т.д., обновляется при levelUp()
}
```

### Способности (Abilities):
```typescript
interface IAbility {
    id: string;
    name: string;
    cooldown: number;
    effect: (attacker: BaseEntity, target: BaseEntity) => void;
}
```

---

**Архитектура готова к расширению и полностью следует Senior-стандартам:** ✅

