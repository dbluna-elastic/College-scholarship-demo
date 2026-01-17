/**
 * AnalyticsDashboard - Analytics display component
 * 
 * Shows charts, graphs, and key metrics for scholarship data.
 * Uses ESQL analytics queries and is template-aware.
 */

import { useState, useEffect } from 'react';
import { getAnalytics } from '../../modules/utils/esqlQueries.js';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { useContext } from 'react';

function AnalyticsDashboard() {
    const template = useContext(TemplateContext);
    const [timeRange, setTimeRange] = useState('30d');
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, [timeRange, template]);

    const loadAnalytics = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const options = {
                timeRange,
                metrics: ['count', 'total_amount', 'avg_amount'],
                state: template?.content?.stateName || undefined,
            };

            const data = await getAnalytics(options);
            setAnalytics(data);
        } catch (err) {
            console.error('Analytics error:', err);
            setError(err.message || 'Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h2
                    className="text-3xl font-bold"
                    style={{
                        fontFamily: 'var(--serif-font)',
                        color: template?.colors?.primary || '#5D5FEF',
                    }}
                >
                    Analytics Dashboard
                </h2>

                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="1y">Last year</option>
                </select>
            </div>

            {template?.content?.stateName && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <strong>Filter:</strong> Showing analytics for {template.content.stateName} residents.
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-flex gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
            ) : analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Count Card */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Total Scholarships</h3>
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{
                                    backgroundColor: `${template?.colors?.primary || '#5D5FEF'}20`,
                                }}
                            >
                                <svg className="w-6 h-6" style={{ color: template?.colors?.primary || '#5D5FEF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {analytics.analytics.count || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">In the last {timeRange}</p>
                    </div>

                    {/* Total Amount Card */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Total Amount</h3>
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{
                                    backgroundColor: `${template?.colors?.primary || '#5D5FEF'}20`,
                                }}
                            >
                                <svg className="w-6 h-6" style={{ color: template?.colors?.primary || '#5D5FEF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            ${(analytics.analytics.total_amount || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">Available funding</p>
                    </div>

                    {/* Average Amount Card */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Average Amount</h3>
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{
                                    backgroundColor: `${template?.colors?.primary || '#5D5FEF'}20`,
                                }}
                            >
                                <svg className="w-6 h-6" style={{ color: template?.colors?.primary || '#5D5FEF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            ${Math.round(analytics.analytics.avg_amount || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">Per scholarship</p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No analytics data available.</p>
                </div>
            )}
        </div>
    );
}

export default AnalyticsDashboard;
