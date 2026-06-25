/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Validates and appends a decision log entry to docs/reports/decision_log.json (Decision Lineage tracking).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const LOG_FILE = path.join('docs', 'reports', 'decision_log.json');

function printUsage() {
    console.log('Usage: node scripts/add-decision-log.js \'<json_string>\'');
    console.log('Or:    node scripts/add-decision-log.js --file <filepath>');
}

function validateDecisionLog(data) {
    const errors = [];

    // 1. Required fields check
    const requiredFields = [
        'task_id', 'decision', 'reasoning_summary',
        'agents_agreed', 'agents_conflicted', 'final_veto', 'metrics_forecast'
    ];

    requiredFields.forEach(field => {
        if (data[field] === undefined || data[field] === null) {
            if (field === 'final_veto' && data[field] === null) {
                // null is allowed for final_veto
            } else {
                errors.push(`Missing required field: "${field}"`);
            }
        }
    });

    if (errors.length > 0) return { valid: false, errors };

    // 2. Type validation
    if (typeof data.task_id !== 'string' || !data.task_id.trim()) {
        errors.push('Field "task_id" must be a non-empty string');
    }
    if (typeof data.decision !== 'string' || !data.decision.trim()) {
        errors.push('Field "decision" must be a non-empty string');
    }
    if (typeof data.reasoning_summary !== 'string' || !data.reasoning_summary.trim()) {
        errors.push('Field "reasoning_summary" must be a non-empty string');
    }

    if (!Array.isArray(data.agents_agreed)) {
        errors.push('Field "agents_agreed" must be an array of strings');
    } else {
        data.agents_agreed.forEach((agent, idx) => {
            if (typeof agent !== 'string') {
                errors.push(`Field "agents_agreed[${idx}]" must be a string`);
            }
        });
    }

    if (!Array.isArray(data.agents_conflicted)) {
        errors.push('Field "agents_conflicted" must be an array of strings');
    } else {
        data.agents_conflicted.forEach((agent, idx) => {
            if (typeof agent !== 'string') {
                errors.push(`Field "agents_conflicted[${idx}]" must be a string`);
            }
        });
    }

    if (data.final_veto !== null && typeof data.final_veto !== 'string') {
        errors.push('Field "final_veto" must be null or a string');
    }

    if (typeof data.metrics_forecast !== 'object' || data.metrics_forecast === null || Array.isArray(data.metrics_forecast)) {
        errors.push('Field "metrics_forecast" must be a valid JSON object');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function addDecisionLog(data) {
    const result = validateDecisionLog(data);
    if (!result.valid) {
        return { success: false, errors: result.errors };
    }

    // Ensure directory exists
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2), 'utf8');
    }

    let logs = [];
    try {
        const rawContent = fs.readFileSync(LOG_FILE, 'utf8');
        logs = JSON.parse(rawContent);
        if (!Array.isArray(logs)) {
            logs = [];
        }
    } catch (e) {
        logs = [];
    }

    logs.push(data);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return { success: true };
}

function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        printUsage();
        process.exit(1);
    }

    let jsonString = '';

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
        jsonString = fs.readFileSync(filePath, 'utf8');
    } else {
        jsonString = args[0];
    }

    try {
        const data = JSON.parse(jsonString);
        const result = addDecisionLog(data);

        if (!result.success) {
            console.error('❌ Validation Error: The Decision Log payload is invalid.');
            result.errors.forEach(err => console.error(`  - ${err}`));
            process.exit(1);
        }

        console.log(`✅ Success: Appended decision log entry for task "${data.task_id}" to ${LOG_FILE}.`);
        process.exit(0);

    } catch (err) {
        console.error('❌ JSON Parse / Write Error: Could not process inputs.');
        console.error(`  - ${err.message}`);
        process.exit(1);
    }
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    main();
}

export { validateDecisionLog, addDecisionLog };
