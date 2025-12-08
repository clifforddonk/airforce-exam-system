import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/models/Question";
import { verifyToken } from "@/lib/auth";

// GET /api/questions/[id] - Get single question
export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const question = await Question.findById(params.id);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(question, { status: 200 });
  } catch (error) {
    console.error("Get question error:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - Update question (Admin only via middleware)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Verify user is authenticated (middleware ensures admin access)
    const cookieString = req.headers.get("cookie") || "";
    await verifyToken(cookieString);

    const data = await req.json();

    const updated = await Question.findByIdAndUpdate(params.id, data, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Question updated", question: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete question (Admin only via middleware)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Verify user is authenticated (middleware ensures admin access)
    const cookieString = req.headers.get("cookie") || "";
    await verifyToken(cookieString);

    const deleted = await Question.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Question deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
