import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

export const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB with URI:", MONGO_URI.substring(0, 20) + "...");
    const conn = await mongoose.connect(MONGO_URI, {
      family: 4,
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
