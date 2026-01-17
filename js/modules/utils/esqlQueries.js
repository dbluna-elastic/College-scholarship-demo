/**
 * ESQL Query Helpers
 * 
 * Provides helper functions to build ESQL queries for common operations:
 * - Scholarship search
 * - Student data queries
 * - Analytics queries
 * 
 * All queries are template-aware (can filter by state if template has stateName)
 */

import { fetchESQLQuery } from './elasticApi.js';

/**
 * Search scholarships by various criteria
 * 
 * @param {Object} criteria - Search criteria
 * @param {number} criteria.minAmount - Minimum scholarship amount
 * @param {string} criteria.deadline - Deadline filter (e.g., "2026-12-31")
 * @param {string} criteria.eligibility - Eligibility requirements
 * @param {string} criteria.state - State filter (from template)
 * @param {string} criteria.keyword - Keyword search
 * @param {number} criteria.limit - Result limit (default: 20)
 * @returns {Promise<Object>} Search results
 */
export async function searchScholarships(criteria = {}) {
    const {
        minAmount,
        deadline,
        eligibility,
        state,
        keyword,
        limit = 20,
    } = criteria;

    // Build ESQL query
    let query = 'FROM scholarships';
    const conditions = [];

    if (keyword) {
        conditions.push(`name LIKE "*${keyword}*" OR description LIKE "*${keyword}*"`);
    }

    if (minAmount) {
        conditions.push(`amount >= ${minAmount}`);
    }

    if (deadline) {
        conditions.push(`deadline >= "${deadline}"`);
    }

    if (eligibility) {
        conditions.push(`eligibility LIKE "*${eligibility}*"`);
    }

    if (state) {
        conditions.push(`state == "${state}" OR state == "ALL"`);
    }

    if (conditions.length > 0) {
        query += ` | WHERE ${conditions.join(' AND ')}`;
    }

    query += ` | SORT deadline ASC | LIMIT ${limit}`;

    try {
        const result = await fetchESQLQuery(query);
        return {
            scholarships: result.values || [],
            total: result.values?.length || 0,
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
 * @returns {Promise<Object>} Student data
 */
export async function getStudentData(studentId) {
    if (!studentId) {
        throw new Error('Student ID is required');
    }

    const query = `FROM students | WHERE student_id == "${studentId}" | LIMIT 1`;

    try {
        const result = await fetchESQLQuery(query);
        return {
            student: result.values?.[0] || null,
            found: (result.values?.length || 0) > 0,
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
 * @returns {Promise<Object>} Analytics data
 */
export async function getAnalytics(options = {}) {
    const {
        timeRange = '30d',
        metrics = ['count', 'total_amount'],
        state,
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

    // Build ESQL query
    let query = 'FROM scholarships';
    const conditions = [`created_date >= "${startDateStr}"`];

    if (state) {
        conditions.push(`state == "${state}" OR state == "ALL"`);
    }

    query += ` | WHERE ${conditions.join(' AND ')}`;

    // Add aggregations based on metrics
    const aggregations = [];
    if (metrics.includes('count')) {
        aggregations.push('STATS count = COUNT(*)');
    }
    if (metrics.includes('total_amount')) {
        aggregations.push('STATS total_amount = SUM(amount)');
    }
    if (metrics.includes('avg_amount')) {
        aggregations.push('STATS avg_amount = AVG(amount)');
    }

    if (aggregations.length > 0) {
        query += ` | ${aggregations.join(', ')}`;
    }

    try {
        const result = await fetchESQLQuery(query);
        return {
            analytics: result.values?.[0] || {},
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
