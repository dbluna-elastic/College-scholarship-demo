/**
 * State Agency grants search — behavior modeled on public grant portals (keyword, facets, table, pagination, saved search).
 * Data and copy come from template (okagency). Styling uses agency design tokens, not a visual clone of any specific portal.
 *
 * Results load from template.elastic.grantsDataIndex (e.g. ok-grant-data via ok-fraud ES proxy) when set; otherwise grantsCatalog.
 */

import { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getOkGrantDataCatalog } from '../../modules/utils/esqlQueries.js';

const STORAGE_KEY = 'okagency_grants_saved_search';

function parseSortDate(iso) {
    const t = new Date(iso);
    return Number.isNaN(t.getTime()) ? 0 : t.getTime();
}

function formatDisplayDate(iso) {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return '—';
    return t.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatMoney(n) {
    if (n == null || n === '') return '—';
    if (typeof n === 'number') {
        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
        return `$${n.toLocaleString()}`;
    }
    return String(n);
}

function defaultApplied() {
    return {
        keyword: '',
        statusForecasted: true,
        statusActive: true,
        statusClosed: true,
        postAwardOnly: false,
        excludeLoans: false,
        excludeMatchRequired: false,
        agency: '',
        category: '',
        eligibleApplicant: '',
        disbursementMethod: '',
        sortBy: 'deadline',
        sortDir: 'asc',
        page: 1,
        pageSize: 20,
    };
}

function cloneApplied(a) {
    return { ...a };
}

export default function StateAgencyGrantsSearch() {
    const template = useContext(TemplateContext);
    const gs = template?.content?.grantsSearch || {};
    const filterOpts = template?.grantsFilterOptions || {};
    const grantsDataIndex = template?.elastic?.grantsDataIndex;
    const fallbackCatalog = Array.isArray(template?.grantsCatalog) ? template.grantsCatalog : [];

    const [catalogRows, setCatalogRows] = useState(() =>
        grantsDataIndex ? [] : fallbackCatalog
    );
    const [grantsLoading, setGrantsLoading] = useState(() => Boolean(grantsDataIndex));
    const [grantsSource, setGrantsSource] = useState(() => (grantsDataIndex ? 'loading' : 'static'));

    useEffect(() => {
        let cancelled = false;
        const fb = Array.isArray(template?.grantsCatalog) ? template.grantsCatalog : [];
        const idx = template?.elastic?.grantsDataIndex;

        if (!idx) {
            setCatalogRows(fb);
            setGrantsLoading(false);
            setGrantsSource('static');
            return undefined;
        }

        setGrantsLoading(true);
        setGrantsSource('loading');

        getOkGrantDataCatalog(template)
            .then((rows) => {
                if (cancelled) return;
                if (rows.length > 0) {
                    setCatalogRows(rows);
                    setGrantsSource('elastic');
                } else {
                    setCatalogRows(fb);
                    setGrantsSource('fallback-empty');
                }
            })
            .catch(() => {
                if (cancelled) return;
                setCatalogRows(fb);
                setGrantsSource('fallback-error');
            })
            .finally(() => {
                if (!cancelled) setGrantsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [
        template?.id,
        template?.elastic?.grantsDataIndex,
        template?.elastic?.grantsDataAgentId,
        template?.elastic?.grantsSearchSize,
        template?.grantsCatalog,
    ]);

    const catalog = catalogRows;
    const showFallbackNotice =
        grantsSource === 'fallback-empty' || grantsSource === 'fallback-error';
    const primaryColor = template?.colors?.primary || '#003366';
    const accentColor = template?.colors?.accent || '#0ea5e9';
    const charcoal = template?.colors?.charcoal || '#1e293b';

    const [draft, setDraft] = useState(() => defaultApplied());
    const [applied, setApplied] = useState(() => defaultApplied());
    const [toast, setToast] = useState('');

    const showToast = useCallback((msg) => {
        setToast(msg);
        if (msg) setTimeout(() => setToast(''), 2500);
    }, []);

    const applyFilters = useCallback(() => {
        setApplied({ ...draft, page: 1 });
    }, [draft]);

    const resetFilters = useCallback(() => {
        const d = defaultApplied();
        setDraft(d);
        setApplied(d);
    }, []);

    const saveSearch = useCallback(() => {
        try {
            const payload = { ...applied };
            delete payload.page;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            showToast(gs.savedToast || 'Search saved.');
        } catch {
            showToast('Could not save.');
        }
    }, [applied, gs.savedToast, showToast]);

    const applySaved = useCallback(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const base = defaultApplied();
            const next = { ...base, ...parsed, page: 1 };
            setDraft(next);
            setApplied(next);
        } catch {
            /* ignore */
        }
    }, []);

    const clearSaved = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            showToast(gs.clearedToast || 'Cleared.');
        } catch {
            /* ignore */
        }
    }, [gs.clearedToast, showToast]);

    const setSort = useCallback(
        (column) => {
            setApplied((prev) => {
                if (prev.sortBy === column) {
                    return { ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' };
                }
                return { ...prev, sortBy: column, sortDir: 'asc' };
            });
        },
        []
    );

    const filteredSorted = useMemo(() => {
        const kw = (applied.keyword || '').trim().toLowerCase();
        const anyStatus =
            applied.statusForecasted || applied.statusActive || applied.statusClosed;

        let rows = catalog.filter((g) => {
            if (kw) {
                const blob = `${g.title} ${g.description || ''}`.toLowerCase();
                if (!blob.includes(kw)) return false;
            }
            if (anyStatus) {
                const ok =
                    (applied.statusForecasted && g.status === 'forecasted') ||
                    (applied.statusActive && g.status === 'active') ||
                    (applied.statusClosed && g.status === 'closed');
                if (!ok) return false;
            }
            if (applied.postAwardOnly && !g.postAwardInfo) return false;
            if (applied.excludeLoans && g.isLoan) return false;
            if (applied.excludeMatchRequired && g.matchRequired) return false;
            if (applied.agency && g.agency !== applied.agency) return false;
            if (applied.category && g.category !== applied.category) return false;
            if (applied.eligibleApplicant && g.eligibleApplicant !== applied.eligibleApplicant) return false;
            if (applied.disbursementMethod && g.disbursementMethod !== applied.disbursementMethod) return false;
            return true;
        });

        const dir = applied.sortDir === 'desc' ? -1 : 1;
        rows = [...rows].sort((a, b) => {
            if (applied.sortBy === 'title') {
                return dir * a.title.localeCompare(b.title);
            }
            if (applied.sortBy === 'openDate') {
                return dir * (parseSortDate(a.openDate) - parseSortDate(b.openDate));
            }
            if (applied.sortBy === 'funding') {
                const av = a.estimatedTotal ?? -1;
                const bv = b.estimatedTotal ?? -1;
                return dir * (av - bv);
            }
            return dir * (parseSortDate(a.deadline) - parseSortDate(b.deadline));
        });

        return rows;
    }, [catalog, applied]);

    const total = filteredSorted.length;
    const pageSize = applied.pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const effectivePage = Math.min(Math.max(1, applied.page), totalPages);
    const startIdx = (effectivePage - 1) * pageSize;
    const pageRows = filteredSorted.slice(startIdx, startIdx + pageSize);
    const displayStart = total === 0 ? 0 : startIdx + 1;
    const displayEnd = startIdx + pageRows.length;

    const rangeText = (gs.displayRange || 'Displaying {start} – {end} of {total}')
        .replace('{start}', String(displayStart))
        .replace('{end}', String(displayEnd))
        .replace('{total}', String(total));

    const sortIndicator = (col) => {
        if (applied.sortBy !== col) return null;
        return applied.sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    const SortableTh = ({ col, label }) => (
        <th className="px-3 py-3 text-left">
            <button
                type="button"
                onClick={() => setSort(col)}
                className="text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900"
            >
                {label}
                {sortIndicator(col)}
            </button>
        </th>
    );

    return (
        <main id="grants-search-main" className="bg-slate-50 pb-16 pt-20 md:pt-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1
                            className="text-4xl font-black tracking-tighter text-slate-900 md:text-5xl"
                            style={{ fontFamily: template?.typography?.fontFamily }}
                        >
                            {gs.pageTitle || 'Find grants'}
                        </h1>
                        <p className="mt-2 max-w-2xl text-slate-600">{gs.intro}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                        <span className="font-semibold text-slate-700">{gs.helpfulResources || 'Resources'}:</span>
                        <a href={gs.glossaryHref || '#'} className="font-medium hover:underline" style={{ color: accentColor }}>
                            {gs.glossaryLabel || 'Glossary'}
                        </a>
                        <a href={gs.faqHref || '#'} className="font-medium hover:underline" style={{ color: accentColor }}>
                            {gs.faqLabel || 'FAQ'}
                        </a>
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={saveSearch}
                        className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                        {gs.saveSearch || 'Save current search'}
                    </button>
                    <button
                        type="button"
                        onClick={applySaved}
                        className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                        {gs.applySaved || 'Apply saved search'}
                    </button>
                    <button
                        type="button"
                        onClick={clearSaved}
                        className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
                    >
                        {gs.clearSaved || 'Clear saved'}
                    </button>
                </div>
                {toast && (
                    <p className="mb-4 text-sm font-medium text-slate-700" role="status">
                        {toast}
                    </p>
                )}

                <div className="grid gap-8 lg:grid-cols-12">
                    <aside className="lg:col-span-4">
                        <div className="rounded-[32px] border border-black/[0.06] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                            <h2 className="mb-4 text-lg font-extrabold tracking-tighter text-slate-900">
                                {gs.refineHeading || 'Refine results'}
                            </h2>

                            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="grant-keyword">
                                {gs.keywordLabel || 'Keyword'}
                            </label>
                            <p className="mb-2 text-xs text-slate-500">{gs.keywordHint}</p>
                            <input
                                id="grant-keyword"
                                type="search"
                                value={draft.keyword}
                                onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))}
                                placeholder={gs.keywordPlaceholder || ''}
                                className="mb-6 w-full rounded-2xl border border-black/[0.08] px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-[var(--primary-color,#5D5FEF)]"
                            />

                            <p className="mb-2 text-sm font-semibold text-slate-800">{gs.statusHeading || 'Show'}</p>
                            <div className="mb-4 flex flex-col gap-2">
                                {[
                                    ['statusForecasted', gs.statusForecasted || 'Forecasted'],
                                    ['statusActive', gs.statusActive || 'Active'],
                                    ['statusClosed', gs.statusClosed || 'Closed'],
                                ].map(([key, label]) => (
                                    <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={draft[key]}
                                            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
                                            className="rounded border-slate-300"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>

                            <label className="mb-2 flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={draft.postAwardOnly}
                                    onChange={(e) => setDraft((d) => ({ ...d, postAwardOnly: e.target.checked }))}
                                    className="rounded border-slate-300"
                                />
                                {gs.postAwardLabel || 'Post-award only'}
                            </label>
                            <p className="mb-3 ml-6 text-xs text-slate-500">{gs.postAwardHint}</p>

                            <label className="mb-2 flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={draft.excludeLoans}
                                    onChange={(e) => setDraft((d) => ({ ...d, excludeLoans: e.target.checked }))}
                                    className="rounded border-slate-300"
                                />
                                {gs.excludeLoansLabel || 'Exclude loans'}
                            </label>
                            <label className="mb-6 flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={draft.excludeMatchRequired}
                                    onChange={(e) => setDraft((d) => ({ ...d, excludeMatchRequired: e.target.checked }))}
                                    className="rounded border-slate-300"
                                />
                                {gs.excludeMatchLabel || 'Exclude match funding'}
                            </label>

                            {[
                                ['agency', gs.filterAgencyLabel || 'Agency', filterOpts.agencies],
                                ['category', gs.filterCategoryLabel || 'Category', filterOpts.categories],
                                ['eligibleApplicant', gs.filterApplicantLabel || 'Eligible applicant', filterOpts.eligibleApplicants],
                                ['disbursementMethod', gs.filterDisbursementLabel || 'Disbursement', filterOpts.disbursementMethods],
                            ].map(([field, label, options]) => (
                                <div key={field} className="mb-4">
                                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor={`f-${field}`}>
                                        {label}
                                    </label>
                                    <select
                                        id={`f-${field}`}
                                        value={draft[field]}
                                        onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                                        className="w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-2.5 text-slate-900"
                                    >
                                        {(options || [{ value: '', label: gs.filterAny || 'Any' }]).map((o) => (
                                            <option key={o.value || 'any'} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    className="rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {gs.applyFilters || 'Apply filters'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="rounded-full border border-black/[0.1] px-6 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                >
                                    {gs.resetFilters || 'Reset'}
                                </button>
                            </div>
                        </div>
                    </aside>

                    <section className="lg:col-span-8">
                        {showFallbackNotice && (gs.fallbackNotice || '').trim() && (
                            <p
                                className="mb-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                                role="status"
                            >
                                {gs.fallbackNotice}
                            </p>
                        )}
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-extrabold tracking-tighter text-slate-900">
                                {gs.resultsHeading || 'Results'}
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                {grantsLoading && (
                                    <span className="font-medium text-slate-500">{gs.loadingResults || 'Loading…'}</span>
                                )}
                                <span>{rangeText}</span>
                                <label className="flex items-center gap-2">
                                    {gs.perPageLabel || 'Per page'}
                                    <select
                                        value={applied.pageSize}
                                        onChange={(e) => {
                                            const n = Number(e.target.value);
                                            setDraft((d) => ({ ...d, pageSize: n }));
                                            setApplied((p) => ({ ...p, pageSize: n, page: 1 }));
                                        }}
                                        className="rounded-xl border border-black/[0.08] px-2 py-1"
                                    >
                                        {[20, 50, 100].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                            <div className="overflow-x-auto">
                                <table className="min-w-[900px] w-full text-left text-sm text-slate-800">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/90">
                                            <SortableTh col="deadline" label={gs.colDeadline || 'Deadline'} />
                                            <SortableTh col="title" label={gs.colTitle || 'Title'} />
                                            <SortableTh col="openDate" label={gs.colOpenDate || 'Open date'} />
                                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                {gs.colAgency || 'Agency'}
                                            </th>
                                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                {gs.colMatch || 'Match?'}
                                            </th>
                                            <SortableTh col="funding" label={gs.colEstimated || 'Est. funding'} />
                                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                {gs.colRange || 'Range'}
                                            </th>
                                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                {gs.colDisbursement || 'Disbursement'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grantsLoading ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                                    {gs.loadingResults || 'Loading opportunities…'}
                                                </td>
                                            </tr>
                                        ) : pageRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                                    {gs.noResults || 'No results'}
                                                </td>
                                            </tr>
                                        ) : (
                                            pageRows.map((g) => {
                                                const statusLabel =
                                                    g.status === 'forecasted'
                                                        ? gs.statusLabelForecasted || 'Forecasted'
                                                        : g.status === 'closed'
                                                          ? gs.statusLabelClosed || 'Closed'
                                                          : gs.statusLabelActive || 'Active';
                                                const agencyLabel =
                                                    g.agencyDisplay ||
                                                    filterOpts.agencies?.find((o) => o.value === g.agency)?.label ||
                                                    g.agency ||
                                                    '—';
                                                const disbLabel =
                                                    filterOpts.disbursementMethods?.find((o) => o.value === g.disbursementMethod)
                                                        ?.label || g.disbursementMethod;
                                                return (
                                                    <tr key={g.id} className="border-b border-slate-100 last:border-0">
                                                        <td className="whitespace-nowrap px-3 py-3">
                                                            <span className="mr-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                                                {statusLabel}
                                                            </span>
                                                            {formatDisplayDate(g.deadline)}
                                                        </td>
                                                        <td className="max-w-[220px] px-3 py-3">
                                                            <span className="font-semibold" style={{ color: charcoal }}>
                                                                {g.title}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                                                            {formatDisplayDate(g.openDate)}
                                                        </td>
                                                        <td className="px-3 py-3 text-slate-700">{agencyLabel}</td>
                                                        <td className="whitespace-nowrap px-3 py-3">{g.matchFunding}</td>
                                                        <td className="whitespace-nowrap px-3 py-3 font-medium">
                                                            {formatMoney(g.estimatedTotal)}
                                                        </td>
                                                        <td className="px-3 py-3 text-slate-600">{g.rangeLowHigh}</td>
                                                        <td className="px-3 py-3 text-slate-600">{disbLabel}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {total > 0 && (
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                <button
                                    type="button"
                                    disabled={effectivePage <= 1}
                                    onClick={() => setApplied((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                    className="rounded-full border border-black/[0.08] px-5 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
                                >
                                    {gs.prevPage || 'Previous'}
                                </button>
                                <span className="text-sm text-slate-600">
                                    Page {effectivePage} of {totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={effectivePage >= totalPages}
                                    onClick={() => setApplied((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                                    className="rounded-full border border-black/[0.08] px-5 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
                                >
                                    {gs.nextPage || 'Next'}
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
