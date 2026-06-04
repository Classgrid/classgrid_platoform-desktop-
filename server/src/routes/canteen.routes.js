import express from "express";
import {
    createItem,
    getMenu,
    toggleAvailability,
    getDailySpecials,
    updateItem,
    deleteItem,
    bulkImportMenu,
    resetDailyStock,
    createRazorpayOrder,
    verifyPayment,
    getStudentHistory,
    rateOrderItems,
    getLiveQueue,
    updateOrderStatus,
    getCanteenAnalytics
} from "../controllers/canteen.controller.js";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🍔 MENU MANAGEMENT
router.get("/menu", isAuthenticated, getMenu);
router.get("/menu/specials", isAuthenticated, getDailySpecials);
router.post("/menu", isAuthenticated, requireRole("org_admin", "canteen_manager"), createItem);
router.put("/menu/:id", isAuthenticated, requireRole("org_admin", "canteen_manager"), updateItem);
router.delete("/menu/:id", isAuthenticated, requireRole("org_admin", "canteen_manager"), deleteItem);
router.put("/menu/:id/toggle-availability", isAuthenticated, requireRole("org_admin", "canteen_manager"), toggleAvailability);
router.post("/menu/bulk-import", isAuthenticated, requireRole("org_admin", "canteen_manager"), bulkImportMenu);
router.post("/menu/reset-stock", isAuthenticated, requireRole("org_admin", "canteen_manager"), resetDailyStock);

// 💳 ORDER & CHECKOUT
router.post("/order/create-razorpay-order", isAuthenticated, createRazorpayOrder);
router.post("/order/verify-payment", isAuthenticated, verifyPayment);

// 👩‍🎓 STUDENT API
router.get("/order/history/student", isAuthenticated, getStudentHistory);
router.post("/order/:id/rate", isAuthenticated, rateOrderItems);

// 🍳 KITCHEN DISPLAY / STAFF API
router.get("/order/queue/live", isAuthenticated, requireRole("org_admin", "canteen_manager", "kitchen_staff"), getLiveQueue);
router.patch("/order/:id/status", isAuthenticated, requireRole("org_admin", "canteen_manager", "kitchen_staff"), updateOrderStatus);

// 📊 ANALYTICS
router.get("/analytics", isAuthenticated, requireRole("org_admin", "canteen_manager"), getCanteenAnalytics);

export default router;
