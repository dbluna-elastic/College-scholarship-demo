/**
 * Small Elasticsearch-style FAB (bottom-left) to switch site templates.
 */

import { useContext, useEffect, useRef, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getTemplateSwitchOptions, switchTemplate } from '../../config/templateEngine.js';

function ElasticMark({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} viewBox="0 0 32 32" aria-hidden="true" fill="none">
            <rect width="32" height="32" rx="8" fill="#343741" />
            <rect x="7" y="9" width="18" height="3.5" rx="1" fill="#FEC514" />
            <rect x="7" y="14.25" width="12" height="3.5" rx="1" fill="#FEC514" opacity="0.9" />
            <rect x="7" y="19.5" width="16" height="3.5" rx="1" fill="#FEC514" opacity="0.75" />
        </svg>
    );
}

export default function TemplateSwitcherFab() {
    const template = useContext(TemplateContext);
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const options = getTemplateSwitchOptions();

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        return () => document.removeEventListener('pointerdown', onPointerDown, true);
    }, [open]);

    const handleSelect = (id) => {
        switchTemplate(id);
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('template', id);
            window.history.replaceState({}, '', url);
        } catch {
            /* ignore */
        }
        setOpen(false);
    };

    const currentId = template?.id;

    return (
        <div ref={rootRef} className="fixed bottom-6 left-4 z-[55] flex flex-col items-start gap-2">
            {open && (
                <div
                    className="mb-1 min-w-[200px] max-h-[min(50vh,320px)] overflow-y-auto rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/95 dark:bg-[#161616]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] py-2"
                    role="menu"
                    aria-label="Choose template"
                >
                    {options.map(({ id, name }) => (
                        <button
                            key={id}
                            type="button"
                            role="menuitem"
                            onClick={() => handleSelect(id)}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors rounded-xl mx-1 ${
                                id === currentId
                                    ? 'bg-[var(--primary-color,#5D5FEF)]/15 text-[var(--primary-color,#5D5FEF)]'
                                    : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                            }`}
                        >
                            {name}
                            {id === currentId && (
                                <span className="ml-2 text-xs opacity-70">(current)</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-[#161616]/90 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.25)] hover:brightness-105 dark:hover:bg-[#1c1c1c] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FEC514]/80"
                aria-label={open ? 'Close template menu' : 'Switch site template'}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <ElasticMark className="w-9 h-9 rounded-lg" />
            </button>
        </div>
    );
}
