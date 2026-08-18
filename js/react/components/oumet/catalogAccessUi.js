/**
 * UI helpers for THREDDS-style catalog access panels.
 */

/**
 * @param {number|null|undefined} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes == null || Number.isNaN(Number(bytes))) return '—';
    const n = Number(bytes);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function formatIsoDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
}

/**
 * @param {Object} dataset
 * @returns {Array<{service: string, service_type: string, description: string, url: string}>}
 */
export function getAccessServices(dataset) {
    if (Array.isArray(dataset?.access_services) && dataset.access_services.length) {
        return dataset.access_services;
    }

    const fallback = [];
    if (dataset?.opendap_url) {
        fallback.push({
            service: 'OPENDAP',
            service_type: 'data_access',
            description: 'Access dataset through OPeNDAP using the DAP2 protocol.',
            url: dataset.opendap_url,
        });
    }
    if (dataset?.httpserver_url) {
        fallback.push({
            service: 'HTTPServer',
            service_type: 'data_access',
            description: 'HTTP file download.',
            url: dataset.httpserver_url,
        });
    }
    if (dataset?.cdmremote_url) {
        fallback.push({
            service: 'CdmRemote',
            service_type: 'data_access',
            description: 'Provides index subsetting on remote CDM datasets, using ncstream.',
            url: dataset.cdmremote_url,
        });
    }
    return fallback;
}

/**
 * @param {Object} dataset
 * @returns {'jupyter'|'download'|null}
 */
export function getPrimaryViewerAction(dataset) {
    if (dataset?.opendap_url) return 'jupyter';
    if (dataset?.httpserver_url || dataset?.file_format === 'nexrad_l2') return 'download';
    const services = getAccessServices(dataset);
    if (services.some((s) => s.service === 'HTTPServer')) return 'download';
    if (services.some((s) => s.service === 'OPENDAP')) return 'jupyter';
    return null;
}

/**
 * @param {string} serviceType
 * @returns {string}
 */
export function formatServiceType(serviceType) {
    if (!serviceType) return 'Data Access';
    return serviceType
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export const IRMA_KAMX_DATASET_HINT = 'Level2_KAMX_20170907_000116';

/**
 * @param {Object} row
 * @returns {boolean}
 */
export function isFeaturedIrmaDataset(row) {
    const text = `${row?.title || ''} ${row?.url_path || ''} ${row?.catalog_path || ''}`;
    return text.includes(IRMA_KAMX_DATASET_HINT);
}
