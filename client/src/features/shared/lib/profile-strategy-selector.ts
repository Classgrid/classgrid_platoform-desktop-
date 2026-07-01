import { ERP_OPTIONS } from "./erp-options";
import {
  ERPSTUDENTADMISSIONMAINCATEGORYLIST,
  NATIONALITYLIST,
  ERPAREATYPELIST,
  BIRTHSTATELIST,
  BIRTHCOUNTRYLIST,
  ERPDOMACILELIST,
  ERPMARITALSTATUSLIST,
  ERPSCHOLARSHIPTYPELIST,
  BLOODGROUPLIST,
  ERPSUBCASTLIST,
  MINORITYTYPELIST,
  ERPRELIGIONLIST,
  ERPCASTLIST,
  GENDERLIST,
  RELATIONTYPELIST,
  BIRTHDISTRICTLIST,
  MOTHERTOUNGELIST,
  ERPUNIVERSITYLIST,
  INDIA_STATES,
  INDIA_DISTRICTS,
  INDIA_TALUKAS,
  EXSERVICEMANLIST,
  CREAMYLAYERLIST,
  PHYSICALLYHANDICAPPEDLIST,
  ISBELONGSTOMINORITYLIST,
  GOVERNMENTSCHEMELIST
} from "./erp-large-options";

