/**
 * Analytics Module (Vanilla JavaScript)
 * 
 * Example vanilla module for tracking and analytics.
 * This module can track template usage and user interactions
 * while coexisting with React components.
 */

import { getCurrentTemplate } from '../config/templateEngine.js';

/**
 * Initializes the analytics module
 */
export function initAnalytics() {
    console.log('📊 Analytics module initialized');
    
    // Track initial template load
    trackTemplateView();
    
    // Listen for template changes
    window.addEventListener('templateChanged', () => {
        trackTemplateView();
    });
}

/**
 * Tracks template view/usage
 */
function trackTemplateView() {
    const template = getCurrentTemplate();
    
    // Example analytics event
    const event = {
        type: 'template_view',
        templateId: template.id,
        templateName: template.name,
        timestamp: new Date().toISOString(),
    };
    
    // In a real app, this would send to your analytics service
    console.log('📊 Analytics event:', event);
    
    // Example: Could send to Elastic via the proxy
    // fetch('/api/elastic/es/_search', { ... })
}
