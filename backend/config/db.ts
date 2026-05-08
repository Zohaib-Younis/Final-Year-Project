import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

/**
 * Connects to MongoDB with retry logic.
 */
export const connectDB = async (retryCount = 5) => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    console.log("⏳ Connecting to MongoDB...");
    
    // Removed family: 4 to allow both IPv4 and IPv6
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Wait up to 10 seconds for selection
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
      return false;
    }
  }
};
