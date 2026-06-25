/**
 * GamedayRevenuePanel — Tickets + stadium team-store retail (100-item bookstore catalog).
 * Data: paciolan-ticket-events, stadium-retail-catalog, stadium-retail-sales.
 */

import { useContext, useEffect, useMemo, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getGamedayRevenueSummary,
    getGamedayTicketRevenueByFanTier,
    getGamedayRetailByCategory,
    getGamedayTopRetailItems,
    getGamedayRetailCatalog,
    getGamedayRetailByLocation,
    GAMEDAY_AGENT,
} from '../../../modules/utils/gamedayEsqlQueries.js';

function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

function formatNumber(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString();
}

const CATEGORY_LABELS = {
    apparel: 'Apparel',
    headwear: 'Headwear',
    accessories: 'Accessories',
    drinkware: 'Drinkware',
    gifts_collectibles: 'Gifts & Collectibles',
    tailgate_outdoors: 'Tailgate & Outdoors',
    books_alumni: 'Books & Alumni',
    youth_kids: 'Youth & Kids',
    supplies: 'Supplies',
};

function formatCategory(value) {
    if (!value) return '—';
    return CATEGORY_LABELS[value] || String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function BarRow({ label, value, max, format = formatCurrency, accent }) {
    const pct = max > 0 ? Math.min(100, (Number(value) / max) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm gap-4">
                <span className="text-gray-700 truncate">{label}</span>
                <span className="font-semibold text-gray-900 shrink-0">{format(value)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: accent }} />
            </div>
        </div>
    );
}

