import { Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware.js";
import Vote from "../models/Vote.js";
import Election from "../models/Election.js";
import Candidate from "../models/Candidate.js";
import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";

export const castVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { election_id, candidate_id } = req.body;
    const user_id = req.user.id;
    const user_role = req.user.role;

    const user = await User.findById(user_id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const election = await Election.findById(election_id);
    if (!election) {
      res.status(404).json({ message: "Election not found" });
      return;
    }

    // Check Maintenance Mode
    const settings = await SystemSetting.findOne();
    if (settings?.maintenanceMode) {
      res.status(503).json({ message: "System is currently under maintenance. Voting is temporarily disabled." });
      return;
    }

    // Check Department Restriction
    if (election.target_department && election.target_department !== "All") {
      if (user.department !== election.target_department) {
        res.status(403).json({ 
          message: `This election is restricted to students from the ${election.target_department} department. Your department is ${user.department || 'Unspecified'}.` 
        });
        return;
      }
    }

    const now = new Date();
    if (election.status !== "active" || now < election.start_date || now > election.end_date) {
      res.status(400).json({ message: "Voting is not currently allowed for this election." });
      return;
    }

    if (user.role === "student" && !user.isEligible) {
      res.status(403).json({ message: "You are not eligible to vote in this election." });
      return;
    }

    if (user_role === "admin" && !election.allow_admin_vote) {
      res.status(403).json({ message: "Administrators are not allowed to vote in this election." });
      return;
    }

    // Dynamic Email Pattern Validation
    if (election.allowed_email_pattern && user_role !== "admin") {
      let pattern = election.allowed_email_pattern.replace(/[.+?^${}()|[\]\\]/g, (match: string) => {
        if (match === "{" || match === "}") return match;
        return "\\" + match;
      });

      pattern = pattern.replace(/\*/g, ".*");
      pattern = pattern.replace(/{rollno}/g, "(\\d+)");
      pattern = pattern.replace(/{text}/g, "([a-zA-Z0-9-]+)");

      const regex = new RegExp(`^${pattern}$`, "i");
      if (!regex.test(user.email)) {
        res.status(403).json({
          message: `Your email is not eligible. This election is restricted to students following pattern: ${election.allowed_email_pattern}`,
        });
        return;
      }
    }

    const receipt_hash = crypto.createHash("sha256")
      .update(`${user_id}-${election_id}-${candidate_id}-${Date.now()}`)
      .digest("hex")
      .substring(0, 16);

    await Vote.create({
      user_id,
      election_id,
      candidate_id,
      receipt_hash,
    });

    // Broadcast update using aggregation
    const results = await Candidate.aggregate([
      { $match: { election_id: new mongoose.Types.ObjectId(election_id as string) } },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "candidate_id",
          as: "votesData",
        },
      },
      {
        $project: {
          id: { $toString: "$_id" },
          name: 1,
          image_url: 1,
          votes: { $size: "$votesData" },
        },
      },
    ]);

    const io = req.app.get("io");
    if (io) {
      io.emit(`election:${election_id}:results`, results);
      io.emit(`election:activity`, {
        election_id,
        department: user.department,
        timestamp: new Date(),
        student_id: user.student_id ? `${user.student_id.substring(0, 3)}***` : "Anonymous",
      });
    }

    res.status(201).json({ message: "Vote cast successfully", receipt_hash });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: "You have already voted in this election" });
      return;
    }
    res.status(500).json({ message: error.message });
  }
};

export const getResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { electionId } = req.params;

    const results = await Candidate.aggregate([
      { $match: { election_id: new mongoose.Types.ObjectId(electionId) } },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "candidate_id",
          as: "votesData",
        },
      },
      {
        $project: {
          id: { $toString: "$_id" },
          name: 1,
          image_url: 1,
          votes: { $size: "$votesData" },
        },
      },
    ]);

    const deptStats = await Vote.aggregate([
      { $match: { election_id: new mongoose.Types.ObjectId(electionId) } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          department: { $ifNull: ["$userData.department", "Administration"] }
        }
      },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          department: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const candidateDeptStats = await Vote.aggregate([
      { $match: { election_id: new mongoose.Types.ObjectId(electionId) } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          department: { $ifNull: ["$userData.department", "Administration"] }
        }
      },
      {
        $group: {
          _id: {
            candidate_id: "$candidate_id",
            department: "$department"
          },
          votes: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "candidates",
          localField: "_id.candidate_id",
          foreignField: "_id",
          as: "candidateData"
        }
      },
      { $unwind: "$candidateData" },
      {
        $project: {
          candidateName: "$candidateData.name",
          department: "$_id.department",
          votes: 1,
          _id: 0
        }
      }
    ]);

    res.json({ results, deptStats, candidateDeptStats });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserVotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user_id = req.user.id;
    const votes = await Vote.find({ user_id })
      .populate("election_id", "title")
      .populate("candidate_id", "name")
      .sort({ timestamp: -1 });

    res.json(votes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
