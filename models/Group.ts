// models/Group.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  groupNumber: number;
  students: mongoose.Types.ObjectId[]; // References to User IDs
  submissionId?: mongoose.Types.ObjectId; // Reference to GroupSubmission
  score?: number;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    groupNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "GroupSubmission",
      default: null,
    },
    score: {
      type: Number,
      default: null,
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Group ||
  mongoose.model<IGroup>("Group", GroupSchema);
