import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import AccountRequest from "../models/AccountRequest.js";
import Department from "../models/Department.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { createAuditLog } from "./adminController.js";

const JWT_SECRET = process.env.JWT_SECRET || "superior_voting_secret_key";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, registration_number } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      registration_number: registration_number || null,
      role: "student",
    });
    res.status(201).json({ id: user._id });
  } catch (error: any) {
    if (error.code === 11000) {
      if (error.keyPattern?.email)
        return void res.status(400).json({ message: "Email already registered" });
      if (error.keyPattern?.username)
        return void res.status(400).json({ message: "Username already taken" });
      if (error.keyPattern?.registration_number)
        return void res.status(400).json({ message: "Registration number already exists" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getPublicDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await Department.find().select("name code");
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const requestAccount = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, registration_number, department } = req.body;
  
  if (!username || !email || !password || !registration_number || !department) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  try {
    const dept = await Department.findOne({ name: department });
    if (!dept) {
      res.status(400).json({ message: "Invalid department selected." });
      return;
    }

    if (!registration_number.toUpperCase().includes(dept.code.toUpperCase())) {
      res.status(400).json({ message: `Registration number must contain '${dept.code}' for ${department} department. Example: SU92-${dept.code}-F22-084` });
      return;
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }, { registration_number }] 
    });
    
    if (existingUser) {
      res.status(400).json({ message: "User with this email, username, or registration number already exists." });
      return;
    }

    const existingRequest = await AccountRequest.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }, { registration_number }],
      status: "pending"
    });

    if (existingRequest) {
      res.status(400).json({ message: "A pending account request already exists for these details." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await AccountRequest.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      registration_number,
      department,
      status: "pending",
    });
    
    res.status(201).json({ message: "Account request submitted successfully. Pending admin approval." });
  } catch (error: any) {
    if (error.code === 11000) {
      if (error.keyPattern?.email)
        return void res.status(400).json({ message: "Email already registered in requests" });
      if (error.keyPattern?.username)
        return void res.status(400).json({ message: "Username already taken in requests" });
      if (error.keyPattern?.registration_number)
        return void res.status(400).json({ message: "Registration number already exists in requests" });
    }
    res.status(400).json({ message: error.message });
  }
};


export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    // --- 1. Check Admin collection first ---
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (admin) {
      if (!admin.isActive) {
        res.status(403).json({ message: "This admin account is deactivated." });
        return;
      }
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      await createAuditLog(
        admin._id.toString(),
        "ADMIN_LOGIN",
        `Admin logged in from IP: ${req.ip}`,
        req.ip || ""
      );

      const token = jwt.sign(
        {
          id: admin._id,
          username: admin.username,
          role: admin.role,
          type: "admin",
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          type: "admin",
        },
      });
      return;
    }

    // --- 2. Check Student (User) collection ---
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (!user.isEligible) {
      res.status(403).json({
        message: "Your voting account is currently deactivated. Please contact the administrator.",
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: "student",
        type: "student",
        registration_number: user.registration_number,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: "student",
        type: "student",
        registration_number: user.registration_number,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.type === "admin") {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }
      res.json(admin);
    } else {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, email, registration_number } = req.body;
  const userId = req.user.id;

  try {
    if (req.user?.type === "admin") {
      await Admin.findByIdAndUpdate(userId, { username, email });
    } else {
      await User.findByIdAndUpdate(userId, { username, email, registration_number });
    }
    res.json({ message: "Profile updated successfully" });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Email or Registration Number already in use." });
      return;
    }
    res.status(400).json({ message: error.message });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  console.log('UpdatePassword attempt for user:', userId, 'type:', req.user?.type);

  try {
    let account;
    if (req.user?.type === "admin") {
      account = await Admin.findById(userId);
    } else {
      account = await User.findById(userId);
    }

    if (!account) {
      console.log('Account not found for ID:', userId);
      res.status(404).json({ message: "Account not found" });
      return;
    }

    console.log('Account found. Checking password match...');
    const isMatch = await bcrypt.compare(currentPassword, account.password);
    if (!isMatch) {
      console.log('Current password mismatch');
      res.status(400).json({ message: "Current password does not match." });
      return;
    }

    console.log('Password match. Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update using findByIdAndUpdate to bypass potential schema issues
    if (req.user?.type === "admin") {
      await Admin.findByIdAndUpdate(userId, { password: hashedPassword });
    } else {
      await User.findByIdAndUpdate(userId, { password: hashedPassword });
    }

    console.log('Password updated successfully');
    res.json({ message: "Password updated successfully!" });
  } catch (error: any) {
    console.error('UpdatePassword Error:', error);
    res.status(500).json({ message: error.message });
  }
};
