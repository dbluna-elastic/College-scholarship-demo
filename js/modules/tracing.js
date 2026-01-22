/**
 * Elastic APM RUM (Real User Monitoring) Initialization
 * 
 * Sets up distributed tracing for the application using Elastic APM.
 * Traces are sent directly to the Elastic APM server.
 */

import { init as initApm } from '@elastic/apm-rum';
import { getEnvVar } from './utils/getEnvVar.js';
import { getCurrentTemplate } from '../config/templateEngine.js';

let apm = null;

/**
 * Initialize Elastic APM RUM
 */
export function initTracing() {
    try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            console.warn('Tracing: Not in browser environment, skipping initialization');
            return;
        }

        // Get APM server URL from environment
        const apmServerUrl = getEnvVar('ELASTIC_APM_SERVER_URL', '');
        if (!apmServerUrl) {
            console.warn('Tracing: ELASTIC_APM_SERVER_URL not set, skipping APM initialization');
            return;
        }

        // Get authentication (API key or secret token)
        const apiKey = getEnvVar('ELASTIC_APM_API_KEY', '');
        const secretToken = getEnvVar('ELASTIC_APM_SECRET_TOKEN', '');
        
        // Get template for service name, with fallback if template is not available
        let serviceName = getEnvVar('ELASTIC_APM_SERVICE_NAME', 'Scholarshipdemo');
        try {
            const template = getCurrentTemplate();
            serviceName = template?.branding?.institutionName || serviceName;
        } catch (templateError) {
            console.warn('Tracing: Could not get template, using default service name:', templateError);
        }

        // Initialize Elastic APM RUM with supported configuration options
        apm = initApm({
            // APM Server configuration
            serverUrl: apmServerUrl,
            serviceName: serviceName,
            serviceVersion: '1.0.0',
            environment: 'production',
            
            // Authentication - use secretToken (apiKey is not a valid option in v5.17.0)
            ...(secretToken && { secretToken }),
            
            // Performance monitoring
            transactionSampleRate: 1.0, // Sample 100% of transactions (adjust as needed)
            centralConfig: false, // Disable central config for now
            
            // Auto-instrumentation
            instrument: true, // Auto-instrument fetch, XHR, etc.
            disableInstrumentations: [], // Don't disable any auto-instrumentation
            
            // Distributed tracing
            distributedTracingOrigins: [
                window.location.origin, // Allow tracing to same origin
                // Add other origins if needed for CORS
            ],
        });

        console.log('✅ Elastic APM RUM initialized:', {
            serviceName,
            serverUrl: apmServerUrl,
        });
    } catch (error) {
        console.error('❌ Elastic APM RUM initialization failed:', error);
        // Don't throw - allow application to continue without tracing
        apm = null;
    }
}

/**
 * Get the APM instance
 * @returns {Object} Elastic APM instance or null
 */
export function getApm() {
    return apm;
}

/**
 * Get the tracer instance (for backward compatibility)
 * @param {string} name - Tracer name (not used in Elastic APM, but kept for compatibility)
 * @returns {Object} APM instance or no-op tracer
 */
export function getTracer(name = 'scholarship-demo') {
    if (!apm) {
        console.warn('Tracing: APM not initialized, returning no-op tracer');
        return {
            startSpan: () => ({
                setAttribute: () => {},
                setStatus: () => {},
                end: () => {},
            }),
        };
    }
    
    // Return APM instance for custom transactions/spans
    return apm;
}

/**
 * Set user context for RUM tracking
 * @param {Object} userContext - User information
 * @param {string} userContext.id - User ID (e.g., campus ID)
 * @param {string} userContext.username - Username
 * @param {string} userContext.email - User email (optional)
 * @param {string} userContext.role - User role (e.g., 'student', 'counselor')
 */
export function setUserContext(userContext) {
    if (!apm) {
        console.warn('Tracing: APM not initialized, cannot set user context');
        return;
    }
    
    try {
        apm.setUserContext({
            id: userContext.id || userContext.username || 'anonymous',
            username: userContext.username || userContext.id || 'anonymous',
            email: userContext.email,
        });
        
        // Add role as custom label
        if (userContext.role) {
            apm.addLabels({
                'user.role': userContext.role,
            });
        }
        
        console.log('✅ User context set for RUM:', {
            id: userContext.id || userContext.username,
            role: userContext.role,
        });
    } catch (error) {
        console.error('❌ Failed to set user context:', error);
    }
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
    if (!apm) {
        return;
    }
    
    try {
        apm.setUserContext({});
        console.log('✅ User context cleared');
    } catch (error) {
        console.error('❌ Failed to clear user context:', error);
    }
}

/**
 * Add custom labels/context to current transaction
 * @param {Object} labels - Key-value pairs of labels
 */
export function addCustomContext(labels) {
    if (!apm) {
        return;
    }
    
    try {
        apm.addLabels(labels);
    } catch (error) {
        console.error('❌ Failed to add custom context:', error);
    }
}
