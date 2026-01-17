/**
 * Elasticsearch Query Helpers
 * 
 * Provides helper functions to build Elasticsearch queries for common operations:
 * - Scholarship search (using RRF - Reciprocal Rank Fusion)
 * - Student data queries
 * - Analytics queries
 * 
 * All queries are template-aware (can filter by state if template has stateName)
 */

import { fetchElasticsearchSearch } from './elasticApi.js';

/**
 * Search scholarships by major/keyword using RRF (Reciprocal Rank Fusion)
 * 
 * @param {Object} criteria - Search criteria
 * @param {string} criteria.keyword - Search keyword (major, field of study, etc.)
 * @param {string} criteria.index - Elasticsearch index (default: 'scholarship_index_elser')
 * @param {number} criteria.size - Result limit (default: 50)
 * @returns {Promise<Object>} Search results with mapped scholarship data
 */
export async function searchScholarships(criteria = {}) {
    const {
        keyword = '',
        index = 'scholarship_index_elser',
        size = 50,
    } = criteria;

    if (!keyword || keyword.trim() === '') {
        return {
            scholarships: [],
            total: 0,
        };
    }

    // Build RRF query structure
    const queryBody = {
        retriever: {
            rrf: {
                retrievers: [
                    {
                        standard: {
                            query: {
                                multi_match: {
                                    query: keyword,
                                    fields: ['title', 'award', 'headings'],
                                },
                            },
                        },
                    },
                    {
                        standard: {
                            query: {
                                semantic: {
                                    field: 'scholarship_name',
                                    query: keyword,
                                },
                            },
                        },
                    },
                    {
                        standard: {
                            query: {
                                semantic: {
                                    field: 'purpose',
                                    query: keyword,
                                },
                            },
                        },
                    },
                    {
                        standard: {
                            query: {
                                semantic: {
                                    field: 'scholarship_criteria',
                                    query: keyword,
                                },
                            },
                        },
                    },
                ],
                rank_window_size: 100,
                rank_constant: 60,
            },
        },
        size: size,
        _source: ['scholarship_name', 'award', 'deadline', 'title', 'amount', 'url'],
    };

    try {
        const result = await fetchElasticsearchSearch(index, queryBody);
        
        // Map Elasticsearch hits to scholarship objects
        const scholarships = (result.hits?.hits || [])
            .map((hit) => {
                const source = hit._source || {};
                const name = source.scholarship_name || source.title || 'Unknown Scholarship';
                
                // Filter out scholarships with names > 200 characters
                if (name.length > 200) {
                    return null;
                }
                
                return {
                    id: hit._id,
                    name: name,
                    amount: source.award || source.amount || 'N/A',
                    deadline: source.deadline || 'N/A',
                    url: source.url || null,
                    title: source.title,
                    award: source.award,
                    score: hit._score,
                };
            })
            .filter((scholarship) => scholarship !== null); // Remove filtered items

        return {
            scholarships,
            total: result.hits?.total?.value || result.hits?.total || 0,
        };
    } catch (error) {
        console.error('Scholarship search error:', error);
        throw error;
    }
}

/**
 * Get student/application data
 * 
 * @param {string} studentId - Student ID
 * @param {string} index - Elasticsearch index (default: 'student_applications')
 * @returns {Promise<Object>} Student data
 */
export async function getStudentData(studentId, index = 'student_applications') {
    if (!studentId) {
        throw new Error('Student ID is required');
    }

    const queryBody = {
        query: {
            term: {
                student_id: studentId,
            },
        },
        size: 1,
    };

    try {
        const result = await fetchElasticsearchSearch(index, queryBody);
        const hits = result.hits?.hits || [];
        return {
            student: hits[0]?._source || null,
            found: hits.length > 0,
        };
    } catch (error) {
        console.error('Student data query error:', error);
        throw error;
    }
}

/**
 * Get analytics and reporting data
 * 
 * @param {Object} options - Analytics options
 * @param {string} options.timeRange - Time range (e.g., "30d", "1y")
 * @param {string[]} options.metrics - Metrics to calculate
 * @param {string} options.state - Optional state filter
 * @param {string} options.index - Elasticsearch index (default: 'scholarship_index_elser')
 * @returns {Promise<Object>} Analytics data
 */
export async function getAnalytics(options = {}) {
    const {
        timeRange = '30d',
        metrics = ['count', 'total_amount'],
        state,
        index = 'scholarship_index_elser',
    } = options;

    // Build time filter
    const now = new Date();
    let startDate;
    if (timeRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '1y') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    // Build query with filters
    const mustClauses = [
        {
            range: {
                created_date: {
                    gte: startDateStr,
                },
            },
        },
    ];

    if (state) {
        mustClauses.push({
            bool: {
                should: [
                    { term: { state: state } },
                    { term: { state: 'ALL' } },
                ],
            },
        });
    }

    // Build aggregations
    const aggs = {};
    if (metrics.includes('count')) {
        aggs.total_scholarships = { value_count: { field: '_id' } };
    }
    if (metrics.includes('total_amount')) {
        aggs.total_amount_awarded = { sum: { field: 'amount' } };
    }
    if (metrics.includes('avg_amount')) {
        aggs.average_amount = { avg: { field: 'amount' } };
    }

    const queryBody = {
        query: {
            bool: {
                must: mustClauses,
            },
        },
        size: 0, // We only want aggregations
        aggs: Object.keys(aggs).length > 0 ? aggs : undefined,
    };

    try {
        const result = await fetchElasticsearchSearch(index, queryBody);
        const aggregations = result.aggregations || {};
        
        return {
            analytics: {
                total_scholarships: aggregations.total_scholarships?.value || 0,
                total_amount_awarded: aggregations.total_amount_awarded?.value || 0,
                average_amount: aggregations.average_amount?.value || 0,
            },
            timeRange,
            metrics,
        };
    } catch (error) {
        console.error('Analytics query error:', error);
        throw error;
    }
}

/**
 * Template-aware scholarship search
 * Uses template state if available
 * 
 * @param {Object} template - Current template object
 * @param {Object} criteria - Search criteria (merged with template state)
 * @returns {Promise<Object>} Search results
 */
export async function searchScholarshipsWithTemplate(template, criteria = {}) {
    const templateCriteria = { ...criteria };

    // Add state filter from template if available
    if (template?.content?.stateName) {
        templateCriteria.state = template.content.stateName;
    }

    return searchScholarships(templateCriteria);
}
