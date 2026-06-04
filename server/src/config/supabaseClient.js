import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ─────────────────────────────────────────────────────────
// PRIMARY SUPABASE CLIENT (SINGLE SOURCE OF TRUTH)
// All modules MUST use this. No more inline createClient().
// Project: bumxgscngzjadyozdpce.supabase.co
// ─────────────────────────────────────────────────────────
const CHAT_URL = process.env.SUPABASE_CHAT_URL;
const CHAT_KEY = process.env.SUPABASE_CHAT_KEY;

let _primaryClient = null;

/**
 * Returns the centralized Supabase client.
 * Lazy singleton — created on first call, reused thereafter.
 *
 * PgBouncer Compatibility (Production/Staging):
 * When using Supabase's PgBouncer (port 6543), the client must be configured
 * with `db.schema` set explicitly and connection pooling awareness.
 * The JS SDK handles this via the REST API (PostgREST), not direct PG connections,
 * so the main optimization is ensuring we reuse a SINGLE client instance
 * across all PM2 workers (each worker creates exactly one client).
 */
export function getChatSb() {
    if (!_primaryClient) {
        if (!CHAT_URL || !CHAT_KEY) {
            console.error("❌ SUPABASE_CHAT_URL or SUPABASE_CHAT_KEY not set!");
            throw new Error("Supabase credentials missing");
        }
        _primaryClient = createClient(CHAT_URL, CHAT_KEY, {
            db: {
                schema: 'public',
            },
            auth: {
                persistSession: false,  // Server-side: no session persistence needed
                autoRefreshToken: false,
            },
            global: {
                headers: {
                    'x-connection-pool': 'pgbouncer', // Signal to Supabase for pool-aware routing
                },
            },
        });
        console.log(`✅ Supabase client initialized (PID: ${process.pid})`);
    }
    return _primaryClient;
}

// ─────────────────────────────────────────────────────────
// BACKWARD-COMPATIBLE OBJECT EXPORTS
// These previously pointed to separate Supabase projects.
// Now they ALL resolve to the same unified client.
// Used by: org-delete.service.js, admin.controller.js,
//          messaging.routes.js, notes.routes.js, etc.
// ─────────────────────────────────────────────────────────

// Proxy-based lazy accessor: behaves like a direct client object,
// but defers creation until first property access.
function createLazyClient() {
    return new Proxy({}, {
        get(_, prop) {
            const client = getChatSb();
            const value = client[prop];
            // Supabase methods require `this` to be the actual client instance, not the Proxy object.
            return typeof value === 'function' ? value.bind(client) : value;
        }
    });
}

export const primarySupabaseClient = createLazyClient();
export const classroomClient = createLazyClient();
export const studentNotesClient = createLazyClient();