export const MASTER_PROFILE_SECTION_POOL = {
  personal_details: {
    key: "personal_details",
    label: "Personal Details",
    icon: "User",
    sub_tabs: ["identity", "religion", "physically_handicapped", "minority_details", "passport_details", "admission_details"],
    fields: [
      { key: "name", label: "Full Name", type: "text", sub_tab: "identity" },
      { key: "first_name", label: "First Name", type: "text", sub_tab: "identity", required: true },
      { key: "middle_name", label: "Middle Name", type: "text", sub_tab: "identity" },
      { key: "last_name", label: "Last Name", type: "text", sub_tab: "identity", required: true },
      { key: "dob", label: "Date of Birth", type: "date", sub_tab: "identity", required: true },
      { key: "gender", label: "Gender", type: "dropdown", sub_tab: "identity", options: GENDERLIST, required: true },
      { key: "blood_group", label: "Blood Group", type: "dropdown", sub_tab: "identity", options: BLOODGROUPLIST, required: true },
      { key: "nationality", label: "Nationality", type: "dropdown", sub_tab: "identity", options: NATIONALITYLIST, required: true },
      { key: "domicile", label: "Domicile", type: "dropdown", sub_tab: "identity", options: ERPDOMACILELIST },
      { key: "mother_tongue", label: "Mother Tongue", type: "dropdown", sub_tab: "identity", options: MOTHERTOUNGELIST },
      { key: "marital_status", label: "Marital Status", type: "dropdown", sub_tab: "identity", options: ERPMARITALSTATUSLIST },
      { key: "ex_serviceman", label: "Ex-Serviceman", type: "dropdown", sub_tab: "identity", options: EXSERVICEMANLIST },
      { key: "fsis_number", label: "FSIS Number", type: "text", sub_tab: "identity" },
      { key: "aadhar_number", label: "Aadhar Number", type: "text", sub_tab: "identity" },
      { key: "pan_number", label: "PAN Number", type: "text", sub_tab: "identity" },
      { key: "birth_country", label: "Birth Country", type: "dropdown", sub_tab: "identity", options: BIRTHCOUNTRYLIST, required: true },
      { key: "birth_state", label: "Birth State", type: "dropdown", sub_tab: "identity", options: INDIA_STATES, required: true },
      { key: "birth_district", label: "Birth District", type: "dropdown", sub_tab: "identity", options: INDIA_DISTRICTS, required: true },
      { key: "birth_place", label: "Birth Place", type: "dropdown", sub_tab: "identity", options: INDIA_TALUKAS, required: true },
      { key: "native_country", label: "Native Country", type: "dropdown", sub_tab: "identity", options: NATIONALITYLIST },
      { key: "native_state", label: "Native State", type: "dropdown", sub_tab: "identity", options: INDIA_STATES },
      { key: "native_district", label: "Native District", type: "dropdown", sub_tab: "identity", options: INDIA_DISTRICTS },
      { key: "native_place", label: "Native Place", type: "dropdown", sub_tab: "identity", options: INDIA_TALUKAS },
      { key: "religion", label: "Religion", type: "dropdown", sub_tab: "religion", options: ERPRELIGIONLIST },
      { key: "caste", label: "Caste", type: "dropdown", sub_tab: "religion", options: ERPCASTLIST, required: true },
      { key: "sub_caste", label: "Sub Caste", type: "dropdown", sub_tab: "religion", options: ERPSUBCASTLIST, required: true },
      { key: "category", label: "Category", type: "dropdown", sub_tab: "religion", options: ERPSTUDENTADMISSIONMAINCATEGORYLIST, required: true },
      { key: "creamy_layer", label: "Creamy Layer", type: "dropdown", sub_tab: "religion", options: CREAMYLAYERLIST },
      { key: "physically_handicapped", label: "Physically Handicapped", type: "dropdown", sub_tab: "physically_handicapped", options: PHYSICALLYHANDICAPPEDLIST },
      { key: "ph_type", label: "PH Type", type: "text", sub_tab: "physically_handicapped" },
      { key: "ph_percentage", label: "PH Percentage", type: "number", sub_tab: "physically_handicapped" },
      { key: "belongs_to_minority", label: "Belongs to Minority", type: "dropdown", sub_tab: "minority_details", options: ISBELONGSTOMINORITYLIST },
      { key: "minority_type", label: "Minority Type", type: "dropdown", sub_tab: "minority_details", options: MINORITYTYPELIST },
      { key: "passport_number", label: "Passport Number", type: "text", sub_tab: "passport_details" },
      { key: "passport_valid_upto", label: "Passport Valid Upto", type: "date", sub_tab: "passport_details" },
      { key: "visa_number", label: "Visa Number", type: "text", sub_tab: "passport_details" },
      { key: "residential_permit_no", label: "Residential Permit No", type: "text", sub_tab: "passport_details" },
      { key: "permit_issue_date", label: "Permit Issue Date", type: "date", sub_tab: "passport_details" },
      { key: "permit_issue_upto_date", label: "Permit Issue Upto Date", type: "date", sub_tab: "passport_details" },
      { key: "admission_type", label: "Admission Type", type: "dropdown", sub_tab: "admission_details", options: ["CAP", "Management", "Direct", "Lateral"] },
      { key: "admission_main_category", label: "Admission Category", type: "dropdown", sub_tab: "admission_details", options: ERPSTUDENTADMISSIONMAINCATEGORYLIST, required: true },
      { key: "seat_type", label: "Seat Type", type: "dropdown", sub_tab: "admission_details", options: ["CAP", "INSTITUTIONAL", "MANAGEMENT", "SPOT"] },
      { key: "cap_round", label: "CAP Round", type: "text", sub_tab: "admission_details" },
      { key: "lateral_entry", label: "Lateral Entry", type: "boolean", sub_tab: "admission_details" },
      { key: "institute_preference_number", label: "Institute Preference Number", type: "number", sub_tab: "admission_details" },
      { key: "government_scheme", label: "Government Scheme", type: "dropdown", sub_tab: "admission_details", options: GOVERNMENTSCHEMELIST },
      { key: "scholarship_type", label: "Scholarship Type", type: "dropdown", sub_tab: "admission_details", options: ERPSCHOLARSHIPTYPELIST },
    ],
  },
  contact_details: {
    key: "contact_details",
    label: "Contact Details",
    icon: "Phone",
    fields: [
      { key: "email", label: "Email", type: "text", required: true },
      { key: "alternateEmail", label: "Alternate Email", type: "text", required: true },
      { key: "phoneNumber", label: "Mobile Number", type: "text", required: true },
      { key: "permanent_address", label: "Permanent Address", type: "text" },
      { key: "permanent_state", label: "State", type: "dropdown", options: INDIA_STATES },
      { key: "permanent_district", label: "District", type: "dropdown", options: INDIA_DISTRICTS },
      { key: "permanent_taluka", label: "Taluka", type: "dropdown", options: INDIA_TALUKAS },
      { key: "permanent_city", label: "City / Village", type: "text" },
      { key: "permanent_pincode", label: "Pincode", type: "text" },
      { key: "native_area_type", label: "Native Area Type", type: "dropdown", options: ERPAREATYPELIST },
      { key: "current_address", label: "Current Address", type: "text" },
      { key: "current_state", label: "Current State", type: "dropdown", options: INDIA_STATES },
      { key: "current_taluka", label: "Current Taluka", type: "dropdown", options: INDIA_TALUKAS },
      { key: "current_city", label: "Current City / Village", type: "text" },
      { key: "current_pincode", label: "Current Pincode", type: "text" },
      { key: "area_type", label: "Current Area Type", type: "dropdown", options: ERPAREATYPELIST },
      { key: "emergency_contact_name", label: "Emergency Contact Name", type: "text" },
      { key: "emergency_contact_mobile", label: "Emergency Contact Mobile", type: "text" },
      { key: "emergency_contact_relation", label: "Relation", type: "dropdown", options: RELATIONTYPELIST },
    ],
  },
  family_details: {
    key: "family_details",
    label: "Family Details",
    icon: "Users",
    fields: [
      { key: "fatherName", label: "Father's Name", type: "text", required: true },
      { key: "motherName", label: "Mother's Name", type: "text", required: true },
      { key: "earning_parent_name", label: "Earning Parent Name", type: "text", required: true },
      { key: "earning_parent_relation", label: "Earning Parent Relation", type: "dropdown", options: RELATIONTYPELIST, required: true },
      { key: "father_occupation", label: "Father's Occupation", type: "text" },
      { key: "mother_occupation", label: "Mother's Occupation", type: "text" },
      { key: "father_income", label: "Father's Income", type: "number" },
      { key: "mother_income", label: "Mother's Income", type: "number" },
      { key: "father_mobile", label: "Father's Mobile", type: "text", sensitive: true },
      { key: "mother_mobile", label: "Mother's Mobile", type: "text", sensitive: true },
      { key: "father_email", label: "Father's Email", type: "text" },
      { key: "mother_email", label: "Mother's Email", type: "text" },
      { key: "father_education", label: "Father's Education", type: "text" },
      { key: "mother_education", label: "Mother's Education", type: "text" },
      { key: "local_guardian_name", label: "Local Guardian Name", type: "text" },
      { key: "local_guardian_mobile", label: "Local Guardian Mobile", type: "text", sensitive: true },
      { key: "local_guardian_address", label: "Local Guardian Address", type: "text" },
    ],
  },
  education_details: {
    key: "education_details",
    label: "Education Details",
    icon: "GraduationCap",
    fields: [
      { key: "10th_board", label: "10th Board", type: "text" },
      { key: "10th_percentage", label: "10th Percentage", type: "number" },
      { key: "12th_board", label: "12th Board", type: "text" },
      { key: "12th_percentage", label: "12th Percentage", type: "number" },
      { key: "pcm_percentage", label: "PCM Percentage", type: "number" },
      { key: "diploma_percentage", label: "Diploma Percentage", type: "number" },
      { key: "previous_school", label: "Previous School/College", type: "text" },
      { key: "previous_percentage", label: "Previous Percentage", type: "number" },
      { key: "en_number", label: "EN Number", type: "text" },
      { key: "cet_score", label: "CET Score", type: "number" },
      { key: "jee_score", label: "JEE Score", type: "number" },
      { key: "entrance_score", label: "Entrance Score (Custom)", type: "number" },
      { key: "eligibilityNo", label: "Eligibility Number", type: "text" },
      { key: "abc_id", label: "ABC ID", type: "text" },
      { key: "university_prn_number", label: "University PRN", type: "text" },
    ],
  },
  bank_details: {
    key: "bank_details",
    label: "Bank Details",
    icon: "Landmark",
    fields: [
      { key: "bank_account_number", label: "Account Number", type: "text", sensitive: true },
      { key: "bank_ifsc_code", label: "IFSC Code", type: "text" },
      { key: "bank_name", label: "Bank Name", type: "text" },
      { key: "bank_branch", label: "Branch Name", type: "text" },
      { key: "bank_micr_code", label: "MICR Code", type: "text" },
    ],
  },
  upload_documents: {
    key: "upload_documents",
    label: "Upload Documents",
    icon: "FileUp",
    fields: [
      { key: "doc_10th", label: "10th Marksheet", type: "file_list" },
      { key: "doc_12th", label: "12th Marksheet / Diploma", type: "file_list" },
      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },
      { key: "doc_pan", label: "PAN Card", type: "file_list" },
      { key: "doc_lc", label: "Leaving Certificate (LC)", type: "file_list" },
      { key: "doc_caste", label: "Caste Certificate (If Applicable)", type: "file_list" },
      { key: "doc_validity", label: "Caste Validity (If Applicable)", type: "file_list" },
      { key: "doc_income", label: "Income Certificate", type: "file_list" },
      { key: "doc_domicile", label: "Domicile Certificate", type: "file_list" },
    ],
  },
  experience_details: {
    key: "experience_details",
    label: "Experience Details",
    icon: "Briefcase",
    fields: [
      { key: "qualification", label: "Qualification", type: "text" },
      { key: "department", label: "Department", type: "text" },
      { key: "designation", label: "Designation", type: "text" },
      { key: "subjectsAssigned", label: "Subjects Assigned", type: "text" },
      { key: "subject", label: "Primary Subject", type: "text" },
      { key: "experience_years", label: "Experience (Years)", type: "number" },
      { key: "experience_details", label: "Experience Details", type: "text" },
      { key: "biometricId", label: "Biometric ID", type: "text" },
    ],
  },
  awards_participation: {
    key: "awards_participation",
    label: "Award / Participation Details",
    icon: "Trophy",
    fields: [
      { key: "awards", label: "Awards & Achievements", type: "text" },
      { key: "participation", label: "Participation Details", type: "text" },
      { key: "sports", label: "Sports", type: "text" },
      { key: "cultural_activities", label: "Cultural Activities", type: "text" },
    ],
  },
  student_activity: {
    key: "student_activity",
    label: "Student Activity",
    icon: "Activity",
    fields: [
      { key: "clubs_joined", label: "Clubs Joined", type: "text" },
      { key: "committees", label: "Committee Membership", type: "text" },
      { key: "nss_ncc", label: "NSS / NCC", type: "text" },
      { key: "internships", label: "Internships", type: "text" },
      { key: "projects", label: "Projects", type: "text" },
    ],
  },
  social_details: {
    key: "social_details",
    label: "Social Details",
    icon: "Globe",
    fields: [
      { key: "bio", label: "Bio", type: "text" },
      { key: "hobby", label: "Hobbies", type: "text" },
      { key: "linkedin_url", label: "LinkedIn", type: "url" },
      { key: "github_url", label: "GitHub", type: "url" },
      { key: "instagram_url", label: "Instagram", type: "url" },
      { key: "portfolio_url", label: "Portfolio", type: "url" },
      { key: "facebook_url", label: "Facebook", type: "url" },
    ],
  },
  id_card_photos: {
    key: "id_card_photos",
    label: "ID-Card Photo & Sign Upload",
    icon: "CreditCard",
    fields: [
      { key: "profilePicture", label: "Profile Photo", type: "image" },
      { key: "profileBanner", label: "Profile Banner", type: "image" },
      { key: "signature", label: "Signature", type: "image" },
    ],
  },
  medical_details: {
    key: "medical_details",
    label: "Medical Details",
    icon: "HeartPulse",
    fields: [
      { key: "medical_conditions", label: "Medical Conditions", type: "text" },
      { key: "allergies", label: "Allergies", type: "text" },
      { key: "disability_type", label: "Disability Type", type: "text" },
      { key: "medical_insurance", label: "Medical Insurance No.", type: "text" },
    ],
  },
  skills_interest: {
    key: "skills_interest",
    label: "Person Skill & Interest",
    icon: "Sparkles",
    fields: [
      { key: "skills", label: "Skills", type: "text" },
      { key: "interests", label: "Interests", type: "text" },
      { key: "languages_known", label: "Languages Known", type: "text" },
      { key: "career_goal", label: "Career Goal", type: "text" },
    ],
  },
  anti_ragging: {
    key: "anti_ragging",
    label: "Anti-Ragging Details",
    icon: "ShieldCheck",
    fields: [
      { key: "anti_ragging_undertaking_no", label: "Anti-Ragging Undertaking No *", type: "text" },
      { key: "anti_ragging_date", label: "Undertaking Date", type: "date" },
    ],
  },
  academic_placement: {
    key: "academic_placement",
    label: "Academic Placement",
    icon: "School",
    fields: [
      { key: "prn", label: "PRN", type: "text" },
      { key: "branch", label: "Branch", type: "text" },
      { key: "batch", label: "Batch", type: "text" },
      { key: "department", label: "Department", type: "text" },
      { key: "division", label: "Division", type: "text" },
      { key: "standard", label: "Standard", type: "text" },
      { key: "stream", label: "Stream", type: "text" },
      { key: "course", label: "Course", type: "text" },
      { key: "semester", label: "Semester", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "degree", label: "Degree", type: "text" },
    ],
  },
  platform_metadata: {
    key: "platform_metadata",
    label: "Platform Info",
    icon: "Clock",
    fields: [
      { key: "lastLoginAt", label: "Last Seen", type: "datetime" },
      { key: "createdAt", label: "Member Since", type: "date" },
      { key: "status", label: "Account Status", type: "text" },
      { key: "verification_status", label: "Verification Status", type: "text" },
      { key: "organization_name", label: "Organization", type: "text" },
    ],
  },
  hr_payroll: {
    key: "hr_payroll",
    label: "HR & Payroll",
    icon: "Wallet",
    fields: [
      { key: "payroll_salary_mode", label: "Salary Mode", type: "dropdown", options: ["hourly", "monthly", "none"], sensitive: true },
      { key: "payroll_hourly_rate", label: "Hourly Rate", type: "number", sensitive: true },
      { key: "payroll_base_salary", label: "Base Monthly Salary", type: "number", sensitive: true },
      { key: "biometricId", label: "Biometric ID", type: "text" },
    ],
  },
};

