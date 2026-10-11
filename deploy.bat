@echo off
chcp 65001 > nul
title Masters of the Wild - Деплой на VPS

echo ========================================================
echo   🎮 Masters of the Wild - Быстрый деплой в 1 клик
echo ========================================================
echo.

node scripts/deploy-to-vps.js %*

pause
