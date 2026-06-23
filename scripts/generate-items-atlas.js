/**
 * generate-items-atlas.js
 *
 * Скрипт для генерации WebP-атласов из PNG-атласа, экспортированного Free Texture Packer.
 * Создаёт:
 *   1. public/assets/images/items/items.webp        — атлас полного качества (ПК)
 *   2. public/assets/images/items/items_mobile.webp — атлас уменьшенный вдвое (мобильный)
 *   3. public/assets/images/items/items.json        — координаты фреймов (общий для ПК)
 *   4. public/assets/images/items/items_mobile.json — координаты фреймов пересчитанные для мобильного
 *
 * Запуск: node scripts/generate-items-atlas.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Пути к источнику
const SRC_PNG  = join(ROOT, 'temp', 'items-png', 'weapons', 'items.png');
const SRC_JSON = join(ROOT, 'temp', 'items-png', 'weapons', 'items.json');

// Пути назначения
const OUT_DIR       = join(ROOT, 'build', 'atlas', 'images', 'items', 'weapons');
const OUT_WEBP_PC   = join(OUT_DIR, 'items.webp');
const OUT_WEBP_MOB  = join(OUT_DIR, 'items_mobile.webp');
const OUT_JSON_PC   = join(OUT_DIR, 'items.json');
const OUT_JSON_MOB  = join(OUT_DIR, 'items_mobile.json');

const MOBILE_SCALE  = 0.5; // уменьшаем мобильную версию в 2 раза

async function main() {
    // Создаём папку назначения если не существует
    mkdirSync(OUT_DIR, { recursive: true });

    // 1. Читаем исходный JSON
    const atlasData = JSON.parse(readFileSync(SRC_JSON, 'utf-8'));
    const { w: atlasW, h: atlasH } = atlasData.meta.size;

    console.log(`📋 Атлас: ${atlasW}x${atlasH}px, фреймов: ${Object.keys(atlasData.frames).length}`);

    // 2. Конвертируем PNG → WebP (ПК, полное качество)
    console.log('🖼  Генерируем ПК-версию (items.webp)...');
    await sharp(SRC_PNG)
        .webp({ quality: 90, effort: 6 })
        .toFile(OUT_WEBP_PC);
    console.log(`   ✅ Сохранено: ${OUT_WEBP_PC}`);

    // 3. Конвертируем PNG → WebP (мобильная, 50% размера)
    const mobW = Math.round(atlasW * MOBILE_SCALE);
    const mobH = Math.round(atlasH * MOBILE_SCALE);
    console.log(`📱 Генерируем мобильную версию (${mobW}x${mobH}, items_mobile.webp)...`);
    await sharp(SRC_PNG)
        .resize(mobW, mobH, { kernel: 'lanczos3' })
        .webp({ quality: 82, effort: 6 })
        .toFile(OUT_WEBP_MOB);
    console.log(`   ✅ Сохранено: ${OUT_WEBP_MOB}`);

    // 4. Копируем JSON для ПК (меняем только image и format в meta)
    const pcJson = JSON.parse(JSON.stringify(atlasData));
    pcJson.meta.image  = 'items.webp';
    pcJson.meta.format = 'RGBA8888';
    pcJson.meta.size   = { w: atlasW, h: atlasH };
    writeFileSync(OUT_JSON_PC, JSON.stringify(pcJson, null, 2), 'utf-8');
    console.log(`   ✅ Сохранено: ${OUT_JSON_PC}`);

    // 5. Создаём мобильный JSON — пересчитываем все координаты * MOBILE_SCALE
    const mobJson = JSON.parse(JSON.stringify(atlasData));
    mobJson.meta.image  = 'items_mobile.webp';
    mobJson.meta.format = 'RGBA8888';
    mobJson.meta.size   = { w: mobW, h: mobH };

    for (const key of Object.keys(mobJson.frames)) {
        const f = mobJson.frames[key];

        // Масштабируем координаты фрейма
        f.frame.x = Math.round(f.frame.x * MOBILE_SCALE);
        f.frame.y = Math.round(f.frame.y * MOBILE_SCALE);
        f.frame.w = Math.round(f.frame.w * MOBILE_SCALE);
        f.frame.h = Math.round(f.frame.h * MOBILE_SCALE);

        // Масштабируем spriteSourceSize
        f.spriteSourceSize.x = Math.round(f.spriteSourceSize.x * MOBILE_SCALE);
        f.spriteSourceSize.y = Math.round(f.spriteSourceSize.y * MOBILE_SCALE);
        f.spriteSourceSize.w = Math.round(f.spriteSourceSize.w * MOBILE_SCALE);
        f.spriteSourceSize.h = Math.round(f.spriteSourceSize.h * MOBILE_SCALE);

        // Масштабируем sourceSize
        f.sourceSize.w = Math.round(f.sourceSize.w * MOBILE_SCALE);
        f.sourceSize.h = Math.round(f.sourceSize.h * MOBILE_SCALE);
    }

    writeFileSync(OUT_JSON_MOB, JSON.stringify(mobJson, null, 2), 'utf-8');
    console.log(`   ✅ Сохранено: ${OUT_JSON_MOB}`);

    // 6. Выводим сводную статистику
    const { statSync } = await import('fs');
    const srcSize  = statSync(SRC_PNG).size;
    const pcSize   = statSync(OUT_WEBP_PC).size;
    const mobSize  = statSync(OUT_WEBP_MOB).size;

    console.log('\n📊 Сводка:');
    console.log(`   Исходный PNG:         ${(srcSize  / 1024 / 1024).toFixed(2)} МБ`);
    console.log(`   ПК WebP-атлас:        ${(pcSize   / 1024).toFixed(0)} КБ  (экономия: ${Math.round((1 - pcSize / srcSize) * 100)}%)`);
    console.log(`   Мобильный WebP-атлас: ${(mobSize  / 1024).toFixed(0)} КБ  (экономия: ${Math.round((1 - mobSize / srcSize) * 100)}%)`);
    console.log('\n🎉 Готово! Теперь добавьте атлас в AssetsMap.ts и AssetLoader.ts.');
    console.log('   Файлы сохранены в: build/atlas/images/items/weapons/');
}

main().catch(err => {
    console.error('❌ Ошибка:', err);
    process.exit(1);
});