export const ORG_TYPE_LABEL_MAP = {
  engineering: {
    prn: "PRN", branch: "Branch", batch: "Batch (e.g. 2023-2027)", department: "Department",
    division: "Division", semester: "Semester", year: "Year", degree: "Degree Program",
    standard: null, stream: null, course: null,
  },
  school: {
    prn: "Roll Number", branch: null, batch: "Academic Year", department: null,
    division: "Division", semester: null, year: null, degree: null,
    standard: "Class / Standard", stream: null, course: null,
  },
  junior_college: {
    prn: "Roll Number", branch: null, batch: "Academic Year", department: null,
    division: "Division", semester: null, year: null, degree: null,
    standard: "Class (11th / 12th)", stream: "Stream", course: null,
  },
  coaching: {
    prn: "Student ID", branch: null, batch: "Batch", department: null,
    division: null, semester: null, year: null, degree: null,
    standard: null, stream: null, course: "Course / Program",
  },
  diploma: {
    prn: "PRN / Enrollment No.", branch: "Branch", batch: "Batch", department: "Department",
    division: "Division", semester: "Semester", year: "Year", degree: null,
    standard: null, stream: null, course: null,
  },
  other: {
    prn: "ID Number", branch: "Branch", batch: "Batch", department: "Department",
    division: "Division", semester: "Semester", year: "Year", degree: "Degree",
    standard: "Level", stream: "Stream", course: "Course",
  },
};

