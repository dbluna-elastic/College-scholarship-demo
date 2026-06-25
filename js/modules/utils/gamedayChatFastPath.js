/**
 * gameday-revenue-data Agent Builder fast path — stadium retail catalog & sales.
 */

import {
    getGamedayRevenueSummary,
    getGamedayRetailByCategory,
    getGamedayTopRetailItems,
    getGamedayRetailCatalog,
    getGamedayRetailByLocation,
    getGamedayTicketRevenueByFanTier,
    GAMEDAY_AGENT,
} from './gamedayEsqlQueries.js';

export { GAMEDAY_AGENT };

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
    books_alumni: 'Books & Alumni',
    youth_kids: 'Youth & Kids',
};

function formatCategory(value) {
    if (!value) return '—';
    return CATEGORY_LABELS[value] || String(value).replace(/_/g, ' ');
}

function matchGamedayIntent(message) {
    const q = message.trim().toLowerCase();
    const sku = message.match(/\b(TC-[A-Z]{3}-\d{3})\b/i)?.[1];
    const gameId = message.match(/\b(GAME-\d{4}-[A-Z0-9-]+)\b/i)?.[1];

    if (sku) return { type: 'sku', sku };

    if (/\b(catalog|100 item|100 sku|what.*sell|merchandise list|team store item)/.test(q)) {
        return { type: 'catalog' };
    }

    if (/\b(top sell|bestsell|best seller|most popular|hot item)/.test(q)) {
        return { type: 'topItems' };
    }

    if (/\b(total|combined|overall)\b.*\b(revenue|gameday|game day)\b/.test(q)
        || /\bgameday revenue\b/.test(q)
        || /\bhow much\b.*\b(revenue|made|earned)\b/.test(q)) {
        return { type: 'summary' };
    }

    if (/\bfan tier\b|\bfan segment\b|\bpremium\b.*\balumni\b/.test(q)) {
        return { type: 'fanTier' };
    }

    if (/\b(apparel|jersey|hoodie|headwear|drinkware|merch|retail|team store)\b.*\b(category|breakdown|revenue)/.test(q)
        || /\bmerchandise by category\b/.test(q)) {
        return { type: 'categories' };
    }

    if (/\bteam store\b|\blocation\b|\bpro shop\b|\bpavilion shop\b/.test(q)) {
        return { type: 'locations' };
    }

    if (/\bticket\b.*\brevenue\b|\bscan\b/.test(q) && !/\bretail\b|\bmerch\b/.test(q)) {
        return { type: 'fanTier' };
    }

    if (gameId) return { type: 'gameId', gameId };

    if (/\bretail\b|\bmerch\b|\bstore\b/.test(q)) {
        return { type: 'topItems' };
    }

    return null;
}

export async function tryGamedayChatFastPath(agentId, message) {
    if (agentId !== GAMEDAY_AGENT) return null;

    const intent = matchGamedayIntent(message);
    if (!intent) return null;

    try {
        if (intent.type === 'summary') {
            const summary = await getGamedayRevenueSummary(agentId);
            if (summary.combinedRevenue == null && summary.ticketRevenue == null) return null;
            return {
                output: [
                    '**Game Day Revenue Summary**',
                    `- **${formatCurrency(summary.combinedRevenue)}** combined (tickets + team store retail)`,
                    `- **${formatCurrency(summary.ticketRevenue)}** tickets (${formatNumber(summary.ticketScans)} scans)`,
                    `- **${formatCurrency(summary.retailRevenue)}** team store retail (${formatNumber(summary.retailUnits)} units, ${formatNumber(summary.retailTransactions)} transactions)`,
                    `- **100** stadium SKUs in the campus bookstore catalog`,
                ].join('\n'),
            };
        }

        if (intent.type === 'catalog') {
            const rows = await getGamedayRetailCatalog(agentId);
            if (!rows.length) return { output: 'Stadium retail catalog is empty.' };
            const lines = rows.slice(0, 12).map((row) =>
                `- **${row.sku}** — ${row.item_name} (${formatCategory(row.category)}, ${formatCurrency(row.unit_price)})`,
            );
            return {
                output: `**Stadium Retail Catalog** (${rows.length} SKUs)\n\n${lines.join('\n')}\n\n_Showing 12 of ${rows.length}. Ask about a category or SKU for more detail._`,
            };
        }

        if (intent.type === 'topItems') {
            const rows = await getGamedayTopRetailItems(agentId, 10);
            if (!rows.length) return { output: 'No retail sales data found.' };
            const lines = rows.map((row, i) =>
                `${i + 1}. **${row.item_name}** (${row.sku}) — ${formatNumber(row.units)} units, ${formatCurrency(row.revenue)}`,
            );
            return { output: `**Top Selling Stadium Items**\n\n${lines.join('\n')}` };
        }

        if (intent.type === 'categories') {
            const rows = await getGamedayRetailByCategory(agentId);
            if (!rows.length) return { output: 'No retail category data found.' };
            const lines = rows.map((row) =>
                `- **${formatCategory(row.category)}**: ${formatCurrency(row.revenue)} (${formatNumber(row.units)} units)`,
            );
            return { output: `**Team Store Revenue by Category**\n\n${lines.join('\n')}` };
        }

        if (intent.type === 'locations') {
            const rows = await getGamedayRetailByLocation(agentId);
            if (!rows.length) return { output: 'No team store location data found.' };
            const lines = rows.map((row) =>
                `- **${row.location_name}**: ${formatCurrency(row.revenue)} (${formatNumber(row.units)} units)`,
            );
            return { output: `**Team Store Locations**\n\n${lines.join('\n')}` };
        }

        if (intent.type === 'fanTier') {
            const rows = await getGamedayTicketRevenueByFanTier(agentId);
            if (!rows.length) return { output: 'No fan tier ticket data found.' };
            const lines = rows.map((row) =>
                `- **${row.fan_tier}**: ${formatCurrency(row.revenue)} (${formatNumber(row.scans)} scans)`,
            );
            return { output: `**Ticket Revenue by Fan Tier**\n\n${lines.join('\n')}` };
        }

        if (intent.type === 'sku') {
            const catalog = await getGamedayRetailCatalog(agentId);
            const item = catalog.find((r) => r.sku === intent.sku);
            if (!item) return { output: `SKU **${intent.sku}** not found in the 100-item stadium catalog.` };
            return {
                output: [
                    `**${item.item_name}** (${item.sku})`,
                    `- Category: ${formatCategory(item.category)}`,
                    `- List price: **${formatCurrency(item.unit_price)}**`,
                    `- Available at stadium team stores: ${item.available_stadium ? 'Yes' : 'No'}`,
                ].join('\n'),
            };
        }

        if (intent.type === 'gameId') {
            const summary = await getGamedayRevenueSummary(agentId);
            return {
                output: [
                    `**${intent.gameId}** retail & tickets`,
                    `- Team store retail: **${formatCurrency(summary.retailRevenue)}** (${formatNumber(summary.retailUnits)} units)`,
                    `- Ticket revenue: **${formatCurrency(summary.ticketRevenue)}** (${formatNumber(summary.ticketScans)} scans)`,
                ].join('\n'),
            };
        }
    } catch (error) {
        console.warn('Gameday chat fast path failed, falling back to agent:', error.message);
        return null;
    }

    return null;
}
