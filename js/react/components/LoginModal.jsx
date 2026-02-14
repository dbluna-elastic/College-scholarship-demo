/**
 * LoginModal - Login modal component matching GSU login design
 * 
 * Two-column layout with login form on left and security information on right.
 * Handles authentication based on password (test = student, staff = counselor).
 */

import { useState, useContext } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';

function LoginModal({ isOpen, onClose, onLogin }) {
    const template = useContext(TemplateContext);
    const [campusId, setCampusId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const labels = getSchemaLabels(template);
        if (!campusId.trim() || !password.trim()) {
            setError(`Please enter both ${labels.idLabel} and Password`);
            return;
        }

        if (password === 'test' || password === 'staff') {
            onLogin(campusId, password);
        } else {
            setError(`Invalid password. Use "test" for ${labels.primaryRole} or "staff" for ${labels.staffRole}.`);
        }
    };

    const handleClose = () => {
        setCampusId('');
        setPassword('');
        setError('');
        onClose();
    };

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

                {/* Agency or University Name Header */}
                <div className="text-center py-6 border-b">
                    <h2 
                        className="text-2xl font-bold"
                        style={{
                            fontFamily: 'var(--serif-font)',
                            color: template?.colors?.primary || '#003087',
                        }}
                    >
                        {template?.branding?.institutionName || 'Portal'}
                    </h2>
                </div>

                {/* Two Column Layout */}
                <div className="flex flex-col md:flex-row">
                    {/* Left Panel - Login Form */}
                    <div className="flex-1 p-8 border-r border-gray-200">
                        <div className="border-2 rounded-lg p-6" style={{ borderColor: template?.colors?.primary || '#003087' }}>
                            {/* ID Field (CampusID or Case ID by schema) */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">{getSchemaLabels(template).idLabel}</label>
                                    <a href="#" className="text-sm text-blue-600 hover:underline">Forgot?</a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={campusId}
                                        onChange={(e) => setCampusId(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={getSchemaLabels(template).idPlaceholder}
                                    />
                                    <button
                                        type="button"
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="More options"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <a href="#" className="text-sm text-blue-600 hover:underline">Forgot?</a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="More options"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Login Button */}
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                className="w-full py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity shadow-md"
                                style={{ backgroundColor: template?.colors?.primary || '#003087' }}
                            >
                                Login
                            </button>

                            {/* Disclaimer (schema-based) */}
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                {getSchemaLabels(template).disclaimer}
                            </p>
                        </div>
                    </div>

                    {/* Right Panel - Security Information */}
                    <div className="flex-1 p-8">
                        {/* Secure Your Session */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <h3 className="text-lg font-bold text-gray-900">Secure Your Session</h3>
                            </div>
                            <p className="text-sm text-gray-700 mb-4">
                                {getSchemaLabels(template).secureSessionNote}
                                {' '}
                                <span className="bg-yellow-200 px-1 rounded">official address</span>.
                            </p>
                            <p className="text-sm text-gray-700">
                                To protect your privacy, close your web browser when you are finished with your session.
                            </p>
                        </div>

                        {/* Duo Authentication Box */}
                        <div className="bg-green-600 rounded-lg p-4 text-white">
                            <h4 className="font-semibold mb-2">{getSchemaLabels(template).ssoTitle}</h4>
                            <p className="text-sm">
                                Duo multifactor authentication is required to log into applications that use this single sign-on (SSO) screen.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;