export const ROLE_PROFILE_CONFIGS = {
  student: {
    sections: [
      "personal_details", "academic_placement", "contact_details", "family_details",
      "education_details", "bank_details", "upload_documents", "awards_participation",
      "student_activity", "social_details", "id_card_photos", "medical_details",
      "skills_interest", "anti_ragging", "platform_metadata",
    ],
    academic_placement_fields: {
      engineering: ["prn", "degree", "department", "branch", "year", "semester", "division", "batch"],
      school: ["prn", "standard", "division", "batch"],
      junior_college: ["prn", "stream", "standard", "division", "batch"],
      coaching: ["prn", "course", "batch"],
      diploma: ["prn", "department", "branch", "year", "semester", "division", "batch"],
      other: ["prn", "department", "branch", "batch"],
    },
  },
  faculty: {
    sections: [
      "personal_details", "experience_details", "contact_details", "education_details",
      "social_details", "id_card_photos", "awards_participation", "skills_interest", "platform_metadata",
    ],
    academic_placement_fields: null,
  },
  org_admin: {
    sections: [
      "personal_details", "experience_details", "contact_details", "social_details",
      "id_card_photos", "platform_metadata",
    ],
    academic_placement_fields: null,
  },
  admission_head: {
    sections: [
      "personal_details", "experience_details", "contact_details", "social_details",
      "id_card_photos", "platform_metadata",
    ],
    academic_placement_fields: null,
  },
  super_admin: {
    sections: ["personal_details", "contact_details", "social_details", "id_card_photos", "platform_metadata"],
    academic_placement_fields: null,
  },
  department_admin: {
    sections: [
      "personal_details", "experience_details", "contact_details", "social_details",
      "id_card_photos", "platform_metadata",
    ],
    academic_placement_fields: null,
  },
  hod: {
    sections: [
      "personal_details", "experience_details", "contact_details", "education_details",
      "social_details", "id_card_photos", "awards_participation", "skills_interest", "platform_metadata",
    ],
    academic_placement_fields: null,
  },
  principal: {
    sections: ["personal_details", "experience_details", "contact_details", "social_details", "id_card_photos", "platform_metadata"],
    academic_placement_fields: null,
  },
};

