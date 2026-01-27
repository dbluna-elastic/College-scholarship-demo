/**
 * Template Engine
 * 
 * Manages multi-tenant template switching based on:
 * 1. URL parameter (?template=texas)
 * 2. Subdomain (texas.example.com)
 * 3. Environment variable (TEMPLATE_ID)
 * 4. Default fallback
 * 
 * Makes the current template available globally via window.currentTemplate
 */

import { defaultTemplate } from './templates/default.js';
import { texasTemplate } from './templates/texas.js';
import { oklahomaTemplate } from './templates/oklahoma.js';
import { beauregardTemplate } from './templates/beauregard.js';
import { getEnvVar } from '../modules/utils/getEnvVar.js';

// Template registry
const templates = {
    default: defaultTemplate,
    texas: texasTemplate,
    oklahoma: oklahomaTemplate,
    beauregard: beauregardTemplate,
};

/**
 * Detects which template to use based on multiple strategies
 * @returns {string} Template ID
 */
function detectTemplate() {
    // Strategy 1: URL parameter (?template=texas)
    const urlParams = new URLSearchParams(window.location.search);
    const templateParam = urlParams.get('template');
    if (templateParam && templates[templateParam]) {
        return templateParam;
    }
    
    // Strategy 2: Subdomain (texas.example.com -> texas)
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    if (subdomain && templates[subdomain] && subdomain !== 'www' && subdomain !== 'localhost') {
        return subdomain;
    }
    
    // Strategy 3: Environment variable
    const envTemplate = getEnvVar('TEMPLATE_ID', '');
    if (envTemplate && templates[envTemplate]) {
        return envTemplate;
    }
    
    // Strategy 4: Default fallback
    return 'default';
}

/**
 * Merges template with environment overrides
 * @param {Object} template - Base template object
 * @returns {Object} Template with environment overrides applied
 */
function applyEnvironmentOverrides(template) {
    const overrides = { ...template };
    
    // Override Elastic agent ID if provided via environment
    const envAgentId = getEnvVar('ELASTIC_AGENT_ID', '');
    if (envAgentId) {
        overrides.elastic = {
            ...overrides.elastic,
            agentId: envAgentId,
        };
    }
    
    return overrides;
}

/**
 * Applies template CSS variables to the document
 * @param {Object} template - Template object with colors
 */
function applyTemplateStyles(template) {
    const root = document.documentElement;
    
    // Apply color variables
    if (template.colors) {
        Object.entries(template.colors).forEach(([key, value]) => {
            const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, value);
        });
    }
    
    // Apply typography variables
    if (template.typography) {
        if (template.typography.fontFamily) {
            root.style.setProperty('--font-family', template.typography.fontFamily);
        }
    }
}

/**
 * Initializes the template engine and sets the current template
 * @returns {Object} The active template object
 */
export function initializeTemplateEngine() {
    const templateId = detectTemplate();
    const baseTemplate = templates[templateId] || templates.default;
    const template = applyEnvironmentOverrides(baseTemplate);
    
    // Make template available globally
    window.currentTemplate = template;
    
    // Apply CSS variables
    applyTemplateStyles(template);
    
    // Dispatch custom event for template change
    window.dispatchEvent(new CustomEvent('templateChanged', {
        detail: { template }
    }));
    
    console.log(`🎨 Template Engine initialized: ${template.name} (${template.id})`);
    
    return template;
}

/**
 * Gets the current active template
 * @returns {Object} Current template object
 */
export function getCurrentTemplate() {
    return window.currentTemplate || templates.default;
}

/**
 * Switches to a different template programmatically
 * @param {string} templateId - ID of the template to switch to
 * @returns {Object} The new template object
 */
export function switchTemplate(templateId) {
    if (!templates[templateId]) {
        console.warn(`Template "${templateId}" not found, using default`);
        templateId = 'default';
    }
    
    const baseTemplate = templates[templateId];
    const template = applyEnvironmentOverrides(baseTemplate);
    
    window.currentTemplate = template;
    applyTemplateStyles(template);
    
    window.dispatchEvent(new CustomEvent('templateChanged', {
        detail: { template }
    }));
    
    console.log(`🔄 Template switched to: ${template.name} (${template.id})`);
    
    return template;
}
