/**
 * Build JupyterLite launch URLs for OU Met catalog OPeNDAP files.
 */

const DEFAULT_BBOX = {
    latMin: 33,
    latMax: 37,
    lonMin: -103,
    lonMax: -94,
};

const DEFAULT_VARIABLE = 'Temperature_surface';

/**
 * @param {string} generatorBase - e.g. /api/notebook-generator or https://host
 * @param {string} sourceUrl - OPeNDAP URL
 * @param {Object} [opts]
 * @returns {string|null}
 */
export function buildGeneratorUrl(sourceUrl, generatorBase, opts = {}) {
    if (!sourceUrl || !sourceUrl.toLowerCase().includes('dods')) return null;

    const base = generatorBase.replace(/\/$/, '');
    const nbBase = base.endsWith('/nb') ? base : `${base}/nb`;
    const bbox = { ...DEFAULT_BBOX, ...opts.bbox };
    const params = new URLSearchParams({
        source_url: sourceUrl,
        lat_min: String(bbox.latMin),
        lat_max: String(bbox.latMax),
        lon_min: String(bbox.lonMin),
        lon_max: String(bbox.lonMax),
    });
    const variable = opts.variable || DEFAULT_VARIABLE;
    if (variable) params.set('variable', variable);
    return `${nbBase}?${params.toString()}`;
}

/**
 * @param {Object} jupyterliteConfig - template.elastic.jupyterlite
 * @param {string} sourceUrl
 * @param {Object} [opts]
 * @returns {string|null}
 */
export function buildJupyterLiteLaunchUrl(jupyterliteConfig, sourceUrl, opts = {}) {
    const liteBase = jupyterliteConfig?.url;
    const generatorBase = jupyterliteConfig?.generatorUrl;
    if (!liteBase || !generatorBase || !sourceUrl) return null;

    const nbUrl = buildGeneratorUrl(sourceUrl, generatorBase, opts);
    if (!nbUrl) return null;

    let lab = liteBase.replace(/\/$/, '');
    if (!lab.includes('/lab')) {
        lab = `${lab}/lab/index.html`;
    }
    return `${lab}?fromURL=${encodeURIComponent(nbUrl)}`;
}

/**
 * Prefer stored launch URL from Elasticsearch; fall back to client-side build.
 * @param {Object} row - catalog document
 * @param {Object} jupyterliteConfig
 * @returns {string|null}
 */
export function getCatalogLaunchUrl(row, jupyterliteConfig) {
    const source = row?.opendap_url || row?.source_url;
    const built = buildJupyterLiteLaunchUrl(jupyterliteConfig, source);
    return built || row?.jupyterlite_launch_url || null;
}
