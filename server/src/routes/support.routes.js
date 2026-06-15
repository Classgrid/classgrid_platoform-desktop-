import express from "express";
import crypto from "crypto";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import SupportTicket from "../models/SupportTicket.js";
import User from "../models/User.js";
import { multipleUploads } from "../middleware/upload.middleware.js";
import storageService from "../services/storage.service.js";
import { notifyTicketCreatorOfAdminReply, notifyUserOfTicketCreation } from "../services/support-ticket-email.service.js";



const router = express.Router();

// ──────────────────────────────────────────────────────────────
//  Helper: Verify email belongs to a registered platform user
// ──────────────────────────────────────────────────────────────
async function verifyRegisteredUser(email) {
    const user = await User.findOne(
        { email: email.trim().toLowerCase(), status: "active" },
        "name email organization_id role"
    ).lean();
    return user; // null if not found
}

function normalizeMessageRole(role) {
    const normalized = String(role || "").toLowerCase();
    return normalized === "admin" || normalized === "super_admin" || normalized.includes("admin")
        ? "admin"
        : "user";
}

function normalizeTicketMessage(message) {
    return {
        _id: message._id,
        author: message.author || message.authorName || "Classgrid User",
        role: normalizeMessageRole(message.role || message.authorRole),
        date: message.date || message.createdAt || new Date(),
        body: message.body || message.message || "",
        footer: message.footer || "",
        avatar: message.avatar || "",
        attachments: message.attachments || []
    };
}

function getTicketMessages(ticket) {
    if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
        return ticket.messages.map(normalizeTicketMessage);
    }

    const messages = [];
    if (ticket.message) {
        messages.push({
            author: ticket.submitterName || ticket.submittedBy?.name || "Classgrid User",
            role: "user",
            date: ticket.createdAt || new Date(),
            body: ticket.message,
            footer: ticket.submitterEmail ? `Email: ${ticket.submitterEmail}` : ""
        });
    }

    for (const reply of ticket.replies || []) {
        messages.push(normalizeTicketMessage(reply));
    }

    return messages;
}

function getLastComment(ticket) {
    const messages = getTicketMessages(ticket);
    const lastMessage = messages[messages.length - 1];
    return ticket.lastComment || lastMessage?.date || ticket.updatedAt || ticket.createdAt;
}

function serializeTicket(ticket) {
    if (!ticket) return null;
    const messages = getTicketMessages(ticket);
    return {
        ...ticket,
        name: ticket.submitterName || ticket.submittedBy?.name || "",
        email: ticket.submitterEmail || ticket.submittedBy?.email || "",
        messages,
        replies: (ticket.replies || []).map(normalizeTicketMessage),
        events: ticket.events || [],
        lastComment: getLastComment({ ...ticket, messages }),
        requester: {
            name: ticket.submitterName || ticket.submittedBy?.name || "Unknown",
            email: ticket.submitterEmail || ticket.submittedBy?.email || ""
        }
    };
}

function ensureInitialMessage(ticket) {
    if (!ticket.messages) ticket.messages = [];
    if (ticket.messages.length === 0 && ticket.message) {
        ticket.messages.push({
            author: ticket.submitterName || "Classgrid User",
            role: "user",
            body: ticket.message,
            date: ticket.createdAt || new Date(),
            footer: ticket.submitterEmail ? `Email: ${ticket.submitterEmail}` : ""
        });
    }
    if (!ticket.lastComment) ticket.lastComment = ticket.createdAt || new Date();
}

// ╔═══════════════════════════════════════════════════════════════╗
// ║  PUBLIC ENDPOINTS — No authentication required               ║
// ║  For marketing site visitors (classgrid.in/support)          ║
// ║  Users identified by email only (like Brevo / Zendesk)       ║
// ╚═══════════════════════════════════════════════════════════════╝

