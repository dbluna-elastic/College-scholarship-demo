/**
 * Navigation Module (Vanilla JavaScript)
 * 
 * Example vanilla module that can coexist with React.
 * This demonstrates the hybrid architecture where vanilla modules
 * and React components can work together, sharing the template state.
 */

import { getCurrentTemplate } from '../config/templateEngine.js';

/**
 * Initializes the navigation module
 */
export function initNavigation() {
    console.log('🧭 Navigation module initialized');
    
    // Example: Update navigation based on template
    const template = getCurrentTemplate();
    
    // Listen for template changes
    window.addEventListener('templateChanged', (event) => {
        const newTemplate = event.detail.template;
        updateNavigationForTemplate(newTemplate);
    });
    
    // Initial update
    updateNavigationForTemplate(template);
}

/**
 * Updates navigation styling/content based on template
 * @param {Object} template - Current template object
 */
function updateNavigationForTemplate(template) {
    // Example: Update any navigation elements with template colors
    const navElements = document.querySelectorAll('[data-nav]');
    navElements.forEach(element => {
        if (template.colors) {
            element.style.setProperty('--nav-primary', template.colors.primary);
        }
    });
    
    console.log('🧭 Navigation updated for template:', template.name);
}
