/**
 * Centered generic email notification overlay for OU Met provisioning demo.
 * Click anywhere to dismiss and advance the workflow.
 */

import { useEffect, useState } from 'react';

const FADE_MS = 450;

/**
 * @typedef {Object} DemoEmail
 * @property {string} from
 * @property {string} to
 * @property {string} subject
 * @property {string[]} bodyLines
 * @property {string} [tag]
 */

/**
 * @param {DemoEmail|null} email
 * @param {() => void} onDismiss
 * @param {string} [dismissLabel]
 */
export default function ProvisionWorkflowEmailOverlay({ email, onDismiss, dismissLabel = 'Click anywhere to continue' }) {
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        if (!email) {
            setOpacity(0);
            return undefined;
        }
        const fadeInTimer = setTimeout(() => setOpacity(1), 30);
        return () => clearTimeout(fadeInTimer);
    }, [email]);

    if (!email) return null;

    return (
        <button
            type="button"
            className="fixed inset-0 z-[200] flex items-center justify-center px-4 cursor-pointer border-0 bg-transparent p-0"
            onClick={onDismiss}
            aria-live="polite"
            aria-label="Provisioning notification email. Click to continue."
        >
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-[450ms]"
                style={{ opacity: opacity * 0.9 }}
            />
            <div
                className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl transition-all duration-[450ms] ease-out text-left"
                style={{
                    opacity,
                    transform: opacity ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
                }}
            >
                <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 rounded-t-xl">
                    <div className="flex gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-red-400" />
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        <span className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Mail — OU Met Data Services
                    </span>
                    {email.tag && (
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                            {email.tag}
                        </span>
                    )}
                </div>

                <div className="px-5 py-4 space-y-2 text-sm text-gray-800">
                    <div className="grid grid-cols-[4rem_1fr] gap-x-2 gap-y-1 text-xs">
                        <span className="text-gray-400 font-medium">From</span>
                        <span className="font-medium">{email.from}</span>
                        <span className="text-gray-400 font-medium">To</span>
                        <span>{email.to}</span>
                        <span className="text-gray-400 font-medium">Subject</span>
                        <span className="font-semibold text-gray-900">{email.subject}</span>
                    </div>

                    <hr className="border-gray-100 my-3" />

                    <div className="space-y-2 text-sm leading-relaxed text-gray-700">
                        {email.bodyLines.map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 rounded-b-xl text-center">
                    <span className="text-xs font-semibold text-sky-700">{dismissLabel}</span>
                </div>
            </div>
        </button>
    );
}

/**
 * Build demo emails for a provisioning approval workflow.
 * @param {Object} row
 * @returns {{ requestEmail: DemoEmail, readyEmail: DemoEmail }}
 */
export function buildProvisionDemoEmails(row) {
    const requestId = row.request_id || 'req-demo';
    const dataset = row.dataset_name || 'Dataset';
    const datasetRef = row.dataset_ref || dataset;
    const researcherEmail = row.researcher_email || 'researcher@ou.edu';
    const researcherId = row.researcher_id || 'researcher';
    const targetVm = row.target_vm || 'researcher-vm-14.met.ou.edu';
    const mountPath = row.mount_path || `/mnt/reanalysis/${String(dataset).toLowerCase()}`;
    const accessUrl = row.access_url || `${targetVm}:${mountPath}`;
    const deliveryMode = row.delivery_mode || 'auto_mount';

    const deliveryNote = deliveryMode === 'approval_required'
        ? 'An administrator has approved your restricted-data request. The mount workflow is now running.'
        : 'Your dataset has been approved for provisioning. The automated mount workflow is now running.';

    const requestEmail = {
        tag: 'Request received',
        from: 'OU Met Data Services <data-services@met.ou.edu>',
        to: researcherEmail,
        subject: `[OU Met] Data request received — ${dataset} (${requestId})`,
        bodyLines: [
            `Hello ${researcherId},`,
            `We received your request for ${datasetRef}.`,
            deliveryNote,
            `Request ID: ${requestId}`,
            `Estimated ready time: ${row.estimated_ready_at ? new Date(row.estimated_ready_at).toLocaleString() : 'within a few minutes'}.`,
            'You will receive a second email when the dataset is mounted on your VM.',
            '— OU School of Meteorology Data Provisioning',
        ],
    };

    const readyEmail = {
        tag: 'Ready',
        from: 'OU Met Data Services <data-services@met.ou.edu>',
        to: researcherEmail,
        subject: `[OU Met] Your dataset is ready — ${dataset} on ${targetVm}`,
        bodyLines: [
            `Hello ${researcherId},`,
            'Your requested dataset is now available on your research VM.',
            `VM: ${targetVm}`,
            `Mount path: ${mountPath}`,
            `Access: ${accessUrl}`,
            'To use in Jupyter: open a notebook and read files from the mount path above, or subset via the catalog OPeNDAP URL if direct access was granted.',
            `SSH: ssh your-username@${targetVm}`,
            'Contact data-services@met.ou.edu if you need help.',
            '— OU School of Meteorology Data Provisioning',
        ],
    };

    return { requestEmail, readyEmail };
}
