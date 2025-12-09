import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const cookieString = request.headers.get("cookie") || "";
    const payload = await verifyToken(cookieString);

    if (!payload || payload.role !== "admin") {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Fetch all submissions
    const submissions = await Submission.find().sort({ createdAt: -1 }).lean();

    console.log(`Total submissions fetched: ${submissions.length}`);

    // Manually fetch users for submissions
    const userIds = submissions
      .map((sub: any) => {
        // Handle both string and ObjectId formats
        if (typeof sub.userId === "string") {
          try {
            return new mongoose.Types.ObjectId(sub.userId);
          } catch {
            return null;
          }
        }
        return sub.userId;
      })
      .filter(Boolean);

    console.log(`Fetching ${userIds.length} unique users`);

    // Fetch all users at once
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    console.log(`Found ${users.length} users in database`);

    // Group submissions by user
    const resultsByUser: {
      [userId: string]: {
        userId: string;
        fullName: string;
        email: string;
        group?: string;
        topic1?: number;
        topic2?: number;
        topic3?: number;
        groupScore?: number;
        submissions: any[];
      };
    } = {};

    submissions.forEach((submission: any) => {
      // Convert userId to string for lookup
      const userIdString = submission.userId?.toString() || submission.userId;

      if (!userIdString) {
        console.warn("Skipping submission without userId:", submission._id);
        return;
      }

      const user = userMap.get(userIdString);

      if (!user) {
        console.warn("Skipping submission - user not found:", userIdString);
        return;
      }

      if (!resultsByUser[userIdString]) {
        resultsByUser[userIdString] = {
          userId: userIdString,
          fullName: user.fullName || "Unknown",
          email: user.email || "No email",
          group: user.group || undefined,
          submissions: [],
        };
      }

      resultsByUser[userIdString].submissions.push(submission);
    });

    // Calculate scores for each topic (using score, not percentage)
    Object.keys(resultsByUser).forEach((userId) => {
      const user = resultsByUser[userId];

      user.submissions.forEach((submission) => {
        const score = submission.score || 0;

        // Map topic IDs to fields
        if (submission.topicId === "topic1") {
          user.topic1 = score;
        } else if (submission.topicId === "topic2") {
          user.topic2 = score;
        } else if (submission.topicId === "topic3") {
          user.topic3 = score;
        } else if (
          submission.topicId === "group" ||
          submission.topicName?.toLowerCase().includes("group")
        ) {
          user.groupScore = score;
        }
      });
    });

    // Convert to array and calculate total
    const results = Object.values(resultsByUser).map((user) => {
      const scores = [
        user.topic1,
        user.topic2,
        user.topic3,
        user.groupScore,
      ].filter((score): score is number => score !== undefined);

      const total = scores.reduce((sum, score) => sum + score, 0);

      return {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        group: user.group,
        topic1: user.topic1,
        topic2: user.topic2,
        topic3: user.topic3,
        groupScore: user.groupScore,
        total,
      };
    });

    console.log(`Returning ${results.length} student results`);

    return Response.json(results);
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    return Response.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}