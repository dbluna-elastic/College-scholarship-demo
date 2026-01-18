/**
 * React App Entry Point
 * 
 * This file mounts the React app into the DOM.
 * It should be imported and called from main.js after vanilla modules are initialized.
 */

import { createRoot } from 'react-dom/client';
import { TemplateProvider } from './context/TemplateContext.jsx';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { getApm } from '../modules/tracing.js';

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
        // Initialize React route tracking if APM is available
        const apm = getApm();
        if (apm) {
            try {
                // Import and initialize React route tracking
                import('@elastic/apm-rum-react').then(({ ApmRoute }) => {
                    // Route tracking will be handled by ApmRoute component in App.jsx
                    console.log('✅ React route tracking enabled');
                }).catch((error) => {
                    console.warn('⚠️ React route tracking not available:', error);
                });
            } catch (error) {
                console.warn('⚠️ Could not initialize React route tracking:', error);
            }
        }

        const root = createRoot(container);
        root.render(
            <ErrorBoundary>
                <TemplateProvider>
                    <App />
                </TemplateProvider>
            </ErrorBoundary>
        );
        console.log('⚛️ React app mounted successfully');
    } catch (error) {
        console.error('❌ React mount error:', error);
    }
}
