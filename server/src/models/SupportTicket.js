import mongoose from "mongoose";

// Sub-schemas for structured data
const ticketEventSchema = new mongoose.Schema({
    type: { type: String, enum: ['ticketCreated', 'statusChanged', 'priorityChanged', 'categoryChanged', 'assigned', 'unassigned', 'adminReply', 'userReply', 'internalNote', 'attachmentAdded', 'resolved', 'reopened'] },
    label: { type: String },
    from: { type: mongoose.Schema.Types.Mixed },
    to: { type: mongoose.Schema.Types.Mixed },
    actorName: { type: String },
    actorRole: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

/**
 * SupportTicket — In-app support system.
 * Users raise tickets, Super Admin / Support team responds.
 */
const supportTicketSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10000000 // Increased significantly to support embedded base64 images from rich text editor
    },
    attachments: [{
        type: mongoose.Schema.Types.Mixed // Mixed to support legacy String URLs and new structured attachment objects
    }],
    category: {
        type: String,
        enum: ["getting_started", "account_security", "technical", "billing", "academics", "finance", "exams", "communication", "general", "inquiry", "login", "dashboard", "profile", "attendance", "fee", "examination", "timetable", "assignments", "live-classes", "chat", "admission", "library", "documents", "erp", "ai", "bug", "feature", "other"],
        default: "general"
    },
    // Priority for internal tracking
    priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium"
    },
    // Ticket lifecycle
    status: {
        type: String,
        enum: ["open", "in_progress", "waiting_on_user", "resolved", "closed"],
        default: "open"
    },
    // Who raised the ticket (null for public/marketing submissions)
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true
    },
    submitterEmail: {
        type: String,
        trim: true
    },
    submitterName: {
        type: String,
        trim: true
    },
    // Organization context
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null
    },
    institution: {
        type: String,
        trim: true,
        default: ""
    },
    // Who is handling this ticket (Super Admin / Support Agent)
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    // Conversation thread (back and forth replies)
    messages: [{
        author: { type: String, trim: true },
        role: { type: String, enum: ["user", "admin"], required: true },
        body: { type: String, required: true },
        date: { type: Date, default: Date.now },
        footer: { type: String, default: "" },
        attachments: [{ type: mongoose.Schema.Types.Mixed }], // Mixed to support legacy and new formats
        avatar: { type: String, default: "" }
    }],
    replies: [{
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        authorName: String,
        authorRole: String,
        message: { type: String, required: true },
        attachments: [{ type: mongoose.Schema.Types.Mixed }], // Mixed format
        createdAt: { type: Date, default: Date.now }
    }],
    lastComment: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Resolution
    resolvedAt: {
        type: Date,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    // New Advanced Features
    events: [ticketEventSchema],
    firstResponseDueAt: { type: Date },
    nextResponseDueAt: { type: Date },
    lastAdminReplyAt: { type: Date },
    lastUserReplyAt: { type: Date },
    slaStatus: { type: String, enum: ["ok", "due_soon", "breached"], default: "ok" },
    satisfaction: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date }
    }
}, { timestamps: true });

supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ submittedBy: 1, createdAt: -1 });

export default mongoose.models.SupportTicket ||
    mongoose.model("SupportTicket", supportTicketSchema);
