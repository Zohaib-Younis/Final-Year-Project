import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import Election from "../models/Election.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Vote from "../models/Vote.js";
import AuditLog from "../models/AuditLog.js";
import Announcement from "../models/Announcement.js";
import SystemSetting from "../models/SystemSetting.js";
import Department from "../models/Department.js";
import Candidate from "../models/Candidate.js";
import Admin from "../models/Admin.js";
import AccountRequest from "../models/AccountRequest.js";
import CandidateRequest from "../models/CandidateRequest.js";

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    // Also count students per department
    const deptsWithCounts = await Promise.all(departments.map(async (dept) => {
      const studentCount = await User.countDocuments({ role: "student", department: dept.name });
      return { ...dept.toObject(), id: dept._id, studentCount };
    }));
    res.json(deptsWithCounts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description } = req.body;
    const department = await Department.create({ name, code, description });
    await createAuditLog(req.user.id, "CREATE_DEPARTMENT", `Created Department: ${name}`, req.ip || "");
    res.status(201).json(department);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      res.status(404).json({ message: "Department not found" });
      return;
    }
    // Also delete all students in this department
    await User.deleteMany({ role: "student", department: dept.name });
    
    await createAuditLog(req.user.id, "DELETE_DEPARTMENT", `Deleted Department: ${dept.name} and all associated students`, req.ip || "");
    res.json({ message: "Department and all associated students deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const oldDept = await Department.findById(req.params.id);
    if (!oldDept) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    const dept = await Department.findByIdAndUpdate(req.params.id, { name, code, description }, { new: true, runValidators: true });
    
    if (dept && oldDept.name !== name) {
      // Update all students' department names
      await User.updateMany({ department: oldDept.name }, { department: name });
    }

    await createAuditLog(req.user.id, "UPDATE_DEPARTMENT", `Updated Department: ${dept?.name}`, req.ip || "");
    res.json(dept);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const electionsCount = await Election.countDocuments();
    const usersCount = await User.countDocuments({ role: "student" });
    const votesCount = await Vote.countDocuments();
    const pendingAccountRequests = await AccountRequest.countDocuments({ status: "pending" });
    const pendingCandidateRequests = await CandidateRequest.countDocuments({ status: "pending" });

    res.json({
      elections: electionsCount,
      users: usersCount,
      votes: votesCount,
      pendingAccountRequests,
      pendingCandidateRequests,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getVoters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { electionId } = req.params;

    const votes = await Vote.find({ election_id: electionId })
      .populate("user_id", "username email department")
      .populate("candidate_id", "name")
      .sort({ timestamp: -1 });

    const formattedVoters = votes.map((vote: any) => ({
      username: vote.user_id?.username,
      email: vote.user_id?.email,
      department: vote.user_id?.department,
      timestamp: vote.timestamp,
      candidate_name: vote.candidate_id?.name,
    }));

    res.json(formattedVoters);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await AuditLog.find()
      .populate("user_id", "username role")
      .sort({ timestamp: -1 })
      .limit(200);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAuditLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const log = await AuditLog.findByIdAndDelete(req.params.id);
    if (!log) {
      res.status(404).json({ message: "Log not found" });
      return;
    }
    res.json({ message: "Log deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const clearAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await AuditLog.deleteMany({});
    // We log the clearing action itself
    await createAuditLog(req.user.id, "CLEAR_LOGS", "All audit logs were cleared", req.ip || "");
    res.json({ message: "All logs cleared successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAuditLog = async (userId: string, action: string, details: string, ip: string) => {
  try {
    await AuditLog.create({ user_id: userId, action, details, ip_address: ip });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const announcements = await Announcement.find()
      .populate("author", "username")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, priority } = req.body;
    const announcement = await Announcement.create({
      title,
      content,
      priority,
      author: req.user.id,
    });
    
    await createAuditLog(req.user.id, "CREATE_ANNOUNCEMENT", `Title: ${title}`, req.ip || "");
    
    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      res.status(400).json({ message: "Invalid announcement ID" });
      return;
    }
    
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      res.status(404).json({ message: "Announcement not found in database" });
      return;
    }
    
    await createAuditLog(req.user.id, "DELETE_ANNOUNCEMENT", `Deleted Announcement: ${announcement.title}`, req.ip || "");
    res.json({ message: "Announcement deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({ role: "student" }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    user.isEligible = !user.isEligible;
    await user.save();
    
    await createAuditLog(req.user.id, "TOGGLE_ELIGIBILITY", `User: ${user.email}, Eligible: ${user.isEligible}`, req.ip || "");
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkImportStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ message: "Invalid or empty students data" });
      return;
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    const hashedPassword = await bcrypt.hash("password123", 10);

    for (const raw of students) {
      try {
        // Normalize column names — handle variations like 'name', 'Name', 'USERNAME', etc.
        const normalize = (obj: any, keys: string[]): string | undefined => {
          for (const k of keys) {
            const found = Object.keys(obj).find(key => key.trim().toLowerCase() === k.toLowerCase());
            if (found && obj[found] !== undefined && obj[found] !== '') return String(obj[found]).trim();
          }
          return undefined;
        };

        const username = normalize(raw, ['username', 'name', 'full_name', 'fullname', 'student_name']);
        const email = normalize(raw, ['email', 'email_address', 'student_email']);
        const department = normalize(raw, ['department', 'dept', 'faculty', 'program']) || raw.department;
        const registration_number = normalize(raw, ['registration_number', 'reg_number', 'reg_no', 'regno', 'roll_no', 'rollno', 'id']);

        if (!username || !email) {
          results.failed++;
          results.errors.push(`Row skipped: missing username or email (got: ${JSON.stringify(raw)})`);
          continue;
        }

        // Check if email already exists to give a cleaner error
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
          results.failed++;
          results.errors.push(`${email}: already exists`);
          continue;
        }

        await User.create({
          username,
          email: email.toLowerCase(),
          password: hashedPassword,
          department: department || 'General',
          registration_number: registration_number || undefined,
          role: 'student',
          isImported: true,
          isEligible: true,
        });
        results.success++;
      } catch (err: any) {
        results.failed++;
        const email = raw.email || raw.Email || raw.EMAIL || 'unknown';
        results.errors.push(`${email}: ${err.code === 11000 ? 'Duplicate email or registration number' : err.message}`);
      }
    }

    await createAuditLog(req.user.id, "BULK_IMPORT", `Success: ${results.success}, Failed: ${results.failed}`, req.ip || "");
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addManualStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password, department, registration_number } = req.body;

    const dept = await Department.findOne({ name: department });
    if (dept && !registration_number.toUpperCase().includes(dept.code.toUpperCase())) {
      res.status(400).json({ message: `Registration number must contain '${dept.code}' for ${department} department.` });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      department: department || "General",
      registration_number: registration_number || null,
      role: "student",
      isEligible: true
    });

    await createAuditLog(req.user.id, "ADD_STUDENT", `User: ${email}`, req.ip || "");
    res.status(201).json({ id: user._id });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Email or Registration Number already exists" });
      return;
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    await createAuditLog(req.user.id, "DELETE_STUDENT", `Deleted User: ${user.email}`, req.ip || "");
    res.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkDeleteStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) {
      res.status(400).json({ message: "Invalid student IDs" });
      return;
    }
    await User.deleteMany({ _id: { $in: studentIds }, role: "student" });
    await createAuditLog(req.user.id, "BULK_DELETE_STUDENTS", `Deleted ${studentIds.length} students`, req.ip || "");
    res.json({ message: "Students deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { maintenanceMode, officerRestricted, institutionName, timezone } = req.body;
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }
    
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (officerRestricted !== undefined) settings.officerRestricted = officerRestricted;
    if (institutionName !== undefined) settings.institutionName = institutionName;
    if (req.body.appName !== undefined) settings.appName = req.body.appName;
    if (req.body.appLogo !== undefined) settings.appLogo = req.body.appLogo;
    if (timezone !== undefined) settings.timezone = timezone;
    
    await settings.save();
    
    await createAuditLog(req.user.id, "UPDATE_SETTINGS", `Updated global system settings`, req.ip || "");
    
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicSettings = async (req: any, res: Response): Promise<void> => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    res.json({
      appName: settings.appName || "SuperiorVote",
      appLogo: settings.appLogo || null,
      institutionName: settings.institutionName
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const exportDatabase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      elections,
      users,
      votes,
      candidates,
      departments,
      announcements,
      settings,
      logs
    ] = await Promise.all([
      Election.find(),
      User.find(),
      Vote.find(),
      Candidate.find(),
      Department.find(),
      Announcement.find(),
      SystemSetting.find(),
      AuditLog.find()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        elections,
        users,
        votes,
        candidates,
        departments,
        announcements,
        settings,
        logs
      }
    };

    await createAuditLog(req.user.id, "BACKUP_DATABASE", "Full system backup exported", req.ip || "");

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAccountRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await AccountRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveAccountRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await AccountRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ message: "Account request not found" });
      return;
    }

    // Create the user
    await User.create({
      username: request.username,
      email: request.email,
      password: request.password, // This was already hashed during the request phase
      department: request.department,
      registration_number: request.registration_number,
      role: "student",
      isEligible: true,
      isImported: false,
    });

    // Update request status
    request.status = "approved";
    await request.save();

    await createAuditLog(req.user.id, "APPROVE_ACCOUNT_REQUEST", `Approved user: ${request.email}`, req.ip || "");

    res.json({ message: "Account request approved and user created successfully" });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: "User with this email, username, or registration number already exists in User collection." });
      return;
    }
    res.status(500).json({ message: error.message });
  }
};

export const rejectAccountRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await AccountRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ message: "Account request not found" });
      return;
    }

    request.status = "rejected";
    await request.save();

    await createAuditLog(req.user.id, "REJECT_ACCOUNT_REQUEST", `Rejected user: ${request.email}`, req.ip || "");

    res.json({ message: "Account request rejected" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
