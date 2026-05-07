import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import CandidateRequest from "../models/CandidateRequest.js";
import { createAuditLog } from "./adminController.js";

export const submitCandidateRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      father_name, 
      semester, 
      department, 
      gpa, 
      cgpa, 
      email, 
      registration_number, 
      cnic_number, 
      picture_url 
    } = req.body;

    // Eligibility check: CGPA must be >= 3.0
    if (parseFloat(cgpa) < 3.0) {
      res.status(400).json({ message: "You are not eligible for candidacy. Minimum CGPA requirement is 3.0." });
      return;
    }

    // Check if user already has a pending or approved request
    const existingRequest = await (CandidateRequest as any).findOne({ 
      user_id: req.user.id, 
      status: { $in: ['pending', 'approved'] } 
    });

    if (existingRequest) {
      res.status(400).json({ message: "You already have a pending or approved candidate request." });
      return;
    }

    const request = await CandidateRequest.create({
      user_id: req.user.id,
      name,
      father_name,
      semester,
      department,
      gpa,
      cgpa,
      email,
      registration_number,
      cnic_number,
      picture_url,
      status: 'pending'
    });

    await createAuditLog(req.user.id, "SUBMIT_CANDIDATE_REQUEST", `Applied for candidacy: ${name}`, req.ip || "");

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCandidateRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await (CandidateRequest as any).find()
      .populate("user_id", "username email")
      .populate("department", "name code")
      .sort({ applied_at: -1 });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCandidateRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const request = await (CandidateRequest as any).findById(id);
    if (!request) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    request.status = status;
    request.admin_notes = admin_notes;
    request.processed_at = new Date();
    await request.save();

    await createAuditLog(req.user.id, "UPDATE_CANDIDATE_REQUEST", `Status updated to ${status} for: ${request.name}`, req.ip || "");

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyCandidateRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await (CandidateRequest as any).findOne({ user_id: req.user.id })
      .populate("department", "name code")
      .sort({ applied_at: -1 });
    res.json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
