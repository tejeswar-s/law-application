"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Bell,
  Home,
  Briefcase,
  Calendar,
  LogOut,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const NAV_BG = "#16305B";
const ACTIVE_BG = "#F7F6F3";
const ACTIVE_TEXT = "#16305B";
const TEXT_COLOR = "white";

export default function AttorneySidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const navLinks = [
    { id: "profile", label: "Profile", icon: <User className="w-6 h-6" />, href: "/profile" },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-6 h-6" />, href: "/notifications" },
  ];

  const mainNav = [
    { id: "home", label: "Home", icon: <Home className="w-6 h-6" />, href: "/attorney", active: true },
    { id: "cases", label: "Cases", icon: <Briefcase className="w-6 h-6" />, href: "/cases" },
    { id: "calendar", label: "Calendar", icon: <Calendar className="w-6 h-6" />, href: "/calendar" },
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
          {navLinks.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`flex items-center ${
                collapsed ? "justify-center py-3" : "px-6 py-3"
              } hover:bg-white/10 rounded transition-all duration-300`}
            >
              <div
                className="flex items-center justify-center w-10 h-10"
                style={{ color: TEXT_COLOR }}
              >
                {n.icon}
              </div>
              <span
                className={`text-[16px] font-medium whitespace-nowrap transition-all duration-500 ease-in-out ${
                  collapsed
                    ? "opacity-0 translate-x-[-10px] w-0 overflow-hidden"
                    : "opacity-100 translate-x-0 ml-2"
                }`}
                style={{ color: TEXT_COLOR }}
              >
                {n.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div className="mt-6 border-t border-white/20" />

      {/* Section Label */}
      <div
        className={`mt-4 px-6 transition-all duration-500 ease-in-out ${
          collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto"
        }`}
      >
      </div>

      {/* Main nav */}
      <nav className="flex flex-col mt-2">
        {mainNav.map((m) => {
          const active = !!m.active;
          return (
            <Link
              key={m.id}
              href={m.href}
              className={`flex items-center rounded transition-all duration-500 ease-in-out mx-2 ${
                collapsed ? "justify-center py-3" : "px-4 py-3 gap-3"
              } ${active ? "hover:bg-opacity-90" : "hover:bg-white/10"}`}
              style={{
                backgroundColor: active ? ACTIVE_BG : "transparent",
              }}
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
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sign out */}
      <div className="mb-6 px-4">
        <Link
          href="/login"
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
        </Link>
      </div>
    </aside>
  );
}