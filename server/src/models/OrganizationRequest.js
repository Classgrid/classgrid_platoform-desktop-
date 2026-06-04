import mongoose from "mongoose";

const orgRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  domain: { type: String, required: true },
  type: { type: String, required: true },
  city: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

export default mongoose.models.OrganizationRequest || mongoose.model("OrganizationRequest", orgRequestSchema);