export default function GamedayRevenuePanel() {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#0C2340';
    const secondaryColor = template?.colors?.secondary || '#F15A22';
    const kibanaUrl = (template?.elastic?.kibanaUrl || '').replace(/\/$/, '');
    const gameday = template?.elastic?.gamedayRevenue || {};
    const dashboards = gameday.dashboards || [];
    const agentId = template?.elastic?.gamedayDataAgentId || template?.elastic?.agents?.gameday || GAMEDAY_AGENT;
    const demoGameId = gameday.demoGameId || 'GAME-2025-HOME-01';
    const catalogSource = gameday.catalogSourceLabel || 'Campus bookstore catalog';

    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState(null);
    const [fanTiers, setFanTiers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [locations, setLocations] = useState([]);
    const [catalogFilter, setCatalogFilter] = useState('');

    useEffect(() => {
        let cancelled = false;
        setSummaryLoading(true);
        setSummaryError(null);

        Promise.all([
            getGamedayRevenueSummary(agentId),
            getGamedayTicketRevenueByFanTier(agentId),
            getGamedayRetailByCategory(agentId),
            getGamedayTopRetailItems(agentId, 15),
            getGamedayRetailCatalog(agentId),
            getGamedayRetailByLocation(agentId),
        ])
            .then(([sum, tiers, cats, top, catRows, locs]) => {
                if (cancelled) return;
                setSummary(sum);
                setFanTiers(tiers);
                setCategories(cats);
                setTopItems(top);
                setCatalog(catRows);
                setLocations(locs);
                setSummaryLoading(false);
            })
            .catch((err) => {
                if (!cancelled) {
                    setSummaryError(err?.message || 'Failed to load game day revenue data');
                    setSummaryLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [agentId]);

    const filteredCatalog = useMemo(() => {
        const q = catalogFilter.trim().toLowerCase();
        if (!q) return catalog;
        return catalog.filter((row) =>
            [row.sku, row.item_name, row.category, row.subcategory].some((v) =>
                String(v || '').toLowerCase().includes(q),
            ),
        );
    }, [catalog, catalogFilter]);

    const dashboardHref = (id) => `${kibanaUrl}/app/dashboards#/view/${id}`;
    const maxFanRevenue = Math.max(...fanTiers.map((r) => Number(r.revenue) || 0), 1);
    const maxCategoryRevenue = Math.max(...categories.map((r) => Number(r.revenue) || 0), 1);

    return (
        <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide text-white" style={{ backgroundColor: primaryColor }}>
                    Team store retail
                </span>
                <span className="text-sm text-gray-600">
                    {gameday.gameLabel || 'Home opener'} · <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{demoGameId}</code>
                </span>
                <span className="text-xs text-gray-500">
                    {catalogSource} · 100 stadium SKUs
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Combined Gameday Revenue</h4>
                    {summaryLoading ? (
                        <p className="text-3xl font-bold text-gray-400">Loading…</p>
                    ) : summaryError ? (
                        <p className="text-sm text-red-600">{summaryError}</p>
                    ) : (
                        <p className="text-2xl md:text-3xl font-black" style={{ color: primaryColor }}>
                            {formatCurrency(summary?.combinedRevenue)}
                        </p>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Ticket Revenue</h4>
                    {summaryLoading ? (
                        <p className="text-3xl font-bold text-gray-400">Loading…</p>
                    ) : (
                        <>
                            <p className="text-2xl font-black" style={{ color: secondaryColor }}>
                                {formatCurrency(summary?.ticketRevenue)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatNumber(summary?.ticketScans)} scans · avg {formatCurrency(summary?.avgTicketPrice)}
                            </p>
                        </>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Team Store Retail</h4>
                    {summaryLoading ? (
                        <p className="text-3xl font-bold text-gray-400">Loading…</p>
                    ) : (
                        <>
                            <p className="text-2xl font-black" style={{ color: secondaryColor }}>
                                {formatCurrency(summary?.retailRevenue)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatNumber(summary?.retailUnits)} units · {formatNumber(summary?.retailTransactions)} transactions
                            </p>
                        </>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Stadium SKU Catalog</h4>
                    {summaryLoading ? (
                        <p className="text-3xl font-bold text-gray-400">Loading…</p>
                    ) : (
                        <>
                            <p className="text-3xl font-black" style={{ color: primaryColor }}>
                                {catalog.length || summary?.catalogItemCount || 100}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Bookstore-style items at team stores</p>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Merchandise Revenue by Category</h3>
                    {categories.length === 0 ? (
                        <p className="text-gray-500 text-sm">No retail category data available.</p>
                    ) : (
                        <div className="space-y-4">
                            {categories.map((row, i) => (
                                <BarRow
                                    key={row.category || i}
                                    label={formatCategory(row.category)}
                                    value={row.revenue}
                                    max={maxCategoryRevenue}
                                    accent={primaryColor}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Ticket Revenue by Fan Tier</h3>
                    {fanTiers.length === 0 ? (
                        <p className="text-gray-500 text-sm">No ticket data available.</p>
                    ) : (
                        <div className="space-y-4">
                            {fanTiers.map((row, i) => (
                                <BarRow
                                    key={row.fan_tier || i}
                                    label={row.fan_tier || 'Unknown'}
                                    value={row.revenue}
                                    max={maxFanRevenue}
                                    accent={secondaryColor}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">Top Selling Items</h3>
                        <p className="text-xs text-gray-500 mt-1">Best performers from the 100-item stadium catalog</p>
                    </div>
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">SKU</th>
                                    <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Item</th>
                                    <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Units</th>
                                    <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topItems.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No sales data</td></tr>
                                ) : (
                                    topItems.map((row, i) => (
                                        <tr key={row.sku || i} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-3 font-mono text-xs text-gray-600">{row.sku}</td>
                                            <td className="px-6 py-3">
                                                <span className="font-medium text-gray-900">{row.item_name}</span>
                                                <span className="block text-xs text-gray-500">{formatCategory(row.category)}</span>
                                            </td>
                                            <td className="px-6 py-3">{formatNumber(row.units)}</td>
                                            <td className="px-6 py-3 font-semibold">{formatCurrency(row.revenue)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">Team Store Locations</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 font-semibold">Location</th>
                                    <th className="px-6 py-3 font-semibold">Units</th>
                                    <th className="px-6 py-3 font-semibold">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No location data</td></tr>
                                ) : (
                                    locations.map((row, i) => (
                                        <tr key={row.location_name || i} className="border-b border-gray-100">
                                            <td className="px-6 py-4 font-medium">{row.location_name}</td>
                                            <td className="px-6 py-4">{formatNumber(row.units)}</td>
                                            <td className="px-6 py-4">{formatCurrency(row.revenue)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm mb-8">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Stadium Retail Catalog</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            100 items aligned with campus bookstore merchandise — available at gameday team stores
                        </p>
                    </div>
                    <input
                        type="search"
                        value={catalogFilter}
                        onChange={(e) => setCatalogFilter(e.target.value)}
                        placeholder="Search SKU or item…"
                        className="px-4 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 min-w-[12rem]"
                    />
                </div>
                <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">SKU</th>
                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Item</th>
                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Category</th>
                                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCatalog.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No catalog items match your search.</td></tr>
                            ) : (
                                filteredCatalog.map((row, i) => (
                                    <tr key={row.sku || i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-6 py-3 font-mono text-xs text-gray-600">{row.sku}</td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{row.item_name}</td>
                                        <td className="px-6 py-3 text-gray-600">{formatCategory(row.category)}</td>
                                        <td className="px-6 py-3">{formatCurrency(row.unit_price)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="px-6 py-3 text-xs text-slate-500 border-t border-slate-100 bg-slate-50/80">
                    Showing {filteredCatalog.length} of {catalog.length} stadium SKUs · sourced from campus bookstore retail assortment
                </p>
            </div>

            {kibanaUrl && dashboards.length > 0 && (
                <div className="p-6 bg-white border border-gray-200 rounded-[32px] shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Game Day Kibana Dashboards</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Open live revenue and fan segment analytics for tickets and team store performance.
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        {dashboards.map((dash) => (
                            <a
                                key={dash.id}
                                href={dashboardHref(dash.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {dash.title}
                                <span aria-hidden>↗</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
