// api/questions/bulk/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/models/Question";
import { verifyToken } from "@/lib/auth";

// POST /api/questions/bulk - Create multiple questions at once
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const cookieString = req.headers.get("cookie") || "";
    await verifyToken(cookieString);
    
    const { category, questions } = await req.json();
    
    // Validation
    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions array is required and must not be empty" },
        { status: 400 }
      );
    }
    
    // Validate each question has required fields
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        return NextResponse.json(
          { error: "Each question must have a question text and at least 2 options" },
          { status: 400 }
        );
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return NextResponse.json(
          { error: "Each question must have a valid correctAnswer index" },
          { status: 400 }
        );
      }
    }
    
    // Add category to each question
    const questionsWithCategory = questions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      category
    }));
    
    // Bulk insert - single DB operation!
    const created = await Question.insertMany(questionsWithCategory);
    
    return NextResponse.json(
      { 
        message: "Questions created successfully", 
        count: created.length,
        questions: created 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Bulk create error:", error);
    return NextResponse.json(
      { error: "Failed to create questions" },
      { status: 500 }
    );
  }
}

// PUT /api/questions/bulk - Update multiple questions at once
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const cookieString = req.headers.get("cookie") || "";
    await verifyToken(cookieString);
    
    const { questions } = await req.json();
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions array is required" },
        { status: 400 }
      );
    }
    
    // Update each question
    const updatePromises = questions.map(q => 
      Question.findByIdAndUpdate(
        q._id,
        {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          category: q.category
        },
        { new: true }
      )
    );
    
    const updated = await Promise.all(updatePromises);
    
    return NextResponse.json(
      { 
        message: "Questions updated successfully", 
        count: updated.length,
        questions: updated 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Failed to update questions" },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/bulk - Delete multiple questions at once
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const cookieString = req.headers.get("cookie") || "";
    await verifyToken(cookieString);
    
    const { ids } = await req.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required" },
        { status: 400 }
      );
    }
    
    const result = await Question.deleteMany({ _id: { $in: ids } });
    
    return NextResponse.json(
      { 
        message: "Questions deleted successfully", 
        count: result.deletedCount 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete questions" },
      { status: 500 }
    );
  }
}