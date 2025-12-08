import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  question: string;
  options: string[];
  correctAnswer: number;
  category?: string;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: Number, required: true },
    category: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);
