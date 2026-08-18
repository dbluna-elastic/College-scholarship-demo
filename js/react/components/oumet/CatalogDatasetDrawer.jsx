/**
 * CatalogDatasetDrawer — THREDDS-style Access / Viewers panel for a catalog row.
 */

import { useEffect, useState } from 'react';
import { getCatalogLaunchUrl } from '../../../modules/utils/jupyterLiteLaunch.js';
import {
    formatFileSize,
    formatIsoDate,
    formatServiceType,
    getAccessServices,
    getPrimaryViewerAction,
} from './catalogAccessUi.js';

function CopyButton({ url, onCopied }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (event) => {
        event.stopPropagation();
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            onCopied?.();
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* ignore */
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
            {copied ? 'Copied' : 'Copy URL'}
        </button>
    );
}

export default function CatalogDatasetDrawer({
    dataset,
    onClose,
    primaryColor = '#003366',
    secondaryColor = '#4A90D9',
    jupyterlite = {},
}) {
    const [copyNotice, setCopyNotice] = useState('');

    useEffect(() => {
        if (!dataset) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [dataset, onClose]);

    if (!dataset) return null;

    const services = getAccessServices(dataset);
    const launchUrl = getCatalogLaunchUrl(dataset, jupyterlite);
    const primaryAction = getPrimaryViewerAction(dataset);
    const httpserverUrl = dataset.httpserver_url
        || services.find((s) => s.service === 'HTTPServer')?.url;
    const catalogPageUrl = dataset.catalog_page_url;
    const threddsNotebookUrl = catalogPageUrl
        ? `${catalogPageUrl.split('?')[0].replace('/catalog/', '/notebook/')}?catalog=${encodeURIComponent(dataset.url_path || '')}&filename=default_viewer.ipynb`
        : null;

    return (
        <>
            <button
                type="button"
                className="fixed inset-0 z-[120] bg-slate-900/35 backdrop-blur-[1px] border-0 p-0 cursor-default"
                aria-label="Close dataset details"
                onClick={onClose}
            />
            <aside
                className="fixed top-0 right-0 z-[121] h-full w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col"
                aria-labelledby="catalog-drawer-title"
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Dataset access</p>
                        <h2 id="catalog-drawer-title" className="text-lg font-bold text-gray-900 break-words">
                            {dataset.title || dataset.dataset_name || 'Catalog dataset'}
                        </h2>
                        {dataset.url_path && (
                            <p className="mt-1 text-xs text-gray-500 break-all font-mono">{dataset.url_path}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500">Feature type</p>
                            <p className="font-semibold text-gray-900">{dataset.feature_type || '—'}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500">Data size</p>
                            <p className="font-semibold text-gray-900">{formatFileSize(dataset.file_size_bytes)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500">Format</p>
                            <p className="font-semibold text-gray-900 uppercase">{dataset.file_format || '—'}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500">Modified</p>
                            <p className="font-semibold text-gray-900">{formatIsoDate(dataset.modified_at)}</p>
                        </div>
                    </div>

                    {(dataset.catalog_path || dataset.data_tier) && (
                        <div className="text-xs text-gray-600">
                            {dataset.data_tier && (
                                <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-800 mr-2 capitalize">
                                    {dataset.data_tier}
                                </span>
                            )}
                            {dataset.catalog_path && (
                                <span className="font-mono break-all">{dataset.catalog_path}</span>
                            )}
                        </div>
                    )}

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Access</h3>
                        {services.length === 0 ? (
                            <p className="text-sm text-gray-500">No access services indexed for this dataset.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-left text-gray-600">
                                        <tr>
                                            <th className="px-3 py-2 font-semibold">Service</th>
                                            <th className="px-3 py-2 font-semibold">Type</th>
                                            <th className="px-3 py-2 font-semibold">Description</th>
                                            <th className="px-3 py-2 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {services.map((service) => (
                                            <tr key={`${service.service}-${service.url}`}>
                                                <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">
                                                    {service.service}
                                                </td>
                                                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                                    {formatServiceType(service.service_type)}
                                                </td>
                                                <td className="px-3 py-3 text-gray-600 min-w-[10rem]">
                                                    {service.description}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-2">
                                                        <a
                                                            href={service.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md text-white hover:opacity-90"
                                                            style={{ backgroundColor: secondaryColor }}
                                                        >
                                                            Open
                                                        </a>
                                                        <CopyButton url={service.url} onCopied={() => setCopyNotice('URL copied to clipboard.')} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Viewers</h3>
                        <div className="space-y-3">
                            {primaryAction === 'jupyter' && launchUrl && (
                                <a
                                    href={launchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90"
                                    style={{ backgroundColor: secondaryColor }}
                                >
                                    Open in JupyterLite
                                </a>
                            )}
                            {primaryAction === 'download' && httpserverUrl && (
                                <a
                                    href={httpserverUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    Download file (HTTPServer)
                                </a>
                            )}
                            {catalogPageUrl && (
                                <a
                                    href={catalogPageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm font-semibold hover:underline"
                                    style={{ color: secondaryColor }}
                                >
                                    View on THREDDS catalog page →
                                </a>
                            )}
                            {threddsNotebookUrl && (
                                <a
                                    href={threddsNotebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-gray-600 hover:underline"
                                >
                                    Open TDS default_viewer.ipynb
                                </a>
                            )}
                            <p className="text-xs text-gray-500">
                                JupyterLite previews OPeNDAP subsets in the browser. NEXRAD Level-II files use HTTPServer download when OPeNDAP is unavailable.
                            </p>
                        </div>
                    </section>

                    {dataset.access_tier && dataset.access_tier !== 'public' && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            This dataset may require provisioning. Ask the catalog assistant to request access or auto-mount on your research VM.
                        </div>
                    )}
                </div>

                {copyNotice && (
                    <div className="border-t border-gray-100 px-5 py-3 text-xs text-emerald-700 bg-emerald-50">
                        {copyNotice}
                    </div>
                )}
            </aside>
        </>
    );
}
