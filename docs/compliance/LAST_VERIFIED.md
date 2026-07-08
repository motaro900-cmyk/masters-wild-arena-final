# Фиксация нормативной базы соответствия (Compliance Record)

* **Платформа**: VK Mini Apps
* **Дата последней проверки**: 18 июня 2026 г.
* **Главный инженер по соответствию**: Antigravity AI (Google DeepMind)
* **Аудитор со стороны разработчика**: Motar

---

## 📚 Официальные источники истины (2026 год)

Все архитектурные решения и вызовы VK API в кодовой базе Masters of the Wild сверяются строго с официаными спецификациями ВКонтакте:
1. **VK Bridge API Reference**: [dev.vk.com/mini-apps/vk-bridge](https://dev.vk.com/ru/mini-apps/development/vk-bridge) (актуальные нативные события и методы)
2. **Требования к публикации**: [dev.vk.com/mini-apps/requirements](https://dev.vk.com/ru/mini-apps/publication/requirements) (правила модерации)
3. **Платежи в мини-приложениях**: [dev.vk.com/mini-apps/payments](https://dev.vk.com/ru/mini-apps/monetization/payments) (голоса, проверка ордеров)
4. **Реклама и монетизация**: [dev.vk.com/mini-apps/ads](https://dev.vk.com/ru/mini-apps/monetization/ads) (межстраничные объявления, rewarded видео)

---

## 🛡️ Статус соответствия (Compliance Status)

На дату проверки кодовая база игры полностью соответствует требованиям:
* **VK Bridge**: Все устаревшие вызовы (например, `VKWebAppShowWallPostBox`, старые API платежей) полностью удалены. Используются исключительно актуальные методы.
* **Реклама**: Внедрен кулдаун в 3 минуты для межстраничной рекламы (`VKWebAppShowNativeAds`), исключающий навязчивость.
* **Платежи**: Валюта названа «голосами». Рублёвый эквивалент удален. Начисление осуществляется по факту успешного возврата от `VKWebAppShowOrderBox`.
* **Документы**: Добавлен ToS и Privacy Policy (маркировка 12+, процедура начисления при сетевых сбоях).
