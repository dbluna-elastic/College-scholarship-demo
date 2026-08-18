/**
 * TexasCollegeStaffChrome — shared header, tabs, and layout for athletic advancement staff views.
 */

import { useContext } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../../config/schemaConfig.js';

export default function TexasCollegeStaffChrome({
    onLogout,
    children,
    tabs,
    activeTab,
    onTabChange,
    subtitle,
    headerLabel,
    dashboardContent,
}) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const primaryColor = template?.colors?.primary || '#0C2340';
    const secondaryColor = template?.colors?.secondary || '#F15A22';
    const staff = dashboardContent || template?.content?.staffDashboard || {};

    return (
        <div className="w-full min-h-screen bg-white" style={{ fontFamily: template?.typography?.fontFamily }}>
            <header className="text-white py-2" style={{ backgroundColor: primaryColor }}>
                <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-4">
                    <span className="text-sm">{headerLabel || schemaLabels.dashboardStaff}</span>
                    {onLogout && (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="px-4 py-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </header>

            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-20 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src={template.branding?.logo}
                                alt={template.branding?.institutionName}
                                className="h-10 w-auto"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="text-xl font-black tracking-tighter truncate" style={{ color: primaryColor }}>
                                {template.branding?.institutionName}
                            </span>
                        </div>
                        {tabs?.length > 0 && (
                            <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => onTabChange?.(tab.id)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                                            activeTab === tab.id ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        style={activeTab === tab.id ? { backgroundColor: secondaryColor } : undefined}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {tabs?.length > 0 && (
                        <div className="md:hidden flex flex-wrap gap-2 pb-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => onTabChange?.(tab.id)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                                        activeTab === tab.id ? 'text-white' : 'text-gray-700 border border-gray-300'
                                    }`}
                                    style={activeTab === tab.id ? { backgroundColor: secondaryColor } : undefined}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            <section className="py-8 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <h2
                        className="text-4xl md:text-5xl font-black tracking-tighter mb-2"
                        style={{ color: primaryColor }}
                    >
                        {staff.pageTitle || schemaLabels.dashboardStaff}
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-3xl">
                        {subtitle || staff.subtitle}
                    </p>
                    {children}
                </div>
            </section>
        </div>
    );
}
