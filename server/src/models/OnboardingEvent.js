import mongoose from "mongoose";

const onboardingEventSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    demoRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DemoRequest",
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    stage: {
      type: String,
      default: "",
      trim: true,
    },
    actorRole: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

onboardingEventSchema.index({ organizationId: 1, createdAt: -1 });
onboardingEventSchema.index({ demoRequestId: 1, createdAt: -1 });

export default mongoose.models.OnboardingEvent ||
  mongoose.model("OnboardingEvent", onboardingEventSchema);
