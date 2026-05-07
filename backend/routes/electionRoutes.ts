import express from "express";
import {
  getElections,
  getElectionById,
  createElection,
  deleteElection,
  addCandidate,
  verifyElectionPassword,
  announceResults,
} from "../controllers/electionController.js";
import { authenticateToken, isAdmin, isStaff, checkOfficerRestriction } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, getElections);
router.get("/:id", authenticateToken, getElectionById);
router.post("/", authenticateToken, isStaff, checkOfficerRestriction, createElection);
router.delete("/:id", authenticateToken, isAdmin, deleteElection);
router.post("/:id/candidates", authenticateToken, isStaff, checkOfficerRestriction, addCandidate);
router.post("/:id/verify", authenticateToken, verifyElectionPassword);
router.post("/:id/announce", authenticateToken, isStaff, announceResults);

export default router;
