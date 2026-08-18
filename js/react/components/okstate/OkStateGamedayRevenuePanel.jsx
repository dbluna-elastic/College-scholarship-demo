/**
 * OkStateGamedayRevenuePanel — Boone Pickens tickets + Square POS concessions/merch.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getOkstateGamedaySummary,
    getOkstatePosByStand,
    getOkstatePosByCategory,
    getOkstatePosByZone,
    getOkstatePosAnomalyWindow,
    getOkstateTicketByFanTier,
    getOkstateTicketByGate,
    OKSTATE_GAMEDAY_AGENT,
    OKSTATE_GAME_ID,
    OKSTATE_ANOMALY_STAND_IDS,
} from '../../../modules/utils/okstateGamedayQueries.js';

const STAND_LABELS = {
    S01: 'Boone Pickens North Beer Garden',
    S02: 'Cowboy Grill — Gate 1',
    S03: 'South End Zone Cantina',
    S04: 'Club Orange Premium Bar',
    S05: 'Student Section Snacks',
    S06: 'West Concourse Grill',
    S07: 'Cowboy Team Store — Main',
    S08: 'Cowboy Team Store — South',
    S09: 'East End Zone Bar',
    S10: 'Visiting Fan Concessions',
};

function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

function formatNumber(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString();
}

function formatCategory(value) {
    if (!value) return '—';
    return String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

export default function OkStateGamedayRevenuePanel() {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#111111';
    const secondaryColor = template?.colors?.secondary || '#FF7300';
    const gameday = template?.elastic?.gamedayRevenue || {};
    const agentId = template?.elastic?.gamedayDataAgentId || template?.elastic?.agents?.gameday || OKSTATE_GAMEDAY_AGENT;
    const demoGameId = gameday.demoGameId || OKSTATE_GAME_ID;
    const anomalyIds = gameday.anomalyStandIds || OKSTATE_ANOMALY_STAND_IDS;

    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState(null);
    const [stands, setStands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [zones, setZones] = useState([]);
    const [fanTiers, setFanTiers] = useState([]);
    const [gates, setGates] = useState([]);
    const [anomalyRows, setAnomalyRows] = useState([]);

    useEffect(() => {
        let cancelled = false;
        setSummaryLoading(true);
        setSummaryError(null);

        Promise.all([
            getOkstateGamedaySummary(agentId),
            getOkstatePosByStand(agentId),
            getOkstatePosByCategory(agentId),
            getOkstatePosByZone(agentId),
            getOkstateTicketByFanTier(agentId),
            getOkstateTicketByGate(agentId),
            getOkstatePosAnomalyWindow(agentId),
        ])
            .then(([sum, standRows, cats, zoneRows, tiers, gateRows, anomaly]) => {
                if (cancelled) return;
                setSummary(sum);
                setStands(standRows);
                setCategories(cats);
                setZones(zoneRows);
                setFanTiers(tiers);
                setGates(gateRows);
                setAnomalyRows(anomaly);
                setSummaryLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                setSummaryError(err?.message || 'Failed to load game day revenue');
                setSummaryLoading(false);
            });

        return () => { cancelled = true; };
    }, [agentId]);

    const maxStandRevenue = Math.max(...stands.map((r) => Number(r.revenue) || 0), 1);
    const maxCategoryRevenue = Math.max(...categories.map((r) => Number(r.revenue) || 0), 1);
    const maxZoneRevenue = Math.max(...zones.map((r) => Number(r.revenue) || 0), 1);
    const maxFanRevenue = Math.max(...fanTiers.map((r) => Number(r.revenue) || 0), 1);
    const anomalyById = Object.fromEntries(anomalyRows.map((row) => [row.stand_id, row]));

    return (
        <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide text-white" style={{ backgroundColor: primaryColor }}>
                    Boone Pickens POS
                </span>
                <span className="text-sm text-gray-600">
                    {gameday.gameLabel || 'Home opener'} · <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{demoGameId}</code>
                </span>
                <span className="text-xs text-gray-500">Tickets + Square concessions &amp; Cowboy Team Store</span>
            </div>

            <div className="mb-8 rounded-[32px] border border-amber-200 bg-amber-50 px-6 py-5">
                <h3 className="text-sm font-bold tracking-tight text-amber-950 mb-1">Payment processor outage · 15:50–16:05 UTC</h3>
                <p className="text-sm text-amber-900 mb-3">
                    Club Orange, West Concourse Grill, and East End Zone Bar drop to near-zero transactions during this window.
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                    {anomalyIds.map((id) => {
                        const row = anomalyById[id];
                        const txns = Number(row?.txns || 0);
                        return (
                            <span key={id} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 border border-amber-200">
                                <span className="font-semibold text-gray-900">{id} {STAND_LABELS[id]}</span>
                                <span className="text-gray-600">{formatNumber(txns)} txns</span>
                            </span>
                        );
                    })}
                </div>
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
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Square POS Revenue</h4>
                    {summaryLoading ? (
                        <p className="text-3xl font-bold text-gray-400">Loading…</p>
                    ) : (
                        <>
                            <p className="text-2xl font-black" style={{ color: secondaryColor }}>
                                {formatCurrency(summary?.posRevenue)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatNumber(summary?.posUnits)} units · {formatNumber(summary?.posTransactions)} transactions
                            </p>
                        </>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Ticket Resale Scans</h4>
                    {summaryLoading ? (
                        <p className="text-3xl font-bold text-gray-400">Loading…</p>
                    ) : (
                        <>
                            <p className="text-3xl font-black" style={{ color: primaryColor }}>
                                {formatNumber(summary?.resaleScans)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Secondary-market Paciolan scans</p>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tighter text-gray-900 mb-4">POS Revenue by Stand</h3>
                    {stands.length === 0 ? (
                        <p className="text-gray-500 text-sm">No stand revenue available.</p>
                    ) : (
                        <div className="space-y-4">
                            {stands.map((row, i) => (
                                <BarRow
                                    key={row.stand_id || i}
                                    label={`${row.stand_id} ${row.stand_name || STAND_LABELS[row.stand_id] || ''}`}
                                    value={row.revenue}
                                    max={maxStandRevenue}
                                    accent={primaryColor}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tighter text-gray-900 mb-4">Concessions &amp; Merch by Category</h3>
                    {categories.length === 0 ? (
                        <p className="text-gray-500 text-sm">No category data available.</p>
                    ) : (
                        <div className="space-y-4">
                            {categories.map((row, i) => (
                                <BarRow
                                    key={row.category || i}
                                    label={formatCategory(row.category)}
                                    value={row.revenue}
                                    max={maxCategoryRevenue}
                                    accent={secondaryColor}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tighter text-gray-900 mb-4">Revenue by Zone</h3>
                    {zones.length === 0 ? (
                        <p className="text-gray-500 text-sm">No zone data available.</p>
                    ) : (
                        <div className="space-y-4">
                            {zones.map((row, i) => (
                                <BarRow
                                    key={row.stand_zone || i}
                                    label={row.stand_zone}
                                    value={row.revenue}
                                    max={maxZoneRevenue}
                                    accent={primaryColor}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tighter text-gray-900 mb-4">Tickets by Fan Tier</h3>
                    {fanTiers.length === 0 ? (
                        <p className="text-gray-500 text-sm">No fan tier data available.</p>
                    ) : (
                        <div className="space-y-4">
                            {fanTiers.map((row, i) => (
                                <BarRow
                                    key={row.fan_tier || i}
                                    label={row.fan_tier}
                                    value={row.revenue}
                                    max={maxFanRevenue}
                                    accent={secondaryColor}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold tracking-tighter text-gray-900">Gate Traffic</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 font-semibold">Gate</th>
                                    <th className="px-6 py-3 font-semibold">Scans</th>
                                    <th className="px-6 py-3 font-semibold">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gates.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No gate data</td></tr>
                                ) : (
                                    gates.map((row, i) => (
                                        <tr key={row.gate || i} className="border-b border-gray-100">
                                            <td className="px-6 py-3 font-medium">{row.gate}</td>
                                            <td className="px-6 py-3">{formatNumber(row.scans)}</td>
                                            <td className="px-6 py-3 font-semibold">{formatCurrency(row.revenue)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
