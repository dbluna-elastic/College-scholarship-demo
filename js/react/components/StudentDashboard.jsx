/**
 * StudentDashboard - Student dashboard page
 * 
 * Displays student's net price estimate and matched scholarships based on their profile.
 */

import { useContext, useState, useEffect } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import { getStudentData, searchScholarshipsWithTemplate } from '../../modules/utils/esqlQueries.js';

function StudentDashboard({ onLogout, campusId }) {
    const template = useContext(TemplateContext);
    
    // State for Net Price Estimate
    const [timePeriod, setTimePeriod] = useState('annual'); // 'total-degree', 'annual', 'monthly'
    
    // State for student data and scholarships
    const [studentProfile, setStudentProfile] = useState(null);
    const [matchedScholarships, setMatchedScholarships] = useState([]);
    const [isLoadingStudent, setIsLoadingStudent] = useState(true);
    const [isLoadingScholarships, setIsLoadingScholarships] = useState(true);
    const [error, setError] = useState(null);

    // Mock data for Net Price Estimate
    const netPriceData = {
        estimatedNetPrice: 23128,
        directCosts: {
            total: 24500,
            tuition: 16608,
            housing: 7892
        },
        indirectCosts: {
            total: 2360,
            books: 588,
            transportation: 732,
            personal: 1040
        },
        costOfAttendance: 26860,
        needBasedAid: {
            total: 3732,
            pellGrant: 933
        },
        grantsAndScholarships: 3732
    };

    // Calculate displayed values based on time period
    const getDisplayValue = (annualValue) => {
        if (timePeriod === 'total-degree') {
            return annualValue * 4; // Assuming 4-year degree
        } else if (timePeriod === 'monthly') {
            return Math.round(annualValue / 12);
        }
        return annualValue;
    };

    const getPeriodLabel = () => {
        if (timePeriod === 'total-degree') return 'Total Degree';
        if (timePeriod === 'monthly') return 'Per Month';
        return 'Per Year';
    };

    // Fetch student data and search for scholarships
    useEffect(() => {
        const fetchStudentData = async () => {
            if (!campusId) {
                setIsLoadingStudent(false);
                setIsLoadingScholarships(false);
                return;
            }

            try {
                setIsLoadingStudent(true);
                setError(null);

                // Fetch student profile
                const studentResult = await getStudentData(campusId);
                if (studentResult.found && studentResult.student) {
                    setStudentProfile(studentResult.student);
                    
                    // Extract major/field of study for scholarship search
                    const major = studentResult.student.major || 
                                  studentResult.student.field_of_study || 
                                  studentResult.student.program || 
                                  'general';
                    
                    // Search for matched scholarships
                    setIsLoadingScholarships(true);
                    try {
                        const scholarshipResult = await searchScholarshipsWithTemplate(
                            template,
                            { keyword: major, size: 10 }
                        );
                        setMatchedScholarships(scholarshipResult.scholarships || []);
                    } catch (scholarshipError) {
                        console.error('Scholarship search error:', scholarshipError);
                        // Continue even if scholarship search fails
                        setMatchedScholarships([]);
                    } finally {
                        setIsLoadingScholarships(false);
                    }
                } else {
                    // Student not found, try default search
                    setIsLoadingScholarships(true);
                    try {
                        const scholarshipResult = await searchScholarshipsWithTemplate(
                            template,
                            { keyword: 'general', size: 10 }
                        );
                        setMatchedScholarships(scholarshipResult.scholarships || []);
                    } catch (scholarshipError) {
                        console.error('Scholarship search error:', scholarshipError);
                        setMatchedScholarships([]);
                    } finally {
                        setIsLoadingScholarships(false);
                    }
                }
            } catch (err) {
                console.error('Student data fetch error:', err);
                setError(err.message || 'Failed to load student data');
                setIsLoadingScholarships(false);
            } finally {
                setIsLoadingStudent(false);
            }
        };

        fetchStudentData();
    }, [campusId, template]);

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    const studentName = studentProfile?.name || 
                       studentProfile?.first_name || 
                       campusId || 
                       'Student';

    return (
        <div className="w-full min-h-screen bg-white">
            {/* 1. Global Header (Top Utility Bar) */}
            <header className="bg-[#1a2332] text-white py-2">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-end items-center gap-4">
                        {/* User Info */}
                        <span className="text-sm">Student Dashboard</span>
                        
                        {/* Logout Button */}
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="px-4 py-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
                            >
                                Logout
                            </button>
                        )}
                        
                        {/* Globe Icon */}
                        <button className="p-1.5 hover:opacity-80 transition-opacity">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. Main Navigation Row */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center">
                            <img
                                src={template.branding.logo}
                                alt={template.branding.institutionName}
                                className="h-12 w-auto"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <span className="text-xl font-bold text-gray-900 hidden">
                                {template.branding.institutionName}
                            </span>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-8">
                            {template.navigation?.links?.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.href}
                                    className="text-gray-900 font-medium hover:text-[var(--primary-color)] transition-colors"
                                    style={{ color: '#1a2332' }}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        {/* Search Bar - Top Right */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm w-40"
                                />
                            </div>
                            
                            {/* Mobile Menu Button */}
                            <button className="md:hidden p-2 text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* 3. Dashboard Content */}
            <section className="py-8 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                            <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-gray-600">
                            Welcome, {studentName}. Below you will find the scholarship opportunities that match your specific FAFSA profile.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Two-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Net Price Estimate */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Net Price Estimate</h2>
                            
                            {/* Toggle Buttons */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setTimePeriod('total-degree')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        timePeriod === 'total-degree'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Total Degree
                                </button>
                                <button
                                    onClick={() => setTimePeriod('annual')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        timePeriod === 'annual'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Annual
                                </button>
                                <button
                                    onClick={() => setTimePeriod('monthly')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        timePeriod === 'monthly'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Monthly
                                </button>
                            </div>

                            {/* Estimated Net Price */}
                            <div className="mb-6">
                                <div className="text-4xl font-bold text-gray-900 mb-2">
                                    ${getDisplayValue(netPriceData.estimatedNetPrice).toLocaleString()} {getPeriodLabel()}
                                </div>
                            </div>

                            {/* Cost Breakdown Cards */}
                            <div className="space-y-4">
                                {/* Direct Costs */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="font-semibold text-gray-900">Direct Costs</h3>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-2">
                                        ${getDisplayValue(netPriceData.directCosts.total).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>Tuition & Fees: ${getDisplayValue(netPriceData.directCosts.tuition).toLocaleString()}</div>
                                        <div>Housing & Food: ${getDisplayValue(netPriceData.directCosts.housing).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Indirect Costs */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <h3 className="font-semibold text-gray-900">Indirect Costs</h3>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-2">
                                        ${getDisplayValue(netPriceData.indirectCosts.total).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>Books & Supplies: ${getDisplayValue(netPriceData.indirectCosts.books).toLocaleString()}</div>
                                        <div>Transportation: ${getDisplayValue(netPriceData.indirectCosts.transportation).toLocaleString()}</div>
                                        <div>Personal Expenses: ${getDisplayValue(netPriceData.indirectCosts.personal).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Cost of Attendance */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="font-semibold text-gray-900">Cost of Attendance</h3>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        ${getDisplayValue(netPriceData.costOfAttendance).toLocaleString()}
                                    </div>
                                </div>

                                {/* Need-Based Aid */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <h3 className="font-semibold text-gray-900">Need-Based Aid</h3>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-2">
                                        ${getDisplayValue(netPriceData.needBasedAid.total).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Federal Pell Grant: ${getDisplayValue(netPriceData.needBasedAid.pellGrant).toLocaleString()}
                                    </div>
                                </div>

                                {/* Grants & Scholarships */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="font-semibold text-gray-900">Grants & Scholarships</h3>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        ${getDisplayValue(netPriceData.grantsAndScholarships).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Matched Scholarships */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Matched Scholarships</h2>
                                <button
                                    className="px-4 py-2 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: template.colors.primary || '#5D5FEF' }}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Chat with a Virtual Counselor
                                    </span>
                                </button>
                            </div>
                            
                            <p className="text-gray-600 mb-6">
                                Based on your academic profile and financial need...
                            </p>

                            {/* Loading State */}
                            {isLoadingScholarships ? (
                                <div className="text-center py-12">
                                    <div className="inline-flex gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <p className="mt-4 text-gray-600">Loading matched scholarships...</p>
                                </div>
                            ) : matchedScholarships.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <p className="text-gray-600">No matched scholarships found.</p>
                                    <p className="text-sm text-gray-500 mt-2">Try updating your profile or search manually.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                    {matchedScholarships.map((scholarship, index) => (
                                        <div
                                            key={scholarship.id || index}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                                            Scholarship
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                        {scholarship.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Award Amount:</span>
                                                    <span className="ml-2 font-semibold text-gray-900">
                                                        {scholarship.amount === 'N/A' || !scholarship.amount 
                                                            ? 'Varies' 
                                                            : typeof scholarship.amount === 'number'
                                                            ? `$${scholarship.amount.toLocaleString()}`
                                                            : scholarship.amount}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Deadline:</span>
                                                    <span className="ml-2 font-semibold text-gray-900">
                                                        {scholarship.deadline === 'N/A' || !scholarship.deadline
                                                            ? 'TBD'
                                                            : scholarship.deadline}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    className="flex-1 px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                                                    style={{ backgroundColor: template.colors.primary || '#5D5FEF' }}
                                                >
                                                    Apply Now
                                                </button>
                                                <button
                                                    className="px-4 py-2 rounded-full text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                                >
                                                    View Scholarship
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Footer */}
            <footer className="bg-[#1a2332] text-white">
                <div className="border-t border-gray-700"></div>
                
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Column 1: University Info */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">
                                {template.branding.institutionName}
                            </h3>
                            <p className="text-gray-300 text-sm mb-2">
                                {template.footer?.address || '123 University Avenue, City, State 12345'}
                            </p>
                            <p className="text-gray-300 text-sm">
                                {template.footer?.phone || '(555) 123-4567'}
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                {template.footer?.quickLinks?.map((link, index) => (
                                    <li key={index}>
                                        <a
                                            href={link.href}
                                            className="text-gray-300 text-sm hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 3: Connect */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Connect</h3>
                            <div className="flex gap-4">
                                {template.footer?.socialMedia?.map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.href}
                                        className="text-gray-300 hover:text-white transition-colors font-semibold"
                                        aria-label={social.label}
                                    >
                                        {social.platform}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <p className="text-center text-gray-400 text-sm">
                            © 2026 {template.branding.institutionName}. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Chat Widget - Floating */}
            <ChatWidget floating={true} />
        </div>
    );
}

export default StudentDashboard;
