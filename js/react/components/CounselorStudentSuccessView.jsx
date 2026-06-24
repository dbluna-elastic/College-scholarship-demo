/**
 * CounselorStudentSuccessView — Full student success profile (matches Scholarship-Demo2026).
 */

import { useEffect, useState, useMemo } from 'react';
import { getStudentData, getAllStudentsForNavigation } from '../../modules/utils/esqlQueries.js';
import { buildStudentSuccessViewModel } from '../../modules/utils/studentSuccessUtils.js';

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 56;

function RiskGauge({ label, gauge, maxLabel = '/ 100', scaleLabel }) {
    return (
        <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-gray-700 mb-4 text-center">
                {label}
                {scaleLabel && <span className="block text-xs text-gray-500">{scaleLabel}</span>}
            </p>
            <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={GAUGE_CIRCUMFERENCE}
                        strokeDashoffset={gauge.offset}
                        strokeLinecap="round"
                        className={gauge.strokeClass}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{gauge.value}</span>
                    <span className="text-xs text-gray-500">{maxLabel}</span>
                </div>
            </div>
        </div>
    );
}

function NeedBar({ label, amount, percent, barClass = 'bg-blue-600' }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">{label}</span>
                <span className="text-xs font-semibold text-gray-900">{amount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
                <div className={`h-4 rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

function CounselorStudentSuccessView({
    studentName,
    primaryColor,
    onBack,
    onStudentChange,
}) {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchInput, setSearchInput] = useState(studentName || '');
    const [navList, setNavList] = useState([]);
    const [navIndex, setNavIndex] = useState(-1);

    const vm = useMemo(() => buildStudentSuccessViewModel(student), [student]);

    useEffect(() => {
        getAllStudentsForNavigation().then(setNavList).catch(() => setNavList([]));
    }, []);

    useEffect(() => {
        if (!studentName) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        setSearchInput(studentName);

        getStudentData(studentName)
            .then((result) => {
                if (!cancelled) {
                    if (result.found && result.student) {
                        setStudent(result.student);
                    } else {
                        setStudent(null);
                        setError(`Student "${studentName}" not found.`);
                    }
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load student');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [studentName]);

    useEffect(() => {
        if (!navList.length || !studentName) return;
        const idx = navList.findIndex((s) => s.full_name === studentName);
        setNavIndex(idx >= 0 ? idx : -1);
    }, [navList, studentName]);

    const handleSearch = () => {
        const name = searchInput.trim();
        if (name) onStudentChange(name);
    };

    const goPrev = () => {
        if (navIndex > 0) onStudentChange(navList[navIndex - 1].full_name);
    };

    const goNext = () => {
        if (navIndex >= 0 && navIndex < navList.length - 1) onStudentChange(navList[navIndex + 1].full_name);
    };

    const fullName = vm?.hero?.fullName || studentName;

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Back
                        </button>
                        <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>Student Success Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by student name..."
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm w-64"
                        />
                        <button type="button" onClick={goPrev} disabled={navIndex <= 0} className="px-3 py-2 bg-gray-200 rounded-md text-sm disabled:opacity-50">Prev</button>
                        <button type="button" onClick={goNext} disabled={navIndex < 0 || navIndex >= navList.length - 1} className="px-3 py-2 bg-gray-200 rounded-md text-sm disabled:opacity-50">Next</button>
                        <button type="button" onClick={handleSearch} className="px-4 py-2 text-white rounded-md text-sm font-semibold" style={{ backgroundColor: primaryColor }}>Search</button>
                    </div>
                </div>
                <p className="text-sm text-gray-600">
                    {loading ? `Loading ${studentName}…` : error ? error : `Viewing student information for ${fullName}`}
                </p>
            </div>

            {!loading && vm && (
                <div className="space-y-6">
                    {/* Hero Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 border-2 border-gray-300">
                                <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2 className="text-3xl font-bold text-gray-900 mb-1">{vm.hero.fullName}</h2>
                                <p className="text-lg text-gray-700 mb-2">{vm.hero.programText}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>Date of Birth: <span className="font-medium text-gray-900">{vm.hero.dateOfBirth}</span></span>
                                    <span>Age: <span className="font-medium text-gray-900">{vm.hero.age}</span></span>
                                </div>
                                {vm.hero.showFirstGen && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mt-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        First-Generation Student
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><rect x="4" y="11" width="16" height="10" rx="2" />
                                        </svg>
                                        Student ID: <span className="font-medium text-gray-900">{vm.hero.studentId}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                        Phone: <span className="font-medium text-gray-900">{vm.hero.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        Email: <span className="font-medium text-gray-900">{vm.hero.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                        </svg>
                                        Location: <span className="font-medium text-gray-900">{vm.hero.location}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center">
                                    <div className="relative w-20 h-20">
                                        <svg className="transform -rotate-90 w-20 h-20">
                                            <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                            <circle cx="40" cy="40" r="36" stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray="226.19" strokeDashoffset={vm.hero.gpa.offset} strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-xs font-semibold text-gray-900">{vm.hero.gpa.value}</span>
                                            <span className="text-xs text-gray-500">/ 4.0</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-gray-700 mt-1">GPA</p>
                                </div>

                                <div className="flex flex-col min-w-[200px]">
                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                        <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${vm.hero.credits.percent}%` }} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-2">{vm.hero.credits.text}</p>
                                    <div className="space-y-1 text-xs text-gray-600">
                                        <p>Credit Hours Enrolled (Current): <span className="font-medium text-gray-900">{vm.hero.credits.enrolled}</span></p>
                                        {vm.hero.housing && (
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${vm.hero.housing.className}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                                                </svg>
                                                {vm.hero.housing.text}
                                            </div>
                                        )}
                                        {vm.hero.showMilitary && (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold mt-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                                                </svg>
                                                Military
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* The Need Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                        {vm.need.hasBursarHold && (
                            <div className="mb-6 bg-red-600 text-white px-4 py-3 rounded-md flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span className="font-bold text-lg">BURSAR HOLD ACTIVE</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <NeedBar label="Student Annual Income" amount={vm.need.studentIncome.amount} percent={vm.need.studentIncome.percent} />
                                <NeedBar label="Asset Value" amount={vm.need.assetValue.amount} percent={vm.need.assetValue.percent} barClass="bg-purple-600" />
                                {vm.need.unmetNeed && (
                                    <NeedBar label="Unmet Need" amount={vm.need.unmetNeed.amount} percent={vm.need.unmetNeed.percent} barClass="bg-red-300" />
                                )}
                                {vm.need.spouseIncome && (
                                    <NeedBar label="Spouse Annual Income" amount={vm.need.spouseIncome.amount} percent={vm.need.spouseIncome.percent} barClass="bg-blue-500" />
                                )}
                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <p className="text-sm text-gray-600 mb-2">SAI Value</p>
                                <p className={`text-4xl font-bold mb-2 ${vm.need.sai.isNegative ? 'text-green-600' : 'text-gray-900'}`}>
                                    {vm.need.sai.value}
                                </p>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${vm.need.sai.badge.className}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    {vm.need.sai.badge.text}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">Work-Study Eligible:</span>
                                    {vm.need.workStudy.eligible ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <span className="font-medium text-gray-900">No</span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-700">Work-Study Hours Completed</span>
                                        <span className="text-xs font-semibold text-gray-900">{vm.need.workStudy.hoursText}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div className="bg-green-600 h-3 rounded-full" style={{ width: `${vm.need.workStudy.hoursPercent}%` }} />
                                    </div>
                                </div>
                                {vm.need.dependents && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold mt-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        {vm.need.dependents.text}
                                    </div>
                                )}
                                {vm.need.showSpouseEnrolled && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold mt-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                                        </svg>
                                        Spouse Enrolled in College
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* The Risk Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-8">
                            <RiskGauge label="LMS Activity Score (0-100 scale)" gauge={vm.risk.lms} />
                            <RiskGauge label="Email Open Rate (0-100 scale)" gauge={vm.risk.email} />
                            <RiskGauge
                                label="Card Swipes/Wifi"
                                scaleLabel={vm.risk.wifi.scaleLabel}
                                gauge={vm.risk.wifi}
                                maxLabel={vm.risk.wifi.maxLabel}
                            />
                            <div className="bg-white rounded-lg p-4 flex flex-col">
                                <p className="text-sm font-medium text-gray-700 mb-2">Assignments Overdue</p>
                                <p className={`text-5xl font-bold ${vm.risk.assignmentsOverdue.colorClass}`}>{vm.risk.assignmentsOverdue.value}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 flex flex-col">
                                <p className="text-sm font-medium text-gray-700 mb-2">Withdrawal Requests</p>
                                <p className={`text-5xl font-bold ${vm.risk.withdrawalRequests.colorClass}`}>{vm.risk.withdrawalRequests.value}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 flex flex-col">
                                <p className="text-sm font-medium text-gray-700 mb-2">Advisor Meetings</p>
                                <p className={`text-5xl font-bold ${vm.risk.advisorMeetings.colorClass}`}>{vm.risk.advisorMeetings.value}</p>
                            </div>
                            <RiskGauge label="Credit Accumulation Ratio" gauge={vm.risk.creditRatio} maxLabel="/ 1.0" />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default CounselorStudentSuccessView;
