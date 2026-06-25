/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Analyzes a task description and dynamically determines its risk level, required agents, and token budget multiplier.
 */

import fs from 'fs';
import { fileURLToPath } from 'url';

function printUsage() {
    console.log('Usage: node scripts/assess-task-risk.js "<task_description>"');
    console.log('Or:    node scripts/assess-task-risk.js --file <filepath>');
}

// Keyword-based classification rules
const CRITICAL_KEYWORDS = [
    'донат', 'платёж', 'платеж', 'vk pay', 'vkpay', 'шлюз', 'база данных', 'firebase', 
    'firestore', 'сохранение', 'save', 'db', 'бд', 'verify-sign', 'verify_sign', 
    'оплат', 'голос', 'покупка за голоса', 'реальн'
];

const HIGH_KEYWORDS = [
    'ивент', 'акция', 'event', 'новые предметы', 'цепочка наград', 'скидка', 
    'сезонный', 'промокод', 'реферальн', 'турнир'
];

const MEDIUM_KEYWORDS = [
    'баланс', 'урон', 'статы', 'цена', 'золото', 'монет', 'gold', 'наград', 
    'reward', 'характеристики', 'атрибут', 'оружие', 'броня'
];

function assessRisk(text) {
    const lowerText = text.toLowerCase();

    // Check CRITICAL triggers
    if (CRITICAL_KEYWORDS.some(kw => lowerText.includes(kw))) {
        return {
            risk_level: 'critical',
            triggers_full_pipeline: true,
            required_agents: ['game_director_agent', 'game_designer', 'economy_agent', 'qa_agent', 'ux_agent', 'live_ops_agent', 'analytics_agent'],
            token_budget_multiplier: 2.0
        };
    }

    // Check HIGH triggers
    if (HIGH_KEYWORDS.some(kw => lowerText.includes(kw))) {
        return {
            risk_level: 'high',
            triggers_full_pipeline: true,
            required_agents: ['live_ops_agent', 'economy_agent', 'ux_agent', 'qa_agent'],
            token_budget_multiplier: 1.5
        };
    }

    // Check MEDIUM triggers
    if (MEDIUM_KEYWORDS.some(kw => lowerText.includes(kw))) {
        return {
            risk_level: 'medium',
            triggers_full_pipeline: false,
            required_agents: ['game_designer', 'economy_agent'],
            token_budget_multiplier: 1.0
        };
    }

    // Default to LOW risk
    return {
        risk_level: 'low',
        triggers_full_pipeline: false,
        required_agents: ['ux_agent'],
        token_budget_multiplier: 0.5
    };
}

function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        printUsage();
        process.exit(1);
    }

    let taskText = '';

    if (args[0] === '--file') {
        if (args.length < 2) {
            console.error('Error: File path is missing.');
            process.exit(1);
        }
        const filePath = args[1];
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File not found at path: ${filePath}`);
            process.exit(1);
        }
        taskText = fs.readFileSync(filePath, 'utf8');
    } else {
        taskText = args.join(' ');
    }

    if (!taskText.trim()) {
        console.error('Error: Task description is empty.');
        process.exit(1);
    }

    const assessment = assessRisk(taskText);
    console.log(JSON.stringify(assessment, null, 2));
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    main();
}

export { assessRisk };
