"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutOverlay from "./LogoutOverlay";
import {
  User,
  Bell,
  Home,
  Briefcase,
  LogOut,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const NAV_BG = "#0C2D57";
const ACTIVE_BG = "#D4C397";
const ACTIVE_TEXT = "#0C2D57";
const TEXT_COLOR = "#D4C397";

type Section = "home" | "profile" | "notifications" | "assigned" | "jobs";

interface JurorSidebarProps {
  selectedSection: Section;
  onSectionChange: (section: Section) => void;
}

export default function JurorSidebar({ selectedSection, onSectionChange }: JurorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const router = useRouter();

  const navLinks = [
    { id: "profile", label: "Profile", icon: <User className="w-6 h-6" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-6 h-6" /> },
  ];

  const mainNav = [
    { id: "home", label: "Home", icon: <Home className="w-6 h-6" /> },
    { id: "assigned", label: "Assigned Cases", icon: <Briefcase className="w-6 h-6" /> },
    { id: "jobs", label: "Job Board", icon: <Briefcase className="w-6 h-6" /> },
  ];

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
          onClick={() => setCollapsed((s) => !s)}
          title={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-9 h-9 bg-transparent rounded hover:bg-white/10 transition-colors duration-300"
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
      <div
        className={`mt-14 flex items-center justify-center transition-all duration-500 ease-in-out`}
      >
        {collapsed ? (
          <Image
            src="/mini_logo.png"
            alt="QV Mini"
            width={40}
            height={40}
            className="h-12 w-auto"
          />
        ) : (
          <Image
            src="/logo_sidebar_signup.png"
            alt="Quick Verdicts"
            width={200}
            height={64}
            className="h-16 w-auto"
          />
        )}
      </div>

      {/* Top nav (Profile / Notifications) */}
      <div className={`mt-10 ${collapsed ? "space-y-2" : "space-y-4"} px-1`}>
        <nav className={`flex flex-col ${collapsed ? "items-center" : ""}`}>
          {navLinks.map((n) => {
            const active = selectedSection === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onSectionChange(n.id as Section)}
                className={`flex items-center w-full ${
                  collapsed ? "justify-center py-3" : "px-6 py-3"
                } hover:bg-white/10 rounded transition-all duration-300 ${active ? "bg-[#D4C397]" : ""}`}
                style={{ backgroundColor: active ? ACTIVE_BG : undefined }}
                aria-current={active ? "page" : undefined}
              >
                <div
                  className="flex items-center justify-center w-10 h-10"
                  style={{ color: active ? ACTIVE_TEXT : TEXT_COLOR }}
                >
                  {n.icon}
                </div>
                <span
                  className={`text-[16px] font-medium whitespace-nowrap transition-all duration-500 ease-in-out ${
                    collapsed
                      ? "opacity-0 translate-x-[-10px] w-0 overflow-hidden"
                      : "opacity-100 translate-x-0 ml-2"
                  }`}
                  style={{ color: active ? ACTIVE_TEXT : TEXT_COLOR }}
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mt-6 border-t border-white/20" />

      {/* Main nav */}
      <nav className="flex flex-col mt-2 px-1">
        {mainNav.map((m) => {
          const active = selectedSection === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSectionChange(m.id as Section)}
              className={`flex items-center w-full ${
                collapsed ? "justify-center py-3" : "px-6 py-3"
              } hover:bg-white/10 rounded transition-all duration-300 ${
                active ? "bg-[#D4C397]" : ""
              }`}
              style={{ backgroundColor: active ? ACTIVE_BG : undefined }}
              aria-current={active ? "page" : undefined}
            >
              <div
                className="flex items-center justify-center w-10 h-10"
                style={{ color: active ? ACTIVE_TEXT : TEXT_COLOR }}
              >
                {m.icon}
              </div>
              <span
                className={`text-[16px] font-semibold whitespace-nowrap transition-all duration-500 ease-in-out ${
                  collapsed
                    ? "opacity-0 translate-x-[-10px] w-0 overflow-hidden"
                    : "opacity-100 translate-x-0 ml-2"
                }`}
                style={{ color: active ? ACTIVE_TEXT : TEXT_COLOR }}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sign out */}
      <div className="mb-6 px-4">
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className={`flex items-center ${
            collapsed ? "justify-center py-3" : "px-4 py-3 w-full gap-3"
          } rounded hover:bg-white/10 transition-colors duration-300`}
        >
          <div
            className="flex items-center justify-center w-10 h-10"
            style={{ color: TEXT_COLOR }}
          >
            <LogOut className="w-6 h-6" />
          </div>
          <span
            className={`text-[16px] font-medium transition-all duration-500 ease-in-out ${
              collapsed
                ? "opacity-0 translate-x-[-10px] w-0 overflow-hidden"
                : "opacity-100 translate-x-0 ml-2"
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
            // Remove token cookie
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setShowLogout(false);
            router.push("/login/juror");
          }}
        />
      </div>
    </aside>
  );
}
