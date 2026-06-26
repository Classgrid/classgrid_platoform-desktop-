import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * GET /api/system/status
 * Proxies the statuspage.io JSON to avoid client-side CORS issues.
 */
router.get("/status", async (req, res) => {
  try {
    const pageId = req.query.pageId || "classgrid1";
    const response = await axios.get(`https://${pageId}.statuspage.io/api/v2/summary.json`);
    
    return res.json(response.data);
  } catch (error) {
    console.error("[System] status fetch error:", error?.message);
    return res.status(error?.response?.status || 500).json({ success: false, message: "Internal proxy error" });
  }
});

export default router;
