/**
 * getEnvVar - Safely retrieves environment variables
 * 
 * Checks both window.env (for browser/injected vars) and process.env (for build-time vars)
 * Follows the Zero-Credentials Policy: never hardcodes secrets
 * 
 * @param {string} key - The environment variable key
 * @param {string} defaultValue - Default value if key is not found
 * @returns {string} The environment variable value or default
 */
export function getEnvVar(key, defaultValue = '') {
    // Check window.env first (for runtime injection, e.g., via Docker env vars)
    if (typeof window !== 'undefined' && window.env && window.env[key] !== undefined) {
        return window.env[key];
    }
    
    // Fallback to process.env (for build-time vars in Vite)
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
        return process.env[key];
    }
    
    return defaultValue;
}
