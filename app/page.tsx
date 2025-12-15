"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import Link from "next/link";
import { Loader2, BookOpen, Plane, User, TrendingUp } from "lucide-react";
import { TOPICS } from "@/lib/topicsConfig";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on user role
        const redirectPath = user.role === "admin" ? "/admin" : "/dashboard";
        router.push(redirectPath);
      } else {
        setChecking(false);
      }
    }
  }, [user, isLoading, router]);

  if (checking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white backdrop-blur-md border-b border-gray-900 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Airforce Logo"
                width={40}
                height={40}
                className="drop-shadow-md"
              />
              <span className="text-xl font-bold text-[#0f172a]">SKYGUARD</span>
            </div>

            {/* Auth Buttons */}
            <div className="flex gap-3">
              <Link href="/auth/signup">
                <button className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg transition-colors">
                  SignUp
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <div className="relative pt-16">
        <div className="absolute inset-0">
          <Image
            src="/drop1.jpg"
            alt="Airforce Aircraft"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900 opacity-10"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-32 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            <p> SKYGUARD </p>No. 4 Strike and Recce Wing Safety Awareness Kit
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl mx-auto leading-relaxed">
            Complete your training modules, test your knowledge, and track your
            progress through our comprehensive safety system designed for Ghana
            Airforce personnel.
          </p>
          <div className="mt-10 flex justify-center space-x-6">
            <Link href="/auth/signup">
              <button className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg transition-colors">
                Get Started
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 shadow-lg transition-colors">
                Login
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Training Modules Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#0f172a] mb-4">
              Training Modules
            </h2>
            <p className="text-xl text-[#0f172a] max-w-2xl mx-auto">
              Comprehensive training covering all essential topics for Airforce
              personnel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {TOPICS.map((topic, index) => (
              <div
                key={topic.id}
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {index === 0 ? (
                      <BookOpen className="h-7 w-7 text-blue-600" />
                    ) : index === 1 ? (
                      <Plane className="h-7 w-7 text-blue-600" />
                    ) : (
                      <TrendingUp className="h-7 w-7 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {topic.label}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>
                <Link href="/auth/login">
                  <button className="w-full mt-6 bg-[#0f172a] hover:bg-gray-900 rounded-lg py-3 text-white font-medium transition-colors shadow-md">
                    Start Quiz
                  </button>
                </Link>
              </div>
            ))}

            {/* Group Project Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <User className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    Day 2 - Group Assignment
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Collaborate with your team to complete the group project and
                    earn extra points.
                  </p>
                </div>
              </div>
              <Link href="/auth/login">
                <button className="w-full mt-6 bg-[#0f172a] hover:bg-gray-900 rounded-lg py-3 text-white font-medium transition-colors shadow-md">
                  Upload PDF
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Stats Section */}
      {/* <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Training Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of personnel who have enhanced their skills through our platform
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-blue-50 p-8 rounded-2xl text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">1,000+</div>
              <div className="text-gray-700 font-medium">Active Students</div>
            </div>
            <div className="bg-blue-50 p-8 rounded-2xl text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">3</div>
              <div className="text-gray-700 font-medium">Training Modules</div>
            </div>
            <div className="bg-blue-50 p-8 rounded-2xl text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-700 font-medium">Completion Rate</div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-[#0f172a] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; 2024 Skyguard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
