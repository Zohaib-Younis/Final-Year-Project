import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "superior_voting_secret_key";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    req.user = user;
    next();
  });
};

// Admin/officer: type === 'admin' (from Admin collection)
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type !== "admin" || req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
};

// Staff = any admin-type user (admin or officer role)
export const isStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type !== "admin") {
    res.status(403).json({ message: "Staff access required" });
    return;
  }
  next();
};

export const checkOfficerRestriction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { default: SystemSetting } = await import("../models/SystemSetting.js");

  if (req.user?.role === "officer") {
    const settings = await SystemSetting.findOne();
    if (settings?.officerRestricted) {
      res.status(403).json({ message: "Officer actions are currently restricted by the administrator." });
      return;
    }
  }
  next();
};
