import mongoose from "mongoose";
import OrganizationAnnouncement from "../models/OrganizationAnnouncement.js";
import Classroom from "../models/Classroom.js";
import ClassroomMembership from "../models/ClassroomMembership.js";
import User from "../models/User.js";
import { bulkDispatchNotification } from "./notification.service.js";

function toObjectId(value) {
    if (!value) return null;
    const id = value.toString();
    return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

function toDateOrNull(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeClassroomIds(classroomIds = []) {
    return classroomIds
        .map((id) => toObjectId(id))
        .filter(Boolean);
}

function compactMessage(content = "") {
    const normalized = String(content || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "New organization announcement";
    return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

export async function syncSupabaseAnnouncementToMongo(announcement, fallbackCreatedBy = null) {
    if (!announcement?.id) return null;

    const orgId = toObjectId(announcement.organization_id);
    const createdBy = toObjectId(announcement.created_by) || toObjectId(fallbackCreatedBy);
    if (!orgId || !createdBy) {
        console.warn("[OrgAnnouncementSync] Skipping Mongo mirror due to invalid ids", {
            supabaseId: announcement.id,
            organization_id: announcement.organization_id,
            created_by: announcement.created_by,
        });
        return null;
    }

    const payload = {
        source: "supabase",
        supabase_id: announcement.id.toString(),
        title: announcement.title,
        content: announcement.content,
        type: announcement.type || "announcement",
        organization_id: orgId,
        created_by: createdBy,
        creator_name: announcement.creator_name || "",
        target_type: announcement.target_type || "specific",
        target_classrooms: announcement.target_type === "all" ? [] : normalizeClassroomIds(announcement.target_classrooms || []),
        status: announcement.status || "published",
        sent_at: toDateOrNull(announcement.sent_at),
        expires_at: toDateOrNull(announcement.expires_at),
        attachment_url: announcement.attachment_url || "",
        attachment_name: announcement.attachment_name || "",
        attachment_type: announcement.attachment_type || "",
    };

    const update = { $set: payload };
    const createdAt = toDateOrNull(announcement.created_at);
    if (createdAt) update.$setOnInsert = { createdAt };
    const updatedAt = toDateOrNull(announcement.updated_at);
    if (updatedAt) update.$set.updatedAt = updatedAt;

    return OrganizationAnnouncement.findOneAndUpdate(
        { supabase_id: announcement.id.toString() },
        update,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

export async function deleteMongoAnnouncementBySupabaseId(supabaseId, organizationId) {
    if (!supabaseId) return { deletedCount: 0 };

    const filter = { supabase_id: supabaseId.toString() };
    const orgId = toObjectId(organizationId);
    if (orgId) filter.organization_id = orgId;

    return OrganizationAnnouncement.deleteOne(filter);
}

async function resolveAnnouncementRecipients(announcement) {
    const orgId = toObjectId(announcement.organization_id);
    if (!orgId) return [];

    if (announcement.target_type === "all") {
        const users = await User.find({ organization_id: orgId, status: "active" }).select("_id").lean();
        return users.map((user) => user._id.toString());
    }

    const classroomIds = normalizeClassroomIds(announcement.target_classrooms || []);
    if (classroomIds.length === 0) return [];

    const [memberships, classrooms] = await Promise.all([
        ClassroomMembership.find({ classroom: { $in: classroomIds }, status: "approved" }).select("student").lean(),
        Classroom.find({ _id: { $in: classroomIds }, organization_id: orgId })
            .select("teacher class_teacher assistant_teacher mentor")
            .lean(),
    ]);

    const candidateIds = new Set();
    memberships.forEach((membership) => {
        if (membership.student) candidateIds.add(membership.student.toString());
    });
    classrooms.forEach((classroom) => {
        [classroom.teacher, classroom.class_teacher, classroom.assistant_teacher, classroom.mentor]
            .filter(Boolean)
            .forEach((id) => candidateIds.add(id.toString()));
    });

    if (candidateIds.size === 0) return [];

    const activeUsers = await User.find({
        _id: { $in: [...candidateIds] },
        organization_id: orgId,
        status: "active",
    }).select("_id").lean();

    return activeUsers.map((user) => user._id.toString());
}

export async function deliverPublishedOrganizationAnnouncement(announcement) {
    if (!announcement || announcement.status !== "published") {
        return { delivered: false, recipientCount: 0 };
    }

    const recipientIds = await resolveAnnouncementRecipients(announcement);
    if (recipientIds.length === 0) {
        return { delivered: false, recipientCount: 0 };
    }

    await bulkDispatchNotification({
        recipientIds,
        type: announcement.type === "emergency" ? "alert" : "new_content",
        title: announcement.title,
        message: compactMessage(announcement.content),
        link: "/notifications",
        relatedId: (announcement.id || announcement.supabase_id || announcement._id || "").toString(),
        sendPush: true,
    });

    return { delivered: true, recipientCount: recipientIds.length };
}