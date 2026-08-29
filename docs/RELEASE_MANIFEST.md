# 📦 RELEASE MANIFEST: MASTERS OF THE WILD
**Версия релиза**: 1.2.0-FINAL (Release Candidate)  
**Дата сборки**: 2026-08-29  
**Целевая платформа**: VK Mini Apps (Российский автономный VPS)  

---

## 1. Спецификация сборки

| Параметр | Значение |
| :--- | :--- |
| **Application Name** | Masters of the Wild |
| **App Version** | 1.2.0-FINAL |
| **Node.js Target** | v20+ / v22+ LTS |
| **Frontend Framework** | React 18.2 + Pixi.js v8.6 |
| **State Management** | Zustand 4.4 + SecureStorage |
| **Storage Engine** | LocalStore (Atomic JSON + In-Memory Mutex + .bak Recovery) |
| **Deployment Mode** | PM2 Single-Process (`instances: 1`) |
| **Foreign Runtime Dependencies** | **0** (Firebase, Google APIs, Vercel полностью удалены) |
| **Secret Leaks** | **0** (`VK_APP_SECRET` изолирован на сервере) |

---

## 2. Статус сертификационных наборов тестов

- ✅ `test_phase1_5.js` — PASS (Production Startup, Offline, Network Latency)
- ✅ `test_phase2_security.js` — PASS (VK HMAC Auth, Security Baseline)
- ✅ `test_phase3_5_adversarial.js` — PASS (Adversarial Economy & Battle Simulation)
- ✅ `test_phase4_6_adversarial.js` — PASS (Secondary Services, Daily Gift, Wheel)
- ✅ `test_phase5_5_acceptance.js` — PASS (Combat Frame Times, Presets, Jitter)
- ✅ `test_phase6_vk_platform.js` — PASS (VK Bridge, Launch Params, Payments MD5)
- ✅ `smoke_phase6_vk_runtime.js` — PASS (Production Runtime Smoke)
- ✅ `test_phase7_production.js` — PASS (Path Traversal, Fuzzing, 50 Parallel, Backup)
- ✅ `test_phase8_production_config.js` — PASS (Secrets, Headers, Sanitization)
- ✅ `test_phase8_restart.js` — PASS (Server Crash Recovery, Idempotency Persistence)
- ✅ `test_phase8_load.js` — PASS (100 Battles, 500 Requests, 4274 RPS Throughput)
- ✅ `test_phase9_final.js` — PASS (End-to-End Master Certification)

---

## 3. Статус релизных ворот (Release Gate)
- **Automated Master Suite**: ✅ **100% PASS**
- **Single Process Safety**: ✅ **ENFORCED (`instances === 1`)**
- **Zero Foreign Traffic**: ✅ **VERIFIED (0 foreign calls)**
- **Real Device Android/iOS**: ⏳ **PENDING (Готово к ручной приёмке по чеклисту)**
