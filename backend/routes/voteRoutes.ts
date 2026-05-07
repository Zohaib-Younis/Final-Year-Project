import express from "express";
import { castVote, getResults, getUserVotes } from "../controllers/voteController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, castVote);
router.get("/results/:electionId", authenticateToken, getResults);
router.get("/my-votes", authenticateToken, getUserVotes);

export default router;
