/**
 * Main React App Component
 * 
 * Complete university website template with:
 * - Global Header (top utility bar)
 * - Main Navigation
 * - Hero Section
 * - Latest News Section
 * - Footer
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from './context/TemplateContext.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import ScholarshipSearch from './components/ScholarshipSearch.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';

function App() {
    const template = useContext(TemplateContext);
    const [activeSection, setActiveSection] = useState('home'); // 'home', 'search', 'analytics'

    useEffect(() => {
        console.log('⚛️ React App mounted with template:', template?.name);
    }, [template]);

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    // Placeholder news items
    const newsItems = [
        {
            category: 'Groundbreaking Research',
            title: 'University Scientists Make Breakthrough Discovery',
            description: 'Our research team has achieved a major milestone in sustainable energy solutions.',
            image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
        },
        {
            category: 'Student Success',
            title: 'Graduates Achieve 95% Employment Rate',
            description: 'This year\'s graduating class has set a new record for post-graduation employment.',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        },
        {
            category: 'Campus Life',
            title: 'New Student Center Opens This Fall',
            description: 'State-of-the-art facility provides modern spaces for student collaboration and learning.',
            image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
        },
    ];

    // Render different sections based on activeSection
    if (activeSection === 'search') {
        return (
            <div className="w-full min-h-screen bg-white">
                {/* Navigation */}
                <nav className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between h-20">
                            <button
                                onClick={() => setActiveSection('home')}
                                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                                {template.branding.institutionName}
                            </button>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveSection('home')}
                                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    Home
                                </button>
                                <button
                                    onClick={() => setActiveSection('analytics')}
                                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    Analytics
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
                <ScholarshipSearch />
                <ChatWidget floating={true} />
            </div>
        );
    }

    if (activeSection === 'analytics') {
        return (
            <div className="w-full min-h-screen bg-white">
                {/* Navigation */}
                <nav className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between h-20">
                            <button
                                onClick={() => setActiveSection('home')}
                                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                                {template.branding.institutionName}
                            </button>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveSection('home')}
                                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    Home
                                </button>
                                <button
                                    onClick={() => setActiveSection('search')}
                                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    Search Scholarships
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
                <AnalyticsDashboard />
                <ChatWidget floating={true} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-white">
            {/* 1. Global Header (Top Utility Bar) */}
            <header className="bg-[#1a2332] text-white py-2">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-end items-center gap-4">
                        {/* Login Button */}
                        <button className="px-4 py-1.5 text-sm font-medium hover:opacity-80 transition-opacity">
                            Login
                        </button>
                        
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
                                    // Fallback to text if image doesn't load
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
                            <button
                                onClick={() => setActiveSection('home')}
                                className={`font-medium transition-colors ${
                                    activeSection === 'home'
                                        ? 'text-blue-600'
                                        : 'text-gray-900 hover:text-blue-600'
                                }`}
                            >
                                Home
                            </button>
                            <button
                                onClick={() => setActiveSection('search')}
                                className={`font-medium transition-colors ${
                                    activeSection === 'search'
                                        ? 'text-blue-600'
                                        : 'text-gray-900 hover:text-blue-600'
                                }`}
                            >
                                Search Scholarships
                            </button>
                            <button
                                onClick={() => setActiveSection('analytics')}
                                className={`font-medium transition-colors ${
                                    activeSection === 'analytics'
                                        ? 'text-blue-600'
                                        : 'text-gray-900 hover:text-blue-600'
                                }`}
                            >
                                Analytics
                            </button>
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

            {/* 3. Hero Section */}
            <section
                className="relative h-[600px] flex items-center justify-center text-white"
                style={{
                    backgroundImage: `linear-gradient(rgba(26, 35, 50, 0.65), rgba(26, 35, 50, 0.65)), url(${template.hero?.backgroundImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1
                        className="text-6xl md:text-7xl font-bold mb-6 tracking-wider"
                        style={{
                            fontFamily: 'var(--serif-font)',
                            letterSpacing: '0.1em',
                        }}
                    >
                        {template.hero?.mainHeading || 'THE STATE WAY'}
                    </h1>
                    <p className="text-xl md:text-2xl mb-10 font-medium">
                        {template.hero?.subHeading || 'Moving Forward. Together.'}
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <button
                            className="px-8 py-3 rounded-full font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
                            style={{ backgroundColor: template.colors.primary }}
                        >
                            {template.hero?.ctaButtons?.primary || 'Apply Now'}
                        </button>
                        <button
                            className="px-8 py-3 rounded-full font-semibold text-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            {template.hero?.ctaButtons?.secondary || 'Visit Campus'}
                        </button>
                    </div>
                </div>
            </section>

            {/* 4. Latest News Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <h2
                        className="text-4xl md:text-5xl font-bold text-center mb-12"
                        style={{
                            fontFamily: 'var(--serif-font)',
                            color: template.colors.primary,
                        }}
                    >
                        Latest News
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {newsItems.map((item, index) => (
                            <article
                                key={index}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {/* Image */}
                                <div className="aspect-video overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                
                                {/* Content */}
                                <div className="p-6">
                                    <span
                                        className="text-sm font-semibold uppercase tracking-wide mb-2 block"
                                        style={{ color: template.colors.primary }}
                                    >
                                        {item.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {item.description}
                                    </p>
                                    <a
                                        href="#"
                                        className="font-bold inline-flex items-center gap-1 hover:gap-2 transition-all"
                                        style={{ color: template.colors.primary }}
                                    >
                                        Read More →
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Footer */}
            <footer className="bg-[#1a2332] text-white">
                {/* Divider Line */}
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

export default App;
