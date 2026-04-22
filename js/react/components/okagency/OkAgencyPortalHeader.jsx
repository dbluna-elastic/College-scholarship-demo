/**
 * Oklahoma Agency portal top bar — template primary background, white controls.
 * Used on public grants page and logged-in okagency app shells for one cohesive identity.
 */

import { useContext } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';

/**
 * @param {Object} props
 * @param {'fixed' | 'sticky'} [props.position='fixed'] — fixed for marketing; sticky for in-app scroll
 * @param {boolean} [props.showNavLinks=false] — inline nav links (app dashboards)
 * @param {() => void} [props.onLoginClick] — show Login (public)
 * @param {() => void} [props.onLogout] — show Logout (app)
 * @param {string} [props.campusId] — optional account hint
 */
function OkAgencyPortalHeader({
    position = 'fixed',
    showNavLinks = false,
    onLoginClick,
    onLogout,
    campusId,
}) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const menuLabel = template?.header?.menuLabel ?? 'MENU';
    const name = template?.branding?.institutionName ?? '';

    const positionClass = position === 'sticky' ? 'sticky top-0' : 'fixed top-0 left-0 right-0';

    return (
        <header
            className={`${positionClass} z-40 flex h-16 items-center justify-between gap-2 px-4 shadow-md md:px-8`}
            style={{ backgroundColor: primaryColor }}
        >
            <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-6">
                <div className="flex shrink-0 items-center gap-3">
                    <img
                        src={template?.branding?.logo ?? ''}
                        alt={name}
                        className="h-9 w-auto"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling?.classList.remove('hidden');
                        }}
                    />
                    <span className="hidden text-lg font-bold text-white lg:inline">{name}</span>
                </div>
                {showNavLinks && template?.navigation?.links?.length > 0 && (
                    <nav className="hidden min-w-0 flex-1 overflow-x-auto md:flex md:items-center md:gap-4 lg:gap-6">
                        {template.navigation.links.map((link, i) => (
                            <a
                                key={i}
                                href={link.href}
                                className="shrink-0 text-sm font-medium text-white/90 hover:text-white transition-colors whitespace-nowrap"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
                {campusId && (
                    <span className="hidden max-w-[8rem] truncate text-xs text-white/80 lg:inline" title="Signed in">
                        {campusId}
                    </span>
                )}
                <button type="button" className="rounded-lg p-2 text-white hover:bg-white/10 transition-colors" aria-label="Search">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
                <button type="button" className="rounded-lg p-2 text-white hover:bg-white/10 transition-colors" aria-label="Language">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <button
                    type="button"
                    className="rounded border border-white/60 px-2 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors sm:px-3 sm:text-sm"
                >
                    {menuLabel}
                </button>
                {typeof onLogout === 'function' ? (
                    <button
                        type="button"
                        onClick={onLogout}
                        className="rounded border border-white/80 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                    >
                        Logout
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onLoginClick}
                        className="rounded px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-colors sm:px-4"
                    >
                        Login
                    </button>
                )}
            </div>
        </header>
    );
}

export default OkAgencyPortalHeader;
