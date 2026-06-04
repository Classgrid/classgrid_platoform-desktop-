import SeatConfig from "../../models/SeatConfig.js";
import { getIO } from "../socket.service.js";

/**
 * SeatMatrixService handles seat allocation, seat release, and live broadcasts.
 */
class SeatMatrixService {
    /**
     * Atomically increment filled seats for a quota.
     * Supports optional mongoose sessions so enrollment flows can keep
     * seat updates consistent with user/application writes.
     */
    async allocateSeat(orgId, hierarchyId, quotaName, options = {}) {
        const { session = null, suppressBroadcast = false } = options;
        let retries = 5;

        while (retries > 0) {
            try {
                let configQuery = SeatConfig.findOne({
                    organization_id: orgId,
                    hierarchy_id: hierarchyId,
                    "quotas.name": quotaName
                }).lean();

                if (session) {
                    configQuery = configQuery.session(session);
                }

                const config = await configQuery;
                if (!config) {
                    return { success: false, error: "Seat configuration not found" };
                }

                const quota = config.quotas.find((q) => q.name === quotaName);
                if (!quota) {
                    return { success: false, error: `Quota ${quotaName} not configured` };
                }

                if (quota.filled >= quota.capacity) {
                    return { success: false, error: `No vacant seats available for ${quotaName}` };
                }

                const updateOptions = { new: true };
                if (session) {
                    updateOptions.session = session;
                }

                const result = await SeatConfig.findOneAndUpdate(
                    {
                        _id: config._id,
                        quotas: {
                            $elemMatch: {
                                name: quotaName,
                                filled: quota.filled
                            }
                        }
                    },
                    { $inc: { "quotas.$.filled": 1 } },
                    updateOptions
                );

                if (result) {
                    const updatedQuota = result.quotas.find((q) => q.name === quotaName);
                    const vacancy = updatedQuota.capacity - updatedQuota.filled;
                    const allocationResult = {
                        success: true,
                        hierarchyId,
                        quotaName,
                        vacancy,
                        totalFilled: updatedQuota.filled,
                        waitlistCount: updatedQuota.waitlist_count || 0,
                    };

                    if (!suppressBroadcast) {
                        this.broadcastUpdate(orgId, "SEAT_ALLOCATED", {
                            hierarchyId,
                            quotaName,
                            vacancy,
                            totalFilled: updatedQuota.filled
                        });
                    }

                    return allocationResult;
                }

                retries--;
                console.warn(`[SeatMatrix] Conflict detected for ${quotaName}, retrying... (${retries} left)`);
                await new Promise((resolve) => setTimeout(resolve, 50 * (5 - retries)));
            } catch (error) {
                console.error("[SeatMatrix] allocateSeat error:", error.message);
                throw error;
            }
        }

        return { success: false, error: "Conflict during seat allocation. Please try again." };
    }

    /**
     * Release an allocated seat.
     * Supports optional session use and deferred side effects.
     */
    async releaseSeat(orgId, hierarchyId, quotaName, options = {}) {
        const {
            session = null,
            suppressBroadcast = false,
            suppressWaitlist = false,
        } = options;

        try {
            const updateOptions = { new: true };
            if (session) {
                updateOptions.session = session;
            }

            const result = await SeatConfig.findOneAndUpdate(
                {
                    organization_id: orgId,
                    hierarchy_id: hierarchyId,
                    quotas: {
                        $elemMatch: {
                            name: quotaName,
                            filled: { $gt: 0 }
                        }
                    }
                },
                { $inc: { "quotas.$.filled": -1 } },
                updateOptions
            );

            if (!result) {
                return { success: false, error: `No allocated seats to release for ${quotaName}` };
            }

            const updatedQuota = result.quotas.find((q) => q.name === quotaName);
            const vacancy = updatedQuota.capacity - updatedQuota.filled;
            const releaseResult = {
                success: true,
                hierarchyId,
                quotaName,
                vacancy,
                totalFilled: updatedQuota.filled,
                waitlistCount: updatedQuota.waitlist_count || 0,
            };

            if (!suppressBroadcast) {
                this.broadcastUpdate(orgId, "SEAT_RELEASED", {
                    hierarchyId,
                    quotaName,
                    vacancy,
                    totalFilled: updatedQuota.filled
                });
            }

            if (!suppressWaitlist && updatedQuota.waitlist_count > 0) {
                try {
                    const { default: waitlistService } = await import("./waitlist.service.js");
                    await waitlistService.autoPromoteFromWaitlist(orgId, hierarchyId, quotaName, 1);
                } catch (waitErr) {
                    console.error("[SeatMatrix] Failed to trigger waitlist promotion:", waitErr);
                }
            }

            return releaseResult;
        } catch (error) {
            console.error("[SeatMatrix] releaseSeat error:", error.message);
            throw error;
        }
    }

    /**
     * Broadcast live updates to projectors.
     */
    broadcastUpdate(orgId, type, data) {
        try {
            const io = getIO();
            if (io) {
                io.to(`org_${orgId}_admission`).emit("ADMISSION_LIVE_UPDATE", {
                    type,
                    data,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.warn(`[SeatMatrix] Broadcast failed: ${error.message}`);
        }
    }

    /**
     * Get live state of all seats for an organization.
     */
    async getFullMatrix(orgId) {
        return await SeatConfig.find({ organization_id: orgId, is_active: true })
            .populate("hierarchy_id", "name level_type code")
            .lean();
    }
}

export default new SeatMatrixService();
