import OrgWebsiteContent from "../models/OrgWebsiteContent.js";
import Organization from "../models/Organization.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function safeText(val) {
  return typeof val === "string" ? val.trim() : "";
}

// ─── PUBLIC: Resolve tenant by slug ──────────────────────────────────────────
// GET /api/public/tenant/resolve?slug=riverview-jc
// Called by Next.js marketing site (tenant-site.ts → resolveTenantFromRemote)

export async function resolveTenantBySlug(req, res) {
  try {
    const slug = slugify(req.query?.slug || "");
    if (!slug) {
      return res.status(400).json({ success: false, message: "slug is required" });
    }

    const site = await OrgWebsiteContent.findOne({ org_slug: slug, isPublished: true })
      .lean();

    if (!site) {
      return res.status(404).json({ success: false, message: "Tenant not found or not published" });
    }

    // Map MongoDB document → shape expected by tenant-site.ts mapRemoteTenantPayload()
    return res.status(200).json({
      success: true,
      tenant: {
        // Theme
        theme: {
          primary:     site.theme?.primary     || "#1e3a8a",
          primary_dark: site.theme?.primaryDark || "#1e3085",
          accent:      site.theme?.accent      || "#ffffff",
          surface:     "#f9fafb",
          darkSurface: "#0f172a",
        },

        // Institution info
        name:            site.institution?.name,
        shortName:       site.institution?.shortName,
        orgType:         site.institution?.type,
        tagline:         site.institution?.tagline,
        location:        site.institution?.location,
        address:         site.institution?.address,
        email:           site.institution?.email,
        phone:           site.institution?.phone,
        whatsapp:        site.institution?.whatsapp,
        establishedYear: site.institution?.establishedYear,
        logoUrl:         site.institution?.logoUrl,
        logoText:        site.institution?.shortName || site.institution?.name?.split(" ").map(w => w[0]).join("").toUpperCase(),
        heroImage:       site.institution?.heroImage,

        // Hero
        heroTitle:       site.hero?.headline,
        heroHeadline:    site.hero?.headline,
        heroSubheadline: site.hero?.subHeadline,
        heroDescription: site.hero?.description,
        heroBadge:       site.hero?.badge,
        videoUrl:        site.hero?.videoUrl,
        fallbackImage:   site.hero?.fallbackImage,
        heroStats:       site.hero?.stats,

        // Nav, programs, notices, etc — full payload
        accreditations:   site.accreditations,
        principal:        site.principal,
        story:            site.story,
        storyImage:       site.storyImage,
        vision:           site.vision,
        mission:          site.mission,
        admissionBanner:  site.admissionBanner,
        programs:         site.programs,
        notices:          site.notices,
        faculty:          site.faculty,
        gallery:          site.gallery,
        testimonials:     site.testimonials,
        toppers:          site.toppers,
        meritLists:       site.meritLists,
        resultStats:      site.resultStats,
        fees:             site.fees,
        scholarshipText:  site.scholarshipText,
        feesPolicies:     site.feesPolicies,
        events:           site.events,
        alumni:           site.alumni,
        blogPosts:        site.blogPosts,
        contactPage:      site.contactPage,
        socialLinks:      site.socialLinks,
        footer:           site.footer,

        // NEW: Governance, Infrastructure, Academics & Student Corner
        mandatoryDisclosures: site.mandatoryDisclosures,
        committees:           site.committees,
        infrastructure:       site.infrastructure,
        academicCalendar:     site.academicCalendar,
        syllabus:             site.syllabus,
        examinationDetails:   site.examinationDetails,
        downloads:            site.downloads,
        schoolDetails:        site.schoolDetails,
        juniorCollegeDetails: site.juniorCollegeDetails,
        coachingDetails:      site.coachingDetails,
        seoMeta:              site.seoMeta,
      },
    });
  } catch (error) {
    console.error("[OrgWebsite] resolveTenantBySlug error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── ORG ADMIN: Get own website content (for CMS editor) ─────────────────────
// GET /api/org-website/my-content
// Auth: org_admin role. Returns full document for editing.

export async function getMyWebsiteContent(req, res) {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const site = await OrgWebsiteContent.findOne({ organization_id: orgId }).lean();

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Website content not set up yet. Please create your website.",
      });
    }

    return res.status(200).json({ success: true, data: site });
  } catch (error) {
    console.error("[OrgWebsite] getMyWebsiteContent error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── ORG ADMIN: Create website content (first-time setup) ────────────────────
// POST /api/org-website/setup
// Auth: org_admin role.

export async function setupWebsiteContent(req, res) {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const existing = await OrgWebsiteContent.findOne({ organization_id: orgId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Website already set up. Use PATCH to update." });
    }

    // Look up org details to pre-fill
    const org = await Organization.findById(orgId).lean();
    if (!org) return res.status(404).json({ success: false, message: "Organization not found" });

    const orgSlug = slugify(req.body?.org_slug || org.slug || org.name || orgId.toString());

    // Check slug is unique
    const slugTaken = await OrgWebsiteContent.findOne({ org_slug: orgSlug });
    if (slugTaken) {
      return res.status(409).json({ success: false, message: `Slug "${orgSlug}" is already taken. Choose another.` });
    }

    const site = await OrgWebsiteContent.create({
      organization_id: orgId,
      org_slug:        orgSlug,
      institution: {
        name:   org.name || safeText(req.body?.name),
        type:   req.body?.type || "junior-college",
        ...req.body?.institution,
      },
      theme: req.body?.theme || {},
      isPublished: false,
      lastEditedBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: "Website created in draft mode. Fill in your content and publish when ready.",
      data: site,
    });
  } catch (error) {
    console.error("[OrgWebsite] setupWebsiteContent error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── ORG ADMIN: Update any section of website content ────────────────────────
// PATCH /api/org-website/update
// Auth: org_admin role.
// Body: any fields from OrgWebsiteContent schema (partial update)

export async function updateWebsiteContent(req, res) {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(403).json({ success: false, message: "Unauthorized" });

    // Fields NOT allowed to be changed directly via this endpoint
    const { organization_id, org_slug, _id, __v, createdAt, ...updateData } = req.body;

    const site = await OrgWebsiteContent.findOneAndUpdate(
      { organization_id: orgId },
      { $set: { ...updateData, lastEditedBy: req.user?._id } },
      { new: true, runValidators: true }
    );

    if (!site) {
      return res.status(404).json({ success: false, message: "Website not found. Run setup first." });
    }

    return res.status(200).json({ success: true, message: "Website updated.", data: site });
  } catch (error) {
    console.error("[OrgWebsite] updateWebsiteContent error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── ORG ADMIN: Toggle publish/unpublish ─────────────────────────────────────
// PATCH /api/org-website/publish
// Auth: org_admin role.

export async function togglePublish(req, res) {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const site = await OrgWebsiteContent.findOne({ organization_id: orgId });
    if (!site) return res.status(404).json({ success: false, message: "Website not found." });

    site.isPublished = !site.isPublished;
    site.lastEditedBy = req.user?._id;
    await site.save();

    return res.status(200).json({
      success: true,
      message: site.isPublished ? "Website is now LIVE." : "Website is now DRAFT (hidden from public).",
      isPublished: site.isPublished,
    });
  } catch (error) {
    console.error("[OrgWebsite] togglePublish error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── ORG ADMIN: Add a single notice ──────────────────────────────────────────
// POST /api/org-website/notices
export async function addNotice(req, res) {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const notice = {
      id:       `notice-${Date.now()}`,
      category: req.body?.category || "General",
      title:    safeText(req.body?.title),
      date:     req.body?.date || new Date().toISOString().slice(0, 10),
      summary:  safeText(req.body?.summary),
      body:     safeText(req.body?.body),
      pdfUrl:   safeText(req.body?.pdfUrl),
      isPublic: req.body?.isPublic !== false,
    };

    if (!notice.title) return res.status(400).json({ success: false, message: "Notice title is required." });

    const site = await OrgWebsiteContent.findOneAndUpdate(
      { organization_id: orgId },
      { $push: { notices: { $each: [notice], $position: 0 } }, $set: { lastEditedBy: req.user?._id } },
      { new: true }
    );

    if (!site) return res.status(404).json({ success: false, message: "Website not found." });
    return res.status(201).json({ success: true, message: "Notice added.", notice });
  } catch (error) {
    console.error("[OrgWebsite] addNotice error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── ORG ADMIN: Delete a notice ──────────────────────────────────────────────
// DELETE /api/org-website/notices/:noticeId
export async function deleteNotice(req, res) {
  try {
    const orgId = req.user?.organizationId;
    const noticeId = req.params?.noticeId;
    if (!orgId) return res.status(403).json({ success: false, message: "Unauthorized" });

    await OrgWebsiteContent.findOneAndUpdate(
      { organization_id: orgId },
      { $pull: { notices: { id: noticeId } }, $set: { lastEditedBy: req.user?._id } }
    );

    return res.status(200).json({ success: true, message: "Notice deleted." });
  } catch (error) {
    console.error("[OrgWebsite] deleteNotice error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── ORG ADMIN: Add a gallery image ──────────────────────────────────────────
// POST /api/org-website/gallery
export async function addGalleryImage(req, res) {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const image = {
      id:       `img-${Date.now()}`,
      category: safeText(req.body?.category) || "Campus",
      image:    safeText(req.body?.imageUrl),     // Supabase URL
      title:    safeText(req.body?.title),
    };

    if (!image.image) return res.status(400).json({ success: false, message: "imageUrl is required." });

    await OrgWebsiteContent.findOneAndUpdate(
      { organization_id: orgId },
      { $push: { "gallery.images": image }, $set: { lastEditedBy: req.user?._id } }
    );

    return res.status(201).json({ success: true, message: "Image added to gallery.", image });
  } catch (error) {
    console.error("[OrgWebsite] addGalleryImage error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── ORG ADMIN: Add a YouTube gallery video ──────────────────────────────────
// POST /api/org-website/gallery/video
export async function addGalleryVideo(req, res) {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(403).json({ success: false, message: "Unauthorized" });

    const youtubeUrl = safeText(req.body?.youtubeUrl);
    // Enforce YouTube only — never allow S3/Supabase video for gallery
    if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
      return res.status(400).json({
        success: false,
        message: "Only YouTube embed URLs are allowed for video gallery. Use youtube.com/embed/... format.",
      });
    }

    const video = {
      id:         `vid-${Date.now()}`,
      title:      safeText(req.body?.title),
      youtubeUrl: youtubeUrl,
      thumbnail:  safeText(req.body?.thumbnail),
    };

    await OrgWebsiteContent.findOneAndUpdate(
      { organization_id: orgId },
      { $push: { "gallery.videos": video }, $set: { lastEditedBy: req.user?._id } }
    );

    return res.status(201).json({ success: true, message: "Video added to gallery.", video });
  } catch (error) {
    console.error("[OrgWebsite] addGalleryVideo error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── SUPER ADMIN: List all tenant websites ───────────────────────────────────
// GET /api/super-admin/org-websites
export async function listAllWebsites(req, res) {
  try {
    const sites = await OrgWebsiteContent.find({})
      .select("org_slug institution.name institution.type isPublished createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: sites.length, data: sites });
  } catch (error) {
    console.error("[OrgWebsite] listAllWebsites error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
