import mongoose from 'mongoose';

const orgSubscriptionSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['demo', 'active'], // 🛑 Strict Single-Plan Enterprise Model
    default: 'demo'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'grace_period'],
    default: 'active'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 31 * 24 * 60 * 60 * 1000) // Default 31 days demo
  },
  razorpay_subscription_id: {
    type: String,
    default: null
  },
  razorpay_customer_id: {
    type: String,
    default: null
  },
  features: {
    attendance: { type: Boolean, default: true },
    examinations: { type: Boolean, default: true },
    admissions: { type: Boolean, default: true }, 
    canteen: { type: Boolean, default: true },     
    ai_viva: { type: Boolean, default: true },     
    naac_auditor: { type: Boolean, default: true } 
  },
  metadata: {
    max_students: { type: Number, default: 50 },  // Demo limit
    max_faculty: { type: Number, default: 5 },    // Demo limit
    storage_limit_gb: { type: Number, default: 2 }, // S3/Document limit
    demo_review_reminder_sent_at: { type: Date, default: null },
    demo_ending_soon_sent_at: { type: Date, default: null },
    demo_final_reminder_sent_at: { type: Date, default: null },
    demo_payment_required_sent_at: { type: Date, default: null }
  },

  // ── Billing Rates (set by Super Admin per org) ─────────────────────
  // All values are in INR. Leave at 0 until Super Admin configures them.
  billing: {
    basePricePerMonth: { type: Number, default: 0 },   // Fixed monthly base fee
    pricePerStudent:   { type: Number, default: 0 },   // ₹ per student per month
    pricePerGB:        { type: Number, default: 0 },   // ₹ per GB of storage per month
    freeStorageGB:     { type: Number, default: 0 },   // GB included free (no charge)
  }

}, { timestamps: true });

// Index for expiry worker
orgSubscriptionSchema.index({ expiresAt: 1, status: 1 });

const OrgSubscription = mongoose.model('OrgSubscription', orgSubscriptionSchema);

export default OrgSubscription;
