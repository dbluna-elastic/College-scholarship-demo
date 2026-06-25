/**
 * Template switcher FAB — expands into a centered rounded pill bar when opened.
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

        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
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
        <>
            {open && (
                <div
                    className="fixed inset-0 z-[54] bg-[radial-gradient(circle_at_50%_50%,rgba(93,95,239,0.12),transparent_55%)] bg-black/30 backdrop-blur-[2px]"
                    aria-hidden="true"
                    onClick={() => setOpen(false)}
                />
            )}
            <div
                ref={rootRef}
                className={`template-bar-root${open ? ' is-open' : ''}`}
            >
                <nav
                    className={`template-bar-shell${open ? ' is-open' : ''}`}
                    aria-label="Choose template"
                >
                    {open && (
                        <div className="template-bar-panel" role="menu">
                            <div className="template-bar-track">
                                {options.map(({ id, name, color }, index) => {
                                    const isCurrent = id === currentId;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            role="menuitem"
                                            onClick={() => handleSelect(id)}
                                            className={`template-bar-item${isCurrent ? ' is-current' : ''}`}
                                            style={{
                                                '--accent': color,
                                                '--delay': `${index * 40}ms`,
                                            }}
                                            tabIndex={0}
                                            aria-current={isCurrent ? 'true' : undefined}
                                        >
                                            <span
                                                className="template-bar-item__swatch"
                                                style={{ backgroundColor: color }}
                                                aria-hidden="true"
                                            />
                                            <span className="template-bar-item__name">{name}</span>
                                            {isCurrent && (
                                                <span className="template-bar-item__badge">Active</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        className="template-bar-toggle focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FEC514]/80"
                        onClick={() => setOpen((v) => !v)}
                        aria-label={open ? 'Close template menu' : 'Switch site template'}
                        aria-expanded={open}
                        aria-haspopup="menu"
                    >
                        <ElasticMark className="w-9 h-9 rounded-lg" />
                    </button>
                </nav>
            </div>
        </>
    );
}
