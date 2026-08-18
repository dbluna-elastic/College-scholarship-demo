/**
 * Run Elastic Workflows via Kibana Workflows API (not Agent Builder tool execute).
 *
 * Agent Builder workflow tools currently expose an empty input schema when created via API,
 * so tool_params (e.g. donor_id) are dropped before the workflow runs. Calling /run with
 * explicit inputs avoids that bug.
 */

import { getEnvVar } from './getEnvVar.js';
import { tracedFetch } from './tracingHelpers.js';

const DEFAULT_POLL_MS = 1000;
const DEFAULT_TIMEOUT_MS = 90000;

/**
 * @returns {string}
 */
function getWorkflowsApiKey() {
    return getEnvVar('OK_KIBANA_API_KEY', '') || getEnvVar('ELASTIC_API_KEY', '');
}

/**
 * @returns {Object}
 */
function createWorkflowAuthHeaders() {
    const apiKey = getWorkflowsApiKey();
    if (!apiKey) {
        throw new Error('OK_KIBANA_API_KEY is required to run Elastic Workflows');
    }
    return {
        Authorization: `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
        'kbn-xsrf': 'true',
    };
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Start a workflow run with inputs.
 * @param {string} workflowId
 * @param {Object} inputs
 * @returns {Promise<string>} workflowExecutionId
 */
export async function startWorkflowRun(workflowId, inputs = {}) {
    if (!workflowId) throw new Error('workflowId is required');

    const response = await tracedFetch(
        `/api/elastic/workflows/workflow/${encodeURIComponent(workflowId)}/run`,
        {
            method: 'POST',
            headers: createWorkflowAuthHeaders(),
            body: JSON.stringify({ inputs }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Workflow run failed: ${response.status}`);
    }

    const data = await response.json();
    const executionId = data?.workflowExecutionId || data?.id;
    if (!executionId) {
        throw new Error('Workflow run did not return an execution id');
    }
    return executionId;
}

/**
 * @param {string} executionId
 * @returns {Promise<Object>}
 */
export async function getWorkflowExecution(executionId) {
    const response = await tracedFetch(
        `/api/elastic/workflows/executions/${encodeURIComponent(executionId)}`,
        {
            method: 'GET',
            headers: createWorkflowAuthHeaders(),
        }
    );
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to load workflow execution: ${response.status}`);
    }
    return response.json();
}

/**
 * @param {string} executionId
 * @param {string} stepExecutionId
 * @returns {Promise<Object>}
 */
export async function getWorkflowStepExecution(executionId, stepExecutionId) {
    const response = await tracedFetch(
        `/api/elastic/workflows/executions/${encodeURIComponent(executionId)}/step/${encodeURIComponent(stepExecutionId)}`,
        {
            method: 'GET',
            headers: createWorkflowAuthHeaders(),
        }
    );
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to load workflow step: ${response.status}`);
    }
    return response.json();
}

/**
 * Extract email draft text from a completed workflow execution.
 * Prefers ai.prompt / draft_email step output.content; falls back to any step with Subject:.
 * @param {string} executionId
 * @param {Object} execution
 * @returns {Promise<string>}
 */
export async function extractEmailFromWorkflowExecution(executionId, execution) {
    const steps = Array.isArray(execution?.stepExecutions) ? execution.stepExecutions : [];
    const preferred = steps.filter(
        (s) => s.stepType === 'ai.prompt' || s.stepId === 'draft_email' || /email|draft|prompt/i.test(s.stepId || '')
    );
    const ordered = preferred.length ? preferred : steps;

    for (const step of ordered) {
        if (!step?.id) continue;
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const detail = await getWorkflowStepExecution(executionId, step.id);
                const output = detail?.output;
                const content = typeof output === 'string'
                    ? output
                    : (output?.content ?? output?.text ?? output?.email_text ?? '');
                if (typeof content === 'string' && content.trim()) {
                    return content.trim();
                }
            } catch {
                /* retry */
            }
            if (attempt < 2) await sleep(500);
        }
    }
    return '';
}

/**
 * Run a workflow to completion and return email draft text from AI/output steps.
 * @param {string} workflowId
 * @param {Object} inputs
 * @param {Object} [options]
 * @param {number} [options.pollMs]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<{ raw: string, executionId: string, execution: Object }>}
 */
export async function runWorkflowForEmailDraft(workflowId, inputs = {}, options = {}) {
    const pollMs = options.pollMs ?? DEFAULT_POLL_MS;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const executionId = await startWorkflowRun(workflowId, inputs);
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
        const execution = await getWorkflowExecution(executionId);
        const status = execution?.status;

        if (status === 'failed' || status === 'cancelled') {
            const msg = execution?.error || execution?.error_message || `Workflow ${status}`;
            throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }

        if (status === 'completed' || status === 'complete' || status === 'success') {
            const raw = await extractEmailFromWorkflowExecution(executionId, execution);
            if (!raw) {
                throw new Error('Workflow completed but returned no email content.');
            }
            return { raw, executionId, execution };
        }

        await sleep(pollMs);
    }

    throw new Error(`Workflow timed out after ${Math.round(timeoutMs / 1000)}s`);
}
