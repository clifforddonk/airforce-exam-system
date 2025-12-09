// app/api/submissions/group/route.ts (YOUR FILE)
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Group from "@/models/Group";
import GroupSubmission from "@/models/GroupSubmission";

// Create Supabase client with SERVICE ROLE KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // 1️⃣ Verify user is authenticated
    const cookieString = request.headers.get("cookie") || "";
    const userData = await verifyToken(cookieString);

    if (!userData || userData.role !== "student") {
      return NextResponse.json(
        { message: "Only students can submit" },
        { status: 403 }
      );
    }

    // 2️⃣ Get user from database
    const currentUser = await User.findById(userData.id);
    if (!currentUser || !currentUser.group) {
      return NextResponse.json(
        { message: "You are not assigned to a group" },
        { status: 400 }
      );
    }

    const groupNumber = currentUser.group;

    // 3️⃣ Find the Group document (IMPORTANT!)
    const group = await Group.findOne({ groupNumber });
    if (!group) {
      return NextResponse.json(
        { message: "Group not found. Please contact admin." },
        { status: 404 }
      );
    }

    // 4️⃣ Check if group already submitted (using locked status)
    if (group.locked) {
      return NextResponse.json(
        { message: "Your group has already submitted an assignment" },
        { status: 400 }
      );
    }

    // 5️⃣ Get file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // 6️⃣ Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const fileName = `group-${groupNumber}-${Date.now()}.pdf`;
    const filePath = `submissions/${fileName}`;

    console.log("Uploading to Supabase:", filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("group-submissions")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("group-submissions")
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // 7️⃣ Save submission to database
    // CRITICAL: Use group._id (ObjectId), NOT groupNumber
    const submission = await GroupSubmission.create({
      groupId: group._id, // ← ObjectId of Group document
      groupNumber: groupNumber, // ← Number for easy filtering
      fileUrl,
      fileName: file.name,
      uploadedBy: userData.id,
      uploadedAt: new Date(),
    });

    // 8️⃣ Lock the group and link submission
    await Group.findByIdAndUpdate(group._id, {
      submissionId: submission._id,
      locked: true,
    });

    console.log("Submission saved:", submission._id);

    return NextResponse.json({
      message: "Assignment uploaded successfully",
      submission: {
        id: submission._id,
        groupNumber: submission.groupNumber,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 1️⃣ Verify authentication
    const cookieString = request.headers.get("cookie") || "";
    const userData = await verifyToken(cookieString);

    if (!userData || userData.role !== "student") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // 2️⃣ Get student
    const user = await User.findById(userData.id);
    if (!user || !user.group) {
      return NextResponse.json(
        { message: "You are not assigned to a group" },
        { status: 400 }
      );
    }

    // 3️⃣ Fetch group
    const group = await Group.findOne({ groupNumber: user.group });

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    // 4️⃣ Optional: fetch submission info
    let submission = null;
    if (group.submissionId) {
      submission = await GroupSubmission.findById(group.submissionId).select(
        "fileName fileUrl uploadedAt"
      );
    }

    // 5️⃣ Return only what frontend needs
    return NextResponse.json({
      groupNumber: group.groupNumber,
      locked: group.locked,
      hasSubmitted: !!group.submissionId,
      submission,
    });
  } catch (error: any) {
    console.error("Get group status error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
