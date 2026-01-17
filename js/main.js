// Main entry point for the application
// This will be expanded in Phase 3 to initialize vanilla modules and mount React app

console.log('🚀 Application initialized');

// Test getEnvVar helper
import { getEnvVar } from './modules/utils/getEnvVar.js';

// Example usage (will be used throughout the app)
const apiKey = getEnvVar('ELASTIC_API_KEY', '');
console.log('Environment check:', {
    hasApiKey: !!apiKey,
    // Never log the actual key value
});
