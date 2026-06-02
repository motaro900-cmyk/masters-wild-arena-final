# Состояние Zustand (Zustand Store): Masters of the Wild

В этом документе приведен регламент работы со стором состояний `useGameStore` и правила оптимизации рендеров.

---

## 1. Слайсы Состояния (`/src/store/slices/`)

Все слайсы объединяются в `/src/store/useGameStore.ts`:

* **`playerSlice`:**
  * Управляет валютами: `gold`, `crystals`, `shards`, `energy`, `maxEnergy`.
  * Управляет VIP: `vipLevel`, `vipExp`, `vipEndTime`.
  * Методы изменения ресурсов: `addGold()`, `spendGold()`, `addCrystals()`, `regenerateEnergy()`.
* **`inventorySlice`:**
  * Содержит массив `inventory` и ресурсы для ковки (`coal`, `steel_bars`, `runic_shards`).
  * Управляет ковкой: `upgradeItem()`, `craftItem()`.
* **`shopSlice`:**
  * Ротация товаров торговца: `shopRotation`, `shopDiscounts`, `shopLastRefreshTime`.
  * Метод покупки: `buyItem()`.
* **`heroSlice`:**
  * Открытые персонажи (`ownedHeroes`), выбранный в данный момент герой (`selectedHeroId`).
  * Одетая экипировка: `heroEquipment`.
  * Таланты персонажей: `heroTalents`.
* **`questSlice`:**
  * Ежедневные (`dailyQuests`) и еженедельные (`weeklyQuests`) квесты.
  * Метод инкремента прогресса: `updateQuestProgress(actionType, amount)`.
* **`clanSlice`:**
  * Идентификатор клана `clanId` и клановые монеты `clanCoins`.
* **`battleSlice`:**
  * Входящая почта `mail` и системные уведомления.

---

## 2. Важнейшее правило оптимизации: Zustand-селекторы

> [!CAUTION]
> **НИКОГДА не вызывайте корень стора без селектора в React-компонентах!**

### Плохой паттерн (Перерисовывает компонент при любых изменениях в игре):
```typescript
// Компонент перерендерится даже если игроку просто пришло сообщение в чат
const { gold, crystals } = useGameStore(); 
```

### Хороший паттерн (Компонент перерендерится ТОЛЬКО при изменении запрашиваемых полей):
```typescript
const gold = useGameStore(state => state.gold);
const crystals = useGameStore(state => state.crystals);
```

Для повышения читаемости можно использовать деструктуризацию точечных вызовов или массивы селекторов.
