/**
 * SNAP fraud detection ESQL helpers (snap-transactions, snap-stores, snap-households).
 */

import { fetchESQLQuery } from './elasticApi.js';

export const SNAP_FRAUD_AGENT = 'snap-fraud-investigator';

function mapEsqlRows(result) {
    if (!result?.columns || !result?.values) return [];
    const columns = result.columns.map((c) => c.name);
    return result.values.map((row) => {
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    });
}

async function runSnapEsql(query) {
    try {
        const result = await fetchESQLQuery(query, {}, SNAP_FRAUD_AGENT);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @returns {Promise<{transactions7d: number|null, flaggedStores: number|null, crossStateIds: number|null, deceasedTx: number|null}>} */
export async function getSnapOverviewStats() {
    const txRows = await runSnapEsql(
        'FROM snap-transactions | WHERE @timestamp > NOW() - 7 days | STATS transactions_7d = COUNT(*) | LIMIT 1'
    );

    const sameCentRows = await runSnapEsql(
        'FROM snap-transactions '
        + '| STATS total = COUNT(*), same_cent = COUNT(*) WHERE cents == 0 BY store_id '
        + '| EVAL pct_round = same_cent::double / total '
        + '| WHERE total > 50 AND pct_round > 0.6 '
        + '| STATS flagged_stores = COUNT(*) | LIMIT 1'
    );

    const crossStateRows = await runSnapEsql(
        'FROM snap-households '
        + '| STATS states = COUNT_DISTINCT(state) BY ssn_hash '
        + '| WHERE states > 1 '
        + '| STATS cross_state_ids = COUNT(*) | LIMIT 1'
    );

    const deceasedRows = await runSnapEsql(
        'FROM snap-transactions '
        + '| LOOKUP JOIN snap-households ON household_id '
        + '| WHERE status == "deceased" '
        + '| STATS deceased_tx = COUNT(*) | LIMIT 1'
    );

    const tx = txRows[0] || {};
    const sc = sameCentRows[0] || {};
    const cs = crossStateRows[0] || {};
    const dec = deceasedRows[0] || {};

    return {
        transactions7d: tx.transactions_7d != null ? Number(tx.transactions_7d) : null,
        flaggedStores: sc.flagged_stores != null ? Number(sc.flagged_stores) : null,
        crossStateIds: cs.cross_state_ids != null ? Number(cs.cross_state_ids) : null,
        deceasedTx: dec.deceased_tx != null ? Number(dec.deceased_tx) : null,
    };
}

/** @returns {Promise<Array<Object>>} */
export async function getSnapSameCentStores(limit = 10) {
    const query = `FROM snap-transactions
| STATS total = COUNT(*), same_cent = COUNT(*) WHERE cents == 0 BY store_id
| EVAL pct_round = same_cent::double / total
| WHERE total > 50 AND pct_round > 0.6
| SORT pct_round DESC
| LIMIT ${Math.min(limit, 20)}`;
    return runSnapEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getSnapManualEntryStores(limit = 10) {
    const query = `FROM snap-transactions
| STATS total = COUNT(*), manual = COUNT(*) WHERE entry_method == "manual" BY store_id
| EVAL pct_manual = manual::double / total
| WHERE total > 50 AND pct_manual > 0.3
| SORT pct_manual DESC
| LIMIT ${Math.min(limit, 20)}`;
    return runSnapEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getSnapCrossStateIds(limit = 10) {
    const query = `FROM snap-households
| STATS states = COUNT_DISTINCT(state), state_list = VALUES(state) BY ssn_hash
| WHERE states > 1
| SORT states DESC
| LIMIT ${Math.min(limit, 15)}`;
    return runSnapEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getSnapDeceasedTransactions(limit = 10) {
    const query = `FROM snap-transactions
| LOOKUP JOIN snap-households ON household_id
| WHERE status == "deceased"
| STATS tx_after_death = COUNT(*), total = SUM(amount) BY household_id
| SORT total DESC
| LIMIT ${Math.min(limit, 15)}`;
    return runSnapEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getSnapRapidBaskets(limit = 10) {
    const query = `FROM snap-transactions
| WHERE @timestamp > NOW() - 7 days
| STATS tx_count = COUNT(*), total_amt = SUM(amount) BY household_id, store_id, bucket = DATE_TRUNC(10 minutes, @timestamp)
| WHERE tx_count >= 3 AND total_amt > 100
| SORT total_amt DESC
| LIMIT ${Math.min(limit, 15)}`;
    return runSnapEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getSnapBalanceDrains(limit = 10) {
    const query = `FROM snap-transactions
| WHERE balance_after < 1.0
| STATS drains = COUNT(*), last_seen = MAX(@timestamp) BY household_id, store_id
| WHERE drains >= 2
| SORT drains DESC
| LIMIT ${Math.min(limit, 15)}`;
    return runSnapEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getSnapLargeBaskets(limit = 5) {
    const query = `FROM snap-transactions
| LOOKUP JOIN snap-stores ON store_id
| WHERE category == "convenience" AND amount > 30
| STATS big_baskets = COUNT(*), avg_amt = AVG(amount) BY store_id, name
| WHERE big_baskets > 20
| SORT avg_amt DESC
| LIMIT ${Math.min(limit, 10)}`;
    return runSnapEsql(query);
}

/** Combined top signals for staff table. @returns {Promise<Array<Object>>} */
export async function getSnapTopFlaggedEntities(limit = 12) {
    const [sameCent, manual, drains] = await Promise.all([
        getSnapSameCentStores(5),
        getSnapManualEntryStores(5),
        getSnapBalanceDrains(5),
    ]);

    const rows = [];

    sameCent.forEach((row) => {
        rows.push({
            entity_type: 'Store',
            entity_id: row.store_id,
            signal: 'Same-cent trafficking',
            metric: row.pct_round != null ? `${Math.round(Number(row.pct_round) * 100)}% round dollars` : '—',
            severity: 'high',
        });
    });

    manual.forEach((row) => {
        rows.push({
            entity_type: 'Store',
            entity_id: row.store_id,
            signal: 'Manual EBT entry',
            metric: row.pct_manual != null ? `${Math.round(Number(row.pct_manual) * 100)}% manual` : '—',
            severity: 'high',
        });
    });

    drains.forEach((row) => {
        rows.push({
            entity_type: 'Household/Store',
            entity_id: `${row.household_id} @ ${row.store_id}`,
            signal: 'Balance drain',
            metric: row.drains != null ? `${row.drains} drains` : '—',
            severity: 'medium',
        });
    });

    return rows.slice(0, limit);
}
