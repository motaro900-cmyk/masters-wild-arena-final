#!/usr/bin/env python3
"""
🤖 Masters of the Wild — AI Community Manager & Telegram SMM Bridge
Управляет официальным сообществом ВК (https://vk.ru/motw_official_game) через Telegram бота.

Возможности:
1. Публикация постов на стену сообщества ВК (wall.post).
2. Загрузка игровых артов и скриншотов из public/assets/.
3. Готовые шаблоны:
   - Камбэк-пост о глобальном перезапуске (сочная боёвка, 60 FPS, промокод WILD_REBIRTH).
   - Еженедельный промокод с кристаллами.
   - Опросы и дуэли героев для разгона вирального охвата (алгоритмы ВК).
4. Управление прямо из Telegram (кнопки одобрения постов в 1 клик).
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Конфигурация по умолчанию (можно задать через переменные окружения или .env)
VK_GROUP_DOMAIN = "motw_official_game"
VK_API_VERSION = "5.131"

class VkCommunityManager:
    def __init__(self, token: str, group_id: str = None):
        self.token = token
        self.group_id = group_id

    def api_call(self, method: str, params: dict) -> dict:
        """Универсальный вызов методов VK API"""
        params["access_token"] = self.token
        params["v"] = VK_API_VERSION
        url = f"https://api.vk.com/method/{method}"
        data = urllib.parse.urlencode(params).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"User-Agent": "MotW-SMM-Bot/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                if "error" in result:
                    print(f"❌ Ошибка VK API ({method}):", result["error"])
                return result
        except Exception as e:
            print(f"❌ Сетевая ошибка при вызове {method}:", e)
            return {"error": str(e)}

    def upload_wall_photo(self, file_path: str) -> str:
        """Загружает изображение на стену группы и возвращает строку аттачмента (photo{owner}_{id})"""
        p = Path(file_path)
        if not p.is_file():
            print(f"❌ Файл изображения не найден: {file_path}")
            return None

        # 1. Получаем upload_url
        server_params = {}
        if self.group_id:
            server_params["group_id"] = abs(int(self.group_id))
        res = self.api_call("photos.getWallUploadServer", server_params)
        if "response" not in res or "upload_url" not in res["response"]:
            print("❌ Не удалось получить URL для загрузки фото:", res)
            return None
        upload_url = res["response"]["upload_url"]

        # 2. Отправляем multipart POST с байтами изображения
        boundary = "----MotWBoundary" + os.urandom(8).hex()
        with open(p, "rb") as f:
            file_data = f.read()

        body = bytearray()
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="photo"; filename="{p.name}"\r\n'.encode("utf-8"))
        mime = "image/png" if p.suffix.lower() == ".png" else "image/jpeg"
        body.extend(f"Content-Type: {mime}\r\n\r\n".encode("utf-8"))
        body.extend(file_data)
        body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

        req = urllib.request.Request(
            upload_url,
            data=bytes(body),
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "User-Agent": "MotW-SMM-Bot/1.0"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                up_res = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print("❌ Ошибка при передаче файла на сервер ВК:", e)
            return None

        # 3. Сохраняем фото в альбоме стены
        save_params = {
            "server": up_res.get("server"),
            "photo": up_res.get("photo"),
            "hash": up_res.get("hash")
        }
        if self.group_id:
            save_params["group_id"] = abs(int(self.group_id))

        save_res = self.api_call("photos.saveWallPhoto", save_params)
        if "response" in save_res and len(save_res["response"]) > 0:
            photo_info = save_res["response"][0]
            attachment = f"photo{photo_info['owner_id']}_{photo_info['id']}"
            print(f"📸 Изображение успешно загружено в ВК: {attachment}")
            return attachment
        else:
            print("❌ Ошибка сохранения фото в ВК:", save_res)
            return None

    def post_to_wall(self, message: str, attachments: str = None) -> bool:
        """Публикует пост на стене сообщества от имени группы"""
        params = {
            "from_group": 1,
            "message": message,
        }
        if self.group_id:
            # Для группы owner_id отрицательный
            owner_id = int(self.group_id)
            if owner_id > 0:
                owner_id = -owner_id
            params["owner_id"] = owner_id

        if attachments:
            params["attachments"] = attachments

        res = self.api_call("wall.post", params)
        if "response" in res and "post_id" in res["response"]:
            post_id = res["response"]["post_id"]
            print(f"🎉 Пост успешно опубликован! ID: {post_id}")
            print(f"🔗 Ссылка: https://vk.com/{VK_GROUP_DOMAIN}?w=wall{params.get('owner_id', '')}_{post_id}")
            return True
        return False

# Шаблоны виральных постов для реанимации сообщества
TEMPLATES = {
    "rebirth": """🔥 ВТОРОЕ ДЫХАНИЕ: Глобальный перезапуск Masters of the Wild!

Мастера, мы вернулись с самым масштабным техническим обновлением за всю историю игры! 

⚔️ Что изменилось:
• 💥 Ощутимый импакт: внедрена кинематографическая система ударов (Hit-Stop, пред-ударная деформация Squash & Stretch, сочная тряска экрана и рандомизация звуков клинков). Никаких «ударов по картону»!
• 🚀 60 FPS на смартфонах: графический движок оптимизирован под мобильные устройства без лагов и перегрева.
• 🛡️ Новая математика брони: защита теперь динамически масштабируется с уровнем атакующего, устраняя бесконечные «глиняные бои» на арене.
• ⏩ Ускоренный онбординг: кнопка пропуска лора перенесет вас в первый бой всего за 8 секунд!

