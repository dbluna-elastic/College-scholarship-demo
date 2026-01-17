/**
 * maskValue - Masks sensitive values in logs
 * 
 * Follows Zero-Credentials Policy: never log full API keys or secrets
 * 
 * @param {string} value - The value to mask
 * @param {number} visibleChars - Number of characters to show at start (default: 4)
 * @returns {string} Masked value (e.g., "abcd...")
 */
export function maskValue(value, visibleChars = 4) {
    if (!value || typeof value !== 'string') {
        return '***';
    }
    
    if (value.length <= visibleChars) {
        return '***';
    }
    
    return value.substring(0, visibleChars) + '...';
}
