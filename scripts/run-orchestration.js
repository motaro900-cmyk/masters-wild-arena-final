/**
 * @owner: @Motaro900 / Orchestration Team
 * @purpose: Central runner for the Adaptive Intelligence Layer. Automates task risk evaluation,
 *           dynamic pipeline escalation, multi-round message bus execution, conflict resolution,
 *           and state persistence.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assessRisk } from './assess-task-risk.js';
import { validateMessage } from './validate-bus-message.js';
import { addDecisionLog } from './add-decision-log.js';

// Color wrappers for terminal presentation
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function logHeader(title) {
    console.log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function printUsage() {
    console.log('Usage: node scripts/run-orchestration.js "<task_description>"');
    console.log('Or:    node scripts/run-orchestration.js --file <filepath>');
}

// Generate realistic, context-aware agent reports based on task keywords
function simulateAgentResponse(agent, taskText, taskId) {
    const lowerText = taskText.toLowerCase();
    
    const message = {
        from: agent,
        to: 'game_director_agent',
        task_id: taskId,
        confidence: 0.90
    };

    switch (agent) {
        case 'ux_agent':
            if (lowerText.includes('квест') || lowerText.includes('интерфейс') || lowerText.includes('кнопк') || lowerText.includes('текст')) {
                message.type = 'report';
                message.confidence = 0.95;
                message.payload = {
                    summary: 'UX layout is clear. Buttons align perfectly with VK Mini Apps guidelines. Recommended font sizes are verified.',
                    details: { layout: 'grid', onboarding_flow: 'unchanged' },
                    risks: [],
                    metrics_impact: { retention_d1: '+0.2%', onboarding_drop_rate: '-0.1%' }
                };
            } else {
                message.type = 'report';
                message.payload = {
                    summary: 'No major UX adjustments needed for this feature.',
                    details: {},
                    risks: [],
                    metrics_impact: {}
                };
            }
            break;

        case 'economy_agent':
            if (lowerText.includes('наград') || lowerText.includes('золот') || lowerText.includes('монет') || lowerText.includes('цена')) {
                message.type = 'report';
                message.confidence = 0.88;
                message.payload = {
                    summary: 'Emitting additional gold could lead to minor economy inflation. Recommended daily limit: 2000 gold per user.',
                    details: { daily_reward_limit: 2000, sink_mechanic: 'None' },
                    risks: ['Potential inflation of 0.8% over 30 days if left unchecked.'],
                    metrics_impact: { inflation: '+0.8%', retention_d7: '+1.2%' }
                };
            } else if (lowerText.includes('донат') || lowerText.includes('платёж') || lowerText.includes('покупк')) {
                message.type = 'recommendation';
                message.payload = {
                    summary: 'Pricing points must be calibrated. Hard currency packs need clear descriptions and strict VK pricing guidelines.',
                    details: { currency_ratio: '100 coins per 1 voice' }
                };
            } else {
                message.type = 'report';
                message.payload = {
                    summary: 'Economic impact is negligible. Ready to proceed.',
                    details: {},
                    risks: [],
                    metrics_impact: {}
                };
            }
            break;

        case 'game_designer':
            if (lowerText.includes('наград') || lowerText.includes('золот') || lowerText.includes('монет') || lowerText.includes('урон') || lowerText.includes('баланс')) {
                message.type = 'report';
                message.confidence = 0.92;
                message.payload = {
                    summary: 'Increasing rewards keeps the gameplay loop highly engaging. We recommend 3000 gold per day to drive player progression.',
                    details: { proposed_gold: 3000, progression_speed: '+12%' },
                    risks: ['Fast progression might burn through level content 5% faster.'],
                    metrics_impact: { retention_d7: '+2.5%' }
                };
            } else {
                message.type = 'report';
                message.payload = {
                    summary: 'Gameplay progression is stable. Approved from game design perspective.',
                    details: {},
                    risks: [],
                    metrics_impact: {}
                };
            }
            break;

        case 'qa_agent':
            if (lowerText.includes('донат') || lowerText.includes('платёж') || lowerText.includes('покупк') || lowerText.includes('сохранение') || lowerText.includes('firebase') || lowerText.includes('db')) {
                if (lowerText.includes('verify-sign') || lowerText.includes('verify_sign') || lowerText.includes('подпись')) {
                    message.type = 'report';
                    message.confidence = 0.99;
                    message.payload = {
                        summary: 'Security check passed. Signature verification via verify-sign is correct.',
                        details: { verification_method: 'verify-sign.js', db_write_protected: true },
                        risks: [],
                        metrics_impact: {}
                    };
                } else {
                    message.type = 'warning';
                    message.confidence = 1.00;
                    message.payload = {
                        summary: 'Veto! Cryptographic signature verification is missing. Payload verification must be handled server-side to prevent bypass.',
                        details: { exploit_type: 'bypass_payment_verification', severity: 'CRITICAL' },
                        risks: ['Malicious players can forge transaction results, leading to unlimited currency injection.']
                    };
                }
            } else {
                message.type = 'report';
                message.payload = {
                    summary: 'Basic code sanity and performance checks passed.',
                    details: { smoke_test: 'green' },
                    risks: [],
                    metrics_impact: {}
                };
            }
            break;

        case 'live_ops_agent':
            message.type = 'report';
            message.payload = {
                summary: 'Campaign lifecycle timeline verified. Ready to queue in scheduler.',
                details: { schedule_slot: 'winter_season_2026' },
                risks: [],
                metrics_impact: {}
            };
            break;

        case 'analytics_agent':
            message.type = 'recommendation';
            message.payload = {
                summary: 'We must ensure core event tracking logs are injected into the client hooks.',
                details: { track_events: ['payment_completed', 'event_reward_claimed'] }
            };
            break;

        default:
            message.type = 'report';
            message.payload = {
                summary: 'Acknowledged and approved.',
                details: {},
                risks: [],
                metrics_impact: {}
            };
            break;
    }

    return message;
}

function updateMemory(taskId, riskAssessment, decisionLog) {
    const memoryPath = path.join('docs', 'reports', 'studio_memory.json');
    let memory = {
        version: "1.0.0",
        economy_state: {
            gold_income_per_day: 1200,
            inflation_rate: 0.03,
            average_gold_balance: 5400
        },
        events_history: [],
        banned_patterns: [
            "infinite_reward_loop",
            "negative_price_arbitrage",
            "double_claim_on_latency"
        ]
    };

    if (fs.existsSync(memoryPath)) {
        try {
            memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
        } catch (e) {
            // Keep default
        }
    }

    // Update banned patterns if QA vetoed security/signature
    if (decisionLog.final_veto === 'qa_agent' && decisionLog.decision === 'REJECTED') {
        const newPattern = 'unverified_signature_payload';
        if (!memory.banned_patterns.includes(newPattern)) {
            memory.banned_patterns.push(newPattern);
        }
    }

    // Update history
    memory.events_history.push({
        event_id: taskId,
        result: decisionLog.decision,
        issues: decisionLog.final_veto ? [decisionLog.final_veto] : []
    });

    // Simulated economy adjustments
    if (decisionLog.decision === 'APPROVED' && decisionLog.metrics_forecast) {
        if (decisionLog.metrics_forecast.inflation) {
            const inf = parseFloat(decisionLog.metrics_forecast.inflation);
            if (!isNaN(inf)) {
                memory.economy_state.inflation_rate = parseFloat((memory.economy_state.inflation_rate + inf / 100).toFixed(4));
            }
        }
    }

    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2), 'utf8');
}

function runOrchestration(taskText) {
    const taskId = 'task_' + Math.floor(Math.random() * 1000000);
    
    logHeader('TASK EVALUATION & RISK CLASSIFICATION');
    console.log(`Task Prompt: "${colors.yellow}${taskText}${colors.reset}"`);
    
    // 1. Risk assessment
    const assessment = assessRisk(taskText);
    const { risk_level, required_agents, token_budget_multiplier } = assessment;
    
    // Determine max rounds based on risk level
    let maxRounds = 1;
    if (risk_level === 'high') maxRounds = 2;
    if (risk_level === 'critical') maxRounds = 3;

    console.log(`├── ${colors.bright}Risk Level:${colors.reset} ${colors.bright}${colors.magenta}${risk_level.toUpperCase()}${colors.reset}`);
    console.log(`├── ${colors.bright}Active Roster:${colors.reset} [${required_agents.join(', ')}]`);
    console.log(`└── ${colors.bright}Budget Multiplier:${colors.reset} ${colors.cyan}${token_budget_multiplier}x${colors.reset} (Max Rounds: ${maxRounds})`);

    // 2. Execute Discussion Loop
    logHeader('DISCUSSION PIPELINE EXECUTION (MESSAGE BUS)');
    
    const messagesExchange = [];
    let round = 1;
    let pipelineEscalated = false;
    let conflictWarnings = [];
    let qaVeto = null;
    let economyVeto = null;

    while (round <= maxRounds) {
        console.log(`\n${colors.bright}--- ROUND ${round} ---${colors.reset}`);
        let roundHasWarnings = false;

        for (const agent of required_agents) {
            if (agent === 'game_director_agent') continue; // Director resolves at the end

            // Send request to agent
            const req = {
                from: 'game_director_agent',
                to: agent,
                type: 'request',
                task_id: taskId,
                confidence: 1.0,
                payload: {
                    instruction: `Evaluate task: "${taskText}"`
                }
            };
            
            // Validate request
            let val = validateMessage(req);
            if (!val.valid) {
                console.error(`❌ Validation failed on request to ${agent}:`, val.errors);
                process.exit(1);
            }
            messagesExchange.push(req);
            console.log(`  ${colors.dim}[Request]${colors.reset} game_director_agent -> ${colors.blue}${agent}${colors.reset}`);

            // Simulate agent response
            const res = simulateAgentResponse(agent, taskText, taskId);
            
            // Validate response
            val = validateMessage(res);
            if (!val.valid) {
                console.error(`❌ Validation failed on response from ${agent}:`, val.errors);
                process.exit(1);
            }
            messagesExchange.push(res);
            
            const typeColor = res.type === 'warning' ? colors.red : (res.type === 'recommendation' ? colors.yellow : colors.green);
            console.log(`  ${colors.dim}[Response]${colors.reset} ${colors.blue}${agent}${colors.reset} -> game_director_agent [${typeColor}${res.type}${colors.reset}]`);
            console.log(`     Summary (${res.payload.summary.split(' ').length} words): "${colors.dim}${res.payload.summary}${colors.reset}"`);
            
            // Limit summary word count check (Token Control/Summarizer)
            if (res.payload.summary.split(' ').length > 150) {
                console.warn(`  ${colors.yellow}⚠️ Warning: Summary for ${agent} exceeds 150-word limit.${colors.reset}`);
            }

            if (res.type === 'warning') {
                roundHasWarnings = true;
                conflictWarnings.push({ agent, msg: res });
                if (agent === 'qa_agent' && res.payload.details?.severity === 'CRITICAL') {
                    qaVeto = res;
                }
                if (agent === 'economy_agent' && res.payload.details?.severity === 'CRITICAL') {
                    economyVeto = res;
                }
            }
        }

        // Adaptive intelligence check: trigger pipeline expansion if warnings exist
        if (roundHasWarnings && round < maxRounds) {
            console.log(`\n${colors.yellow}⚠️ Warning or high risk detected. Escalating pipeline to next discussion round...${colors.reset}`);
            pipelineEscalated = true;
            round++;
        } else {
            break;
        }
    }

    // 3. Conflict Resolution (Anti-Conflict Matrix)
    logHeader('CONFLICT RESOLUTION & GAME DIRECTOR DECISION');
    
    let decision = 'APPROVED';
    let reasoning_summary = 'All active agents validated the task without warnings. Gameplay retention and technical specs align.';
    let final_veto = null;
    let metrics_forecast = {
        retention_d7: '+0.5%',
        inflation: '0.0%'
    };
    
    const agents_agreed_set = new Set(required_agents.filter(a => a !== 'game_director_agent'));
    const agents_conflicted_set = new Set();

    if (conflictWarnings.length > 0) {
        console.log(`${colors.yellow}Conflict/Warning list detected. Applying priority matrix resolution:${colors.reset}`);
        
        conflictWarnings.forEach(c => {
            agents_conflicted_set.add(c.agent);
            agents_agreed_set.delete(c.agent);
        });

        // 1. Check QA Veto (Highest Priority)
        if (qaVeto) {
            decision = 'REJECTED';
            final_veto = 'qa_agent';
            reasoning_summary = `Vetoed by qa_agent: ${qaVeto.payload.summary} (Resolved via Anti-Conflict Matrix: Security Veto blocks release).`;
            console.log(`  ${colors.bright}${colors.red}[VETO UPHELD]${colors.reset} qa_agent vetoed the release due to: "${qaVeto.payload.summary}"`);
            metrics_forecast = {
                retention_d7: '0.0%',
                inflation: '0.0%'
            };
        } 
        // 2. Check Economy Veto/Warnings (Inflation vs Retention)
        else if (economyVeto || conflictWarnings.some(c => c.agent === 'economy_agent')) {
            const econWarning = conflictWarnings.find(c => c.agent === 'economy_agent');
            decision = 'CONDITIONALLY_APPROVED';
            final_veto = 'economy_agent';
            reasoning_summary = `Economy risk flagged: ${econWarning.msg.payload.summary}. Approved with reward caps to prevent inflation. (Resolved via Anti-Conflict Matrix: Economy overrides GD retention).`;
            console.log(`  ${colors.bright}${colors.yellow}[VETO OVERRIDE / CONDITION]${colors.reset} economy_agent limits reward scaling. Cap applied: 2000 gold/day.`);
            metrics_forecast = {
                retention_d7: '+1.2%',
                inflation: '+0.8%'
            };
        } 
        // 3. Default conflict resolution (Game designer progression overrides minor complaints)
        else {
            decision = 'APPROVED';
            reasoning_summary = 'Resolved conflict. Game designer requirements for progression outweigh UX aesthetic warning.';
            console.log(`  ${colors.bright}${colors.green}[APPROVED WITH OVERRIDE]${colors.reset} Game Director approved features despite UX recommendations.`);
        }
    } else {
        console.log(`  ${colors.green}No conflicts detected. Immediate approval.${colors.reset}`);
        
        // Populate simulated metric forecasting
        if (taskText.toLowerCase().includes('квест') || taskText.toLowerCase().includes('интерфейс')) {
            metrics_forecast.retention_d7 = '+0.2%';
        }
    }

    const decisionLogPayload = {
        task_id: taskId,
        decision,
        reasoning_summary,
        agents_agreed: Array.from(agents_agreed_set),
        agents_conflicted: Array.from(agents_conflicted_set),
        final_veto,
        metrics_forecast
    };

    // 4. Persistence & Output
    logHeader('PERSISTENCE & PIPELINE SUMMARY');
    
    // Add decision log
    const logResult = addDecisionLog(decisionLogPayload);
    if (logResult.success) {
        console.log(`[Decision Log] Successfully appended decision for task "${colors.cyan}${taskId}${colors.reset}" to docs/reports/decision_log.json.`);
    } else {
        console.error('❌ Failed to write decision log:', logResult.errors);
    }

    // Update memory state
    updateMemory(taskId, assessment, decisionLogPayload);
    console.log(`[Studio Memory] State variables & events_history updated in docs/reports/studio_memory.json.`);

    // Token control metrics summary
    const totalRequests = messagesExchange.filter(m => m.type === 'request').length;
    const totalResponses = messagesExchange.length - totalRequests;
    const maxPossibleCalls = required_agents.filter(a => a !== 'game_director_agent').length * maxRounds;
    const actualCalls = totalResponses;
    const savings = maxPossibleCalls > 0 ? ((1 - actualCalls / maxPossibleCalls) * 100).toFixed(1) : 0;

    console.log(`\n${colors.bright}Token Control Report:${colors.reset}`);
    console.log(`  - Discussion Rounds: ${round} / Max: ${maxRounds} (Pipeline Escalated: ${pipelineEscalated ? 'YES' : 'NO'})`);
    console.log(`  - Total Messages Exchanged on Bus: ${messagesExchange.length}`);
    console.log(`  - Call Budget Efficiency: ${colors.green}${savings}% saved${colors.reset} relative to full loop expansion.`);
    console.log(`  - Final Pipeline Status: [${decision === 'APPROVED' ? colors.green : (decision === 'REJECTED' ? colors.red : colors.yellow)}${decision}${colors.reset}]`);
    console.log(`\n${colors.bright}Decision Summary:${colors.reset} ${reasoning_summary}\n`);
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

    runOrchestration(taskText);
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    main();
}

export { runOrchestration };
