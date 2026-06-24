/**
 * Parse workflow / AI email draft text into subject + body for mailto links.
 */

/**
 * @param {string} raw
 * @returns {{ subject: string, body: string }}
 */
export function parseEmailDraft(raw) {
    const text = String(raw || '').trim();
    if (!text) return { subject: '', body: '' };

    const subjectMatch = text.match(/^Subject:\s*(.+?)(?:\r?\n\r?\n|\r?\n$)/is);
    if (subjectMatch) {
        const subject = subjectMatch[1].trim();
        const body = text.slice(subjectMatch[0].length).trim();
        return { subject, body };
    }

    const lines = text.split(/\r?\n/);
    const subject = lines[0]?.trim() || 'Case update';
    const body = lines.slice(1).join('\n').trim() || text;
    return { subject, body };
}

/**
 * Extract email content from Agent Builder workflow tool execute response.
 * @param {Object} executeResponse
 * @returns {string}
 */
export function extractWorkflowEmailContent(executeResponse) {
    const results = executeResponse?.results;
    if (!Array.isArray(results) || !results.length) return '';

    const data = results[0]?.data;
    const execution = data?.execution;
    const output = execution?.output;

    if (typeof output === 'string') return output;
    if (output?.content) return String(output.content);
    if (output?.email_text) return String(output.email_text);
    if (typeof data === 'string') return data;

    return '';
}

/**
 * @param {string} subject
 * @param {string} body
 * @param {string} [to]
 * @returns {string}
 */
export function buildMailtoHref(subject, body, to = '') {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const qs = params.toString();
    return to ? `mailto:${encodeURIComponent(to)}?${qs}` : `mailto:?${qs}`;
}
