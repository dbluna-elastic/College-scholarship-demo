/**
 * OuMetResearcherProvisionPanel — single-researcher view of provisioning requests.
 */

import { useContext, useEffect, useMemo, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getField,
    getProvisioningRequestsForResearcher,
} from '../../../modules/utils/weatherQueries.js';

function formatDate(value) {
    if (value == null) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function statusBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'complete') return 'bg-green-100 text-green-800';
    if (s === 'pending') return 'bg-amber-100 text-amber-800';
    if (s === 'failed') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
}

function permissionBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'auto_approved' || s === 'approved') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (s === 'pending') return 'bg-violet-50 text-violet-800 border-violet-200';
    if (s === 'denied') return 'bg-red-50 text-red-800 border-red-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
}

function provisionBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'complete') return 'bg-green-50 text-green-800 border-green-200';
    if (s === 'in_progress') return 'bg-sky-50 text-sky-800 border-sky-200';
    if (s === 'pending') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (s === 'failed') return 'bg-red-50 text-red-800 border-red-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
}

function permissionLabel(status) {
    const map = {
        auto_approved: 'Auto-approved',
        approved: 'Permission granted',
        pending: 'Permission pending',
        denied: 'Permission denied',
    };
    return map[String(status || '').toLowerCase()] || status || '—';
}

function provisionLabel(status) {
    const map = {
        pending: 'Awaiting provision',
        in_progress: 'Provisioning',
        complete: 'Provisioned',
        failed: 'Provision failed',
        not_required: 'N/A',
    };
    return map[String(status || '').toLowerCase()] || status || '—';
}

function deliveryLabel(mode) {
    const m = String(mode || '').toLowerCase();
    if (m === 'direct') return 'Direct OPeNDAP';
    if (m === 'auto_mount') return 'Auto-mount';
    if (m === 'approval_required') return 'Approval required';
    return mode || '—';
}

function normalizeRow(row) {
    return {
        request_id: getField(row, 'request_id'),
        dataset_name: getField(row, 'dataset_name'),
        dataset_ref: getField(row, 'dataset_ref'),
        delivery_mode: getField(row, 'delivery_mode'),
        status: getField(row, 'status'),
        permission_status: getField(row, 'permission_status'),
        provision_status: getField(row, 'provision_status'),
        workflow_label: getField(row, 'workflow_label'),
        submitted_at: getField(row, 'submitted_at'),
        estimated_ready_at: getField(row, 'estimated_ready_at'),
        completed_at: getField(row, 'completed_at'),
        target_vm: getField(row, 'target_vm'),
        mount_path: getField(row, 'mount_path'),
        access_url: getField(row, 'access_url'),
    };
}

function canRerequest(row) {
    const permission = String(row.permission_status || '').toLowerCase();
    const provision = String(row.provision_status || '').toLowerCase();
    const status = String(row.status || '').toLowerCase();
    return permission === 'denied'
        || provision === 'failed'
        || status === 'completed'
        || status === 'complete';
}

function buildRerequestRow(row) {
    const approvalRequired = String(row.delivery_mode || '').toLowerCase() === 'approval_required';
    const eta = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    return {
        ...row,
        request_id: `req-rerequest-${Date.now()}`,
        status: 'pending',
        permission_status: approvalRequired ? 'pending' : 'auto_approved',
        provision_status: 'pending',
        workflow_label: approvalRequired
            ? 'Awaiting permission'
            : 'Auto-approved · Awaiting provisioning',
        submitted_at: new Date().toISOString(),
        estimated_ready_at: eta,
        completed_at: null,
        access_url: null,
    };
}

