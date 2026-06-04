import express from "express";
import {
  resolveTenantBySlug,
  getMyWebsiteContent,
  setupWebsiteContent,
  updateWebsiteContent,
  togglePublish,
  addNotice,
  deleteNotice,
  addGalleryImage,
  addGalleryVideo,
  listAllWebsites,
} from "../controllers/org-website.controller.js";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";

const protect       = isAuthenticated;
const requireOrgAdmin   = requireRole("org_admin");
const requireSuperAdmin = requireRole("super_admin");


const router = express.Router();

// ─── PUBLIC (no auth) ────────────────────────────────────────────────────────
// Called by Next.js marketing site tenant resolver
// GET /api/public/tenant/resolve?slug=riverview-jc
router.get("/resolve", resolveTenantBySlug);

export const publicTenantRouter = router;

// ─── ORG ADMIN (auth required) ───────────────────────────────────────────────
const orgRouter = express.Router();
orgRouter.use(protect);
orgRouter.use(requireOrgAdmin);

// Website setup & content management
orgRouter.get("/my-content",            getMyWebsiteContent);    // GET  /api/org-website/my-content
orgRouter.post("/setup",                setupWebsiteContent);    // POST /api/org-website/setup
orgRouter.patch("/update",              updateWebsiteContent);   // PATCH /api/org-website/update
orgRouter.patch("/publish",             togglePublish);          // PATCH /api/org-website/publish

// Notices
orgRouter.post("/notices",              addNotice);              // POST  /api/org-website/notices
orgRouter.delete("/notices/:noticeId",  deleteNotice);           // DELETE /api/org-website/notices/:id

// Gallery
orgRouter.post("/gallery",              addGalleryImage);        // POST /api/org-website/gallery
orgRouter.post("/gallery/video",        addGalleryVideo);        // POST /api/org-website/gallery/video

export const orgWebsiteRouter = orgRouter;

// ─── SUPER ADMIN ─────────────────────────────────────────────────────────────
const superRouter = express.Router();
superRouter.use(protect);
superRouter.use(requireSuperAdmin);

superRouter.get("/org-websites", listAllWebsites);               // GET /api/super-admin/org-websites

export const superAdminWebsiteRouter = superRouter;
