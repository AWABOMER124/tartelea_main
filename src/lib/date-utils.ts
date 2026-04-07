/**
 * Centralized date utilities - import from here instead of date-fns directly
 * This ensures only the Arabic locale is bundled (saves ~130KB)
 */
export { format, formatDistanceToNow, isAfter, isBefore, addDays, subDays, startOfDay, endOfDay, parseISO } from "date-fns";

// Import specific locale instead of all locales
import { ar as arLocale } from "date-fns/locale/ar";
export const ar = arLocale;
