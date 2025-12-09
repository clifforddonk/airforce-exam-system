import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/models/Submission";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

// POST /api/submissions - Submit a quiz
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify user is authenticated
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    const data = await req.json();

    // Validate data
    if (
      !data.topicId ||
      !data.answers ||
      data.score === undefined ||
      !data.totalQuestions
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create submission with ObjectId
    const submission = await Submission.create({
      userId: new mongoose.Types.ObjectId(user.id), // Convert to ObjectId
      topicId: data.topicId,
      topicName: data.topicName,
      answers: data.answers,
      score: data.score,
      totalQuestions: data.totalQuestions,
      percentage: data.percentage,
      timeSpent: data.timeSpent,
    });

    return NextResponse.json(
      { message: "Submission saved", submission },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}

// GET /api/submissions - Get user's submissions
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify user is authenticated
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    const submissions = await Submission.find({
      userId: new mongoose.Types.ObjectId(user.id), // Convert to ObjectId for query
    }).sort({
      createdAt: -1,
    });

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
