/**
 * React Error Boundary with Elastic APM RUM Error Tracking
 * 
 * Catches React component errors and reports them to Elastic APM
 */

import { Component } from 'react';
import { getApm } from '../../modules/tracing.js';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        try {
            const apm = getApm();
            if (apm) {
                try {
                    if (typeof apm.captureError === 'function') {
                        apm.captureError(error, {
                            tags: {
                                errorBoundary: true,
                                componentStack: errorInfo.componentStack,
                            },
                            custom: {
                                componentStack: errorInfo.componentStack,
                                errorInfo: errorInfo,
                            },
                        });
                    }
                    if (typeof apm.addLabels === 'function') {
                        apm.addLabels({
                            'error.type': 'react_error_boundary',
                            'error.component': errorInfo.componentStack?.split('\n')[0] || 'unknown',
                        });
                    }
                } catch (apmError) {
                    console.error('Failed to report error to APM:', apmError);
                }
            }
        } catch (tracingError) {
            console.error('Error in error boundary (tracing):', tracingError);
        }
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const showErrorDetail = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true
                || (typeof window !== 'undefined' && window.location.search.includes('showError=1'));
            const error = this.state.error;

            return this.props.fallback || (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <svg className="w-12 h-12 text-red-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            {showErrorDetail && error
                                ? error.message || String(error)
                                : "We're sorry, but something unexpected happened. The error has been reported and we're working on fixing it."}
                        </p>
                        {showErrorDetail && error?.stack && (
                            <pre className="text-left text-xs text-gray-500 mb-4 p-3 bg-gray-100 rounded overflow-auto max-h-32">
                                {error.stack}
                            </pre>
                        )}
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
