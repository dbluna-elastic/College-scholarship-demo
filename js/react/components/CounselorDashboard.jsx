/**
 * CounselorDashboard - Counselor dashboard page
 * 
 * Uses the same template structure as the main app but with a blank hero section.
 * Placeholder for future counselor dashboard features.
 */

import { useContext } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';
import ChatWidget from './ChatWidget.jsx';

function CounselorDashboard({ onLogout }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-white">
            {/* 1. Global Header (Top Utility Bar) */}
            <header className="bg-[#1a2332] text-white py-2">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-end items-center gap-4">
                        {/* User Info */}
                        <span className="text-sm">{schemaLabels.dashboardStaff}</span>
                        
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

            {/* 4. Dashboard Content Placeholder */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <h2
                        className="text-4xl md:text-5xl font-bold text-center mb-12"
                        style={{
                            fontFamily: 'var(--serif-font)',
                            color: template.colors?.primary || '#5D5FEF',
                        }}
                    >
                        {schemaLabels.dashboardStaff}
                    </h2>
                    <p className="text-center text-gray-600">
                        Dashboard content will be added here.
                    </p>
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

export default CounselorDashboard;