export const VIEWER_ACCESS_MATRIX = {
  self: {
    access_level: "full", can_edit: true, hidden_sections: [], show_sensitive: true, show_settings: true,
  },
  super_admin: {
    access_level: "full", can_edit: false, hidden_sections: [], show_sensitive: true, show_settings: false,
  },
  org_admin: {
    access_level: "full", can_edit: false, hidden_sections: [], show_sensitive: true, show_settings: false,
  },
  department_admin: {
    access_level: "full", can_edit: false, hidden_sections: ["hr_payroll"], show_sensitive: true, show_settings: false,
  },
  principal: {
    access_level: "full", can_edit: false, hidden_sections: ["hr_payroll"], show_sensitive: true, show_settings: false,
  },
  hod: {
    access_level: "professional", can_edit: false, hidden_sections: ["bank_details", "hr_payroll"], show_sensitive: false, show_settings: false,
  },
  admission_head: {
    access_level: "professional", can_edit: false, hidden_sections: ["bank_details", "hr_payroll", "medical_details"], show_sensitive: false, show_settings: false,
  },
  fee_manager: {
    access_level: "professional", can_edit: false, hidden_sections: ["hr_payroll", "medical_details"], show_sensitive: false, show_settings: false,
    section_overrides: { bank_details: { visible: true, show_sensitive: true } },
  },
  exam_controller: {
    access_level: "professional", can_edit: false, hidden_sections: ["bank_details", "hr_payroll", "family_details", "medical_details"], show_sensitive: false, show_settings: false,
  },
  library_manager: {
    access_level: "public", can_edit: false, hidden_sections: ["bank_details", "hr_payroll", "family_details", "medical_details", "education_details"], show_sensitive: false, show_settings: false,
  },
  hr_dept: {
    access_level: "full", can_edit: false, hidden_sections: [], show_sensitive: true, show_settings: false,
    section_overrides: { hr_payroll: { visible: true, show_sensitive: true } },
  },
  faculty: {
    access_level: "professional", can_edit: false, hidden_sections: ["bank_details", "hr_payroll"], show_sensitive: false, show_settings: false,
  },
  student: {
    access_level: "public", can_edit: false,
    hidden_sections: ["bank_details", "hr_payroll", "family_details", "medical_details", "upload_documents", "anti_ragging"],
    show_sensitive: false, show_settings: false,
  },
};

