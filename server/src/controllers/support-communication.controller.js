import SupportConversation from "../models/SupportConversation.js";
import Organization from "../models/Organization.js";
import { addSupportMessage, createSupportConversation, markSupportConversationRead, serializeConversation, sanitizeDepartment, sanitizePriority } from "../services/support-communication.service.js";

export const listOrgSupportConversations = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) return res.status(400).json({ message: "No organization bound." });

    const conversations = await SupportConversation.find({ organization_id: orgId })
      .sort({ lastMessageAt: -1 })
      .select("subject department status priority unreadForOrgAdmin unreadForSuperAdmin lastMessageAt createdAt updatedAt")
      .lean();

    res.json({ conversations });
  } catch (err) {
    console.error("[Org Helpdesk List] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const createOrgSupportConversation = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) return res.status(400).json({ message: "No organization bound." });

    const { subject, department, priority, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ message: "Subject and message are required." });
    }

    const conversation = await createSupportConversation({
      organizationId: orgId,
      createdBy: req.user._id,
      subject,
      department,
      priority,
      body,
    });

    res.status(201).json({ conversation: serializeConversation(conversation) });
  } catch (err) {
    console.error("[Org Helpdesk Create] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOrgSupportConversation = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const conversation = await SupportConversation.findOne({
      _id: req.params.threadId,
      organization_id: orgId,
    })
      .populate("messages.sender", "name email role")
      .populate("createdBy", "name email role")
      .lean();

    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    res.json({ conversation });
  } catch (err) {
    console.error("[Org Helpdesk Get] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendOrgSupportMessage = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: "Message body is required." });

    const existing = await SupportConversation.findOne({ _id: req.params.threadId, organization_id: orgId }).select("_id").lean();
    if (!existing) return res.status(404).json({ message: "Conversation not found." });

    const conversation = await addSupportMessage({
      conversationId: req.params.threadId,
      senderId: req.user._id,
      senderRole: "org_admin",
      body,
    });

    res.status(201).json({ conversation: serializeConversation(conversation) });
  } catch (err) {
    console.error("[Org Helpdesk Reply] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const markOrgSupportConversationRead = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const existing = await SupportConversation.findOne({ _id: req.params.threadId, organization_id: orgId }).select("_id").lean();
    if (!existing) return res.status(404).json({ message: "Conversation not found." });

    const conversation = await markSupportConversationRead({ conversationId: req.params.threadId, actorRole: "org_admin" });
    res.json({ conversation: serializeConversation(conversation) });
  } catch (err) {
    console.error("[Org Helpdesk Read] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const listSuperAdminSupportConversations = async (req, res) => {
  try {
    const { department, status, orgId } = req.query;
    const filter = {};
    if (department) filter.department = sanitizeDepartment(department);
    if (status) filter.status = status;
    if (orgId) filter.organization_id = orgId;

    const conversations = await SupportConversation.find(filter)
      .populate("createdBy", "name email role organization_id")
      .sort({ lastMessageAt: -1 })
      .lean();

    res.json({ conversations });
  } catch (err) {
    console.error("[SuperAdmin Helpdesk List] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSuperAdminSupportConversation = async (req, res) => {
  try {
    const conversation = await SupportConversation.findById(req.params.threadId)
      .populate("messages.sender", "name email role organization_id")
      .populate("createdBy", "name email role organization_id")
      .lean();

    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const organization = await Organization.findById(conversation.organization_id)
      .select("name ownerName ownerEmail")
      .lean();

    res.json({ conversation, organization });
  } catch (err) {
    console.error("[SuperAdmin Helpdesk Get] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendSuperAdminSupportMessage = async (req, res) => {
  try {
    const { body, department } = req.body;
    if (!body) return res.status(400).json({ message: "Message body is required." });

    const conversation = await addSupportMessage({
      conversationId: req.params.threadId,
      senderId: req.user._id,
      senderRole: "super_admin",
      department,
      body,
    });

    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    res.status(201).json({ conversation: serializeConversation(conversation) });
  } catch (err) {
    console.error("[SuperAdmin Helpdesk Reply] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSuperAdminSupportConversation = async (req, res) => {
  try {
    const updates = {};
    const { department, priority, status } = req.body;
    if (department) updates.department = sanitizeDepartment(department);
    if (priority) updates.priority = sanitizePriority(priority);
    if (status) updates.status = status;

    const conversation = await SupportConversation.findByIdAndUpdate(
      req.params.threadId,
      { $set: updates },
      { new: true }
    );

    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    res.json({ conversation: serializeConversation(conversation) });
  } catch (err) {
    console.error("[SuperAdmin Helpdesk Update] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const markSuperAdminSupportConversationRead = async (req, res) => {
  try {
    const conversation = await markSupportConversationRead({ conversationId: req.params.threadId, actorRole: "super_admin" });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    res.json({ conversation: serializeConversation(conversation) });
  } catch (err) {
    console.error("[SuperAdmin Helpdesk Read] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSuperAdminSupportConversation = async (req, res) => {
  try {
    // Try SupportConversation first (Classgrid Talk / Inquiries)
    let deleted = await SupportConversation.findByIdAndDelete(req.params.threadId);
    
    // If not found, try SupportTicket (In-app Support Tickets)
    if (!deleted) {
      const SupportTicket = (await import("../models/SupportTicket.js")).default;
      deleted = await SupportTicket.findByIdAndDelete(req.params.threadId);
    }
    
    if (!deleted) return res.status(404).json({ message: "Ticket not found." });
    res.json({ success: true, message: "Ticket deleted successfully." });
  } catch (err) {
    console.error("[SuperAdmin Helpdesk Delete] Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
