/**
 * React App Entry Point
 * 
 * This file mounts the React app into the DOM.
 * It should be imported and called from main.js after vanilla modules are initialized.
 */

import { createRoot } from 'react-dom/client';
import { TemplateProvider } from './context/TemplateContext.jsx';
import App from './App.jsx';

/**
 * Mounts the React app to the specified DOM element
 * @param {HTMLElement} container - DOM element to mount React app to
 */
export function mountReactApp(container) {
    if (!container) {
        console.error('❌ React mount failed: container element not found');
        return;
    }

    try {
        const root = createRoot(container);
        root.render(
            <TemplateProvider>
                <App />
            </TemplateProvider>
        );
        console.log('⚛️ React app mounted successfully');
    } catch (error) {
        console.error('❌ React mount error:', error);
    }
}
