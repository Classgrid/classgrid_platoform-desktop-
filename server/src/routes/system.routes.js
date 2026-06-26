import express from "express";

const router = express.Router();

/**
 * GET /api/system/status
 * Proxies the statuspage.io JSON to avoid client-side CORS issues.
 */
router.get("/status", async (req, res) => {
  try {
    const pageId = req.query.pageId || "classgrid";
    const response = await fetch(`https://${pageId}.statuspage.io/api/v2/summary.json`);
    
    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: "Statuspage API error" });
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("[System] status fetch error:", error);
    return res.status(500).json({ success: false, message: "Internal proxy error" });
  }
});

export default router;
