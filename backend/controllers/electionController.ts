import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import Election from "../models/Election.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import { createAuditLog } from "./adminController.js";

export const getElections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const elections = await Election.find().sort({ start_date: -1 }).lean();
    
    const electionsWithVoteCount = await Promise.all(
      elections.map(async (election) => {
        const vote_count = await Vote.countDocuments({ election_id: election._id });
        return {
          ...election,
          id: election._id.toString(),
          vote_count,
        };
      })
    );

    res.json(electionsWithVoteCount);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getElectionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const election = await Election.findById(req.params.id).lean();
    if (!election) {
      res.status(404).json({ message: "Election not found" });
      return;
    }

    const candidates = await Candidate.find({ election_id: election._id });
    res.json({ ...election, id: election._id.toString(), candidates });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createElection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, start_date, end_date, password, allow_admin_vote, allowed_email_pattern, target_department } = req.body;
    
    const election = await Election.create({
      title,
      description,
      start_date,
      end_date,
      password: password || null,
      allow_admin_vote: !!allow_admin_vote,
      allowed_email_pattern: allowed_email_pattern || null,
      target_department: target_department || "All"
    });

    await createAuditLog(req.user.id, "CREATE_ELECTION", `Title: ${title}`, req.ip || "");

    res.status(201).json({ id: election._id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteElection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Election.findByIdAndDelete(req.params.id);
    await Candidate.deleteMany({ election_id: req.params.id });
    await Vote.deleteMany({ election_id: req.params.id });
    
    await createAuditLog(req.user.id, "DELETE_ELECTION", `ID: ${req.params.id}`, req.ip || "");

    res.json({ message: "Election deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, bio, manifesto, image_url, department } = req.body;
    
    const candidate = await Candidate.create({
      name,
      bio,
      manifesto: manifesto || null,
      image_url: image_url || null,
      department: department || "General",
      election_id: req.params.id,
    });

    await createAuditLog(req.user.id, "ADD_CANDIDATE", `Name: ${name}, Election: ${req.params.id}`, req.ip || "");

    res.status(201).json({ id: candidate._id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyElectionPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      res.status(404).json({ message: "Election not found" });
      return;
    }

    if (!election.password || election.password === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Incorrect election password" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const announceResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const election = await Election.findById(id);
    
    if (!election) {
      res.status(404).json({ message: "Election not found" });
      return;
    }

    election.results_announced = !election.results_announced;
    
    // Automatically close election if results are announced
    if (election.results_announced) {
      election.status = "closed";
    }
    
    await election.save();

    await createAuditLog(
      req.user.id, 
      "ANNOUNCE_RESULTS", 
      `Election: ${election.title}, Announced: ${election.results_announced}`, 
      req.ip || ""
    );

    res.json({ 
      message: election.results_announced ? "Results announced successfully" : "Results announcement retracted",
      results_announced: election.results_announced 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
