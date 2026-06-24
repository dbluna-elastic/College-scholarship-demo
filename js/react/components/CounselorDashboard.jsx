/**
 * CounselorDashboard — Staff dashboard matching Scholarship-Demo2026 counselor tools.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';
import ChatWidget from './ChatWidget.jsx';
import ChatHistoryModal from './ChatHistoryModal.jsx';
import CounselorStudentSuccessView from './CounselorStudentSuccessView.jsx';
import {
    searchHighPriorityStudents,
    searchPrimeScholarshipCandidates,
    searchCriticalRiskStudents,
    getRandomStudents,
} from '../../modules/utils/esqlQueries.js';
import {
    sortHighPriorityStudents,
    riskBadgeClass,
    deriveLastLmsLogin,
    deriveAcademicAlert,
    deriveFinancialStatus,
    UNCLAIMED_SCHOLARSHIPS,
    APPROACHING_DEADLINES,
    APPOINTMENT_CALENDAR,
} from '../../modules/utils/counselorDashboardUtils.js';

const DOC_TYPES = ['Letter of Rec', 'Transcript', 'FAFSA'];

function CounselorDashboard({ onLogout }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const primaryColor = template?.colors?.primary || '#5D5FEF';

    const [view, setView] = useState('dashboard');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [chatHistoryStudent, setChatHistoryStudent] = useState(null);

    const [highPriority, setHighPriority] = useState([]);
    const [highPriorityLoading, setHighPriorityLoading] = useState(true);
    const [highPriorityError, setHighPriorityError] = useState(null);

    const [primeCandidates, setPrimeCandidates] = useState([]);
    const [primeLoading, setPrimeLoading] = useState(true);

    const [criticalStudents, setCriticalStudents] = useState([]);
    const [criticalLoading, setCriticalLoading] = useState(true);

    const [docQueue, setDocQueue] = useState([]);
    const [docLoading, setDocLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setHighPriorityLoading(true);
        searchHighPriorityStudents()
            .then((rows) => {
                if (!cancelled) {
                    setHighPriority(sortHighPriorityStudents(rows));
                    setHighPriorityLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setHighPriorityError(err?.message || 'Failed to load');
                    setHighPriorityLoading(false);
                }
            });

        searchPrimeScholarshipCandidates().then((rows) => {
            if (!cancelled) {
                setPrimeCandidates(rows);
                setPrimeLoading(false);
            }
        }).catch(() => { if (!cancelled) setPrimeLoading(false); });

        searchCriticalRiskStudents().then((rows) => {
            if (!cancelled) {
                setCriticalStudents(rows);
                setCriticalLoading(false);
            }
        }).catch(() => { if (!cancelled) setCriticalLoading(false); });

        getRandomStudents(3).then((rows) => {
            if (!cancelled) {
                setDocQueue(rows);
                setDocLoading(false);
            }
        }).catch(() => { if (!cancelled) setDocLoading(false); });

        return () => { cancelled = true; };
    }, []);

    const openStudent = (name) => {
        setSelectedStudent(name);
        setView('student-success');
    };

    if (!template) {
        return <div className="text-center p-8"><p className="text-gray-600">Loading template...</p></div>;
    }

    if (view === 'student-success' && selectedStudent) {
        return (
            <div className="w-full min-h-screen bg-gray-50" style={{ fontFamily: template?.typography?.fontFamily }}>
                <CounselorStudentSuccessView
                    studentName={selectedStudent}
                    primaryColor={primaryColor}
                    onBack={() => setView('dashboard')}
                    onStudentChange={(name) => setSelectedStudent(name)}
                />
                <ChatWidget floating />
                {chatHistoryStudent && (
                    <ChatHistoryModal studentName={chatHistoryStudent} onClose={() => setChatHistoryStudent(null)} />
                )}
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50" style={{ fontFamily: template?.typography?.fontFamily }}>
            <header className="bg-[#1a2332] text-white py-2">
                <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-4">
                    <span className="text-sm">{schemaLabels.dashboardStaff}</span>
                    {onLogout && (
                        <button type="button" onClick={onLogout} className="px-4 py-1.5 text-sm font-medium hover:opacity-80">Logout</button>
                    )}
                </div>
            </header>

            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
                    <img src={template.branding?.logo} alt={template.branding?.institutionName} className="h-12 w-auto" onError={(e) => { e.target.style.display = 'none'; }} />
                    <div className="hidden md:flex items-center gap-8">
                        {template.navigation?.links?.slice(0, 6).map((link, i) => (
                            <a key={i} href={link.href} className="text-gray-900 font-medium hover:opacity-80">{link.label}</a>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>{schemaLabels.dashboardStaff}</h1>
                    <p className="text-sm text-gray-600">Welcome to the counselor dashboard. Review high-priority students, documents, and scholarship pipeline.</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">High-Priority Student List</h2>
                    <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Student Name / ID</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Risk Level</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Last LMS Login</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Academic Alert</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Financial Status</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {highPriorityLoading ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
                                ) : highPriorityError ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-red-600">{highPriorityError}</td></tr>
                                ) : highPriority.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No high-priority students found</td></tr>
                                ) : (
                                    highPriority.map((student) => {
                                        const name = student.full_name || 'Unknown';
                                        const login = deriveLastLmsLogin(student);
                                        return (
                                            <tr key={name} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <button type="button" onClick={() => openStudent(name)} className="font-medium text-gray-900 hover:text-blue-600 hover:underline text-left">
                                                        {name}
                                                    </button>
                                                    <div className="text-xs text-gray-500">#{student.student_id || student.campus_id || '—'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${riskBadgeClass(student.risk_label)}`}>
                                                        {student.risk_label || '—'}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 ${login.highlight ? 'bg-red-50' : ''}`}>{login.text}</td>
                                                <td className="px-4 py-3">{deriveAcademicAlert(student)}</td>
                                                <td className="px-4 py-3">{deriveFinancialStatus(student)}</td>
                                                <td className="px-4 py-3">
                                                    <button type="button" onClick={() => openStudent(name)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">View Profile</button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Total Scholarships Awarded YTD:</h3>
                        <p className="text-4xl font-bold text-green-600">$222,300</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Overall FAFSA Completion <span className="text-blue-600">78%</span></h3>
                        <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                            <div className="bg-blue-600 h-3 rounded-full" style={{ width: '78%' }} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Total Scholarship Applications Submitted:</h3>
                        <p className="text-4xl font-bold" style={{ color: primaryColor }}>1,250</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Document Request Queue</h3>
                        {docLoading ? <p className="text-xs text-gray-500">Loading…</p> : (
                            <div className="space-y-2">
                                {docQueue.map((row, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-1 h-8 bg-yellow-500 rounded" />
                                        <p className="text-xs text-gray-900 flex-1">
                                            {DOC_TYPES[i] || 'Document'} —
                                            <button type="button" onClick={() => openStudent(row.full_name)} className="hover:text-blue-600 hover:underline ml-1">{row.full_name}</button>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Approaching Deadlines</h3>
                        <div className="space-y-2">
                            {APPROACHING_DEADLINES.map((line) => (
                                <div key={line} className="flex items-center gap-2">
                                    <div className="w-1 h-8 bg-red-500 rounded" />
                                    <p className="text-xs text-gray-900">{line}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Appointment Calendar</h3>
                        <div className="space-y-3">
                            {APPOINTMENT_CALENDAR.map((slot) => (
                                <div key={slot.time} className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-medium text-gray-700">{slot.time}</p>
                                        <button type="button" onClick={() => openStudent(slot.name)} className="text-xs font-medium text-gray-900 hover:text-blue-600 hover:underline">{slot.name}</button>
                                        <p className="text-xs text-gray-500">from virtual counselor</p>
                                    </div>
                                    <button type="button" onClick={() => setChatHistoryStudent(slot.name)} className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700" title="View Chat History">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">At Risk Students (Zero Activity)</h3>
                        {criticalLoading ? <p className="text-xs text-gray-500">Loading…</p> : (
                            <div className="space-y-1.5">
                                {criticalStudents.map((s) => (
                                    <div key={s.full_name} className="flex justify-between items-center">
                                        <button type="button" onClick={() => openStudent(s.full_name)} className="text-xs text-gray-900 hover:text-blue-600 hover:underline">{s.full_name}</button>
                                        <span className="text-xs font-semibold text-red-600">{Math.round(Number(s.risk_score_normalized ?? 0))}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Unclaimed Scholarships Expiring Soon</h3>
                        <div className="space-y-2">
                            {UNCLAIMED_SCHOLARSHIPS.map((sch) => (
                                <div key={sch.name} className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-semibold">{sch.initials}</div>
                                    <div>
                                        <p className="text-xs text-gray-900">{sch.name} — {sch.amount}</p>
                                        <p className="text-xs text-gray-500">Expires in {sch.daysUntilExpiry} days</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Scholarship Application Status</h3>
                        <div className="space-y-2 text-xs">
                            {[
                                { label: 'Submitted', count: 1250, pct: 100, color: 'bg-blue-500' },
                                { label: 'In Progress', count: 720, pct: 58, color: 'bg-blue-600' },
                                { label: 'Awarded', count: 247, pct: 20, color: 'bg-green-600' },
                                { label: 'Denied', count: 283, pct: 23, color: 'bg-red-600' },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center gap-2">
                                    <span className="w-20 text-gray-600">{row.label}</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                                        <div className={`${row.color} h-4 rounded-full`} style={{ width: `${row.pct}%` }} />
                                    </div>
                                    <span className="w-12 text-right font-semibold">{row.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Prime Scholarship Candidates</h3>
                        {primeLoading ? <p className="text-xs text-gray-500">Loading…</p> : (
                            <div className="space-y-2">
                                {primeCandidates.map((c, i) => {
                                    const initials = (c.full_name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <div key={c.full_name || i} className="flex items-start gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-semibold">{initials}</div>
                                            <div>
                                                <button type="button" onClick={() => openStudent(c.full_name)} className="text-xs text-gray-900 hover:text-blue-600 hover:underline">{c.full_name}</button>
                                                <p className="text-xs text-gray-500">SAI: {c.sai_value ?? '—'} | LMS: {c.lms_activity_score ?? '—'} | GPA: {c.cumulative_gpa ?? '—'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ChatWidget floating />
            {chatHistoryStudent && (
                <ChatHistoryModal studentName={chatHistoryStudent} onClose={() => setChatHistoryStudent(null)} />
            )}
        </div>
    );
}

export default CounselorDashboard;