export function getResolvedProfileStrategy({
  targetRole,
  viewerRole,
  orgType,
  structureType,
  isSelfView = false,
  context = "full",
}: {
  targetRole: string;
  viewerRole: string;
  orgType: string;
  structureType: string;
  isSelfView?: boolean;
  context?: "full" | "chat";
}) {
  const resolveBaseOrgType = (o: string, s: string) => {
    if (o) return o;
    const structureMap: Record<string, string> = {
      engineering: "engineering", engineering_with_div: "engineering", engineering_no_div: "engineering",
      school_with_div: "school", school_no_div: "school", coaching: "coaching",
      junior_college: "junior_college", junior_college_with_div: "junior_college", junior_college_no_div: "junior_college",
      diploma: "diploma", diploma_with_div: "diploma", diploma_no_div: "diploma", custom: "other",
    };
    return structureMap[s] || "other";
  };

  const baseOrgType = resolveBaseOrgType(orgType, structureType);
  const labels = ORG_TYPE_LABEL_MAP[baseOrgType as keyof typeof ORG_TYPE_LABEL_MAP] || ORG_TYPE_LABEL_MAP.other;
  const targetConfig = ROLE_PROFILE_CONFIGS[targetRole as keyof typeof ROLE_PROFILE_CONFIGS] || ROLE_PROFILE_CONFIGS.student;
  const viewerAccess = isSelfView ? VIEWER_ACCESS_MATRIX.self : (VIEWER_ACCESS_MATRIX[viewerRole as keyof typeof VIEWER_ACCESS_MATRIX] || VIEWER_ACCESS_MATRIX.student);

  const hiddenByViewer = new Set(viewerAccess.hidden_sections || []);
  const visibleSections = targetConfig.sections
    .filter(sectionKey => !hiddenByViewer.has(sectionKey))
    .map(sectionKey => {
      const sectionDef = MASTER_PROFILE_SECTION_POOL[sectionKey as keyof typeof MASTER_PROFILE_SECTION_POOL];
      if (!sectionDef) return null;

      let fields = sectionDef.fields;
      if (sectionKey === "academic_placement" && targetConfig.academic_placement_fields) {
        const relevantKeys = targetConfig.academic_placement_fields[baseOrgType as keyof typeof targetConfig.academic_placement_fields] || [];
        fields = sectionDef.fields.filter(f => relevantKeys.includes(f.key));
      }

      fields = fields.filter(f => {
        const resolvedLabel = labels[f.key as keyof typeof labels];
        return resolvedLabel !== null;
      }).map(f => ({
        ...f,
        label: labels[f.key as keyof typeof labels] !== undefined ? labels[f.key as keyof typeof labels] : f.label,
      }));

      if (!viewerAccess.show_sensitive) {
        fields = fields.filter(f => !f.sensitive);
      }

      return {
        key: sectionKey,
        label: sectionDef.label,
        icon: sectionDef.icon,
        sub_tabs: sectionDef.sub_tabs || null,
        fields,
      };
    })
    .filter(Boolean);

  return {
    context: "full",
    targetRole,
    viewerRole,
    orgType: baseOrgType,
    structureType: structureType || baseOrgType,
    isSelfView,
    labels,
    sections: visibleSections,
    permissions: {
      can_edit: viewerAccess.can_edit,
      show_settings: viewerAccess.show_settings,
      access_level: viewerAccess.access_level,
    },
  };
}
