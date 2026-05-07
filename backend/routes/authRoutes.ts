import express from "express";
import { register, login, getMe, updateProfile, updatePassword, requestAccount, getPublicDepartments } from "../controllers/authController.js";
import { getPublicSettings } from "../controllers/adminController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/settings", getPublicSettings);
router.get("/departments", getPublicDepartments);
router.post("/register", register);
router.post("/request-account", requestAccount);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.put("/profile", authenticateToken, updateProfile);
router.put("/password", authenticateToken, updatePassword);

export default router;
