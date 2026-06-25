/**
 * Game Day Revenue ESQL helpers — paciolan tickets + stadium retail catalog/sales.
 */

export const GAMEDAY_AGENT = 'gameday-revenue-data';

export {
    getGamedayRevenueSummary,
    getGamedayTicketRevenueByFanTier,
    getGamedayTicketRevenueByType,
    getGamedayGateTraffic,
    getGamedayRetailByCategory,
    getGamedayTopRetailItems,
    getGamedayRetailCatalog,
    getGamedayRetailByLocation,
    getGamedayHourlyGateScans,
} from './esqlQueries.js';
