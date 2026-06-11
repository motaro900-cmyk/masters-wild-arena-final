import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * INPUT от клиента (минимально доверенный)
 */
type ResolveBattleInput = {
  battleId: string;
  attackerId: string;
  defenderId: string;
  mode: "pvp" | "pve";
};

/**
 * SERVER AUTHORITATIVE BATTLE RESOLUTION
 */
export const resolveBattle = onCall(async (request) => {
  const data = request.data as ResolveBattleInput;

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;

  // 🛡️ 1. проверка владения
  if (uid !== data.attackerId) {
    throw new HttpsError("permission-denied", "Invalid attacker");
  }

  // 🛡️ 2. идемпотентность (anti replay)
  const battleRef = db.collection("battles").doc(data.battleId);
  const battleSnap = await battleRef.get();

  if (battleSnap.exists) {
    return battleSnap.data(); // уже посчитано
  }

  // 🧩 3. загружаем реальные данные с сервера (НЕ клиента)
  const attackerRef = db.collection("users").doc(data.attackerId);
  const defenderRef = db.collection("users").doc(data.defenderId);

  const [attackerSnap, defenderSnap] = await Promise.all([
    attackerRef.get(),
    defenderRef.get(),
  ]);

  if (!attackerSnap.exists || !defenderSnap.exists) {
    throw new HttpsError("not-found", "Players not found");
  }

  const attacker = attackerSnap.data()!;
  const defender = defenderSnap.data()!;

  // ⚔️ 4. серверная симуляция боя (детерминированная логика)
  const attackerPower =
    (attacker.attack || 0) + (attacker.level || 1) * 10;

  const defenderPower =
    (defender.defense || 0) + (defender.level || 1) * 10;

  // server RNG (ВАЖНО: не Math.random client-side)
  const seed = Date.now() + parseInt(data.battleId.slice(-4), 10);
  const rng = mulberry32(seed);

  const attackerRoll = attackerPower * (0.8 + rng() * 0.4);
  const defenderRoll = defenderPower * (0.8 + rng() * 0.4);

  const attackerWins = attackerRoll >= defenderRoll;

  // 💰 5. расчёт наград (ТОЛЬКО СЕРВЕР)
  const reward = attackerWins
    ? {
        xp: 120,
        gold: 80,
      }
    : {
        xp: 40,
        gold: 20,
      };

  // 💾 6. атомарная запись результата
  await db.runTransaction(async (tx) => {
    const freshAttacker = await tx.get(attackerRef);

    const current = freshAttacker.data()!;

    tx.update(attackerRef, {
      xp: (current.xp || 0) + reward.xp,
      gold: (current.gold || 0) + reward.gold,
      lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.set(battleRef, {
      battleId: data.battleId,
      attackerId: data.attackerId,
      defenderId: data.defenderId,
      result: attackerWins ? "win" : "lose",
      reward,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  // 📤 7. ответ клиенту (ТОЛЬКО визуализация)
  return {
    success: true,
    result: attackerWins ? "win" : "lose",
    reward,
  };
});

/**
 * deterministic RNG (server-safe)
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
