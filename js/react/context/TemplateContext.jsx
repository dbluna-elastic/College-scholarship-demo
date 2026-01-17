/**
 * Template Context
 * 
 * Provides template state to React components.
 * The template is initialized by vanilla JavaScript in main.js
 * and made available to React via this context.
 */

import { createContext } from 'react';

/**
 * Template Context
 * 
 * This context provides the current template object to all React components.
 * The template is initialized by the vanilla template engine before React mounts.
 */
export const TemplateContext = createContext(null);

/**
 * Template Provider Component
 * 
 * Wraps the React app and provides template context.
 * The template value comes from window.currentTemplate set by templateEngine.
 */
export function TemplateProvider({ children }) {
    // Get template from global window object (set by templateEngine)
    const template = window.currentTemplate || null;

    return (
        <TemplateContext.Provider value={template}>
            {children}
        </TemplateContext.Provider>
    );
}
