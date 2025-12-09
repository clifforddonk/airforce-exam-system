"use client";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function GroupAssignmentPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError("");
    setSuccess("");

    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file");
      return;
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    if (!user?.group) {
      setError("You are not assigned to a group yet");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/submissions/group", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess(
        "Assignment uploaded successfully! Your group submission has been recorded."
      );
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload file. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No Group Assigned
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't been assigned to a group yet. Please contact your
            administrator.
          </p>
          <Link href="/dashboard">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Group Assignment Submission
            </h1>
            <p className="text-gray-600">Topic 4 - Group Project</p>
          </div>

          {/* Group Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Group</p>
                <p className="font-semibold text-gray-800">
                  Group {user.group}
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Success!</p>
                <p className="text-sm">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
              <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF Document
            </label>

            {/* File Input */}
            <div className="relative">
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading || !!success}
                className="hidden"
              />
              <label
                htmlFor="file-input"
                className={`block border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  uploading || success
                    ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                    : "border-gray-300 hover:border-blue-400 cursor-pointer"
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-1">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF files only (Max 10MB)
                    </p>
                  </>
                )}
              </label>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Important Instructions
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 ml-7">
              <li>• Only PDF files are accepted</li>
              <li>• Maximum file size is 10MB</li>
              <li>• Only one submission per group is allowed</li>
              <li>• All group members will receive the same score</li>
              <li>
                • Make sure your group agrees on the final document before
                uploading
              </li>
            </ul>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading || !!success}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Uploaded Successfully
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Submit Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
