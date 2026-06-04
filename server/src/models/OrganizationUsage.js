import mongoose from "mongoose";

const organizationUsageSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true,
        },
        totalStudents: {
            type: Number,
            default: 0,
        },
        totalTeachers: {
            type: Number,
            default: 0,
        },
        totalAdmins: {
            type: Number,
            default: 0,
        },
        storageUsedGB: {
            type: Number,
            default: 0,
        },
        emailsSent: {
            type: Number,
            default: 0,
        },
        activeUsers: {
            type: Number,
            default: 0,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.OrganizationUsage || mongoose.model("OrganizationUsage", organizationUsageSchema);
