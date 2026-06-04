import { primarySupabaseClient as supabase } from "../config/supabaseClient.js";

/**
 * Check if a given date falls on a marked holiday for the organization.
 * Supports both single-day and multi-day holidays (using end_date).
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {string} orgId - Organization ID
 * @returns {Promise<{isHoliday: boolean, holiday: object|null}>}
 */
export async function isHoliday(date, orgId) {
    if (!date || !orgId) return { isHoliday: false, holiday: null };

    const dateStr = typeof date === "string" ? date.split("T")[0] : new Date(date).toISOString().split("T")[0];

    try {
        // 1. Check legacy/dedicated Holidays Module (Single-day)
        const { data: singleDay, error: e1 } = await supabase
            .from("holidays")
            .select("id, title, date, end_date")
            .eq("org_id", orgId)
            .eq("date", dateStr)
            .eq("is_holiday", true)
            .limit(1);

        if (!e1 && singleDay && singleDay.length > 0) {
            return { isHoliday: true, holiday: singleDay[0] };
        }

        // 2. Check legacy/dedicated Holidays Module (Multi-day)
        const { data: multiDay, error: e2 } = await supabase
            .from("holidays")
            .select("id, title, date, end_date")
            .eq("org_id", orgId)
            .eq("is_holiday", true)
            .not("end_date", "is", null)
            .lte("date", dateStr)
            .gte("end_date", dateStr)
            .limit(1);

        if (!e2 && multiDay && multiDay.length > 0) {
            return { isHoliday: true, holiday: multiDay[0] };
        }

        // 3. Check holidays in the unified V3 Event Engine (org_events)
        const { data: holidays, error } = await supabase
            .from("org_events")
            .select("id, title, start_date, end_date")
            .eq("org_id", orgId)
            .eq("type", "holiday")
            .lte("start_date", `${dateStr}T23:59:59.999Z`);

        if (!error && holidays && holidays.length > 0) {
            // Find if any event holiday covers this date
            const targetTime = new Date(dateStr).getTime();
            
            const matchedHoliday = holidays.find(h => {
                const hStart = new Date(h.start_date).getTime();
                if (!h.end_date) {
                    return new Date(h.start_date).toISOString().split("T")[0] === dateStr;
                }
                const hEnd = new Date(h.end_date).getTime();
                return targetTime >= new Date(h.start_date.split('T')[0]).getTime() && 
                       targetTime <= new Date(h.end_date.split('T')[0]).getTime();
            });

            if (matchedHoliday) {
                return { isHoliday: true, holiday: matchedHoliday };
            }
        }

        return { isHoliday: false, holiday: null };
    } catch (err) {
        console.error("[holidayUtils] isHoliday check failed:", err.message);
        return { isHoliday: false, holiday: null };
    }
}
