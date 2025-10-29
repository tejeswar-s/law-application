"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LogoutOverlay from "./LogoutOverlay";
import NotificationPreview from "@/app/components/NotificationPreview";
import {
  User,
  Bell,
  Home,
  Briefcase,
  ClipboardType,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Lock,
} from "lucide-react";

const NAV_BG = "#16305B";
const ACTIVE_BG = "#F7F6F3";
const ACTIVE_TEXT = "#16305B";
const TEXT_COLOR = "white";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Section = "home" | "profile" | "notifications" | "assigned" | "jobs";

interface JurorSidebarProps {
  selectedSection: Section;
  onSectionChange: (section: Section) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function JurorSidebar({ selectedSection, onSectionChange, onCollapsedChange }: JurorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hoveredNotifications, setHoveredNotifications] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken'); // Use authToken from localStorage
      if (!token) {
        console.log("No auth token found");
        return;
      }
      
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  useEffect(() => {
    // Check verification status from juror profile API
    const fetchJurorProfile = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Use authToken from localStorage
        if (!token) {
          console.log("No auth token found");
          return;
        }
        
        const res = await fetch(`${API_BASE}/api/juror/profile`, {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        if (data.success) {
          setIsVerified(data.juror?.verified || false);
        }
      } catch (error) {
        console.error("Failed to fetch juror profile:", error);
      }
    };

    fetchJurorProfile();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { id: "profile", label: "Profile", icon: <User className="w-6 h-6" />, requiresVerification: false },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-6 h-6" />, requiresVerification: false },
  ];

  const mainNav = [
    { id: "home", label: "Home", icon: <Home className="w-6 h-6" />, requiresVerification: false },
    { id: "assigned", label: "Assigned Cases", icon: <Briefcase className="w-6 h-6" />, requiresVerification: true },
    { id: "jobs", label: "Job Board", icon: <ClipboardType className="w-6 h-6" />, requiresVerification: true },
  ];

  const handleSectionChange = (sectionId: string, requiresVerification: boolean) => {
    if (requiresVerification && !isVerified) {
      // Don't allow navigation to restricted sections
      return;
    }
    onSectionChange(sectionId as Section);
  };

  return (
    <aside
      className={`relative flex flex-col min-h-screen transition-all duration-500 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{ backgroundColor: NAV_BG }}
    >
      {/* Collapse Button */}
      <div
        className={`absolute ${
          collapsed ? "left-1/2 -translate-x-1/2" : "right-2"
        } top-4 z-30 transition-all duration-500 ease-in-out`}
      >
        <button
          onClick={() => {
            const newCollapsed = !collapsed;
            setCollapsed(newCollapsed);
            onCollapsedChange?.(newCollapsed);
          }}
          title={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-9 h-9 bg-transparent rounded hover:bg-white/10 transition-colors duration-300 cursor-pointer"
        >
          {collapsed ? (
            <div className="flex items-center text-[20px]" style={{ color: TEXT_COLOR }}>
              <span className="mr-0.5">|</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          ) : (
            <div className="flex items-center text-[20px]" style={{ color: TEXT_COLOR }}>
              <span className="mr-0.5">|</span>
              <ArrowLeft className="w-5 h-5" />
            </div>
          )}
        </button>
      </div>

      {/* Logo */}
      <div className={`mt-14 flex items-center justify-center transition-all duration-500 ease-in-out`}>
        {collapsed ? (
          <Image src="/mini_logo.png" alt="QV Mini" width={40} height={40} className="h-12 w-auto" />
        ) : (
          <Image src="/logo_sidebar_signup.png" alt="Quick Verdicts" width={200} height={64} className="h-16 w-auto" />
        )}
      </div>

      {/* Top nav (Profile / Notifications) */}
      <div className={`mt-10 ${collapsed ? "space-y-2" : "space-y-4"} px-1`}>
        <nav className={`flex flex-col ${collapsed ? "items-center" : ""}`}>
          {navLinks.map((n) => {
            const active = selectedSection === n.id;
            const isNotifications = n.id === "notifications";
            return (
              <div 
                key={n.id} 
                className="relative"
                onMouseEnter={() => isNotifications && setHoveredNotifications(true)}
                onMouseLeave={() => isNotifications && setHoveredNotifications(false)}
              >
                <button
                  type="button"
                  onClick={() => handleSectionChange(n.id, n.requiresVerification)}
                  className={`flex items-center rounded transition-all duration-500 ease-in-out cursor-pointer w-full ${
                    collapsed ? "justify-center py-3" : "px-4 py-3 gap-3"
                  } ${active ? "hover:bg-opacity-90" : "hover:bg-white/10"}`}
                  style={{ backgroundColor: active ? ACTIVE_BG : "transparent" }}
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 relative"
                    style={{ color: active ? ACTIVE_TEXT : TEXT_COLOR }}
                  >
                    {n.icon}
                    {isNotifications && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[16px] font-semibold whitespace-nowrap transition-all duration-500 ease-in-out ${
                      collapsed ? "opacity-0 translate-x-[-10px] w-0 overflow-hidden" : "opacity-100 translate-x-0 ml-2"
                    }`}
                    style={{ color: active ? ACTIVE_TEXT : TEXT_COLOR }}
                  >
                    {n.label}
                  </span>
                </button>
                {isNotifications && !collapsed && (
                  <NotificationPreview isHovered={hoveredNotifications} />
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mt-6 border-t border-white/20" />

      {/* Main nav */}
      <nav className="flex flex-col mt-2 px-2">
        {mainNav.map((m) => {
          const active = selectedSection === m.id;
          const isLocked = m.requiresVerification && !isVerified;
          
          return (
            <div key={m.id} className="relative mb-1">
              <button
                type="button"
                onClick={() => handleSectionChange(m.id, m.requiresVerification)}
                disabled={isLocked}
                className={`flex items-center rounded transition-all duration-500 ease-in-out w-full ${
                  collapsed ? "justify-center py-3" : "px-4 py-3 gap-3"
                } ${
                  isLocked 
                    ? "cursor-not-allowed opacity-60" 
                    : "cursor-pointer hover:bg-white/10"
                } ${active && !isLocked ? "hover:bg-opacity-90" : ""}`}
                style={{ backgroundColor: active && !isLocked ? ACTIVE_BG : "transparent" }}
              >
                <div className="flex items-center justify-center w-10 h-10 relative" style={{ color: active && !isLocked ? ACTIVE_TEXT : TEXT_COLOR }}>
                  {m.icon}
                  {isLocked && (
                    <Lock className="absolute -bottom-1 -right-1 w-3 h-3 text-yellow-400" />
                  )}
                </div>
                <span
                  className={`text-[16px] font-semibold whitespace-nowrap transition-all duration-500 ease-in-out ${
                    collapsed ? "opacity-0 translate-x-[-10px] w-0 overflow-hidden" : "opacity-100 translate-x-0 ml-2"
                  }`}
                  style={{ color: active && !isLocked ? ACTIVE_TEXT : TEXT_COLOR }}
                >
                  {m.label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Sign out */}
      <div className="mb-6 px-4">
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className={`flex items-center cursor-pointer ${
            collapsed ? "justify-center py-3" : "px-4 py-3 w-full gap-3"
          } rounded hover:bg-white/10 transition-colors duration-300`}
        >
          <div className="flex items-center justify-center w-10 h-10" style={{ color: TEXT_COLOR }}>
            <LogOut className="w-6 h-6" />
          </div>
          <span
            className={`text-[16px] font-semibold transition-all duration-500 ease-in-out ${
              collapsed ? "opacity-0 translate-x-[-10px] w-0 overflow-hidden" : "opacity-100 translate-x-0 ml-2"
            }`}
            style={{ color: TEXT_COLOR }}
          >
            Sign Out
          </span>
        </button>
        <LogoutOverlay
          open={showLogout}
          onClose={() => setShowLogout(false)}
          onSignOut={() => {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setShowLogout(false);
            router.push("/login/juror");
          }}
        />
      </div>
    </aside>
  );
}