// scratch/test_cup_simulation.js
const calcCupsChange = (rating, opponentRating, won) => {
    const diff = opponentRating - rating;
    const isWeakOpponent = diff < 0;

    if (rating < 1000) {
        if (won) {
            return isWeakOpponent ? 70 : 100;
        } else {
            return 0;
        }
    } else if (rating < 3000) {
        if (won) {
            return isWeakOpponent ? 40 : 60;
        } else {
            return diff > 0 ? -3 : -5;
        }
    } else if (rating < 4500) {
        if (won) {
            return isWeakOpponent ? 20 : 35;
        } else {
            return diff > 0 ? -7 : -10;
        }
    } else {
        // Fallback for higher ratings
        if (won) return 25;
        else return -13;
    }
};

const runSimulation = () => {
    let rating = 500;
    let winStreak = 0;
    const totalBattles = 20;
    const winRate = 0.70;

    console.log(`Starting rating: ${rating} cups\n`);
    console.log(`Battle | Result  | Opponent Rating | Cups Change | New Rating | Win Streak`);
    console.log(`-------------------------------------------------------------------------`);

    let wins = 0;
    let losses = 0;
    let totalCupsGained = 0;

    // Fixed sequence of 20 battles with 70% wins (e.g. 14 wins, 6 losses)
    // To avoid random fluctuations in this run, we'll use a pre-determined array of 14 wins (W) and 6 losses (L)
    // mixed realistically: W, W, L, W, W, W, L, W, W, L, W, W, W, L, W, L, W, W, L, W
    const battleOutcomes = [
        true, true, false, true, true, true, false, true, true, false,
        true, true, true, false, true, false, true, true, false, true
    ];

    for (let i = 0; i < totalBattles; i++) {
        const won = battleOutcomes[i];
        const opponentRating = rating + Math.floor(Math.random() * 60) - 30;
        
        let change = calcCupsChange(rating, opponentRating, won);

        if (won) {
            wins++;
            winStreak++;
            
            // Win streak bonus
            let streakBonus = 0;
            if (winStreak >= 10) {
                streakBonus = 35;
            } else if (winStreak >= 5) {
                streakBonus = 20;
            } else if (winStreak >= 3) {
                streakBonus = 10;
            }
            change += streakBonus;
        } else {
            losses++;
            winStreak = 0;
        }

        rating = Math.max(0, rating + change);
        totalCupsGained += change;

        console.log(
            `${String(i + 1).padStart(6)} | ${won ? 'WIN   ' : 'LOSS  '} | ${String(opponentRating).padStart(15)} | ${String(change).padStart(11)} | ${String(rating).padStart(10)} | ${winStreak}`
        );
    }

    console.log(`\n================ SUMMARY ================`);
    console.log(`Total Battles: ${totalBattles}`);
    console.log(`Wins: ${wins} (Win Rate: ${(wins / totalBattles * 100).toFixed(1)}%)`);
    console.log(`Losses: ${losses}`);
    console.log(`Final Rating: ${rating} cups`);
    console.log(`Total Cups Gained: ${rating - 500}`);
};

runSimulation();
