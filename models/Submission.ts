import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId; // Changed from string to ObjectId
  topicId: string;
  topicName: string;
  answers: { [questionId: string]: number };
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: { 
      type: Schema.Types.ObjectId, // Changed from String
      ref: "User", // Add reference to User model
      required: true 
    },
    topicId: { type: String, required: true },
    topicName: { type: String, required: true },
    answers: { type: Map, of: Number, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeSpent: { type: Number, required: true }, // in seconds
  },
  { timestamps: true }
);

export default mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);