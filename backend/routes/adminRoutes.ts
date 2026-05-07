import express from "express";
import { 
  getStats, 
  getVoters, 
  getAuditLogs, 
  getAnnouncements, 
  createAnnouncement, 
  getAllUsers, 
  toggleUserEligibility,
  bulkImportStudents,
  addManualStudent,
  deleteStudent,
  bulkDeleteStudents,
  getSystemSettings,
  updateSystemSettings,
  deleteAnnouncement,
  deleteAuditLog,
  clearAuditLogs,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  exportDatabase,
  getAccountRequests,
  approveAccountRequest,
  rejectAccountRequest
} from "../controllers/adminController.js";
import { authenticateToken, isAdmin, isStaff, checkOfficerRestriction } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/account-requests", authenticateToken, isStaff, getAccountRequests);
router.post("/account-requests/:id/approve", authenticateToken, isStaff, checkOfficerRestriction, approveAccountRequest);
router.post("/account-requests/:id/reject", authenticateToken, isStaff, checkOfficerRestriction, rejectAccountRequest);

router.get("/departments", authenticateToken, isStaff, getDepartments);
router.post("/departments", authenticateToken, isAdmin, createDepartment);
router.put("/departments/:id", authenticateToken, isAdmin, updateDepartment);
router.delete("/departments/:id", authenticateToken, isAdmin, deleteDepartment);

router.get("/stats", authenticateToken, isStaff, getStats);
router.get("/voters/:electionId", authenticateToken, isStaff, getVoters);
router.get("/logs", authenticateToken, isStaff, getAuditLogs);
router.delete("/logs/all", authenticateToken, isAdmin, clearAuditLogs);
router.delete("/logs/:id", authenticateToken, isStaff, deleteAuditLog);
router.get("/announcements", authenticateToken, isStaff, getAnnouncements);
router.post("/announcements", authenticateToken, isStaff, checkOfficerRestriction, createAnnouncement);
router.delete("/announcements/:id", authenticateToken, isStaff, checkOfficerRestriction, deleteAnnouncement);
router.get("/users", authenticateToken, isStaff, getAllUsers);
router.post("/users", authenticateToken, isStaff, checkOfficerRestriction, addManualStudent);
router.delete("/users/bulk", authenticateToken, isStaff, checkOfficerRestriction, bulkDeleteStudents);
router.delete("/users/:id", authenticateToken, isStaff, checkOfficerRestriction, deleteStudent);
router.put("/users/:id/eligibility", authenticateToken, isStaff, checkOfficerRestriction, toggleUserEligibility);
router.post("/users/import", authenticateToken, isStaff, checkOfficerRestriction, bulkImportStudents);

router.get("/settings", authenticateToken, isStaff, getSystemSettings);
router.put("/settings", authenticateToken, isAdmin, updateSystemSettings);
router.get("/backup", authenticateToken, isAdmin, exportDatabase);

export default router;
