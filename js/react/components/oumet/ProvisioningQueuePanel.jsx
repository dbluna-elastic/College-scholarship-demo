/**
 * ProvisioningQueuePanel — ops queue for OU Met data provisioning requests.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import { getField, getProvisioningRequests, getProvisioningStats } from '../../../modules/utils/weatherQueries.js';
import ProvisionWorkflowEmailOverlay, {
    buildProvisionDemoEmails,
} from './ProvisionWorkflowEmailOverlay.jsx';

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
    if (s === 'approved' || s === 'provisioning') return 'bg-blue-100 text-blue-800';
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
    if (s === 'not_required') return 'bg-gray-50 text-gray-500 border-gray-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
}

function permissionLabel(status) {
    const map = {
        auto_approved: 'Auto-approved',
        approved: 'Permission granted',
        pending: 'Permission pending',
        denied: 'Permission denied',
        none: 'No permission gate',
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
        researcher_id: getField(row, 'researcher_id'),
        researcher_email: getField(row, 'researcher_email'),
        target_vm: getField(row, 'target_vm'),
        mount_path: getField(row, 'mount_path'),
        access_url: getField(row, 'access_url'),
    };
}

function canApproveRow(row) {
    const permission = String(row.permission_status || '').toLowerCase();
    const provision = String(row.provision_status || '').toLowerCase();
    const status = String(row.status || '').toLowerCase();

    if (permission === 'pending') return true;
    if (['approved', 'auto_approved'].includes(permission) && provision === 'pending') return true;
    if (status === 'pending' && provision === 'pending') return true;
    return false;
}

function approveButtonLabel(row) {
    const permission = String(row.permission_status || '').toLowerCase();
    if (permission === 'pending') return 'Approve & provision';
    if (permission === 'auto_approved') return 'Run provisioning';
    return 'Run workflow';
}

export default function ProvisioningQueuePanel() {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const secondaryColor = template?.colors?.secondary || '#4A90D9';
    const kibanaUrl = (template?.elastic?.kibanaUrl || '').replace(/\/$/, '');
    const dashboards = template?.elastic?.dashboards || [];

    const [statusFilter, setStatusFilter] = useState('');
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [emailWorkflow, setEmailWorkflow] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        Promise.all([
            getProvisioningRequests(statusFilter),
            getProvisioningStats(),
        ])
            .then(([rows, summary]) => {
                if (!cancelled) {
                    setRequests(rows.map(normalizeRow));
                    setStats(summary);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load provisioning queue');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [statusFilter]);

    const completeApproval = (requestId, row) => {
        setApprovingId(null);
        setEmailWorkflow(null);
        setRequests((prev) => prev.map((r) => (
            r.request_id === requestId
                ? {
                    ...r,
                    status: 'completed',
                    permission_status: r.permission_status === 'pending' ? 'approved' : r.permission_status,
                    provision_status: 'complete',
                    workflow_label: 'Complete',
                    completed_at: new Date().toISOString(),
                    access_url: r.access_url || `${r.target_vm || 'researcher-vm-14.met.ou.edu'}:${r.mount_path || '/mnt/data'}`,
                }
                : r
        )));
        setStats((prev) => prev ? {
            ...prev,
            pending: Math.max(0, (prev.pending || 0) - 1),
            completed: (prev.completed || 0) + 1,
            awaitingPermission: Math.max(0, (prev.awaitingPermission || 0) - (row.permission_status === 'pending' ? 1 : 0)),
            awaitingProvision: Math.max(0, (prev.awaitingProvision || 0) - 1),
        } : prev);
    };

    const handleApprove = (row) => {
        const requestId = row.request_id;
        if (!requestId || approvingId) return;

        const { requestEmail, readyEmail } = buildProvisionDemoEmails(row);
        setApprovingId(requestId);
        setEmailWorkflow({
            requestId,
            row,
            step: 0,
            requestEmail,
            readyEmail,
        });
    };

    const handleDismissEmail = () => {
        if (!emailWorkflow) return;

        if (emailWorkflow.step === 0) {
            setEmailWorkflow((prev) => (prev ? { ...prev, step: 1 } : null));
            return;
        }

        completeApproval(emailWorkflow.requestId, emailWorkflow.row);
    };

    const activeEmail = emailWorkflow
        ? (emailWorkflow.step === 0 ? emailWorkflow.requestEmail : emailWorkflow.readyEmail)
        : null;

    const dismissLabel = emailWorkflow?.step === 0
        ? 'Click anywhere to continue to ready notification'
        : 'Click anywhere to finish';

    const filterOptions = [
        { id: '', label: 'All' },
        { id: 'awaiting_permission', label: 'Awaiting permission' },
        { id: 'awaiting_provision', label: 'Awaiting provisioning' },
        { id: 'auto_approved', label: 'Auto-approved' },
        { id: 'permission_granted', label: 'Permission granted' },
        { id: 'provisioning', label: 'Provisioning' },
        { id: 'pending', label: 'Status: pending' },
        { id: 'completed', label: 'Completed' },
        { id: 'failed', label: 'Failed' },
    ];

    return (
        <>
            <ProvisionWorkflowEmailOverlay
                email={activeEmail}
                onDismiss={handleDismissEmail}
                dismissLabel={dismissLabel}
            />

            <div className="space-y-8">
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { label: 'Total', value: stats.total },
                            { label: 'Awaiting permission', value: stats.awaitingPermission },
                            { label: 'Awaiting provision', value: stats.awaitingProvision },
                            { label: 'Auto-approved', value: stats.autoApproved },
                            { label: 'Provisioning', value: stats.provisioningActive },
                            { label: 'Completed', value: stats.completed },
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

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 w-full sm:w-auto">Filter:</span>
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.id || 'all'}
                            type="button"
                            onClick={() => setStatusFilter(opt.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                                statusFilter === opt.id ? 'text-white' : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                            style={statusFilter === opt.id ? { backgroundColor: secondaryColor } : undefined}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {loading && (
                    <p className="text-gray-500 text-sm">Loading provisioning queue…</p>
                )}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        {error}
                    </div>
                )}

                {!loading && !error && requests.length === 0 && (
                    <p className="text-gray-500 text-sm">No provisioning requests match the current filter.</p>
                )}

                {!loading && !error && requests.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm pr-1">
                        <table className="w-full text-sm" style={{ minWidth: '72rem' }}>
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Request ID</th>
                                    <th className="px-4 py-3 font-semibold">Dataset</th>
                                    <th className="px-4 py-3 font-semibold">Workflow</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Permission</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Provisioning</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Submitted</th>
                                    <th className="px-4 py-3 font-semibold">Researcher</th>
                                    <th className="sticky right-0 z-10 px-4 py-3 font-semibold whitespace-nowrap bg-gray-50 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.12)] min-w-[9.5rem]">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((row) => {
                                    const requestId = row.request_id;
                                    const running = approvingId === requestId;
                                    const canApprove = canApproveRow(row) && !approvingId;

                                    return (
                                        <tr key={requestId || JSON.stringify(row)} className="group hover:bg-gray-50">
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
                                                    {running ? 'provisioning…' : (row.status ?? '—')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                {formatDate(row.submitted_at)}
                                                <div className="text-gray-400">{formatDate(row.estimated_ready_at || row.completed_at)}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs">{row.researcher_id ?? '—'}</div>
                                                <div className="text-[10px] text-gray-500">{row.researcher_email}</div>
                                            </td>
                                            <td className="sticky right-0 z-10 px-4 py-3 whitespace-nowrap bg-white group-hover:bg-gray-50 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.12)] min-w-[9.5rem]">
                                                {canApprove ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(row)}
                                                        className="inline-flex items-center justify-center px-3 py-2 text-xs font-bold text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                                                        style={{ backgroundColor: primaryColor }}
                                                    >
                                                        {approveButtonLabel(row)}
                                                    </button>
                                                ) : running ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                                                        <span className="h-3 w-3 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
                                                        Running…
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {kibanaUrl && dashboards.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>Kibana dashboards</h3>
                        <ul className="space-y-2">
                            {dashboards.map((dash) => (
                                <li key={dash.id}>
                                    <a
                                        href={`${kibanaUrl}/app/dashboards#/view/${dash.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold hover:underline"
                                        style={{ color: secondaryColor }}
                                    >
                                        {dash.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    );
}
