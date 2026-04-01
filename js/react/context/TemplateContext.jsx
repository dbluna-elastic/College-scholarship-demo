/**
 * Template Context
 * 
 * Provides template state to React components.
 * The template is initialized by vanilla JavaScript in main.js
 * and made available to React via this context.
 * Listens for `templateChanged` so programmatic switches (e.g. template switcher) re-render React.
 */

import { createContext, useEffect, useState } from 'react';
import { getCurrentTemplate } from '../../config/templateEngine.js';

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
 * Uses getCurrentTemplate() so context value is never null (falls back to default template).
 */
export function TemplateProvider({ children }) {
    const [template, setTemplate] = useState(() => getCurrentTemplate());

    useEffect(() => {
        const onTemplateChanged = (e) => {
            if (e.detail?.template) setTemplate(e.detail.template);
        };
        window.addEventListener('templateChanged', onTemplateChanged);
        return () => window.removeEventListener('templateChanged', onTemplateChanged);
    }, []);

    return (
        <TemplateContext.Provider value={template}>
            {children}
        </TemplateContext.Provider>
    );
}
