import express from "express";
import { createOrganization, getOrganizations, updateOrganizationStatus } from "../controllers/organizations.controller.js";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(isAuthenticated, requireRole("super_admin"));

router.post("/", createOrganization);
router.get("/", getOrganizations);
router.patch("/:id", updateOrganizationStatus);

export default router;
