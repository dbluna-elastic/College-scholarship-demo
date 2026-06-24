/**
 * Radial popup FAB (bottom-left) to switch site templates.
 * Moves to screen center when opened so the full circle can expand.
 */

import { useContext, useEffect, useRef, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getTemplateSwitchOptions, switchTemplate } from '../../config/templateEngine.js';

const SHORT_LABELS = {
    default: 'Def',
    texas: 'TX',
    oklahoma: 'OK',
    beauregard: 'Beau',
    okagency: 'Agcy',
    okmentalhealth: 'MH',
    dot: 'DOT',
    texascollege: 'TC',
    okoja: 'OJA',
};

const RADIAL_RADIUS = 148;

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

/**
 * Evenly distribute items around a full circle (starts at top).
 * @param {number} index
 * @param {number} total
 * @param {number} radius
 */
function getRadialOffset(index, total, radius) {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
    };
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
    const count = options.length;

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-[54] bg-[radial-gradient(circle_at_50%_50%,rgba(93,95,239,0.14),transparent_55%)] bg-black/30 backdrop-blur-[2px]"
                    aria-hidden="true"
                    onClick={() => setOpen(false)}
                />
            )}
            <div
                ref={rootRef}
                className={`template-radial-root${open ? ' is-open' : ''}`}
            >
                <nav
                    className={`template-radial-menu relative ${open ? 'is-open' : ''}`}
                    aria-label="Choose template"
                    role={open ? 'menu' : undefined}
                >
                    {options.map(({ id, name, color }, index) => {
                        const { x, y } = getRadialOffset(index, count, RADIAL_RADIUS);
                        const isCurrent = id === currentId;

                        return (
                            <button
                                key={id}
                                type="button"
                                role="menuitem"
                                title={name}
                                onClick={() => handleSelect(id)}
                                className={`template-radial-menu__item${isCurrent ? ' is-current' : ''}`}
                                style={{
                                    '--tx': `${x}px`,
                                    '--ty': `${y}px`,
                                    '--delay': `${index * 50}ms`,
                                    backgroundColor: color,
                                }}
                                tabIndex={open ? 0 : -1}
                            >
                                {SHORT_LABELS[id] || name.slice(0, 3)}
                                <span className="template-radial-menu__label">
                                    {name}
                                    {isCurrent ? ' · current' : ''}
                                </span>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        className="template-radial-menu__toggle focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FEC514]/80"
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
