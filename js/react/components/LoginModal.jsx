/**
 * LoginModal - Origin-inspired sign-in modal with template-aware styling.
 *
 * Two-column layout: form on the left, feature highlights on the right.
 * Handles authentication based on password (test = primary role, staff = staff role).
 */

import { useState, useContext } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels, getLoginConfig } from '../../config/schemaConfig.js';

function FloatingInput({ id, label, type = 'text', value, onChange, autoComplete, trailing, accentColor = '#003087' }) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                placeholder=" "
                className="peer w-full rounded-2xl border border-gray-300 bg-white px-4 pb-2.5 pt-6 text-sm text-gray-900 outline-none transition-colors focus:ring-1"
                style={{ '--input-accent': accentColor }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = accentColor;
                    e.currentTarget.style.boxShadow = `0 0 0 1px ${accentColor}`;
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                }}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-4 top-4 origin-left text-xs font-medium uppercase tracking-wide text-gray-500 transition-all peer-focus:top-2 peer-focus:scale-90 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:scale-90"
            >
                {label}
            </label>
            {trailing && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                    {trailing}
                </div>
            )}
        </div>
    );
}

function CheckIcon({ color }) {
    return (
        <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: color, color: '#fff' }}
        >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
        </span>
    );
}

function LoginModal({ isOpen, onClose, onLogin }) {
    const template = useContext(TemplateContext);
    const [campusId, setCampusId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    const labels = getSchemaLabels(template);
    const login = getLoginConfig(template);
    const primary = template?.colors?.primary || '#003087';
    const secondary = template?.colors?.secondary || '#2E7D32';
    const panelTint = `color-mix(in srgb, ${secondary} 18%, white)`;
    const headingFont = template?.typography?.fontFamily || 'var(--serif-font, Georgia, serif)';

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!campusId.trim() || !password.trim()) {
            setError(`Please enter both ${labels.idLabel} and password`);
            return;
        }

        if (password === 'test' || password === 'staff') {
            onLogin(campusId, password);
        } else {
            setError(`Invalid password. Use "test" for ${labels.primaryRole} or "staff" for ${labels.staffRole}.`);
        }
    };

    const handleSsoLogin = () => {
        setError('');
        onLogin(campusId.trim(), 'staff');
    };

    const handleClose = () => {
        setCampusId('');
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            <div
                className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] md:flex-row"
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-modal-title"
            >
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close sign in"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left — sign-in form */}
                <div className="flex flex-1 flex-col px-8 py-10 md:px-10 md:py-12">
                    <div className="mb-8 flex flex-col items-center text-center">
                        {template?.branding?.logo && (
                            <img
                                src={template.branding.logo}
                                alt=""
                                className="mb-3 h-10 w-auto object-contain"
                            />
                        )}
                        <p
                            className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500"
                            style={{ fontFamily: template?.typography?.fontFamily }}
                        >
                            {template?.branding?.institutionName || 'Portal'}
                        </p>
                    </div>

                    <h2
                        id="login-modal-title"
                        className="mb-8 text-center text-3xl font-normal tracking-tight text-gray-900 md:text-4xl"
                        style={{ fontFamily: headingFont }}
                    >
                        {login.welcomeTitle}
                    </h2>

                    <button
                        type="button"
                        className="mb-3 flex w-full items-center justify-between rounded-full border border-gray-300 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-800 transition-colors hover:bg-gray-50"
                        onClick={handleSsoLogin}
                    >
                        <span>{login.ssoButtonLabel}</span>
                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </button>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                            {login.emailDivider}
                        </span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FloatingInput
                            id="login-email"
                            label={labels.idLabel}
                            value={campusId}
                            onChange={(e) => setCampusId(e.target.value)}
                            autoComplete="username"
                            accentColor={primary}
                        />

                        <FloatingInput
                            id="login-password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            accentColor={primary}
                            trailing={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            }
                        />

                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
                                style={{ color: primary }}
                                onClick={(e) => e.preventDefault()}
                            >
                                Forgot password?
                            </button>
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full rounded-full py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: primary }}
                        >
                            {login.signInButton}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
                        {labels.disclaimer}
                    </p>
                </div>

                {/* Right — template-branded highlights */}
                <div
                    className="flex flex-1 flex-col justify-center px-8 py-10 md:px-10 md:py-12"
                    style={{ backgroundColor: panelTint }}
                >
                    <div
                        className="mb-6 rounded-2xl px-5 py-4 text-white"
                        style={{ backgroundColor: secondary }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-90">
                            {template?.branding?.institutionName || 'Portal'}
                        </p>
                        <h3
                            className="mt-2 text-2xl font-normal leading-snug tracking-tight md:text-3xl"
                            style={{ fontFamily: headingFont }}
                        >
                            {login.headline}
                        </h3>
                    </div>

                    <ul className="space-y-4">
                        {login.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-gray-800">
                                <CheckIcon color={secondary} />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <p className="mt-8 text-xs leading-relaxed text-gray-600">
                        {labels.secureSessionNote}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;
