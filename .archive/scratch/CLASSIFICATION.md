# CLASSIFICATION OF SCRATCH DIRECTORY

Этот файл описывает назначение и статус всех файлов в каталоге `/scratch/`.

## ACTIVE (Используется в сборке или рантайме)
* Нет активных файлов. Все файлы и директории классифицированы как OBSOLETE.

## OBSOLETE (Не используется в текущих пайплайнах)
Все файлы и папки из этой директории не вызываются и не импортируются в проекте. Они перемещены в `/.archive/scratch/` для сохранения истории:
* Резервные копии старых версий компонентов (`ShopScene_old.tsx`, `beasts_menu_old.tsx`, `gearview_old.tsx` и др.)
* Отладочные и аналитические скрипты баланса (`progression_simulator.js`, `monte_carlo_audit.js`, `apply_formula.js` и др.)
* Результаты анализа баланса и прогрессии (`deep_power_progression_check.md`, `proposed_tiers.md` и др.)
* Скрипты разрезки и проверки кадров анимаций персонажей (`center_panda.js`, `check_raccoon_centers.js`, `clean_raccoon_poses.js` и др.)
* Временные папки с кадрами анимаций (`minotaur_frames/`, `raccoon_6x3/`, `raccoon_8x3/`, `raccoon_debug/`)
* Отладочные изображения, логи и дампы данных (`raccoon_components_debug.png`, `sim_results.json`, `slot_raw_data.json` и др.)
