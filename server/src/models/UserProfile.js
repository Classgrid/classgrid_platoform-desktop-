import mongoose from "mongoose";

// Profile details schema handling the 100+ fields from the 17 stepper sections
const userProfileSchema = new mongoose.Schema(
  {
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One profile per user
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    // ── Section 1: Personal Details ──────────────────────────────
    identity: {
      first_name: { type: String, default: "" },
      middle_name: { type: String, default: "" },
      last_name: { type: String, default: "" },
      blood_group: { type: String, default: "" },
      nationality: { type: String, default: "Indian" },
      domicile: { type: String, default: "" },
      mother_tongue: { type: String, default: "" },
      marital_status: { type: String, default: "Single" },
      aadhar_number: { type: String, default: "" },
      pan_number: { type: String, default: "" },
      birth_place: { type: String, default: "" },
      native_place: { type: String, default: "" },
    },
    religion_details: {
      religion: { type: String, default: "" },
      caste: { type: String, default: "" },
      sub_caste: { type: String, default: "" },
      creamy_layer: { type: Boolean, default: false },
    },
    handicap_details: {
      physically_handicapped: { type: Boolean, default: false },
      ph_type: { type: String, default: "" },
      ph_percentage: { type: Number, default: 0 },
    },
    minority_details: {
      belongs_to_minority: { type: Boolean, default: false },
      minority_type: { type: String, default: "" },
    },
    passport_details: {
      passport_number: { type: String, default: "" },
      passport_valid_upto: { type: Date, default: null },
      visa_number: { type: String, default: "" },
    },
    admission_details: {
      admission_main_category: { type: String, default: "" },
      seat_type: { type: String, default: "" },
      cap_round: { type: String, default: "" },
      lateral_entry: { type: Boolean, default: false },
    },

    // ── Section 2: Contact Details ───────────────────────────────
    contact: {
      permanent_address: { type: String, default: "" },
      permanent_state: { type: String, default: "" },
      permanent_city: { type: String, default: "" },
      permanent_district: { type: String, default: "" },
      permanent_pincode: { type: String, default: "" },
      current_address: { type: String, default: "" },
      current_state: { type: String, default: "" },
      current_city: { type: String, default: "" },
      current_pincode: { type: String, default: "" },
      emergency_contact_name: { type: String, default: "" },
      emergency_contact_mobile: { type: String, default: "" },
      emergency_contact_relation: { type: String, default: "" },
    },

    // ── Section 3: Family Details ────────────────────────────────
    family: {
      father_occupation: { type: String, default: "" },
      mother_occupation: { type: String, default: "" },
      father_income: { type: Number, default: 0 },
      mother_income: { type: Number, default: 0 },
      father_mobile: { type: String, default: "" },
      mother_mobile: { type: String, default: "" },
      father_email: { type: String, default: "" },
      mother_email: { type: String, default: "" },
      father_education: { type: String, default: "" },
      mother_education: { type: String, default: "" },
      local_guardian_name: { type: String, default: "" },
      local_guardian_mobile: { type: String, default: "" },
      local_guardian_address: { type: String, default: "" },
    },

    // ── Section 4: Education Details ─────────────────────────────
    education: {
      tenth_board: { type: String, default: "" }, // 10th
      tenth_percentage: { type: Number, default: 0 },
      twelfth_board: { type: String, default: "" }, // 12th
      twelfth_percentage: { type: Number, default: 0 },
      pcm_percentage: { type: Number, default: 0 },
      diploma_percentage: { type: Number, default: 0 },
      previous_school: { type: String, default: "" },
      previous_percentage: { type: Number, default: 0 },
      en_number: { type: String, default: "" },
      cet_score: { type: Number, default: 0 },
      jee_score: { type: Number, default: 0 },
      entrance_score: { type: Number, default: 0 },
      university_prn_number: { type: String, default: "" },
    },

    // ── Section 5: Bank Details ──────────────────────────────────
    bank: {
      bank_account_number: { type: String, default: "" },
      bank_ifsc_code: { type: String, default: "" },
      bank_name: { type: String, default: "" },
      bank_branch: { type: String, default: "" },
      bank_micr_code: { type: String, default: "" },
    },

    // ── Section 6: Documents ─────────────────────────────────────
    documents: [{
      document_name: { type: String, required: true },
      file_url: { type: String, required: true },
      uploaded_at: { type: Date, default: Date.now }
    }],

    // ── Section 7: Experience Details (Faculty) ──────────────────
    experience: {
      experience_years: { type: Number, default: 0 },
      experience_details: { type: String, default: "" },
    },

    // ── Section 8: Awards / Participation ────────────────────────
    awards_participation: {
      awards: { type: String, default: "" },
      participation: { type: String, default: "" },
      sports: { type: String, default: "" },
      cultural_activities: { type: String, default: "" },
    },

    // ── Section 9: Student Activity ──────────────────────────────
    activity: {
      clubs_joined: { type: String, default: "" },
      committees: { type: String, default: "" },
      nss_ncc: { type: String, default: "" },
      internships: { type: String, default: "" },
      projects: { type: String, default: "" },
    },

    // ── Section 10: Social Details ───────────────────────────────
    social: {
      instagram_url: { type: String, default: "" },
      facebook_url: { type: String, default: "" },
      linkedin_url: { type: String, default: "" },
      github_url: { type: String, default: "" },
      portfolio_url: { type: String, default: "" },
    },

    // ── Section 12: Medical Details ──────────────────────────────
    medical: {
      medical_conditions: { type: String, default: "" },
      allergies: { type: String, default: "" },
      disability_type: { type: String, default: "" },
      medical_insurance: { type: String, default: "" },
    },

    // ── Section 13: Person Skill & Interest ──────────────────────
    skills_interests: {
      skills: { type: String, default: "" },
      interests: { type: String, default: "" },
      languages_known: { type: String, default: "" },
      career_goal: { type: String, default: "" },
    },

    // ── Section 14: Anti-Ragging Details ─────────────────────────
    anti_ragging: {
      anti_ragging_link: { type: String, default: "" },
      anti_ragging_date: { type: Date, default: null },
    },
    
  },
  { timestamps: true }
);

export default mongoose.models.UserProfile || mongoose.model("UserProfile", userProfileSchema);
