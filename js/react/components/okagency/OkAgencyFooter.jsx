/**
 * Oklahoma Agency portal footer — primary background, shared by public layout and app shells.
 */

import { useContext } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';

function OkAgencyFooter() {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const name = template?.branding?.institutionName ?? 'State Agency';

    if (!template) return null;

    return (
        <footer className="text-white" style={{ backgroundColor: primaryColor }}>
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold text-lg mb-4">{name}</h3>
                        <p className="text-white/80 text-sm mb-2">{template.footer?.address ?? ''}</p>
                        <p className="text-white/80 text-sm">{template.footer?.phone ?? ''}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            {(template.footer?.quickLinks ?? []).map((link, i) => (
                                <li key={i}>
                                    <a href={link.href} className="text-white/80 text-sm hover:text-white transition-colors">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Connect</h3>
                        <div className="flex gap-4">
                            {(template.footer?.socialMedia ?? []).map((s, i) => (
                                <a
                                    key={i}
                                    href={s.href}
                                    className="text-white/80 hover:text-white font-semibold"
                                    aria-label={s.label}
                                >
                                    {s.platform}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-white/20">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <p className="text-center text-white/70 text-sm">© 2026 {name}. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default OkAgencyFooter;