export default function OuMetResearcherProvisionPanel({ researcherId }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const secondaryColor = template?.colors?.secondary || '#4A90D9';
    const researcher = template?.content?.researcherDashboard || {};

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [submittingId, setSubmittingId] = useState(null);

    useEffect(() => {
        if (!researcherId) return undefined;

        let cancelled = false;
        setLoading(true);
        setError(null);

        getProvisioningRequestsForResearcher(researcherId)
            .then((rows) => {
                if (!cancelled) {
                    setRequests(rows.map(normalizeRow));
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load your data requests');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [researcherId]);

    const stats = useMemo(() => {
        const pending = requests.filter((r) => String(r.status).toLowerCase() === 'pending').length;
        const complete = requests.filter((r) => ['completed', 'complete'].includes(String(r.status).toLowerCase())).length;
        const denied = requests.filter((r) => String(r.permission_status).toLowerCase() === 'denied').length;
        const active = requests.filter((r) => String(r.provision_status).toLowerCase() === 'in_progress').length;
        return { total: requests.length, pending, complete, denied, active };
    }, [requests]);

    const handleRerequest = (row) => {
        const requestId = row.request_id;
        if (!requestId || submittingId) return;

        setSubmittingId(requestId);
        setNotice(null);

        window.setTimeout(() => {
            const next = buildRerequestRow(row);
            setRequests((prev) => [next, ...prev]);
            setNotice(`New access request submitted for ${row.dataset_name}. You will receive email updates as provisioning progresses.`);
            setSubmittingId(null);
        }, 600);
    };

    return (
        <div className="space-y-8">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-600">
                    Signed in as
                    {' '}
                    <strong>{researcher.demoResearcherName || researcherId}</strong>
                    {' '}
                    (
                    {researcher.demoResearcherEmail || `${researcherId}@ou.edu`}
                    )
                    {' '}
                    · VM:
                    {' '}
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{researcher.demoTargetVm || 'researcher-vm.met.ou.edu'}</code>
                </p>
            </div>

            {stats.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: 'My requests', value: stats.total },
                        { label: 'In progress', value: stats.pending + stats.active },
                        { label: 'Ready', value: stats.complete },
                        { label: 'Denied', value: stats.denied },
                        { label: 'Provisioning now', value: stats.active },
                    ].map((kpi) => (
                        <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                            <p className="text-xs text-gray-500">{kpi.label}</p>
                            <p className="text-xl font-black mt-0.5" style={{ color: primaryColor }}>
                                {kpi.value.toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {notice && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    {notice}
                </div>
            )}

            {loading && (
                <p className="text-gray-500 text-sm">Loading your data requests…</p>
            )}

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {error}
                </div>
            )}

            {!loading && !error && requests.length === 0 && (
                <p className="text-gray-500 text-sm">No data access requests on file for this account.</p>
            )}

            {!loading && !error && requests.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-sm" style={{ minWidth: '56rem' }}>
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3 font-semibold whitespace-nowrap">Request ID</th>
                                <th className="px-4 py-3 font-semibold">Dataset</th>
                                <th className="px-4 py-3 font-semibold">Workflow</th>
                                <th className="px-4 py-3 font-semibold whitespace-nowrap">Permission</th>
                                <th className="px-4 py-3 font-semibold whitespace-nowrap">Provisioning</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold whitespace-nowrap">Submitted</th>
                                <th className="px-4 py-3 font-semibold">Access</th>
                                <th className="px-4 py-3 font-semibold whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.map((row) => {
                                const requestId = row.request_id;
                                const running = submittingId === requestId;
                                const showRerequest = canRerequest(row);

                                return (
                                    <tr key={requestId || JSON.stringify(row)} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-xs">{requestId ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{row.dataset_name ?? '—'}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[10rem]">{row.dataset_ref}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{deliveryLabel(row.delivery_mode)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[11rem]">
                                            {row.workflow_label || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${permissionBadgeClass(row.permission_status)}`}>
                                                {permissionLabel(row.permission_status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${provisionBadgeClass(row.provision_status)}`}>
                                                {provisionLabel(row.provision_status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                                                {running ? 'submitting…' : (row.status ?? '—')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                                            {formatDate(row.submitted_at)}
                                            <div className="text-gray-400">{formatDate(row.estimated_ready_at || row.completed_at)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {row.access_url ? (
                                                <a
                                                    href={row.access_url.startsWith('http') ? row.access_url : `https://${row.access_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold hover:underline"
                                                    style={{ color: secondaryColor }}
                                                >
                                                    Open mount
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {showRerequest ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRerequest(row)}
                                                    disabled={!!submittingId}
                                                    className="inline-flex items-center justify-center px-3 py-2 text-xs font-bold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                                    style={{ backgroundColor: primaryColor }}
                                                >
                                                    {running ? 'Submitting…' : 'Re-request access'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">In queue</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
