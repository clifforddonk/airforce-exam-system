// models/GroupSubmission.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IGroupSubmission extends Document {
  groupId: mongoose.Types.ObjectId; // ← Changed from number to ObjectId
  groupNumber: number; // Keep this as number for easy filtering
  fileUrl: string;
  fileName: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  score?: number;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  feedback?: string;
}

const GroupSubmissionSchema = new Schema<IGroupSubmission>(
  {
    groupId: {
      type: Schema.Types.ObjectId, // ← Changed from Number to ObjectId
      ref: "Group",
      required: true,
    },
    groupNumber: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      default: null,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
GroupSubmissionSchema.index({ groupId: 1 });
GroupSubmissionSchema.index({ groupNumber: 1 });
GroupSubmissionSchema.index({ uploadedBy: 1 });

export default mongoose.models.GroupSubmission ||
  mongoose.model<IGroupSubmission>("GroupSubmission", GroupSubmissionSchema);
