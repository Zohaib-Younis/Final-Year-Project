import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

/**
 * Connects to MongoDB with retry logic.
 * On Railway, we want to avoid process.exit(1) to prevent crash loops,
 * but we also need to ensure we don't run DB operations while disconnected.
 */
export const connectDB = async (retryCount = 5) => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    console.log("⏳ Connecting to MongoDB...");
    
    const conn = await mongoose.connect(MONGO_URI, {
      family: 4, // Force IPv4
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (retryCount > 0) {
      console.log(`🔄 Retrying in 5 seconds... (${retryCount} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount - 1);
    } else {
      console.error("🚫 Maximum connection retries reached.");
      // We don't exit here to avoid Railway crash loops, 
      // but we return false so the caller knows it failed.
      return false;
    }
  }
};
