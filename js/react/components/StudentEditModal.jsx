/**
 * StudentEditModal - Modal for editing student information
 * 
 * Displays a form modal matching the student information template with sections for:
 * - Personal Information
 * - Enrollment
 * - Demographics
 * - Household Information
 * - Financial Information
 */

import { useState, useEffect } from 'react';

// US States list for dropdown
const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
];

// Enrollment stages
const ENROLLMENT_STAGES = [
    'Prospective Student',
    'Applied',
    'Accepted',
    'Enrolled',
    'Current Student',
    'Graduated'
];

function StudentEditModal({ isOpen, onClose, studentProfile, studentId, onSave }) {
    // Form state
    const [formData, setFormData] = useState({
        // Personal Information
        first_name: '',
        last_name: '',
        email: '',
        major: '',
        gpa: '',
        
        // Enrollment
        enrollment_stage: '',
        
        // Demographics
        date_of_birth: '',
        citizenship_status: '',
        state_of_residence: '',
        
        // Household Information
        active_duty_veteran: false,
        married: false,
        dependent_children: false,
        sai_known: false,
        
        // Financial Information
        student_income: '',
        cash_assets: false,
    });

    // Validation errors
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Initialize form data from student profile
    useEffect(() => {
        if (studentProfile && isOpen) {
            // Map student data to form fields with fallbacks
            setFormData({
                first_name: studentProfile.first_name || studentProfile.firstName || studentProfile.firstname || '',
                last_name: studentProfile.last_name || studentProfile.lastName || studentProfile.lastname || '',
                email: studentProfile.email || studentProfile.email_address || '',
                major: studentProfile.major || studentProfile.field_of_study || studentProfile.program || '',
                gpa: studentProfile.gpa || studentProfile.grade_point_average || '',
                
                enrollment_stage: studentProfile.enrollment_stage || studentProfile.enrollmentStage || studentProfile.status || '',
                
                date_of_birth: formatDateForInput(studentProfile.date_of_birth || studentProfile.dob || studentProfile.birth_date || ''),
                citizenship_status: studentProfile.citizenship_status || studentProfile.citizenship || studentProfile.citizen_status || '',
                state_of_residence: studentProfile.state_of_residence || studentProfile.state || studentProfile.residence_state || '',
                
                active_duty_veteran: studentProfile.active_duty_veteran || studentProfile.veteran || studentProfile.military_status === 'active' || false,
                married: studentProfile.married || studentProfile.marital_status === 'married' || false,
                dependent_children: studentProfile.dependent_children || studentProfile.dependents || studentProfile.has_dependents || false,
                sai_known: studentProfile.sai_known || studentProfile.fafsa_sai_known || studentProfile.knows_sai || false,
                
                student_income: studentProfile.student_income || studentProfile.income || studentProfile.annual_income || '',
                cash_assets: studentProfile.cash_assets || studentProfile.has_cash_assets || studentProfile.assets || false,
            });
            setErrors({});
            setSaveError('');
            setSaveSuccess(false);
        }
    }, [studentProfile, isOpen]);

    // Format date from various formats to mm/dd/yyyy for input
    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        
        // If already in mm/dd/yyyy format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            return dateStr;
        }
        
        // Try to parse ISO date or other formats
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        }
        
        return '';
    }

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }
        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // GPA validation
        if (formData.gpa && (isNaN(formData.gpa) || parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 4.0)) {
            newErrors.gpa = 'GPA must be between 0.0 and 4.0';
        }

        // Date validation
        if (formData.date_of_birth && !/^\d{2}\/\d{2}\/\d{4}$/.test(formData.date_of_birth)) {
            newErrors.date_of_birth = 'Date must be in mm/dd/yyyy format';
        }

        // Income validation
        if (formData.student_income && (isNaN(formData.student_income) || parseFloat(formData.student_income) < 0)) {
            newErrors.student_income = 'Income must be a non-negative number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveError('');
        setSaveSuccess(false);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            // Prepare data for save (convert empty strings to null for optional fields)
            const dataToSave = {
                ...formData,
                gpa: formData.gpa ? parseFloat(formData.gpa) : null,
                student_income: formData.student_income ? parseFloat(formData.student_income) : null,
                enrollment_stage: formData.enrollment_stage || null,
                date_of_birth: formData.date_of_birth || null,
                citizenship_status: formData.citizenship_status || null,
                state_of_residence: formData.state_of_residence || null,
            };

            await onSave(studentId, dataToSave);
            setSaveSuccess(true);
            
            // Close modal after a brief delay to show success message
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Save error:', error);
            setSaveError(error.message || 'Failed to save student information');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        setErrors({});
        setSaveError('');
        setSaveSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Modal Header */}
                <div className="border-b px-6 py-4">
                    <h2 className="text-2xl font-bold text-gray-900">Student Information</h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Personal Information Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                            errors.first_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="More options"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </div>
                                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                        errors.last_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                                <input
                                    type="text"
                                    name="major"
                                    value={formData.major}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                                <input
                                    type="text"
                                    name="gpa"
                                    value={formData.gpa}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                        errors.gpa ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {errors.gpa && <p className="text-red-500 text-xs mt-1">{errors.gpa}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Enrollment Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Stage</label>
                            <select
                                name="enrollment_stage"
                                value={formData.enrollment_stage}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select...</option>
                                {ENROLLMENT_STAGES.map(stage => (
                                    <option key={stage} value={stage}>{stage}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Demographics Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        placeholder="mm/dd/yyyy"
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                            errors.date_of_birth ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                    />
                                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship Status</label>
                                <div className="space-y-2">
                                    {['US Citizen', 'Permanent Resident', 'International'].map(status => (
                                        <label key={status} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="citizenship_status"
                                                value={status}
                                                checked={formData.citizenship_status === status}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">{status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State of Residence</label>
                                <select
                                    name="state_of_residence"
                                    value={formData.state_of_residence}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select State...</option>
                                    {US_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Household Information Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Household Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="active_duty_veteran"
                                    checked={formData.active_duty_veteran}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">I am on active duty/veteran</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="married"
                                    checked={formData.married}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">I am married</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="dependent_children"
                                    checked={formData.dependent_children}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">I have dependent children</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="sai_known"
                                    checked={formData.sai_known}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">I know my SAI from FAFSA</span>
                            </label>
                        </div>
                    </div>

                    {/* Family Details / Financial Information Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Details</h3>
                        <div className="mb-4">
                            <h4 className="text-md font-medium text-gray-800 mb-3">Financial Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Student Income ($)</label>
                                    <input
                                        type="text"
                                        name="student_income"
                                        value={formData.student_income}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                            errors.student_income ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                    />
                                    {errors.student_income && <p className="text-red-500 text-xs mt-1">{errors.student_income}</p>}
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="cash_assets"
                                            checked={formData.cash_assets}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">I have cash assets</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    {saveError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                            {saveError}
                        </div>
                    )}
                    {saveSuccess && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                            Student information saved successfully!
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StudentEditModal;
