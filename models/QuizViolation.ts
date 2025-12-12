import mongoose, { Schema, Document } from "mongoose";

export interface IQuizViolation extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  topicId: string;
  violationType: "tab_switch" | "page_focus_loss" | "copy_paste" | "devtools";
  severity: "low" | "medium" | "high";
  count: number;
  details: {
    ip?: string;
    userAgent?: string;
    timeIntoQuiz?: number;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizViolationSchema = new Schema<IQuizViolation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "QuizSession",
      required: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    violationType: {
      type: String,
      enum: ["tab_switch", "page_focus_loss", "copy_paste", "devtools"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    count: {
      type: Number,
      default: 1,
    },
    details: {
      ip: String,
      userAgent: String,
      timeIntoQuiz: Number, // in seconds
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast queries
QuizViolationSchema.index({ userId: 1 });
QuizViolationSchema.index({ sessionId: 1 });
QuizViolationSchema.index({ createdAt: -1 });

export default mongoose.models.QuizViolation ||
  mongoose.model<IQuizViolation>("QuizViolation", QuizViolationSchema);