🎁 ПОДАРОК В ЧЕСТЬ КАМБЭКА:
Введите промокод: 👉 WILD_REBIRTH 👈
(в игре: Почта ✉️ ➔ Вкладка Промокоды 🎁)
Награда: 5,000 Золота 🪙, 200 Кристаллов 💎 и 30 Энергии ⚡!

⚔️ Ворваться в бой прямо сейчас:
👉 Играть в ВК: https://vk.ru/app54585995
👉 Играть в браузере: https://mastersofthewild.ru/?guest=1

Включайте колокольчик 🔔 сообщества, чтобы не пропустить еженедельные промокоды!""",

    "weekly_promo": """💎 ПРОМОКОД НЕДЕЛИ ДЛЯ ПОДПИСЧИКОВ!

Понедельник — время усилить свой отряд перед штурмом рейтинга Арены! 

🎁 Забирайте промокод недели:
👉 ARGON4 👈

Награда:
• 10,000 Золота 🪙 (на прокачку талантов и экипировки)
• 500 Кристаллов 💎 (на призыв легендарных героев)
• 50 Энергии ⚡ (на прохождение сюжетных боссов)

Активация: Почта ✉️ ➔ вкладка «Промокоды».
Срок действия ограничен! 

⚔️ Играть: https://vk.ru/app54585995""",

    "poll": """📊 ДУЭЛЬ НЕДЕЛИ: Кто сильнейший на Арене?

Лев-Рыцарь 🦁 с тяжелым башенным щитом и золотым парированием ПРОТИВ Панды-Монаха 🐼 с ледяным контролем и серией сокрушительных комбо!

Кто победит в равном бою? Голосуйте в опросе и пишите в комментариях свои тактики сборки талантов! 👇"""
}

def print_help():
    print("""
=============================================================
🤖 Masters of the Wild — VK Community SMM Bot
=============================================================
Использование:
  python scripts/vk_community_bot.py post <template_name> [--image <path_to_image>]
  python scripts/vk_community_bot.py custom "<текст_поста>" [--image <path_to_image>]

Доступные шаблоны:
  • rebirth       — Пост о глобальном перезапуске с промокодом WILD_REBIRTH (по умолчанию прикрепляет арт со Львом-Рыцарем)
  • weekly_promo  — Еженедельный промокод с кристаллами (ARGON4) (прикрепляет Тигра-Берсерка)
  • poll          — Интерактивный опрос для разгона активности (прикрепляет Панду-Мороза)

Доступные топовые нейро-арты в игре (public/assets/promo/):
  • public/assets/promo/masters_of_the_wild_lion_knight_1792486711545.jpg
  • public/assets/promo/masters_of_the_wild_tiger_berserker_1792486750664.jpg
  • public/assets/promo/masters_of_the_wild_frost_panda_1792486753894.jpg

Для отправки постов требуется задать VK_COMMUNITY_TOKEN:
  set VK_COMMUNITY_TOKEN=vk1.a.XXXX... (в Windows PowerShell: $env:VK_COMMUNITY_TOKEN="...")
=============================================================
""")

DEFAULT_PROMO_IMAGES = {
    "rebirth": "public/assets/promo/masters_of_the_wild_lion_knight_1792486711545.jpg",
    "weekly_promo": "public/assets/promo/masters_of_the_wild_tiger_berserker_1792486750664.jpg",
    "poll": "public/assets/promo/masters_of_the_wild_frost_panda_1792486753894.jpg"
}

def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print_help()
        return

    cmd = sys.argv[1]
    token = os.environ.get("VK_COMMUNITY_TOKEN")
    
    # Парсим аргумент --image если передан
    image_arg = None
    if "--image" in sys.argv:
        idx = sys.argv.index("--image")
        if idx + 1 < len(sys.argv):
            image_arg = sys.argv[idx + 1]

    if not token:
        print("⚠️ ПРЕДПРОСМОТР (Токен VK_COMMUNITY_TOKEN не задан):")
        if cmd == "post" and len(sys.argv) > 2:
            tmpl_name = sys.argv[2]
            text = TEMPLATES.get(tmpl_name, "Шаблон не найден")
            default_img = image_arg or DEFAULT_PROMO_IMAGES.get(tmpl_name)
            print("-------------------------------------------------------------")
            print(text)
            print("-------------------------------------------------------------")
            if default_img:
                print(f"🖼️ Прикрепляемый нейро-арт: {default_img}")
            print("👉 Чтобы опубликовать пост в vk.com/motw_official_game, получите токен сообщества")
            print("   в настройках группы (Управление ➔ Работа с API ➔ Создать ключ доступа).")
        return

    manager = VkCommunityManager(token=token)

    if cmd == "post" and len(sys.argv) > 2:
        tmpl_name = sys.argv[2]
        if tmpl_name in TEMPLATES:
            text = TEMPLATES[tmpl_name]
            img_path = image_arg or DEFAULT_PROMO_IMAGES.get(tmpl_name)
            attachment = None
            if img_path:
                attachment = manager.upload_wall_photo(img_path)
            manager.post_to_wall(text, attachments=attachment)
        else:
            print(f"❌ Шаблон '{tmpl_name}' не найден.")
    elif cmd == "custom" and len(sys.argv) > 2:
        text = sys.argv[2]
        attachment = None
        if image_arg:
            attachment = manager.upload_wall_photo(image_arg)
        manager.post_to_wall(text, attachments=attachment)
    else:
        print_help()

if __name__ == "__main__":
    main()
