/**
 * Tracing helpers for instrumenting API calls and user interactions
 * Uses Elastic APM RUM for tracing
 */

import { getApm } from '../tracing.js';

/**
 * Instrument a fetch call with tracing
 * Note: Elastic APM auto-instruments fetch/XHR, but this wrapper allows
 * custom labels and explicit transaction management
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function tracedFetch(url, options = {}) {
    const apm = getApm();
    
    // If APM is not initialized, just use regular fetch
    if (!apm) {
        return fetch(url, options);
    }

    // Elastic APM auto-instruments fetch, but we can add custom labels
    const method = options.method || 'GET';
    const transactionName = `${method} ${new URL(url, window.location.origin).pathname}`;
    
    const transaction = apm.startTransaction?.(transactionName, 'request');
    if (transaction && typeof transaction.addLabels === 'function') {
        transaction.addLabels({
            'http.method': method,
            'http.url': url,
        });
    }

    try {
        const response = await fetch(url, options);
        if (transaction && typeof transaction.addLabels === 'function') {
            transaction.addLabels({
                'http.status_code': response.status,
                'http.status_text': response.statusText,
            });
        }
        return response;
    } catch (error) {
        if (typeof apm.captureError === 'function') {
            apm.captureError(error);
        }
        throw error;
    } finally {
        if (transaction && typeof transaction.end === 'function') {
            transaction.end();
        }
    }
}

/**
 * Create a transaction for a user interaction
 * @param {string} action - Action name (e.g., 'button.click', 'form.submit')
 * @param {Object} labels - Additional labels/attributes
 * @returns {Object} Elastic APM transaction object
 */
export function startInteractionSpan(action, labels = {}) {
    const apm = getApm();
    
    if (!apm) {
        // Return no-op object if APM is not initialized
        return {
            addLabels: () => {},
            setOutcome: () => {},
            end: () => {},
        };
    }
    
    const transaction = apm.startTransaction?.(action, 'user-interaction');
    if (transaction && typeof transaction.addLabels === 'function') {
        transaction.addLabels({
            'user.interaction': true,
            ...labels,
        });
    }
    return transaction || {
        addLabels: () => {},
        setOutcome: () => {},
        end: () => {},
    };
}

/**
 * Track a custom metric/event
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {Object} labels - Additional labels
 */
export function trackCustomMetric(name, value, labels = {}) {
    const apm = getApm();
    
    if (!apm) {
        return;
    }
    
    try {
        if (typeof apm.addLabels === 'function') {
            apm.addLabels({
                [`metric.${name}`]: value,
                ...labels,
            });
        }
        const transaction = apm.startTransaction?.(`Metric: ${name}`, 'custom');
        if (transaction) {
            if (typeof transaction.addLabels === 'function') {
                transaction.addLabels({
                    'metric.name': name,
                    'metric.value': value,
                    ...labels,
                });
            }
            if (typeof transaction.end === 'function') {
                transaction.end();
            }
        }
    } catch (error) {
        console.error('Failed to track custom metric:', error);
    }
}

/**
 * Track a page view
 * @param {string} pageName - Name of the page
 * @param {Object} metadata - Additional metadata
 */
export function trackPageView(pageName, metadata = {}) {
    const apm = getApm();
    
    if (!apm) {
        return;
    }
    
    try {
        const transaction = apm.startTransaction?.(`Page: ${pageName}`, 'page-load');
        if (transaction && typeof transaction.addLabels === 'function') {
            transaction.addLabels({
                'page.name': pageName,
                'page.url': window.location.href,
                'page.path': window.location.pathname,
                ...metadata,
            });
        }
        if (transaction && typeof transaction.end === 'function') {
            setTimeout(() => transaction.end(), 100);
        }
    } catch (error) {
        console.error('Failed to track page view:', error);
    }
}

/**
 * Track a user action/event
 * @param {string} actionName - Name of the action (e.g., 'search', 'click', 'submit')
 * @param {string} element - Element that triggered the action (e.g., 'button', 'form')
 * @param {Object} metadata - Additional metadata
 */
export function trackUserAction(actionName, element, metadata = {}) {
    const apm = getApm();
    
    if (!apm) {
        return;
    }
    
    try {
        if (typeof apm.addLabels === 'function') {
            apm.addLabels({
                'user.action': actionName,
                'user.action.element': element,
                'user.action.timestamp': new Date().toISOString(),
                ...metadata,
            });
        }
        const transaction = apm.startTransaction?.(`Action: ${actionName}`, 'user-action');
        if (transaction) {
            if (typeof transaction.addLabels === 'function') {
                transaction.addLabels({
                    'action.name': actionName,
                    'action.element': element,
                    ...metadata,
                });
            }
            if (typeof transaction.end === 'function') {
                transaction.end();
            }
        }
    } catch (error) {
        console.error('Failed to track user action:', error);
    }
}