// ──────────────────────────────────────────────────────────────
//  POST /api/support/public/tickets — Create ticket (no login)
// ──────────────────────────────────────────────────────────────
router.post("/public/tickets", multipleUploads("files", 5), async (req, res) => {
    try {
        const { name, email, subject, message, category, priority, institution } = req.body;

        if (!email?.trim() || !subject?.trim() || !message?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email, subject, and description are required"
            });
        }

        if (subject.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: `Subject is too long (${subject.trim().length} characters). Maximum allowed is 200 characters.`
            });
        }

        // The Inquiry page (Classgrid Talk) sends the "institution" field, 
        // whereas the Technical Ticket page does not.
        const isGeneralInquiry = !!institution;

        let organization_id = null;
        if (!isGeneralInquiry) {
            // Verify email belongs to a registered platform user
            const registeredUser = await verifyRegisteredUser(email);
            if (!registeredUser) {
                return res.status(403).json({
                    success: false,
                    message: "This email is not registered on Classgrid. Only registered users can raise support tickets."
                });
            }

            // Only users linked to a valid organization can raise tickets.
            // ClassGrid Talk users or bare accounts with no org are not eligible.
            if (!registeredUser.organization_id) {
                return res.status(403).json({
                    success: false,
                    message: "Support tickets can only be raised by users who belong to a registered institution on Classgrid. Please contact your institution administrator.",
                    code: "NO_ORG"
                });
            }
            organization_id = registeredUser.organization_id;
        }

        // Handle File Uploads to Supabase
        const uploadedAttachments = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const folderPath = `support_tickets/public/${email.trim().replace(/[^a-zA-Z0-9]/g, "_")}`;
                const uploadResult = await storageService.uploadDocument(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    folderPath,
                    "support-attachments" // explicitly use the support bucket
                );
                uploadedAttachments.push({
                    id: uploadResult.id,
                    name: uploadResult.name,
                    url: uploadResult.storage_path,
                    mimeType: uploadResult.mimeType,
                    size: uploadResult.size,
                    uploadedAt: uploadResult.uploadedAt
                });
            }
        }

        const now = new Date();
        const submitterName = ((name || "").trim() || "Anonymous").replace(/\b\w/g, c => c.toUpperCase());
        const submitterEmail = email.trim().toLowerCase();
        const ticket = await SupportTicket.create({
            subject: subject.trim(),
            message: message.trim(),
            category: category || "general",
            attachments: uploadedAttachments,
            priority: priority || "medium",
            submitterEmail,
            submitterName,
            institution: institution?.trim() || "",
            organization_id,
            messages: [{
                author: submitterName,
                role: "user",
                body: message.trim(),
                date: now,
                footer: `Email: ${submitterEmail}`,
                avatar: "",
                attachments: uploadedAttachments
            }],
            lastComment: now,
            events: [{
                type: 'ticketCreated',
                label: 'Ticket submitted',
                actorName: submitterName,
                actorRole: 'user',
                createdAt: now
            }],
            // No submittedBy (ObjectId) since user is not logged in
        });

        // ── Send email notification for new ticket ──
        try {
            await notifyUserOfTicketCreation({ ticket });
        } catch (emailErr) {
            console.error("[Support] New ticket email notification failed:", emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            ticket: {
                _id: ticket._id,
                subject: ticket.subject,
                status: ticket.status,
                createdAt: ticket.createdAt
            }
        });
    } catch (err) {
        console.error("[Support] Public create error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
//  GET /api/support/public/tickets?email=xxx — Lookup by email
// ──────────────────────────────────────────────────────────────
router.get("/public/tickets", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email?.trim()) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Check if they are a registered platform user
        const registeredUser = await verifyRegisteredUser(email);
        
        if (registeredUser && !registeredUser.organization_id) {
            // Block orgless accounts UNLESS they have public inquiries
            const hasTickets = await SupportTicket.exists({
                submitterEmail: email.trim().toLowerCase()
            });
            if (!hasTickets) {
                return res.status(403).json({
                    success: false,
                    message: "Only users belonging to a registered institution can access support tickets.",
                    code: "NO_ORG"
                });
            }
        }

        const tickets = await SupportTicket.find({
            submitterEmail: email.trim().toLowerCase()
        })
            .sort({ createdAt: -1 })
            .select("subject status priority category createdAt updatedAt replies messages lastComment")
            .lean();

        // Add reply count and last reply date for the table view
        const enriched = tickets.map(t => ({
            ...t,
            messages: getTicketMessages(t),
            replyCount: Math.max(getTicketMessages(t).length - 1, 0),
            lastComment: getLastComment(t)
        }));

        res.json({ 
            success: true, 
            tickets: enriched,
            isPlatformUser: !!registeredUser,
            hasOrganization: !!(registeredUser && registeredUser.organization_id)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ──────────────────────────────────────────────────────────────
//  GET /api/support/public/tickets/:id?email=xxx — View ticket
// ──────────────────────────────────────────────────────────────
router.get("/public/tickets/:id", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email?.trim()) {
            return res.status(400).json({ success: false, message: "Email is required for verification" });
        }

        const ticket = await SupportTicket.findById(req.params.id)
            .populate("assignedTo", "name email")
            .lean();

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        // Verify the email matches the ticket submitter
        if (ticket.submitterEmail?.toLowerCase() !== email.trim().toLowerCase()) {
            return res.status(403).json({ success: false, message: "Email does not match ticket owner" });
        }

        res.json({ success: true, ticket: serializeTicket(ticket) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ──────────────────────────────────────────────────────────────
//  POST /api/support/public/tickets/:id/reply — Reply (email verified)
// ──────────────────────────────────────────────────────────────
router.post("/public/tickets/:id/reply", multipleUploads("files", 5), async (req, res) => {
    try {
        const { email, message, name } = req.body;
        if (!email?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: "Email and message are required" });
        }

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        // Verify ownership via email
        if (ticket.submitterEmail?.toLowerCase() !== email.trim().toLowerCase()) {
            return res.status(403).json({ success: false, message: "Email does not match ticket owner" });
        }

        // Handle File Uploads
        const uploadedAttachments = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const folderPath = `support_tickets/public/${email.trim().replace(/[^a-zA-Z0-9]/g, "_")}`;
                const uploadResult = await storageService.uploadDocument(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    folderPath,
                    "support-attachments" // explicitly use the support bucket
                );
                uploadedAttachments.push({
                    id: uploadResult.id,
                    name: uploadResult.name,
                    url: uploadResult.storage_path,
                    mimeType: uploadResult.mimeType,
                    size: uploadResult.size,
                    uploadedAt: uploadResult.uploadedAt
                });
            }
        }

        ensureInitialMessage(ticket);
        const now = new Date();
        const authorName = (name || ticket.submitterName || "Classgrid User").trim();

        ticket.replies.push({
            authorName,
            authorRole: "user",
            message: message.trim(),
            attachments: uploadedAttachments,
            createdAt: now
        });

        ticket.messages.push({
            author: authorName,
            role: "user",
            body: message.trim(),
            date: now,
            footer: `Email: ${email.trim().toLowerCase()}`,
            avatar: "",
            attachments: uploadedAttachments
        });

        ticket.events.push({
            type: 'userReply',
            label: 'User replied',
            actorName: authorName,
            actorRole: 'user',
            createdAt: now
        });

        ticket.lastComment = now;
        ticket.lastUserReplyAt = now;
        ticket.status = "open";

        await ticket.save();
        res.json({ success: true, message: "Reply added", ticket: serializeTicket(ticket.toObject()) });
    } catch (err) {
        console.error("[Support] Public reply error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ╔═══════════════════════════════════════════════════════════════╗
// ║  AUTHENTICATED ENDPOINTS — Logged-in platform users          ║
// ╚═══════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════
//  POST /api/support/tickets — Create a new support ticket
// ══════════════════════════════════════════════════════════════
router.post("/tickets", isAuthenticated, multipleUploads("files", 5), async (req, res) => {
    try {
        const { subject, message, category, priority } = req.body;
        if (!subject?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: "Subject and message are required" });
        }

        // Only users who belong to a valid organization may raise tickets.
        // Accounts without an org (e.g. ClassGrid Talk-only users) are blocked.
        const orgId = req.effectiveOrganizationId || req.user.organization_id;
        if (!orgId) {
            return res.status(403).json({
                success: false,
                message: "Support tickets can only be raised by users who belong to a registered institution on Classgrid. Please contact your institution administrator.",
                code: "NO_ORG"
            });
        }

        // Handle File Uploads to Supabase
        const uploadedAttachments = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const folderPath = `support_tickets/${req.user._id}`;
                const uploadResult = await storageService.uploadDocument(
                    file.buffer, 
                    file.originalname, 
                    file.mimetype, 
                    folderPath,
                    "support-attachments" // explicitly use the support bucket
                );
                uploadedAttachments.push({
                    id: uploadResult.id,
                    name: uploadResult.name,
                    url: uploadResult.storage_path,
                    mimeType: uploadResult.mimeType,
                    size: uploadResult.size,
                    uploadedAt: uploadResult.uploadedAt
                });
            }
        }

        const now = new Date();
        const ticket = await SupportTicket.create({
            subject: subject.trim(),
            message: message.trim(),
            category: category || "general",
            attachments: uploadedAttachments,
            priority: priority || "medium",
            submittedBy: req.user._id,
            submitterEmail: req.user.email,
            submitterName: req.user.name,
            organization_id: req.effectiveOrganizationId || req.user.organization_id || null,
            messages: [{
                author: req.user.name || req.user.email || "Classgrid User",
                role: "user",
                body: message.trim(),
                date: now,
                footer: req.user.email ? `Email: ${req.user.email}` : "",
                avatar: req.user.profilePicture || "",
                attachments: uploadedAttachments
            }],
            lastComment: now,
            events: [{
                type: 'ticketCreated',
                label: 'Ticket created',
                actorName: req.user.name || req.user.email,
                actorRole: req.user.role,
                createdAt: now
            }]
        });

        res.status(201).json({ success: true, message: "Ticket created", ticket: serializeTicket(ticket.toObject()) });
    } catch (err) {
        console.error("[Support] Create error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  GET /api/support/tickets — User's own tickets
// ══════════════════════════════════════════════════════════════
router.get("/tickets", isAuthenticated, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ submittedBy: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        const serializedTickets = tickets.map(serializeTicket);
        res.json({
            success: true,
            tickets: serializedTickets,
            total: serializedTickets.length,
            stats: {
                open: serializedTickets.filter((ticket) => ticket.status === "open").length,
                inProgress: serializedTickets.filter((ticket) => ticket.status === "in_progress").length,
                resolved: serializedTickets.filter((ticket) => ticket.status === "resolved").length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  GET /api/support/tickets/:id — Get ticket detail with replies
// ══════════════════════════════════════════════════════════════
router.get("/tickets/:id", isAuthenticated, async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate("submittedBy", "name email role")
            .populate("assignedTo", "name email")
            .lean();

        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        // Only the submitter or super_admin can view
        const isSuper = req.user.role === "super_admin";
        const isOwner =
            ticket.submittedBy?._id?.toString() === req.user._id.toString() ||
            ticket.submitterEmail?.toLowerCase() === req.user.email?.toLowerCase();
        if (!isOwner && !isSuper) return res.status(403).json({ success: false, message: "Not authorized" });

        res.json({ success: true, ticket: serializeTicket(ticket) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  POST /api/support/tickets/:id/reply — Add a reply (user or admin)
// ══════════════════════════════════════════════════════════════
router.post("/tickets/:id/reply", isAuthenticated, multipleUploads("files", 5), async (req, res) => {
    try {
        const { message, adminName } = req.body;
        if (!message?.trim()) return res.status(400).json({ success: false, message: "Message is required" });

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        const isSuperAdmin = req.user.role === "super_admin";
        const isOwner =
            ticket.submittedBy?.toString() === req.user._id.toString() ||
            ticket.submitterEmail?.toLowerCase() === req.user.email?.toLowerCase();
        if (!isSuperAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Handle File Uploads to Supabase
        const uploadedAttachments = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const folderPath = `support_tickets/${req.user._id}`;
                const uploadResult = await storageService.uploadDocument(
                    file.buffer, 
                    file.originalname, 
                    file.mimetype, 
                    folderPath,
                    "support-attachments" // explicitly use the support bucket
                );
                uploadedAttachments.push({
                    id: uploadResult.id,
                    name: uploadResult.name,
                    url: uploadResult.storage_path,
                    mimeType: uploadResult.mimeType,
                    size: uploadResult.size,
                    uploadedAt: uploadResult.uploadedAt
                });
            }
        }

        ensureInitialMessage(ticket);
        const now = new Date();
        const authorName = (isSuperAdmin ? (adminName || req.user.name) : req.user.name) || req.user.email || "Classgrid Support";
        const messageRole = isSuperAdmin ? "admin" : "user";

        ticket.replies.push({
            author: req.user._id,
            authorName,
            authorRole: req.user.role,
            message: message.trim(),
            attachments: uploadedAttachments,
            createdAt: now
        });

        ticket.messages.push({
            author: authorName,
            role: messageRole,
            body: message.trim(),
            date: now,
            avatar: req.user.profilePicture || req.user.profilePic || req.user.image || "",
            attachments: uploadedAttachments
        });

        ticket.events.push({
            type: isSuperAdmin ? 'adminReply' : 'userReply',
            label: isSuperAdmin ? 'Admin replied' : 'User replied',
            actorName: authorName,
            actorRole: req.user.role,
            createdAt: now
        });

        ticket.lastComment = now;
        if (isSuperAdmin) {
            ticket.lastAdminReplyAt = now;
            ticket.status = "in_progress";
            if (!ticket.assignedTo) {
                ticket.assignedTo = req.user._id;
                ticket.events.push({
                    type: 'assigned',
                    label: 'Ticket auto-assigned to respondent',
                    to: req.user._id,
                    actorName: authorName,
                    actorRole: req.user.role,
                    createdAt: now
                });
            }
        } else {
            ticket.lastUserReplyAt = now;
            ticket.status = "open";
        }

        await ticket.save();

        let emailNotification = { queued: false };
        if (isSuperAdmin) {
            try {
                emailNotification = await notifyTicketCreatorOfAdminReply({
                    ticket,
                    replyMessage: message.trim(),
                    adminName: authorName
                });
            } catch (emailErr) {
                console.error("[Support] Reply email notification failed:", emailErr.message);
            }
        }

        res.json({
            success: true,
            message: "Reply added",
            ticket: serializeTicket(ticket.toObject()),
            emailNotification
        });
    } catch (err) {
        console.error("[Support] Reply error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  SUPER ADMIN: GET /api/support/admin/tickets — All tickets
// ══════════════════════════════════════════════════════════════
router.get("/admin/tickets", isAuthenticated, requireRole("super_admin"), async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [tickets, total] = await Promise.all([
            SupportTicket.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("submittedBy", "name email role")
                .populate("organization_id", "name slug")
                .populate("assignedTo", "name email")
                .lean(),
            SupportTicket.countDocuments(filter)
        ]);

        // Stats
        const [openCount, inProgressCount, resolvedCount] = await Promise.all([
            SupportTicket.countDocuments({ status: "open" }),
            SupportTicket.countDocuments({ status: "in_progress" }),
            SupportTicket.countDocuments({ status: "resolved" })
        ]);

        res.json({
            success: true,
            tickets: tickets.map(serializeTicket),
            total,
            stats: { open: openCount, inProgress: inProgressCount, resolved: resolvedCount }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  SUPER ADMIN: PATCH /api/support/admin/tickets/:id — Update ticket fields
// ══════════════════════════════════════════════════════════════
router.patch("/admin/tickets/:id", isAuthenticated, requireRole("super_admin"), async (req, res) => {
    try {
        const { status, priority, category, assignedTo } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        const now = new Date();
        const actorName = req.user.name || req.user.email;

        if (status && status !== ticket.status) {
            ticket.events.push({
                type: status === 'resolved' ? 'resolved' : status === 'open' ? 'reopened' : 'statusChanged',
                label: `Status changed to ${status}`,
                from: ticket.status,
                to: status,
                actorName,
                actorRole: req.user.role,
                createdAt: now
            });
            ticket.status = status;
            if (status === "resolved") {
                ticket.resolvedAt = now;
                ticket.resolvedBy = req.user._id;
            }
        }

        if (priority && priority !== ticket.priority) {
            ticket.events.push({
                type: 'priorityChanged',
                label: `Priority changed to ${priority}`,
                from: ticket.priority,
                to: priority,
                actorName,
                actorRole: req.user.role,
                createdAt: now
            });
            ticket.priority = priority;
        }

        if (category && category !== ticket.category) {
            ticket.events.push({
                type: 'categoryChanged',
                label: `Category changed to ${category}`,
                from: ticket.category,
                to: category,
                actorName,
                actorRole: req.user.role,
                createdAt: now
            });
            ticket.category = category;
        }

        if (assignedTo && assignedTo !== ticket.assignedTo?.toString()) {
            const assignee = await User.findById(assignedTo, "name email").lean();
            ticket.events.push({
                type: 'assigned',
                label: `Assigned to ${assignee?.name || 'agent'}`,
                from: ticket.assignedTo,
                to: assignedTo,
                actorName,
                actorRole: req.user.role,
                createdAt: now
            });
            ticket.assignedTo = assignedTo;
        }

        await ticket.save();
        const updated = await SupportTicket.findById(ticket._id)
            .populate("submittedBy", "name email role")
            .populate("assignedTo", "name email")
            .lean();

        res.json({ success: true, message: "Ticket updated", ticket: serializeTicket(updated) });
    } catch (err) {
        console.error("[Support] Admin update error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  SUPER ADMIN: POST /api/support/admin/tickets/:id/note — Internal note
// ══════════════════════════════════════════════════════════════
router.post("/admin/tickets/:id/note", isAuthenticated, requireRole("super_admin"), async (req, res) => {
    try {
        const { message } = req.body;
        if (!message?.trim()) return res.status(400).json({ success: false, message: "Note content is required" });

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        const now = new Date();
        const authorName = req.user.name || req.user.email;

        ticket.messages.push({
            author: authorName,
            role: "admin",
            body: message.trim(),
            date: now,
            footer: "internal_note",
            avatar: req.user.profilePicture || "",
            attachments: []
        });

        ticket.events.push({
            type: 'internalNote',
            label: 'Internal note added',
            actorName: authorName,
            actorRole: req.user.role,
            createdAt: now
        });

        await ticket.save();
        res.json({ success: true, message: "Internal note added", ticket: serializeTicket(ticket.toObject()) });
    } catch (err) {
        console.error("[Support] Internal note error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  PUBLIC: POST /api/support/public/tickets/:id/reopen — Reopen ticket
// ══════════════════════════════════════════════════════════════
router.post("/public/tickets/:id/reopen", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email?.trim()) return res.status(400).json({ success: false, message: "Email is required" });

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        if (ticket.submitterEmail?.toLowerCase() !== email.trim().toLowerCase()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        if (ticket.status !== "resolved" && ticket.status !== "closed") {
            return res.status(400).json({ success: false, message: "Ticket is not resolved or closed" });
        }

        const now = new Date();
        ticket.events.push({
            type: 'reopened',
            label: 'Ticket reopened by user',
            from: ticket.status,
            to: 'open',
            actorName: ticket.submitterName || email,
            actorRole: 'user',
            createdAt: now
        });

        ticket.status = "open";
        ticket.resolvedAt = null;
        ticket.resolvedBy = null;
        await ticket.save();

        res.json({ success: true, message: "Ticket reopened", ticket: serializeTicket(ticket.toObject()) });
    } catch (err) {
        console.error("[Support] Reopen error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  PUBLIC: POST /api/support/public/tickets/:id/rate — Satisfaction rating
// ══════════════════════════════════════════════════════════════
router.post("/public/tickets/:id/rate", async (req, res) => {
    try {
        const { email, rating, comment } = req.body;
        if (!email?.trim()) return res.status(400).json({ success: false, message: "Email is required" });
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        if (ticket.submitterEmail?.toLowerCase() !== email.trim().toLowerCase()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        ticket.satisfaction = {
            rating: Number(rating),
            comment: (comment || "").trim(),
            createdAt: new Date()
        };

        await ticket.save();
        res.json({ success: true, message: "Thank you for your feedback", ticket: serializeTicket(ticket.toObject()) });
    } catch (err) {
        console.error("[Support] Rating error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  PUBLIC: GET /api/support/public/tickets/:id/related — Related tickets
// ══════════════════════════════════════════════════════════════
router.get("/public/tickets/:id/related", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email?.trim()) return res.status(400).json({ success: false, message: "Email is required" });

        const ticket = await SupportTicket.findById(req.params.id).lean();
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        if (ticket.submitterEmail?.toLowerCase() !== email.trim().toLowerCase()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const related = await SupportTicket.find({
            submitterEmail: ticket.submitterEmail,
            _id: { $ne: ticket._id }
        })
        .select("subject status createdAt lastComment")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

        res.json({ success: true, tickets: related });
    } catch (err) {
        console.error("[Support] Related tickets error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
