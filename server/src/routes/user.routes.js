import express from "express";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import connectDB from "../../config/db.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { attachInstitutionProfile } from "../middleware/institution-profile.middleware.js";
import { getChatSb } from "../config/supabaseClient.js";
import { generateR2UploadUrl } from "../services/r2.service.js";

const router = express.Router();

// =======================
// GET USER PROFILE
// =======================
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("organization_id")
      .select("-password -verificationToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber || "",
        profilePicture: user.profilePicture || "",
        profileBanner: user.profileBanner || "",
        photoURL: user.profilePicture || "", // Alias for compatibility
        qualification: user.qualification || "",
        department: user.department || "",
        bio: user.bio || "",
        address: user.address || "",
        hobby: user.hobby || "",
        subjectsAssigned: user.subjectsAssigned || "",
        prn: user.prn || null,
        abc_id: user.abc_id || null,
        fatherName: user.fatherName || "",
        motherName: user.motherName || "",
        eligibilityNo: user.eligibilityNo || "",
        pattern: user.pattern || "",
        authProvider: user.authProvider,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        dob: user.dob || null,
        gender: user.gender || null,
        alternateEmail: user.alternateEmail || "",
        signature: user.signature || "",
        organization_id: user.organization_id ? {
          id: user.organization_id._id,
          name: user.organization_id.name,
          logo_url: user.organization_id.logo_url,
          rollNumberLabel: user.organization_id.academic_config?.identifierLabel || user.organization_id.rollNumberLabel || "PRN",
          address: user.organization_id.address || "",
          website: user.organization_id.website || "",
          contactNumber: user.organization_id.contactNumber || "",
          affiliation: user.organization_id.affiliation || "",
          academic_config: user.organization_id.academic_config || {},
        } : null,
        branch: user.branch || null,
        batch: user.batch || null,
        profile_completed: user.profile_completed,
        pushNotifications: user.pushNotifications || { global: true }
      },
    });
  } catch (error) {
    console.error("PROFILE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// UPDATE USER PROFILE
// =======================
router.put("/update", isAuthenticated, attachInstitutionProfile({ required: false }), async (req, res) => {
  try {
    const { name, phoneNumber, profilePicture, profileBanner, qualification, department, bio, prn, abc_id, branch, batch, address, hobby, subjectsAssigned, dob, gender, fatherName, motherName, eligibilityNo, pattern, alternateEmail, signature, admission_type, category } = req.body;

    // Safety check: Don't allow empty name
    if (name !== undefined && (name === null || name.trim() === "")) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (profilePicture !== undefined) {
      // Lightweight server-side photo validation (no native modules)
      if (profilePicture && profilePicture.startsWith('data:image/')) {
        // Extract base64 and check rough size
        const base64Data = profilePicture.split(',')[1] || '';
        const sizeBytes = Math.ceil(base64Data.length * 3 / 4);
        if (sizeBytes > 600 * 1024) {
          return res.status(400).json({ message: 'Profile photo must be under 600KB' });
        }
        if (sizeBytes < 500) {
          return res.status(400).json({ message: 'Profile photo is too small or corrupted' });
        }
      }
      updateData.profilePicture = profilePicture;
    }
    if (profileBanner !== undefined) updateData.profileBanner = profileBanner;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (bio !== undefined) updateData.bio = (bio || '').substring(0, 300);
    if (address !== undefined) updateData.address = (address || '').substring(0, 200);
    if (hobby !== undefined) updateData.hobby = (hobby || '').substring(0, 200);
    if (subjectsAssigned !== undefined) updateData.subjectsAssigned = (subjectsAssigned || '').substring(0, 500);

    // New Profile Fields
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (fatherName !== undefined) updateData.fatherName = (fatherName || '').trim();
    if (motherName !== undefined) updateData.motherName = (motherName || '').trim();
    if (eligibilityNo !== undefined) updateData.eligibilityNo = (eligibilityNo || '').trim();
    if (pattern !== undefined) updateData.pattern = (pattern || '').trim();
    if (alternateEmail !== undefined) updateData.alternateEmail = (alternateEmail || '').trim().toLowerCase();
    if (signature !== undefined) updateData.signature = signature;
    if (admission_type !== undefined) updateData.admission_type = admission_type;
    if (category !== undefined) updateData.category = category;

    // Push Notifications Toggle
    if (req.body.pushNotifications !== undefined && typeof req.body.pushNotifications.global === 'boolean') {
      updateData["pushNotifications.global"] = req.body.pushNotifications.global;
    }

    // Fetch the current user to enforce field locking
    const currentUser = await User.findById(req.user._id).select("prn abc_id branch batch department organization_id profile_completed").lean();

    // ── 🎓 Org Academic Config — server-side validation ──────────────
    let orgAcademicConfig = null;
    if (currentUser?.organization_id) {
        const orgDoc = await (await import("../models/Organization.js")).default
            .findById(currentUser.organization_id)
            .select("academic_config")
            .lean();
        orgAcademicConfig = orgDoc?.academic_config || null;
    }
    const profileOrgType = req.institutionProfile?.admissionProfile?.baseOrgType || null;
    const identifierLabel = req.institutionProfile?.terminology?.identifier || orgAcademicConfig?.identifierLabel || "PRN";
    const usesPrimaryIdentifier = ["engineering", "diploma"].includes(profileOrgType);

    // 🎓 Academic Field Locking Logic
    // Apply .trim() BEFORE any truthy checks
    const trimmedDept = department !== undefined && department !== null ? String(department).trim() : undefined;
    const trimmedBranch = branch !== undefined && branch !== null ? String(branch).trim() : undefined;
    const trimmedBatch = batch !== undefined && batch !== null ? String(batch).trim() : undefined;
    const trimmedPrn = prn !== undefined && prn !== null ? String(prn).trim() : undefined;
    const trimmedAbcId = abc_id !== undefined && abc_id !== null ? String(abc_id).trim() : undefined;

    if (trimmedDept !== undefined) {
      if (trimmedDept === "") {
        // Empty is okay — just don't save a blank value, skip this field
        // (only reject if user already has a dept and tries to blank it out)
      } else {
        if (currentUser.department && currentUser.department.trim() !== "") {
          if (trimmedDept !== currentUser.department.trim()) return res.status(400).json({ message: "Department is locked and cannot be changed." });
        } else {
          updateData.department = trimmedDept;
        }
      }
    }

    if (trimmedBranch !== undefined) {
      if (trimmedBranch === "") {
        // Empty is okay — skip, don't overwrite
      } else {
      
      let finalBranch = trimmedBranch;
      // ── Validate branch against org config (Case Insensitive) ──
      if (orgAcademicConfig?.branches?.length > 0) {
        const matched = orgAcademicConfig.branches.find(b => b.toLowerCase() === trimmedBranch.toLowerCase());
        if (!matched) {
          return res.status(400).json({ message: `Invalid branch. Allowed: ${orgAcademicConfig.branches.join(', ')}` });
        }
        finalBranch = matched; // Normalize to exact org config case
      }
      
      if (currentUser.branch && currentUser.branch.trim() !== "") {
        if (finalBranch.toLowerCase() !== currentUser.branch.trim().toLowerCase()) {
          return res.status(400).json({ message: "Branch is locked and cannot be changed." });
        }
      } else {
        updateData.branch = finalBranch;
      }
      }
    }

    if (trimmedBatch !== undefined) {
      if (trimmedBatch === "") {
        // Empty is okay — skip, don't overwrite
      } else {
      
      let finalBatch = trimmedBatch;
      // ── Validate batch against org config (Case Insensitive) ──
      if (orgAcademicConfig?.batches?.length > 0) {
        const matched = orgAcademicConfig.batches.find(b => b.toLowerCase() === trimmedBatch.toLowerCase());
        if (!matched) {
          return res.status(400).json({ message: `Invalid batch. Allowed: ${orgAcademicConfig.batches.join(', ')}` });
        }
        finalBatch = matched; // Normalize to exact org config case
      }
      
      if (currentUser.batch && currentUser.batch.trim() !== "") {
        if (finalBatch.toLowerCase() !== currentUser.batch.trim().toLowerCase()) {
          return res.status(400).json({ message: "Batch is locked and cannot be changed." });
        }
      } else {
        updateData.batch = finalBatch;
      }
      }
    }

    // PRN logic
    if (trimmedPrn !== undefined) {
      if (trimmedPrn === "") {
        // Only enforce PRN non-empty strictness for students where PRN is required
        const prnRequired = req.user.role === 'student' && usesPrimaryIdentifier && orgAcademicConfig?.prnRequired !== false;
        
        if (currentUser.prn && orgAcademicConfig?.prnLocked) {
          return res.status(400).json({ message: `${identifierLabel} has already been set and is locked by your organization.` });
        }
        
        if (prnRequired) {
          return res.status(400).json({ message: `${identifierLabel} cannot be empty or whitespace only.` });
        } else {
          // If allowed to be empty, we unset it from the DB
          updateData.$unset = updateData.$unset || {};
          updateData.$unset.prn = 1;
        }
      } else {
        if (!/^[a-zA-Z0-9]{1,15}$/.test(trimmedPrn)) {
        console.warn(`[ProfileUpdate] User ${req.user._id} submitted invalid PRN format: ${trimmedPrn}`);
        return res.status(400).json({ message: `${identifierLabel} must be alphanumeric and up to 15 characters.` });
      }

      // ── PRN Lock: strictly respect org academic_config.prnLocked ──
      if (currentUser && currentUser.prn) {
        if (orgAcademicConfig?.prnLocked) {
          return res.status(400).json({ message: `${identifierLabel} has already been set and is locked by your organization.` });
        }
      }
      
      // Check uniqueness within the same organization
      if (currentUser?.organization_id) {
        const existing = await User.findOne({
          organization_id: currentUser.organization_id,
          prn: trimmedPrn,
        }).lean();
        if (existing) {
          return res.status(409).json({ message: `This ${identifierLabel} is already registered in your organization. Please contact your faculty or organization admin.` });
        }
      }
      }
      updateData.prn = trimmedPrn;
    }

    if (trimmedAbcId !== undefined) {
      if (!usesPrimaryIdentifier) {
        return res.status(400).json({ message: "ABC ID is only supported for higher-education profiles." });
      }

      if (trimmedAbcId === "") {
        updateData.$unset = updateData.$unset || {};
        updateData.$unset.abc_id = 1;
      } else {
        if (!/^[0-9]{12}$/.test(trimmedAbcId)) {
          return res.status(400).json({ message: "ABC ID must be a 12-digit number." });
        }

        if (currentUser.abc_id && currentUser.abc_id.trim() !== "" && currentUser.abc_id !== trimmedAbcId) {
          return res.status(400).json({ message: "ABC ID is already set and cannot be changed from profile update." });
        }

        updateData.abc_id = trimmedAbcId;
      }
    }

    // Determine if profile should be marked as completed
    const nextPrn = updateData.prn !== undefined ? updateData.prn : currentUser.prn;
    const nextBranch = updateData.branch !== undefined ? updateData.branch : currentUser.branch;
    const nextBatch = updateData.batch !== undefined ? updateData.batch : currentUser.batch;
    const nextDept = updateData.department !== undefined ? updateData.department : currentUser.department;
    
    // Always recalculate securely. Don't trust the existing boolean flag blindly.
    if (req.user.role === 'student') {
        const isCompleted = !!(
            nextPrn && nextPrn.trim() !== "" &&
            nextBranch && nextBranch.trim() !== "" &&
            nextBatch && nextBatch.trim() !== "" &&
            nextDept && nextDept.trim() !== ""
        );
        updateData.profile_completed = isCompleted;

        // 🛡️ THE AUTO-MATCH ENGINE (Backend Confirmation)
        // If the student is on the waitlist, we check if the Org Admin pre-uploaded their data via Excel
        if (isCompleted && currentUser.verification_status === 'pending' && nextPrn) {
            // Find a pre-seeded shell account by the Admin in the same org matching this PRN
            const preSeededUser = await User.findOne({
                organization_id: currentUser.organization_id,
                prn: nextPrn,
                // Ensure it's not their own record
                _id: { $ne: currentUser._id }
            }).lean();

            if (preSeededUser) {
                // If the PRN exists, check if Name & Academics Match Exactly
                const nameMatches = preSeededUser.name.trim().toLowerCase() === (updateData.name || currentUser.name).trim().toLowerCase();
                const branchMatches = (preSeededUser.branch || "").trim().toLowerCase() === nextBranch.trim().toLowerCase();

                if (nameMatches && branchMatches) {
                    // EXACT MATCH: Bypass the waitlist! Instant Onboarding.
                    updateData.verification_status = 'verified';
                    
                    // Cleanup: Delete the admin's shell account so there are no duplicates
                    await User.findByIdAndDelete(preSeededUser._id);
                    console.log(`[Auto-Match Success]: Student ${nextPrn} instantly verified and merged.`);
                }
            }
        }
    } else {
        updateData.profile_completed = true; // Non-students instantly complete
    }

    // Use findByIdAndUpdate
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true } // Return updated doc, validate
    ).select("-password -verificationToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber || "",
        profilePicture: user.profilePicture || "",
        qualification: user.qualification || "",
        department: user.department || "",
        bio: user.bio || "",
        prn: user.prn || null,
        branch: user.branch || null,
        batch: user.batch || null,
        dob: user.dob || null,
        fatherName: user.fatherName || "",
        motherName: user.motherName || "",
        eligibilityNo: user.eligibilityNo || "",
        pattern: user.pattern || "",
        gender: user.gender || null,
        alternateEmail: user.alternateEmail || "",
        signature: user.signature || "",
        profile_completed: user.profile_completed,
        authProvider: user.authProvider,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        pushNotifications: user.pushNotifications || { global: true }
      }
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error.message);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

// =======================
// GET R2 UPLOAD URL
// =======================
router.post("/upload-url", isAuthenticated, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ message: "Filename and file type are required" });
    }

    // Ensure the filename is unique to prevent overwriting
    const uniqueFileName = `${req.user._id}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { uploadUrl, publicUrl } = await generateR2UploadUrl(uniqueFileName, fileType);

    res.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error("GET UPLOAD URL ERROR:", error);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
});

// =======================
// GET EMAIL PREFERENCES
// =======================
router.get("/email-preferences", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("emailNotifications").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return with safe defaults for users who predate this feature
    const defaults = {
      digestMode: "instant",
      global: true,
      announcements: true,
      notes: true,
      quizzes: true,
      joinApproval: true,
      emailOnPost: true,
    };

    res.json({
      emailNotifications: { ...defaults, ...(user.emailNotifications || {}) },
    });
  } catch (error) {
    console.error("GET EMAIL PREFS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// UPDATE EMAIL PREFERENCES
// =======================
router.put("/email-preferences", isAuthenticated, async (req, res) => {
  try {
    const booleanKeys = ["global", "announcements", "notes", "quizzes", "joinApproval", "emailOnPost"];
    const allowedDigestModes = ["instant", "daily", "weekly"];
    const updates = {};

    // Accept known boolean keys
    for (const key of booleanKeys) {
      if (typeof req.body[key] === "boolean") {
        updates[`emailNotifications.${key}`] = req.body[key];
      }
    }

    // Accept digestMode enum (strict validation — never trust frontend)
    if (typeof req.body.digestMode === "string" && allowedDigestModes.includes(req.body.digestMode)) {
      updates["emailNotifications.digestMode"] = req.body.digestMode;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid preferences provided" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: "after" }
    ).select("emailNotifications");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Email preferences updated",
      emailNotifications: user.emailNotifications,
    });
  } catch (error) {
    console.error("UPDATE EMAIL PREFS ERROR:", error.message);
    res.status(500).json({ message: "Server error updating preferences" });
  }
});

// =======================
// SAVE FCM TOKEN
// =======================
router.post("/fcm-token", isAuthenticated, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    // Store unique device tokens so users can receive pushes on multiple devices
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { fcmTokens: token }
    });

    res.json({ message: "FCM token registered successfully" });
  } catch (error) {
    console.error("FCM TOKEN REGISTRATION ERROR:", error.message);
    res.status(500).json({ message: "Server error registering token" });
  }
});

// =======================
// CREATE CUSTOM DIVISION (BYPASS RLS)
// =======================
router.post("/divisions", isAuthenticated, async (req, res) => {
  try {
    const { standard, year, semester, section, name, org_type,
            course, branch, class_teacher_id, assistant_teacher_id, subjects,
            sem_start_date, sem_end_date, sem2_start_date, sem2_end_date,
            academic_year_start, academic_year_end } = req.body;

    const resolvedOrgType = (org_type || 'COLLEGE').toUpperCase();
    
    // Use the authenticated user's org — no mismatch possible
    const org_id = req.user.organization_id?.toString();
    if (!org_id) return res.status(400).json({ message: "User does not belong to any organization." });

    // ── VALIDATION: Academic dates are COMPULSORY ──
    if (!academic_year_start || !academic_year_end) {
      return res.status(400).json({ message: "Academic year start and end dates are mandatory." });
    }
    if (!sem_start_date || !sem_end_date) {
      return res.status(400).json({ message: "Semester start and end dates are mandatory." });
    }
    if (resolvedOrgType === 'SCHOOL' && (!sem2_start_date || !sem2_end_date)) {
      return res.status(400).json({ message: "Semester 2 start and end dates are mandatory for schools." });
    }
    if (!class_teacher_id) {
      return res.status(400).json({ message: "Class teacher must be assigned." });
    }
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "At least one subject is required." });
    }

    // ── 1:1 Faculty enforcement — check if teacher already assigned to another division ──
    const { data: existingTeacher } = await getChatSb()
      .from('divisions')
      .select('id, name')
      .eq('org_id', org_id)
      .eq('class_teacher_id', class_teacher_id)
      .maybeSingle();

    if (existingTeacher) {
      return res.status(409).json({ message: `This faculty is already class teacher of "${existingTeacher.name}". One faculty can only be class teacher of one division.` });
    }

    // Build division name
    let cleanSection = section ? section.trim().toUpperCase() : null;
    let finalName = name ? name.trim().toUpperCase() : '';

    if (resolvedOrgType === 'SCHOOL') {
      if (!standard || !cleanSection) return res.status(400).json({ message: "Standard and Section are required for schools." });
      finalName = `${standard} ${cleanSection}`;
    } else {
      if (!year || !semester || !cleanSection) return res.status(400).json({ message: "Year, Semester, and Section are required for colleges." });
      finalName = `${year} ${branch || ''} Sem ${semester} ${cleanSection}`.trim();
    }

    const payload = {
      org_id,
      type: resolvedOrgType.toLowerCase(),
      name: finalName,
      division_name: cleanSection,
      standard: standard || null,
      year: year || null,
      semester: semester ? parseInt(semester) : null,
      course: course || null,
      branch: branch || null,
      class_teacher_id,
      assistant_teacher_id: assistant_teacher_id || null,
      subjects: subjects || [],
      sem_start_date,
      sem_end_date,
      sem2_start_date: sem2_start_date || null,
      sem2_end_date: sem2_end_date || null,
      academic_year_start,
      academic_year_end,
    };

    const { data: newDiv, error } = await getChatSb()
      .from("divisions")
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Create Division SB Error]:", error);
      if (error.code === '23505') return res.status(409).json({ message: "This exact division already exists." });
      return res.status(500).json({ message: `Database error: ${error.message || JSON.stringify(error)}` });
    }

    res.json(newDiv);
  } catch (error) {
    console.error("CREATE DIVISION ERROR:", error.message);
    res.status(500).json({ message: "Server error creating division." });
  }
});

// ======================================================
// GET /api/user/my-teaching-roles
// Returns teacher's complete role map (class teacher, subject teacher, assistant)
// ======================================================
router.get("/my-teaching-roles", isAuthenticated, async (req, res) => {
  try {
    if (!['faculty', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: "Only faculty can access this." });
    }

    const userId = req.user._id.toString();
    const orgId = req.user.organization_id?.toString();
    if (!orgId) return res.status(400).json({ message: "No organization assigned." });

    const sb = getChatSb();

    // 1. Class Teacher — divisions where this user is class_teacher_id
    const { data: classTeacherDivs } = await sb
      .from('divisions')
      .select('*')
      .eq('org_id', orgId)
      .eq('class_teacher_id', userId);

    // 2. Assistant Teacher — divisions where this user is assistant_teacher_id
    const { data: assistantDivs } = await sb
      .from('divisions')
      .select('*')
      .eq('org_id', orgId)
      .eq('assistant_teacher_id', userId);

    // 3. Subject Teacher — classrooms created by this teacher (MongoDB)
    const Classroom = (await import('../models/Classroom.js')).default;
    const subjectClassrooms = await Classroom.find({
      teacher: req.user._id,
      organization_id: req.user.organization_id,
    }).select('name subject_name division division_id year branch semester standard course_type subject_id coverImage classCode students').lean();

    // Enrich subject classrooms with student count
    const enriched = subjectClassrooms.map(c => ({
      ...c,
      student_count: c.students?.length || 0,
    }));

    res.json({
      classTeacher: classTeacherDivs || [],
      assistantTeacher: assistantDivs || [],
      subjectTeacher: enriched,
    });
  } catch (err) {
    console.error("[My Teaching Roles Error]:", err);
    res.status(500).json({ message: "Failed to load teaching roles." });
  }
});

export default router;

