/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Validates JSON strings representing Message Bus payloads to ensure they match the Studio Orchestration standard.
 */

import fs from 'fs';
import { fileURLToPath } from 'url';

function printUsage() {
    console.log('Usage: node scripts/validate-bus-message.js \'<json_string>\'');
    console.log('Or:    node scripts/validate-bus-message.js --file <filepath>');
}

function validateMessage(data) {
    const errors = [];

    // 1. Base Fields Validation
    const requiredBaseFields = ['from', 'to', 'type', 'task_id', 'payload', 'confidence'];
    requiredBaseFields.forEach(field => {
        if (data[field] === undefined || data[field] === null) {
            errors.push(`Missing required field: "${field}"`);
        }
    });

    if (errors.length > 0) return { valid: false, errors };

    // 2. Type validations
    if (typeof data.from !== 'string' || !data.from.trim()) {
        errors.push('Field "from" must be a non-empty string');
    }
    if (typeof data.to !== 'string' || !data.to.trim()) {
        errors.push('Field "to" must be a non-empty string');
    }
    if (typeof data.task_id !== 'string' || !data.task_id.trim()) {
        errors.push('Field "task_id" must be a non-empty string');
    }

    const validTypes = ['request', 'report', 'warning', 'recommendation'];
    if (!validTypes.includes(data.type)) {
        errors.push(`Field "type" must be one of: ${validTypes.join(', ')} (got: "${data.type}")`);
    }

    if (typeof data.payload !== 'object' || Array.isArray(data.payload) || data.payload === null) {
        errors.push('Field "payload" must be a valid JSON object');
    }

    if (typeof data.confidence !== 'number' || data.confidence < 0.0 || data.confidence > 1.0) {
        errors.push('Field "confidence" must be a number between 0.0 and 1.0');
    }

    if (errors.length > 0) return { valid: false, errors };

    // 3. Payload-specific checks
    const payload = data.payload;

    if (data.type === 'request') {
        if (typeof payload.instruction !== 'string' || !payload.instruction.trim()) {
            errors.push('For "request" type, "payload.instruction" must be a non-empty string');
        }
    } else if (data.type === 'report') {
        if (typeof payload.summary !== 'string' || !payload.summary.trim()) {
            errors.push('For "report" type, "payload.summary" must be a non-empty string');
        }
        if (typeof payload.details !== 'object' || payload.details === null) {
            errors.push('For "report" type, "payload.details" must be a JSON object');
        }
        if (!Array.isArray(payload.risks)) {
            errors.push('For "report" type, "payload.risks" must be an array of strings');
        } else {
            payload.risks.forEach((risk, idx) => {
                if (typeof risk !== 'string') {
                    errors.push(`For "report" type, "payload.risks[${idx}]" must be a string`);
                }
            });
        }
        if (typeof payload.metrics_impact !== 'object' || payload.metrics_impact === null) {
            errors.push('For "report" type, "payload.metrics_impact" must be a JSON object');
        }
    } else if (data.type === 'warning') {
        if (typeof payload.summary !== 'string' || !payload.summary.trim()) {
            errors.push('For "warning" type, "payload.summary" must be a non-empty string');
        }
        if (typeof payload.details !== 'object' || payload.details === null) {
            errors.push('For "warning" type, "payload.details" must be a JSON object');
        }
        if (!Array.isArray(payload.risks)) {
            errors.push('For "warning" type, "payload.risks" must be an array of strings');
        } else {
            payload.risks.forEach((risk, idx) => {
                if (typeof risk !== 'string') {
                    errors.push(`For "warning" type, "payload.risks[${idx}]" must be a string`);
                }
            });
        }
    } else if (data.type === 'recommendation') {
        if (typeof payload.summary !== 'string' || !payload.summary.trim()) {
            errors.push('For "recommendation" type, "payload.summary" must be a non-empty string');
        }
        if (typeof payload.details !== 'object' || payload.details === null) {
            errors.push('For "recommendation" type, "payload.details" must be a JSON object');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
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
        const result = validateMessage(data);
        if (result.valid) {
            console.log('✅ Success: Message payload is valid and conforms to the Studio Orchestration standard.');
            process.exit(0);
        } else {
            console.error('❌ Validation Error: The Message Bus payload is invalid.');
            result.errors.forEach(err => console.error(`  - ${err}`));
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ JSON Parse Error: Could not parse input as valid JSON.');
        console.error(`  - ${err.message}`);
        process.exit(1);
    }
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    main();
}

export { validateMessage };
