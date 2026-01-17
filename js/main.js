// Main entry point for the application
// This will be expanded in Phase 3 to initialize vanilla modules and mount React app

import { getEnvVar } from './modules/utils/getEnvVar.js';
import { initializeTemplateEngine, getCurrentTemplate } from './config/templateEngine.js';

console.log('🚀 Application initialized');

// Initialize template engine (must happen early)
const template = initializeTemplateEngine();

// Test getEnvVar helper
const apiKey = getEnvVar('ELASTIC_API_KEY', '');
console.log('Environment check:', {
    hasApiKey: !!apiKey,
    // Never log the actual key value
});

// Apply template content to the page
function applyTemplateToPage() {
    const currentTemplate = getCurrentTemplate();
    
    // Update page title
    document.title = currentTemplate.branding.institutionName;
    
    // Update all data-template attributes
    const templateElements = document.querySelectorAll('[data-template]');
    templateElements.forEach(element => {
        const key = element.getAttribute('data-template');
        // Try common paths: content.key, branding.key, or direct key
        let value = getNestedValue(currentTemplate, `content.${key}`) ||
                   getNestedValue(currentTemplate, `branding.${key}`) ||
                   getNestedValue(currentTemplate, key);
        
        if (value !== undefined && value !== null) {
            element.textContent = value;
        } else {
            console.warn(`Template value not found for key: ${key}`);
        }
    });
    
    // Apply CSS variables are already set by templateEngine
    console.log('✅ Template applied to page:', currentTemplate.name);
}

/**
 * Helper to get nested object values by dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-separated path (e.g., "content.heroTitle")
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Apply template when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTemplateToPage);
} else {
    applyTemplateToPage();
}

// Listen for template changes (useful for dynamic switching)
window.addEventListener('templateChanged', (event) => {
    console.log('Template changed:', event.detail.template.name);
    applyTemplateToPage();
});
