/**
 * Main React App Component
 * 
 * This is the root React component that will be mounted into the DOM.
 * It has access to the template context for branding and content.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from './context/TemplateContext.jsx';

function App() {
    const template = useContext(TemplateContext);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        console.log('⚛️ React App mounted with template:', template.name);
    }, []);

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-white/60">Loading template...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            {/* Hero Section - React Version */}
            <div className="text-center mb-12">
                <h1 
                    className="text-6xl font-black tracking-tighter mb-4 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent"
                    style={{ 
                        fontFamily: template.typography?.fontFamily,
                        letterSpacing: template.typography?.headingTracking 
                    }}
                >
                    {template.content.heroTitle}
                </h1>
                <p className="text-white/60 text-lg mb-8">
                    {template.content.heroSubtitle}
                </p>
                <div className="flex gap-4 justify-center">
                    <button 
                        className="px-8 py-3 rounded-full hover:opacity-90 transition-opacity font-semibold"
                        style={{ backgroundColor: template.colors.primary }}
                    >
                        {template.content.ctaText}
                    </button>
                    <button 
                        className="px-8 py-3 rounded-full border border-white/10 hover:border-white/20 transition-colors font-semibold"
                    >
                        {template.content.ctaSecondary}
                    </button>
                </div>
            </div>

            {/* Template Info Card */}
            <div 
                className="rounded-[32px] p-8 border border-white/[0.08] backdrop-blur-md"
                style={{ backgroundColor: template.colors.bgSurface }}
            >
                <h2 className="text-2xl font-extrabold mb-4 tracking-tighter">
                    Template Information
                </h2>
                <div className="space-y-2 text-white/80">
                    <p><strong>Template:</strong> {template.name} ({template.id})</p>
                    <p><strong>Institution:</strong> {template.branding.institutionName}</p>
                    <p><strong>Tagline:</strong> {template.branding.tagline}</p>
                    {template.content.stateName && (
                        <p><strong>State:</strong> {template.content.stateName} ({template.content.stateAbbreviation})</p>
                    )}
                </div>
            </div>

            {mounted && (
                <div className="mt-8 text-center text-white/40 text-sm">
                    React is running! Template state is shared with vanilla modules.
                </div>
            )}
        </div>
    );
}

export default App;
