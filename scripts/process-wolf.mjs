import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Скрипт для нормализации спрайта Волка.
 * Приводит к 512x512 и ставит ноги на y=0.95.
 */

const INPUT_PATH = 'public/assets/characters/wolf_knight/wolf_knight.png';
const TARGET_W = 512;
const TARGET_H = 512;
const ANCHOR_X = 0.5;
const ANCHOR_Y = 0.95;

async function process() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌ Файл не найден: ${INPUT_PATH}`);
    return;
  }

  console.log(`⏳ Обработка ${INPUT_PATH}...`);
  const buffer = fs.readFileSync(INPUT_PATH);
  
  const img = sharp(buffer).png();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  
  // Находим границы непрозрачных пикселей
  let left = info.width, right = 0, top = info.height, bottom = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  const pivotX = (left + right) / 2;
  const pivotY = bottom;

  const targetPivotX = TARGET_W * ANCHOR_X;
  const targetPivotY = TARGET_H * ANCHOR_Y;

  const padLeft = Math.round(targetPivotX - pivotX);
  const padTop = Math.round(targetPivotY - pivotY);
  const padRight = TARGET_W - info.width - padLeft;
  const padBottom = TARGET_H - info.height - padTop;

  console.log(`📐 Смещения: L:${padLeft}, T:${padTop}, R:${padRight}, B:${padBottom}`);

  await sharp(buffer)
    .extend({ 
      top: Math.max(0, padTop), 
      bottom: Math.max(0, padBottom), 
      left: Math.max(0, padLeft), 
      right: Math.max(0, padRight),
      background: { r: 0, g: 0, b: 0, alpha: 0 } 
    })
    .resize(TARGET_W, TARGET_H)
    .png()
    .toBuffer()
    .then(out => fs.writeFileSync(INPUT_PATH, out));

  console.log(`✅ Волк нормализован! (512x512, feet at 95%)`);
}

process();
