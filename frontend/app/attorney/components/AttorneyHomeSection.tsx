"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
const AttorneyHelp = dynamic(() => import("./AttorneyHelp"), { ssr: false });
const AttorneyContact = dynamic(() => import("./AttorneyContact"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

type AttorneyUser = {
  attorneyId: number;
  firstName: string;
  lastName: string;
  email: string;
  lawFirmName: string;
  phoneNumber?: string;
  isVerified: boolean;
  verificationStatus: string;
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

// Introductory Slider Component for Unverified Attorneys
function IntroductorySlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "Welcome to Quick Verdicts!",
      description: "Your comprehensive platform for managing virtual trials efficiently and effectively.",
      image: "/image2.png"
    },
    {
      title: "Manage Your Cases",
      description: "Create, organize, and track all your cases in one centralized dashboard.",
      image: "/image3.png"
    },
    {
      title: "Virtual Courtroom",
      description: "Conduct trials seamlessly with our integrated video conferencing and case management tools.",
      image: "/image4.png"
    },
    {
      title: "War Room Collaboration",
      description: "Prepare for trials with document management, witness preparation, and team collaboration features.",
      image: "/image5.png"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <div className="relative">
        {/* Slide Content */}
        <div className="text-center mb-6">
          <div className="mb-6 flex justify-center">
            <img 
              src={slides[currentSlide].image} 
              alt={slides[currentSlide].title}
              className="h-64 w-auto object-contain rounded-lg"
            />
          </div>
          <h2 className="text-2xl font-bold text-[#16305B] mb-3">
            {slides[currentSlide].title}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="text-[#16305B]" />
          </button>
          
          {/* Dots Indicator */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? "w-8 bg-[#16305B]" 
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="text-[#16305B]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttorneyHomeSection() {
  const [user, setUser] = useState<AttorneyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("attorneyUser");
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse attorney user:", error);
        }
      }
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="flex-1 px-10 py-8 bg-[#F7F6F3] flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#16305B]" />
      </main>
    );
  }

  if (showContact) {
    return <AttorneyContact onBack={() => { setShowContact(false); setShowHelp(true); }} />;
  }

  if (showHelp) {
    return <AttorneyHelp onContact={() => { setShowHelp(false); setShowContact(true); }} />;
  }

  const isVerified = user?.isVerified || false;
  const verificationStatus = user?.verificationStatus || "pending";

  return (
    <main className="flex-1 px-10 py-8 bg-[#F7F6F3] transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#16305B]">
          Welcome back{user ? `, ${user.firstName}!` : "!"}
        </h1>
        <div className="flex items-center gap-4">
          <button 
            className="text-[#16305B] hover:text-[#1e417a] transition-colors" 
            onClick={() => setShowHelp(true)}
          >
            Help
          </button>
        </div>
      </div>

      {/* Verification Status Alert for Unverified Attorneys */}
      {!isVerified && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-yellow-800 font-semibold mb-1">Account Pending Verification</h3>
              <p className="text-yellow-700 text-sm">
                Your account is currently under review by our admin team. You will gain full access to Cases and Calendar sections once your account is verified. In the meantime, you can explore the platform features below and manage your profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Introductory Slider for Unverified Attorneys */}
      {!isVerified && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#16305B] mb-4">Get Started with Quick Verdicts</h2>
          <IntroductorySlider />
        </section>
      )}

      {/* Cases Section Preview */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#16305B]">Your Cases</h2>
            <p className="text-sm text-[#6B7280]">
              {isVerified ? "Manage and access your cases quickly" : "Available after verification"}
            </p>
          </div>
        </div>
        
        {isVerified ? (
          <div className="bg-white rounded shadow p-6">
            <p className="text-gray-600 text-center">
              Click on <span className="font-semibold text-[#16305B]">Cases</span> in the sidebar to view and manage your cases.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cases Section Locked</h3>
              <p className="text-gray-600">
                You will be able to create and manage cases once your account is verified by an administrator. This ensures the security and integrity of our platform.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Calendar Section Preview */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#16305B]">Calendar & Events</h2>
            <p className="text-sm text-[#6B7280]">
              {isVerified ? "Track your upcoming trials and events" : "Available after verification"}
            </p>
          </div>
        </div>
        
        {isVerified ? (
          <div className="bg-white rounded shadow p-6">
            <p className="text-gray-600 text-center">
              Click on <span className="font-semibold text-[#16305B]">Calendar</span> in the sidebar to view your schedule and upcoming events.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Section Locked</h3>
              <p className="text-gray-600">
                You will be able to view and manage your calendar once your account is verified by an administrator.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}