# Структура базы данных Firestore: Masters of the Wild

В этом документе приведена схема данных Firestore, структуры документов и план перехода к защищенной бэкенд-валидации.

---

## 1. Коллекции и Схемы документов

### Коллекция `/пользователи`
Основной документ профиля игрока. Имя документа соответствует уникальному ID (обычно `vk_{userId}`).
```json
{
  "playerId": "vk_123456",
  "name": "Мастер Панда",
  "level": 5,
  "exp": 1250,
  "gold": 4500,
  "crystals": 150,
  "rating": 1120,
  "energy": 80,
  "maxEnergy": 100,
  "lastEnergyUpdate": 1780000000000,
  "vipLevel": 1,
  "vipEndTime": 1789999999000,
  "inventory": [
    { "id": "sword_1", "type": "WEAPON", "level": 2, "quality": "rare" }
  ],
  "heroEquipment": {
    "panda": { "weapon": "sword_1", "armor": "chest_1" }
  }
}
```
*Внимание:* В текущей версии все эти поля сериализуются клиентом и отправляются целиком через метод `setDoc`.

### Подколлекция `/пользователи/{id}/почта`
Входящие письма пользователя. Каждое письмо представляет отдельный документ.
```json
{
  "id": "mail_abc123",
  "title": "Награда за Арену",
  "text": "Поздравляем с победой в сезоне!",
  "sender": "СИСТЕМА",
  "timestamp": 1780120000000,
  "claimed": false,
  "rewards": { "gold": 500, "crystals": 20 }
}
```

### Коллекция `/чат`
Сообщения глобального чата.
```json
{
  "id": "msg_987",
  "author": "Motaro",
  "text": "Всем привет в Диких Землях! ⚔️",
  "timestamp": 1780123000000,
  "type": "common",
  "vipLevel": 3
}
```

---

## 2. Безопасность и Валидация (План перехода к Cloud Functions)

В текущей схеме клиент имеет права на запись (`allow write: if true`), так как Firebase Auth на клиенте не подключен (вход идет напрямую из VK API). 

### Целевое решение (Этап 4):
1. **Запретить клиентскую запись:** В `firestore.rules` прописать `allow write: if false` для коллекции `/пользователи`.
2. **Создать Firebase Cloud Functions:**
   * `claimQuestReward(questId)`
   * `buyItemFromShop(itemId)`
   * `upgradeEquipment(itemId, useProtectionStone)`
3. **Admin SDK:** Cloud Functions выполняются в доверенном окружении с правами администратора и записывают измененный профиль в БД после валидации баланса.
