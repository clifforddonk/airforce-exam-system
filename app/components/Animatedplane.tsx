import React from "react";

import { Plane } from "lucide-react";
const AnimatedPlane = () => {
  return (
    <div>
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 animate-float">
            <Plane className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>
      {/* Custom Animation Styles */}
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AnimatedPlane;
