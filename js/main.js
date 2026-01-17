/**
 * Main entry point for the application
 * 
 * Phase 3: Hybrid Vanilla/React Architecture
 * 
 * Initialization order:
 * 1. Template Engine (vanilla) - sets up branding/theme
 * 2. Vanilla Modules - initialize any vanilla JS modules
 * 3. React App - mount React components with template context
 */

import { getEnvVar } from './modules/utils/getEnvVar.js';
import { initializeTemplateEngine, getCurrentTemplate } from './config/templateEngine.js';
import { initNavigation } from './modules/navigation.js';
import { initAnalytics } from './modules/analytics.js';
import { mountReactApp } from './react/index.jsx';

console.log('🚀 Application initialized');

/**
 * Initialize the application in the correct order
 */
async function initializeApp() {
    // Step 1: Initialize template engine (must happen first)
    const template = initializeTemplateEngine();
    console.log('✅ Template engine initialized:', template.name);

    // Step 2: Update page title
    document.title = template.branding.institutionName;

    // Step 3: Initialize vanilla modules
    initNavigation();
    initAnalytics();
    console.log('✅ Vanilla modules initialized');

    // Step 4: Wait for DOM to be ready, then mount React
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountReact);
    } else {
        mountReact();
    }
}

/**
 * Mounts the React app to the DOM
 */
function mountReact() {
    const container = document.getElementById('app');
    if (!container) {
        console.error('❌ React mount failed: #app element not found');
        return;
    }

    // Clear any existing content (like the loading template)
    container.innerHTML = '';

    // Mount React app
    mountReactApp(container);
}

/**
 * Listen for template changes and update React if needed
 */
window.addEventListener('templateChanged', (event) => {
    const newTemplate = event.detail.template;
    console.log('🔄 Template changed:', newTemplate.name);
    
    // Update page title
    document.title = newTemplate.branding.institutionName;
    
    // React will automatically re-render if using context properly
    // Vanilla modules are already listening via their own event handlers
});

// Start the application
initializeApp();

// Test getEnvVar helper (for debugging)
const apiKey = getEnvVar('ELASTIC_API_KEY', '');
console.log('Environment check:', {
    hasApiKey: !!apiKey,
    // Never log the actual key value
});
