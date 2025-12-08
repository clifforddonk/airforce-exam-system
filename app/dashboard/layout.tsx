"use client";
import { useState } from "react";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import StudentSidebar from "../components/StudentSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row overflow-x-hidden">
      <StudentSidebar onLogout={handleLogout} />
      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden lg:ml-64">{children}</main>
    </div>
  );
}
