import mongoose, { Schema, Document } from "mongoose";

export interface IQuizSession extends Document {
  userId: mongoose.Types.ObjectId;
  topicId: string;
  startedAt: Date;
  expiresAt: Date;
  tabSwitches: number;
  sessionToken: string;
  ip?: string;
  userAgent?: string;
  status: "active" | "completed" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

const QuizSessionSchema = new Schema<IQuizSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    tabSwitches: {
      type: Number,
      default: 0,
    },
    sessionToken: {
      type: String,
      unique: true,
      required: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for fast lookups
QuizSessionSchema.index({ sessionToken: 1 });
QuizSessionSchema.index({ userId: 1, topicId: 1 });
QuizSessionSchema.index({ expiresAt: 1 });

export default mongoose.models.QuizSession ||
  mongoose.model<IQuizSession>("QuizSession", QuizSessionSchema);
