import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL as string;

if (!MONGO_URL) {
  throw new Error("Missing MONGO_URL in .env");
}

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) return; // already connected
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
