import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { attachInstitutionProfile } from "../middleware/institution-profile.middleware.js";
import { validateHierarchyRequest, enforcePlanBoundary } from "../middleware/hierarchy-validator.middleware.js";
import {
    createNode,
    getTree,
    getChildren,
    updateNode,
    deleteNode,
    getOrgTerminology,
    seedHierarchy,
} from "../controllers/hierarchy.controller.js";

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);
router.use(attachInstitutionProfile());

// ============================================
// 📐 Academic Hierarchy CRUD
// ============================================

// GET /api/hierarchy/tree — Full hierarchy tree (nested or flat)
router.get("/tree", getTree);

// GET /api/hierarchy/terminology — Get org-specific labels
router.get("/terminology", getOrgTerminology);

// GET /api/hierarchy/children/:parentId — Direct children of a node
router.get("/children/:parentId", getChildren);

// POST /api/hierarchy/node — Create a new hierarchy node
// Validated by hierarchy-validator middleware (blocks invalid level_types per org plan)
router.post("/node", validateHierarchyRequest, createNode);

// POST /api/hierarchy/seed — Seed default structure (one-time during onboarding)
router.post("/seed", seedHierarchy);

// PATCH /api/hierarchy/node/:nodeId — Update a node
router.patch("/node/:nodeId", updateNode);

// DELETE /api/hierarchy/node/:nodeId — Soft-delete a node + descendants
router.delete("/node/:nodeId", deleteNode);

export default router;
