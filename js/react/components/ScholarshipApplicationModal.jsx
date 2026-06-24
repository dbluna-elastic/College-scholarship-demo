/**
 * ScholarshipApplicationModal — Apply Now flow (Scholarship-Demo2026 scholarships.js).
 */

import { useEffect, useRef, useState } from 'react';

function ScholarshipApplicationModal({
    isOpen,
    onClose,
    scholarshipName,
    scholarshipId,
    studentProfile,
    primaryColor = '#5D5FEF',
    onSubmitted,
}) {
    const [graduationDate, setGraduationDate] = useState('');
    const [facultyReference, setFacultyReference] = useState('');
    const [gpaVerification, setGpaVerification] = useState('');
    const [fileName, setFileName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const firstName = studentProfile?.firstName || '';
    const lastName = studentProfile?.lastName || '';
    const email = studentProfile?.email || '';
    const major = studentProfile?.major || '';

    useEffect(() => {
        if (!isOpen) {
            setGraduationDate('');
            setFacultyReference('');
            setGpaVerification('');
            setFileName('');
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!graduationDate || !facultyReference.trim() || !gpaVerification.trim()) {
            alert('Please fill in all required fields.');
            return;
        }
        if (!fileName) {
            alert('Please upload your essay file.');
            return;
        }
        setSubmitting(true);
        setTimeout(() => {
            onSubmitted?.(scholarshipId);
            setSubmitting(false);
            onClose();
        }, 500);
    };

    const handleFileChange = (file) => {
        if (!file) return;
        const ok = file.type === 'application/pdf'
            || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            || file.name.endsWith('.pdf')
            || file.name.endsWith('.docx');
        if (!ok) {
            alert('Please upload a PDF or DOCX file only.');
            return;
        }
        setFileName(file.name);
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 py-8">
                <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
                <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
                    <div className="px-6 py-4 text-white rounded-t-lg" style={{ backgroundColor: primaryColor }}>
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="text-lg font-bold">
                                Applying for: {scholarshipName}
                            </h3>
                            <button type="button" onClick={onClose} className="text-white hover:opacity-80">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6">
                        <div className="mb-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4">Applicant Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input readOnly value={firstName} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input readOnly value={lastName} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input readOnly value={email} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Major</label>
                                    <input readOnly value={major} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700" />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 space-y-4">
                            <h4 className="text-lg font-bold text-gray-900">Required Information</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation Date</label>
                                <input
                                    type="date"
                                    required
                                    value={graduationDate}
                                    onChange={(e) => setGraduationDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Reference Name</label>
                                <input
                                    type="text"
                                    required
                                    value={facultyReference}
                                    onChange={(e) => setFacultyReference(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current GPA Verification</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter your current GPA"
                                    value={gpaVerification}
                                    onChange={(e) => setGpaVerification(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4">Essay Upload</h4>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${fileName ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                                />
                                <p className="text-sm text-gray-600 mb-1">Drag & Drop your Essay here (PDF or DOCX)</p>
                                <p className="text-sm text-gray-500">or click to browse</p>
                                {fileName && <p className="text-sm text-green-600 mt-2 font-semibold">Selected: {fileName}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 text-white rounded-md font-semibold disabled:opacity-60"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {submitting ? 'Submitting…' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ScholarshipApplicationModal;
