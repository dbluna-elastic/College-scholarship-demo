/**
 * ScholarshipSearch - Search interface for scholarships
 * 
 * Provides search form with filters, results display, and integration
 * with ESQL queries. Template-aware (pre-filters by state if available).
 */

import { useState, useEffect } from 'react';
import { searchScholarshipsWithTemplate } from '../../modules/utils/esqlQueries.js';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { useContext } from 'react';

function ScholarshipSearch() {
    const template = useContext(TemplateContext);
    const [searchCriteria, setSearchCriteria] = useState({
        keyword: '',
        minAmount: '',
        deadline: '',
        eligibility: '',
    });
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const criteria = {
                keyword: searchCriteria.keyword || undefined,
                minAmount: searchCriteria.minAmount ? parseInt(searchCriteria.minAmount) : undefined,
                deadline: searchCriteria.deadline || undefined,
                eligibility: searchCriteria.eligibility || undefined,
            };

            const response = await searchScholarshipsWithTemplate(template, criteria);
            setResults(response.scholarships || []);
        } catch (err) {
            console.error('Search error:', err);
            setError(err.message || 'Failed to search scholarships');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSearchCriteria({
            keyword: '',
            minAmount: '',
            deadline: '',
            eligibility: '',
        });
        setResults([]);
        setError(null);
        setHasSearched(false);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <h2
                className="text-3xl font-bold mb-6"
                style={{
                    fontFamily: 'var(--serif-font)',
                    color: template?.colors?.primary || '#5D5FEF',
                }}
            >
                Search Scholarships
            </h2>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Keyword
                        </label>
                        <input
                            type="text"
                            value={searchCriteria.keyword}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, keyword: e.target.value })}
                            placeholder="Search by name or description..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Amount ($)
                        </label>
                        <input
                            type="number"
                            value={searchCriteria.minAmount}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, minAmount: e.target.value })}
                            placeholder="e.g., 1000"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deadline (YYYY-MM-DD)
                        </label>
                        <input
                            type="date"
                            value={searchCriteria.deadline}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, deadline: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Eligibility
                        </label>
                        <input
                            type="text"
                            value={searchCriteria.eligibility}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, eligibility: e.target.value })}
                            placeholder="e.g., GPA, major, residency"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {template?.content?.stateName && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <strong>Note:</strong> Results are filtered for {template.content.stateName} residents.
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 rounded-full font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        style={{
                            backgroundColor: template?.colors?.primary || '#5D5FEF',
                        }}
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2 rounded-full border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Results */}
            {hasSearched && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">
                        Results {results.length > 0 && `(${results.length})`}
                    </h3>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-flex gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <p className="mt-4 text-gray-600">Searching scholarships...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">No scholarships found matching your criteria.</p>
                            <p className="text-sm text-gray-500 mt-2">Try adjusting your search filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((scholarship, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                                        {scholarship.name || `Scholarship ${index + 1}`}
                                    </h4>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {scholarship.description || 'No description available.'}
                                    </p>
                                    <div className="space-y-2 mb-4">
                                        {scholarship.amount && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold text-gray-700">Amount:</span>
                                                <span className="text-green-600 font-bold">
                                                    ${scholarship.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {scholarship.deadline && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold text-gray-700">Deadline:</span>
                                                <span className="text-gray-600">
                                                    {new Date(scholarship.deadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        {scholarship.state && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold text-gray-700">State:</span>
                                                <span className="text-gray-600">{scholarship.state}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="w-full px-4 py-2 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                                        style={{
                                            backgroundColor: template?.colors?.primary || '#5D5FEF',
                                        }}
                                    >
                                        Learn More
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ScholarshipSearch;
