/**
 * OuMetCatalogPanel — sample catalog results with THREDDS-style access drawer.
 */

import { useContext, useEffect, useMemo, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import { fetchElasticsearchSearchWithAgent } from '../../../modules/utils/elasticApi.js';
import { getCatalogLaunchUrl } from '../../../modules/utils/jupyterLiteLaunch.js';
import CatalogDatasetDrawer from './CatalogDatasetDrawer.jsx';
import { formatFileSize, getAccessServices, isFeaturedIrmaDataset } from './catalogAccessUi.js';

const SEARCH_AGENT = 'ok-fraud';

const SOURCE_FIELDS = [
    'title',
    'dataset_name',
    'data_tier',
    'file_format',
    'opendap_url',
    'httpserver_url',
    'cdmremote_url',
    'jupyterlite_launch_url',
    'temporal_start',
    'temporal_end',
    'file_size_bytes',
    'feature_type',
    'modified_at',
    'catalog_path',
    'url_path',
    'catalog_page_url',
    'access_services',
    'access_tier',
    'file_id',
];

export default function OuMetCatalogPanel({ embedded = false }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const secondaryColor = template?.colors?.secondary || '#4A90D9';
    const jupyterlite = template?.elastic?.jupyterlite || {};
    const kibanaUrl = (template?.elastic?.kibanaUrl || '').replace(/\/$/, '');
    const dashboardId = template?.elastic?.dashboards?.[0]?.id || 'ou-met-catalog-dashboard';
    const catalogIndex = template?.elastic?.indexes?.catalog || 'ou-met-catalog';

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDataset, setSelectedDataset] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const query = {
            size: 20,
            sort: [{ temporal_start: { order: 'desc', unmapped_type: 'date' } }],
            query: {
                bool: {
                    should: [
                        { exists: { field: 'opendap_url' } },
                        { exists: { field: 'httpserver_url' } },
                        { exists: { field: 'url_path' } },
                    ],
                    minimum_should_match: 1,
                },
            },
            _source: SOURCE_FIELDS,
        };

        fetchElasticsearchSearchWithAgent(catalogIndex, query, SEARCH_AGENT)
            .then((data) => {
                if (!cancelled) {
                    setRows((data.hits?.hits ?? []).map((h) => h._source ?? {}));
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load catalog');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [catalogIndex]);

    const sortedRows = useMemo(() => {
        const copy = [...rows];
        copy.sort((a, b) => {
            const aFeatured = isFeaturedIrmaDataset(a) ? 1 : 0;
            const bFeatured = isFeaturedIrmaDataset(b) ? 1 : 0;
            if (aFeatured !== bFeatured) return bFeatured - aFeatured;
            return 0;
        });
        return copy;
    }, [rows]);

    const outerClass = embedded ? '' : 'py-16 bg-gray-50';
    const Wrapper = embedded ? 'div' : 'section';

    return (
        <Wrapper id={embedded ? undefined : 'catalog'} className={outerClass}>
            <div className={embedded ? '' : 'max-w-7xl mx-auto px-4'}>
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <h2
                            className="text-4xl md:text-5xl font-black tracking-tighter mb-2"
                            style={{ color: primaryColor }}
                        >
                            Data Catalog
                        </h2>
                        <p className="text-gray-600 max-w-2xl text-sm">
                            Search results from the THREDDS metadata index. Click a row to open the
                            {' '}
                            <strong>Access</strong>
                            {' '}
                            panel (OPeNDAP, HTTPServer, CdmRemote) and preview in JupyterLite when available.
                        </p>
                    </div>
                    {kibanaUrl && (
                        <a
                            href={`${kibanaUrl}/app/dashboards#/view/${dashboardId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold hover:underline"
                            style={{ color: secondaryColor }}
                        >
                            Open full Kibana dashboard →
                        </a>
                    )}
                </div>

                {loading && <p className="text-gray-500 text-sm">Loading catalog samples…</p>}
                {error && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        {error}
                    </div>
                )}

                {!loading && !error && sortedRows.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Title</th>
                                    <th className="px-4 py-3 font-semibold">Dataset</th>
                                    <th className="px-4 py-3 font-semibold">Tier</th>
                                    <th className="px-4 py-3 font-semibold">Size</th>
                                    <th className="px-4 py-3 font-semibold">Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedRows.map((row, i) => {
                                    const launchUrl = getCatalogLaunchUrl(row, jupyterlite);
                                    const services = getAccessServices(row);
                                    const featured = isFeaturedIrmaDataset(row);
                                    return (
                                        <tr
                                            key={row.file_id || row.title || i}
                                            className={`hover:bg-sky-50/70 cursor-pointer ${featured ? 'bg-emerald-50/40' : ''}`}
                                            onClick={() => setSelectedDataset(row)}
                                        >
                                            <td className="px-4 py-3 font-medium max-w-xs">
                                                <div className="truncate">{row.title || '—'}</div>
                                                {featured && (
                                                    <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                                        Irma NEXRAD demo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{row.dataset_name || '—'}</td>
                                            <td className="px-4 py-3 capitalize">{row.data_tier || '—'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{formatFileSize(row.file_size_bytes)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {services.slice(0, 3).map((service) => (
                                                        <span
                                                            key={service.service}
                                                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700"
                                                        >
                                                            {service.service}
                                                        </span>
                                                    ))}
                                                    {launchUrl ? (
                                                        <span className="text-[11px] font-semibold" style={{ color: secondaryColor }}>
                                                            JupyterLite
                                                        </span>
                                                    ) : services.some((s) => s.service === 'HTTPServer') ? (
                                                        <span className="text-[11px] font-semibold text-gray-600">Download</span>
                                                    ) : null}
                                                    <span className="text-[11px] text-gray-400">View →</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="mt-4 text-xs text-gray-500">
                    Requires the notebook generator running (
                    <code className="bg-gray-100 px-1 rounded">uvicorn services.notebook_generator.app:app --port 8765</code>
                    ) with a public URL for remote JupyterLite.
                </p>
            </div>

            <CatalogDatasetDrawer
                dataset={selectedDataset}
                onClose={() => setSelectedDataset(null)}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                jupyterlite={jupyterlite}
            />
        </Wrapper>
    );
}
