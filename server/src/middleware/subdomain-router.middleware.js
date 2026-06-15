/**
 * subdomain-router.middleware.js
 * 
 * MODULE 22: Multi-Tenant Subdomain Router
 * 
 * Extracts the organization (tenant) slug from the URL subdomain,
 * resolves it to a full Organization document with LRU caching,
 * and injects `req.tenantSlug` + `req.tenantOrg` for downstream use.
 * 
 * Supports: {subdomain}.classgrid.in, {subdomain}.localhost:3000
 * Ignores: www, app, admin, api, dev, staging
 */

import Organization from "../models/Organization.js";

// ─── In-Memory LRU Cache (TTL: 5 minutes) ───────────────────────────
const TENANT_CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 200;

function getCachedTenant(slug) {
    const entry = TENANT_CACHE.get(slug);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        TENANT_CACHE.delete(slug);
        return null;
    }
    return entry.org;
}

function setCachedTenant(slug, org) {
    // Evict oldest if at capacity
    if (TENANT_CACHE.size >= MAX_CACHE_SIZE) {
        const firstKey = TENANT_CACHE.keys().next().value;
        TENANT_CACHE.delete(firstKey);
    }
    TENANT_CACHE.set(slug, { org, timestamp: Date.now() });
}

/** Forcefully clear a single tenant from cache (call after subdomain change) */
export function invalidateTenantCache(slug) {
    TENANT_CACHE.delete(slug?.toLowerCase());
}

/** Clear entire tenant cache */
export function clearTenantCache() {
    TENANT_CACHE.clear();
}

// ─── System Subdomains (Never Resolve) ───────────────────────────────
const SYSTEM_SUBDOMAINS = new Set([
    "localhost", "127", "www", "app", "admin", "api", "dev", "staging", "mail", "ftp"
]);

// ─── Subdomain Extraction ────────────────────────────────────────────
function extractSlugFromHost(host) {
    if (!host) return null;

    const cleanHost = host.split(":")[0].toLowerCase(); // Remove port
    const parts = cleanHost.split(".");

    // localhost:  slug.localhost → parts = ["slug", "localhost"]
    // production: slug.classgrid.in → parts = ["slug", "classgrid", "in"]

    if (parts.length >= 2) {
        const candidate = parts[0];
        if (!SYSTEM_SUBDOMAINS.has(candidate) && candidate.length > 0) {
            return candidate;
        }
    }

    return null;
}

// ─── Phase 1: Extract Subdomain (runs on EVERY request) ─────────────
export const extractSubdomain = (req, res, next) => {
    const host = req.headers.host || "";
    req.tenantSlug = extractSlugFromHost(host) || null;
    next();
};

// ─── Phase 2: Resolve Tenant (runs on routes that NEED org context) ──
// Use this as middleware on tenant-scoped API routes:
//   router.use(resolveTenant);
//   router.get("/menu", getMenu);
export const resolveTenant = async (req, res, next) => {
    try {
        const slug = req.tenantSlug;
        
        if (!slug) {
            // No subdomain detected — this may be a direct API call
            // Let downstream auth middleware handle org resolution via JWT
            return next();
        }

        // 1. Check cache
        const cached = getCachedTenant(slug);
        if (cached) {
            req.tenantOrg = cached;
            return next();
        }

        // 2. DB lookup
        const org = await Organization.findOne({ subdomain: slug })
            .select("_id name subdomain org_type structure_type admission_config subscription_tier logo_url")
            .lean();

        if (!org) {
            // Subdomain exists but no org found — NOT a critical error for API calls
            // The request may still be authenticated via JWT with org_id
            return next();
        }

        // 3. Cache and attach
        setCachedTenant(slug, org);
        req.tenantOrg = org;
        next();
    } catch (err) {
        console.error("[SubdomainRouter] Tenant resolution failed:", err.message);
        next(); // Don't block the request — downstream auth will handle
    }
};

// ─── Public Tenant Info (for unauthenticated portal pages) ───────────
// GET /api/tenant/info — Returns public-safe org info based on subdomain
export const getPublicTenantInfo = async (req, res) => {
    try {
        const slug = req.tenantSlug || req.query.slug;

        if (!slug) {
            return res.status(400).json({ error: "No subdomain or slug provided." });
        }

        // Check cache first
        let org = getCachedTenant(slug);

        if (!org) {
            org = await Organization.findOne({ subdomain: slug })
                .select("_id name subdomain org_type structure_type logo_url tagline admission_config.is_portal_open")
                .lean();

            if (org) setCachedTenant(slug, org);
        }

        if (!org) {
            return res.status(404).json({ error: "Organization not found." });
        }

        res.json({
            success: true,
            tenant: {
                id: org._id,
                tenantId: org._id,
                name: org.name,
                subdomain: org.subdomain,
                org_type: org.org_type,
                orgType: org.org_type,
                structure_type: org.structure_type,
                logo_url: org.logo_url,
                tagline: org.tagline,
                admission_portal_open: org.admission_config?.is_portal_open || false,
            }
        });
    } catch (err) {
        console.error("[SubdomainRouter] Public tenant info error:", err.message);
        res.status(500).json({ error: "Failed to fetch tenant info." });
    }
};

export default extractSubdomain;
