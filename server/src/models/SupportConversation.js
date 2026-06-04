import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderRole: {
    type: String,
    enum: ["org_admin", "super_admin", "department"],
    required: true,
  },
  department: {
    type: String,
    enum: ["general", "onboarding", "admissions", "fees", "technical", "billing", null],
    default: null,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const supportConversationSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180,
  },
  department: {
    type: String,
    enum: ["general", "onboarding", "admissions", "fees", "technical", "billing"],
    default: "general",
    index: true,
  },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open",
    index: true,
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal",
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  messages: {
    type: [supportMessageSchema],
    default: [],
  },
  unreadForOrgAdmin: {
    type: Number,
    default: 0,
  },
  unreadForSuperAdmin: {
    type: Number,
    default: 0,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

supportConversationSchema.index({ organization_id: 1, lastMessageAt: -1 });
supportConversationSchema.index({ department: 1, status: 1, lastMessageAt: -1 });

const SupportConversation = mongoose.model("SupportConversation", supportConversationSchema);

export default SupportConversation;
