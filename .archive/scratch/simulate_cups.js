const calcCupsChange = (rating, opponentRating, won) => {
    const diff = opponentRating - rating;
    const isWeakOpponent = diff < 0;
    if (rating < 1000) return won ? (isWeakOpponent ? 70 : 100) : 0;
    if (rating < 3000) return won ? (isWeakOpponent ? 40 : 60) : (diff > 0 ? -3 : -5);
    return won ? 35 : -10;
};

const simulateWins = (playerLevel, cap, divisor) => {
    let rating = 0;
    let winStreak = 0;
    const path = [];

    for (let game = 1; game <= 10; game++) {
        const opponentRating = rating;
        winStreak++;
        let cupsChange = calcCupsChange(rating, opponentRating, true);

        // Catch-up
        if (rating < 3000) {
            const expectedLevel = rating < 1000 ? 1 : (rating < 2000 ? 10 : 20);
            const levelDiff = playerLevel - expectedLevel;
            if (levelDiff >= 20) {
                const multiplier = Math.min(cap, 1 + levelDiff / divisor);
                cupsChange = Math.round(cupsChange * multiplier);
            }
        }

        // Streak
        let streakBonus = 0;
        if (winStreak >= 10) streakBonus = 35;
        else if (winStreak >= 5) streakBonus = 20;
        else if (winStreak >= 3) streakBonus = 10;
        cupsChange += streakBonus;

        rating += cupsChange;
        path.push(rating);
    }
    return path;
};

const levelsToSimulate = [50, 80];
const configurations = [
    { name: "Текущая (Cap 5.0, Div 20)", cap: 5.0, divisor: 20 },
    { name: "Вариант А (Cap 3.0, Div 30)", cap: 3.0, divisor: 30 },
    { name: "Вариант Б (Cap 2.5, Div 40)", cap: 2.5, divisor: 40 },
    { name: "Вариант В (Cap 2.0, Div 40)", cap: 2.0, divisor: 40 },
];

levelsToSimulate.forEach(lvl => {
    console.log(`\n==================================================`);
    console.log(`  СИМУЛЯЦИЯ ДЛЯ ИГРОКА ${lvl} УРОВНЯ (10 побед подряд)`);
    console.log(`==================================================`);
    configurations.forEach(cfg => {
        const path = simulateWins(lvl, cfg.cap, cfg.divisor);
        console.log(`- ${cfg.name.padEnd(30)}: Итог = ${String(path[9]).padStart(4)} кубков (Путь: ${path.join(" → ")})`);
    });
});
