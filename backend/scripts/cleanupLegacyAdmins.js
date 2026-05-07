import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/superior_voting";

async function cleanup() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB...");

    const db = mongoose.connection.db;
    const usersColl = db.collection("users");
    const adminsColl = db.collection("admins");

    // 1. Find all users with role 'admin' or 'officer' in the users collection
    const legacyAdmins = await usersColl.find({ role: { $in: ["admin", "officer"] } }).toArray();
    console.log(`Found ${legacyAdmins.length} legacy admin/officer records.`);

    for (const legacy of legacyAdmins) {
      console.log(`Checking: ${legacy.email}`);
      const existing = await adminsColl.findOne({ email: legacy.email.toLowerCase() });
      
      if (!existing) {
        console.log(`Migrating ${legacy.email}...`);
        await adminsColl.insertOne({
          username: legacy.username,
          email: legacy.email.toLowerCase(),
          password: legacy.password,
          role: legacy.role,
          isActive: true,
          isSuperAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // 2. Delete from users collection
    const result = await usersColl.deleteMany({ role: { $in: ["admin", "officer"] } });
    console.log(`Deleted ${result.deletedCount} legacy records.`);

    console.log("Cleanup finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

cleanup();
