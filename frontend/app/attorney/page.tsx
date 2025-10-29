"use client";

import { useState, useEffect } from "react";
import AttorneySidebar from "./components/AttorneySidebar";
import AttorneyMainSection from "./components/AttorneyMainSection";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type Section = "home" | "profile" | "notifications" | "cases" | "calendar";

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function AttorneyDashboard() {
  // Use protected route hook
  useProtectedRoute('attorney');

  const [selectedSection, setSelectedSection] = useState<Section>("home");
  const [verificationStatusChanged, setVerificationStatusChanged] = useState(0);

  // Listen for in-page navigation events (e.g. Home "View all" -> Cases)
  useEffect(() => {
    const handler = (e: Event) => {
      setSelectedSection("cases");
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('navigate-to-cases', handler as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('navigate-to-cases', handler as EventListener);
      }
    };
  }, []);

  // Periodically check verification status
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const token = getCookie("token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/attorney/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.attorney) {
            // Get current user from localStorage
            const stored = localStorage.getItem("attorneyUser");
            if (stored) {
              const currentUser = JSON.parse(stored);
              
              // Check if verification status changed
              if (currentUser.isVerified !== data.attorney.verified ||
                  currentUser.verificationStatus !== data.attorney.verificationStatus) {
                
                // Update localStorage with new verification status
                const updatedUser = {
                  ...currentUser,
                  isVerified: data.attorney.verified,
                  verificationStatus: data.attorney.verificationStatus
                };
                
                localStorage.setItem("attorneyUser", JSON.stringify(updatedUser));
                
                // Trigger re-render by incrementing state
                setVerificationStatusChanged(prev => prev + 1);
                
                console.log("✅ Verification status updated:", {
                  isVerified: data.attorney.verified,
                  status: data.attorney.verificationStatus
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to check verification status:", error);
      }
    };

    // Check immediately on mount
    checkVerificationStatus();

    // Check every 30 seconds
    const interval = setInterval(checkVerificationStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      <AttorneySidebar
        selectedSection={selectedSection}
        onSectionChange={(section: Section) => setSelectedSection(section)}
        key={verificationStatusChanged} // Force re-render when verification changes
      />
      <AttorneyMainSection 
        selectedSection={selectedSection}
        onSectionChange={(section: Section) => setSelectedSection(section)}
      />
    </div>
  );
}