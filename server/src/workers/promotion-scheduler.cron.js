import cron from "node-cron";
import Organization from "../models/Organization.js";
import { getChatSb } from "../config/supabaseClient.js";

/**
 * 📅 SAAS SCHEDULED PROMOTION AUTOMATION
 * This cron job runs every hour on the hour (0 * * * *)
 * It checks for any organizations that have a pending scheduled promotion
 * where the execute_at date is in the past (i.e. it is time to execute).
 */
export const initPromotionSchedulerCron = () => {
    // Runs every 5 minutes for better responsiveness on exact dates
    cron.schedule("*/5 * * * *", async () => {
        try {
            const now = new Date();
            // Find organizations that have a pending promotion ready to execute
            const readyOrgs = await Organization.find({
                "scheduled_promotion.status": "pending",
                "scheduled_promotion.execute_at": { $lte: now }
            });

            if (readyOrgs.length === 0) return;

            console.log(`[Promotion Scheduler] Found ${readyOrgs.length} scheduled promotions to execute at ${now.toISOString()}`);

            const sb = getChatSb();

            for (const org of readyOrgs) {
                const orgId = org._id.toString();
                const { target_year_id, excluded_ids, admin_id } = org.scheduled_promotion;

                // 1. Mark as running & acquire lock
                await Organization.findByIdAndUpdate(orgId, {
                    $set: {
                        is_promoting: true,
                        promotion_started_at: new Date(),
                        "scheduled_promotion.status": "running"
                    }
                });

                try {
                    // Create batch record
                    const { data: activeYear } = await sb.from("academic_years").select("id").eq("org_id", orgId).eq("is_active", true).maybeSingle();

                    const { data: batch, error: bErr } = await sb.from("promotion_batches").insert({
                        org_id: orgId,
                        from_academic_year_id: activeYear?.id || null,
                        to_academic_year_id: target_year_id,
                        status: "idle",
                        created_by: admin_id,
                        excluded_count: excluded_ids.length,
                    }).select().single();

                    if (bErr) throw bErr;

                    const orgType = org.org_type || "COLLEGE";

                    // Execute via RPC
                    const { data: result, error: rpcErr } = await sb.rpc("execute_promotion", {
                        p_batch_id: batch.id,
                        p_org_id: orgId,
                        p_to_academic_year_id: target_year_id,
                        p_excluded_ids: excluded_ids,
                        p_admin_id: admin_id,
                        p_org_type: orgType,
                    });

                    if (rpcErr || result?.success === false) {
                        const errMsg = rpcErr ? rpcErr.message : (result?.error || "Unknown error");
                        console.error(`[Promotion Scheduler] RPC Error for Org ${orgId}:`, errMsg);
                        
                        // Fail batch and schedule
                        if (batch?.id) {
                             await sb.from("promotion_batches").update({ status: "failed", error_message: errMsg, completed_at: new Date().toISOString() }).eq("id", batch.id);
                        }
                        await Organization.findByIdAndUpdate(orgId, {
                            $set: { is_promoting: false, "scheduled_promotion.status": "failed" }
                        });
                    } else {
                        // Success
                        console.log(`[Promotion Scheduler] Success for Org ${orgId}, Batch ${batch.id}`);
                        await Organization.findByIdAndUpdate(orgId, {
                            $set: { is_promoting: false, "scheduled_promotion.status": "completed" }
                        });
                    }
                } catch (err) {
                    console.error(`[Promotion Scheduler] Execution crashed for Org ${orgId}:`, err);
                    await Organization.findByIdAndUpdate(orgId, {
                        $set: { is_promoting: false, "scheduled_promotion.status": "failed" }
                    });
                }
            }
        } catch (error) {
            console.error("[Promotion Scheduler] Fatal error in cron job:", error);
        }
    });
};
