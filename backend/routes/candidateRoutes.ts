import express from "express";
import { 
  submitCandidateRequest, 
  getCandidateRequests, 
  updateCandidateRequestStatus,
  getMyCandidateRequest
} from "../controllers/candidateRequestController.js";
import { getDepartments } from "../controllers/adminController.js";
import { authenticateToken, isAdmin, isStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student routes
router.post("/apply", authenticateToken, submitCandidateRequest);
router.get("/my-request", authenticateToken, getMyCandidateRequest);
router.get("/departments", authenticateToken, getDepartments);

// Admin routes
router.get("/all", authenticateToken, isStaff, getCandidateRequests);
router.put("/:id/status", authenticateToken, isStaff, updateCandidateRequestStatus);

export default router;
