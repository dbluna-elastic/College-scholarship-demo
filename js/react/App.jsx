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
import LoginModal from './components/LoginModal.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import CounselorDashboard from './components/CounselorDashboard.jsx';
import MentalHealthFraudDashboard from './components/MentalHealthFraudDashboard.jsx';
import FraudRecipientDetail from './components/FraudRecipientDetail.jsx';
import OkCommerceCompanyDashboard from './components/OkCommerceCompanyDashboard.jsx';
import OkAgencyStaffDashboard from './components/OkAgencyStaffDashboard.jsx';
import OkAgencyBusinessScorecard from './components/OkAgencyBusinessScorecard.jsx';
import StateAgencyGrantsSearch from './components/StateAgencyGrantsSearch.jsx';
import OkAgencyPortalHeader from './components/okagency/OkAgencyPortalHeader.jsx';
import OkAgencyFooter from './components/okagency/OkAgencyFooter.jsx';
import { getApm, setUserContext, clearUserContext } from '../modules/tracing.js';

function App() {
    const template = useContext(TemplateContext);
    const [activeSection, setActiveSection] = useState('home'); // 'home', 'search', 'analytics', 'student-dashboard', 'counselor-dashboard'
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [userRole, setUserRole] = useState(null); // 'student' | 'counselor' | null
    const [campusId, setCampusId] = useState(null); // Store campus ID from login
    const [headerScrolled, setHeaderScrolled] = useState(false);
    const [fraudRecipientId, setFraudRecipientId] = useState(null);
    const [okagencyBusinessId, setOkagencyBusinessId] = useState(null);

    useEffect(() => {
        console.log('⚛️ React App mounted with template:', template?.name);
    }, [template]);

    // Agency hero overlay: header becomes solid on scroll (okmentalhealth only; okagency uses solid grants search header)
    useEffect(() => {
        if (template?.id !== 'okmentalhealth') return;
        const onScroll = () => setHeaderScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [template?.id]);

    // Track route changes for RUM
    useEffect(() => {
        const apm = getApm();
        if (apm && activeSection) {
            const transaction = apm.startTransaction?.(`Route: ${activeSection}`, 'route-change');
            if (transaction && typeof transaction.addLabels === 'function') {
                transaction.addLabels({
                    'route.name': activeSection,
                    'route.type': activeSection.includes('dashboard') ? 'dashboard' : 'page',
                });
            }
            if (transaction && typeof transaction.end === 'function') {
                setTimeout(() => transaction.end(), 100);
            }
        }
    }, [activeSection]);

    const handleLogin = (campusId, password) => {
        const apm = getApm();
        
        if (password === 'test') {
            setUserRole('student');
            setCampusId(campusId || 'student');
            setActiveSection(template?.id === 'okagency' ? 'commerce-dashboard' : 'student-dashboard');
            setShowLoginModal(false);
            
            // Set user context for RUM
            if (apm) {
                setUserContext({
                    id: campusId || 'student',
                    username: campusId || 'student',
                    role: 'student',
                });
                
                // Track login event
                if (typeof apm.addLabels === 'function') {
                    apm.addLabels({
                        'user.action': 'login',
                        'user.role': 'student',
                    });
                }
            }
        } else if (password === 'staff') {
            setUserRole('counselor');
            setCampusId(campusId || 'counselor');
            setActiveSection('counselor-dashboard');
            setShowLoginModal(false);
            
            // Set user context for RUM
            if (apm) {
                setUserContext({
                    id: campusId || 'counselor',
                    username: campusId || 'counselor',
                    role: 'counselor',
                });
                
                // Track login event
                if (typeof apm.addLabels === 'function') {
                    apm.addLabels({
                        'user.action': 'login',
                        'user.role': 'counselor',
                    });
                }
            }
        }
    };

    const handleLogout = () => {
        const apm = getApm();
        
        // Clear user context for RUM
        if (apm) {
            clearUserContext();
            if (typeof apm.addLabels === 'function') {
                apm.addLabels({
                    'user.action': 'logout',
                });
            }
        }
        
        setUserRole(null);
        setCampusId(null);
        setOkagencyBusinessId(null);
        setActiveSection('home');
    };

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    // News items - use template-specific news if available, otherwise use defaults
    const newsItems = template.news || [
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
    if (activeSection === 'commerce-dashboard') {
        return <OkCommerceCompanyDashboard onLogout={handleLogout} campusId={campusId} />;
    }

    if (activeSection === 'student-dashboard') {
        return <StudentDashboard onLogout={handleLogout} campusId={campusId} />;
    }

    if (activeSection === 'fraud-recipient-detail') {
        return (
            <FraudRecipientDetail
                medicaidRecipientId={fraudRecipientId}
                onBack={() => {
                    setFraudRecipientId(null);
                    setActiveSection('counselor-dashboard');
                }}
                onLogout={handleLogout}
            />
        );
    }

    if (activeSection === 'okagency-business-scorecard' && template?.id === 'okagency') {
        return (
            <OkAgencyBusinessScorecard
                businessId={okagencyBusinessId}
                campusId={campusId}
                onBack={() => {
                    setOkagencyBusinessId(null);
                    setActiveSection('counselor-dashboard');
                }}
                onLogout={handleLogout}
            />
        );
    }

    if (activeSection === 'counselor-dashboard') {
        if (template?.id === 'okmentalhealth') {
            return (
                <MentalHealthFraudDashboard
                    onLogout={handleLogout}
                    onRecipientClick={(id) => {
                        setFraudRecipientId(id);
                        setActiveSection('fraud-recipient-detail');
                    }}
                />
            );
        }
        if (template?.id === 'okagency') {
            return (
                <OkAgencyStaffDashboard
                    onLogout={handleLogout}
                    campusId={campusId}
                    onBusinessClick={(id) => {
                        setOkagencyBusinessId(id);
                        setActiveSection('okagency-business-scorecard');
                    }}
                />
            );
        }
        return <CounselorDashboard onLogout={handleLogout} />;
    }

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
                                {template.branding?.institutionName ?? 'Portal'}
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
                                {template.branding?.institutionName ?? 'Portal'}
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

    // Oklahoma agency–style layout (okagency, okmentalhealth): overlay header, hero, blue bar, promo bar, white main
    const isAgencyOverlayLayout = ['okagency', 'okmentalhealth'].includes(template?.id);
    const primaryColor = template?.colors?.primary || '#5D5FEF';
    const secondaryColor = template?.colors?.secondary || '#2E7D32';
    const accentColor = template?.colors?.accent || '#0ea5e9';
    const charcoalColor = template?.colors?.charcoal || '#1e293b';

    if (isAgencyOverlayLayout && template?.id === 'okagency') {
        return (
            <div className="w-full min-h-screen bg-slate-50" style={{ fontFamily: template?.typography?.fontFamily }}>
                <a
                    href="#grants-search-main"
                    className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:shadow-lg"
                >
                    Skip to grant search
                </a>
                <OkAgencyPortalHeader position="fixed" onLoginClick={() => setShowLoginModal(true)} />

                <StateAgencyGrantsSearch />

                <OkAgencyFooter />

                <ChatWidget floating={true} />
                <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
            </div>
        );
    }

    if (isAgencyOverlayLayout) {
        return (
            <div className="w-full min-h-screen bg-white" style={{ fontFamily: template?.typography?.fontFamily }}>
                {/* Overlay Header: transparent on hero, solid on scroll */}
                <header
                    className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 flex items-center justify-between h-16 px-4 md:px-8 ${
                        headerScrolled ? 'bg-[#003366] shadow-md' : 'bg-transparent'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <img
                            src={template.branding?.logo ?? ''}
                            alt={template.branding?.institutionName ?? ''}
                            className="h-9 w-auto"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.classList.remove('hidden'); }}
                        />
                        <span className="text-lg font-bold text-white hidden">
                            {template.branding?.institutionName ?? 'State Agency'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Search">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <button className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Language">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button className="px-3 py-1.5 text-white text-sm font-semibold border border-white/60 rounded hover:bg-white/10 transition-colors">
                            {template?.header?.menuLabel ?? 'MENU'}
                        </button>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 rounded transition-colors"
                        >
                            Login
                        </button>
                    </div>
                </header>

                {/* Hero: full-bleed image + overlay, H1 + sub, scroll indicator bottom-left */}
                <section className="relative min-h-[90vh] flex flex-col justify-center text-white">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${template.hero?.backgroundImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80'})`,
                        }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor: 'rgba(0, 51, 102, 0.72)' }}
                    />
                    <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 text-center pt-16">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight" style={{ fontFamily: template?.typography?.fontFamily }}>
                            {template.hero?.mainHeading ?? 'Building Businesses and Communities'}
                        </h1>
                        <p className="text-lg md:text-xl font-normal opacity-95 max-w-2xl mx-auto">
                            {template.hero?.subHeading ?? 'Learn more about what makes Oklahoma the land of opportunity.'}
                        </p>
                    </div>
                    {/* Scroll indicator bottom-left */}
                    <div className="absolute bottom-8 left-6 md:left-10 z-10 flex flex-col items-center gap-1 text-white/90">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            {template.content?.blueBar?.scrollPromptText ?? 'Scroll to learn more'}
                        </span>
                        <div className="w-10 h-12 rounded-full border-2 border-white/80 flex items-start justify-center pt-2">
                            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </div>
                </section>

                {/* Blue bar: newsletter + sidebar icons */}
                <div
                    className="w-full flex flex-wrap items-center justify-between gap-4 py-3 px-4 md:px-8 text-white"
                    style={{ backgroundColor: primaryColor }}
                >
                    <a
                        href="#newsletter"
                        className="inline-flex items-center gap-2 font-semibold hover:opacity-90 transition-opacity"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {template.content?.blueBar?.newsletterText ?? 'Sign up for our Newsletter'}
                    </a>
                    <div className="flex items-center gap-3">
                        <a href="#email" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" aria-label="Email">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </a>
                        <a href="#documents" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" aria-label="Documents">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Green feature banner */}
                {template.content?.promoBar && (
                    <a
                        href={template.content.promoBar?.href || '#'}
                        className="block w-full py-4 text-center text-white font-semibold hover:opacity-95 transition-opacity"
                        style={{ backgroundColor: secondaryColor }}
                    >
                        {template.content.promoBar?.text ?? ''}
                    </a>
                )}

                {/* Main content: white, H2 + tagline + news */}
                <main className="bg-white py-16">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2
                            className="text-3xl md:text-4xl font-bold text-center mb-3"
                            style={{ color: charcoalColor, fontFamily: template?.typography?.fontFamily }}
                        >
                            {template.content?.mainHeading ?? "North America's Central Location for Business"}
                        </h2>
                        <p
                            className="text-center text-lg font-medium mb-12"
                            style={{ color: accentColor }}
                        >
                            {template.content?.mainTagline ?? 'A GLOBAL VISION WITH A LOCAL FOCUS'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {newsItems.map((item, index) => (
                                <article key={index} className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                                    <div className="aspect-video overflow-hidden">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-6">
                                        <span className="text-sm font-semibold uppercase tracking-wide block mb-2" style={{ color: primaryColor }}>
                                            {item.category}
                                        </span>
                                        <h3 className="text-xl font-bold mb-3" style={{ color: charcoalColor }}>{item.title}</h3>
                                        <p className="text-gray-600 mb-4">{item.description}</p>
                                        <a href="#" className="font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: primaryColor }}>
                                            Read More →
                                        </a>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="text-white" style={{ backgroundColor: primaryColor }}>
                    <div className="max-w-7xl mx-auto px-4 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div>
                                <h3 className="font-bold text-lg mb-4">{template.branding?.institutionName ?? 'State Agency'}</h3>
                                <p className="text-white/80 text-sm mb-2">{template.footer?.address ?? ''}</p>
                                <p className="text-white/80 text-sm">{template.footer?.phone ?? ''}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                                <ul className="space-y-2">
                                    {template.footer?.quickLinks?.map((link, i) => (
                                        <li key={i}>
                                            <a href={link.href} className="text-white/80 text-sm hover:text-white transition-colors">{link.label}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-4">Connect</h3>
                                <div className="flex gap-4">
                                    {template.footer?.socialMedia?.map((s, i) => (
                                        <a key={i} href={s.href} className="text-white/80 hover:text-white font-semibold" aria-label={s.label}>{s.platform}</a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/20">
                        <div className="max-w-7xl mx-auto px-4 py-6">
                            <p className="text-center text-white/70 text-sm">
                                © 2026 {template.branding?.institutionName ?? 'State Agency'}. All Rights Reserved.
                            </p>
                        </div>
                    </div>
                </footer>

                <ChatWidget floating={true} />
                <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-white">
            {/* 1. Global Header (Top Utility Bar) */}
            <header className="bg-[#1a2332] text-white py-2">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-end items-center gap-4">
                        {/* Login Button with Pulsing Animation */}
                        <div className="relative">
                            {/* Pulsing ring effect */}
                            <div 
                                className="absolute inset-0 rounded chatbot-pulse-ring opacity-50"
                                style={{
                                    backgroundColor: template?.colors?.primary || '#5D5FEF',
                                }}
                            ></div>
                            <button 
                                onClick={() => setShowLoginModal(true)}
                                className="relative px-4 py-1.5 text-sm font-medium hover:opacity-80 transition-opacity chatbot-pulse-button"
                            >
                                Login
                            </button>
                        </div>
                        
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
                                src={template.branding?.logo ?? ''}
                                alt={template.branding?.institutionName ?? 'Portal'}
                                className="h-12 w-auto"
                                onError={(e) => {
                                    // Fallback to text if image doesn't load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <span className="text-xl font-bold text-gray-900 hidden">
                                {template.branding?.institutionName ?? 'Portal'}
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

                        {/* Mobile Menu Button */}
                        <div className="flex items-center gap-4">
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
                            style={{ backgroundColor: template.colors?.primary || '#5D5FEF' }}
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

            {/* Promo bar (template-driven, e.g. okagency) */}
            {template.content?.promoBar && (
                <a
                    href={template.content.promoBar?.href || '#'}
                    className="block w-full py-4 text-center text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: template.colors?.secondary || '#2E7D32' }}
                >
                    {template.content.promoBar?.text ?? ''}
                </a>
            )}

            {/* 4. Latest News Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <h2
                        className="text-4xl md:text-5xl font-bold text-center mb-12"
                        style={{
                            fontFamily: 'var(--serif-font)',
                            color: template.colors?.primary || '#5D5FEF',
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
                                        style={{ color: template.colors?.primary || '#5D5FEF' }}
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
                                        style={{ color: template.colors?.primary || '#5D5FEF' }}
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
                                {template.branding?.institutionName ?? 'Portal'}
                            </h3>
                            <p className="text-gray-300 text-sm mb-2">
                                {template.footer?.address ?? '123 University Avenue, City, State 12345'}
                            </p>
                            <p className="text-gray-300 text-sm">
                                {template.footer?.phone ?? '(555) 123-4567'}
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
                            © 2026 {template.branding?.institutionName ?? 'Portal'}. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Chat Widget - Floating */}
            <ChatWidget floating={true} />

            {/* Login Modal */}
            <LoginModal 
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={handleLogin}
            />
        </div>
    );
}

export default App;
