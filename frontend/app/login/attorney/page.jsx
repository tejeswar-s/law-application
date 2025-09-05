"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";

export default function AttorneyLogin() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen flex font-sans" style={{ backgroundColor: BG }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px]">
        <div className="flex-1 bg-[#0A2342] text-white relative">
          {/* Logo plate slightly down */}
          <div className="absolute top-10 left-0 w-full">
            <Image
              src="/logo_sidebar_signup.png"
              alt="Quick Verdicts Logo"
              width={280}
              height={120}
              className="w-full object-cover"
            />
          </div>

          {/* Sidebar text */}
          <div className="px-6 py-8 mt-48">
            <h2 className="text-lg font-semibold mb-3">Log In: Attorney</h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Please enter your Log In credentials to access your Attorney portal.
            </p>
            <p className="text-sm text-blue-100 leading-relaxed mt-4">
              In your Attorney portal, you can access your cases, war room, and much more!
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 flex flex-col relative px-12 py-10">
        {/* Top-left back link */}
        <div className="absolute top-6 left-10">
          <Link href="/" className="text-sm text-gray-600 hover:underline flex items-center gap-1">
            ← Back
          </Link>
        </div>

        {/* Top-right sign-up link */}
        <div className="absolute top-6 right-10 flex items-center space-x-3 text-sm">
          <span className="text-gray-600">Don&apos;t have an account?</span>
          <Link
            href="/signup/attorney"
            className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
          >
            Sign Up
          </Link>
        </div>

        {/* Login form (mostly left aligned) */}
        <div className="flex flex-1 items-center">
          <div className="max-w-md w-full ml-16">
            <h1 className="text-2xl font-bold mb-8" style={{ color: BLUE }}>
              Log In: Attorney
            </h1>

            <form className="space-y-6">
              {/* Email */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#0A2342] outline-none"
                />
              </div>

              {/* Password with eye toggle */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-[#0A2342] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit + Forgot password */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-[#0A2342] text-white rounded px-4 py-2 hover:bg-[#132c54] transition"
                >
                  Log in
                </button>
                <div className="mt-2 text-right">
                  <Link href="/forgot-password" className="text-sm text-gray-500 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
