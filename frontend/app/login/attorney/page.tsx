"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function AttorneyLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState(0);

  // Preload critical images
  useEffect(() => {
    const imagesToLoad = [
      "/logo_sidebar_signup.png"
    ];

    let loaded = 0;
    imagesToLoad.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        loaded++;
        setLoadedImages(loaded);
        if (loaded === imagesToLoad.length) {
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        loaded++;
        setLoadedImages(loaded);
        if (loaded === imagesToLoad.length) {
          setIsLoading(false);
        }
      };
    });
  }, []);
  const router = useRouter();

  // If a valid token cookie exists, redirect to attorney home
  useEffect(() => {
    const token = (document.cookie || "")
      .split(";")
      .map(p => p.trim())
      .find(p => p.startsWith("token="))
      ?.split("=")[1];
    if (!token) return;
    fetch(`${API_BASE}/api/auth/verify-token`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data?.valid && data?.user?.type === "attorney") {
          router.replace("/attorney");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/attorney/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }
      if (data.token) {
        document.cookie = `token=${data.token}; path=/;`;
        // Store auth token for protected route
        localStorage.setItem('authToken', data.token);
        // Store user type for protected route
        localStorage.setItem('userType', 'attorney');
      }
      if (data.user) {
        localStorage.setItem("attorneyUser", JSON.stringify(data.user));
        localStorage.setItem("attorneyName", data.user.firstName);
      }
      
      // Clear signup drafts after successful login
      try {
        localStorage.removeItem('attorneySignupDraft');
        localStorage.removeItem('jurorSignupDraft');
      } catch (error) {
        console.warn('Failed to clear signup drafts:', error);
      }
      
      // Redirect to attorney dashboard
      router.push("/attorney");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#f9f7f2] flex flex-col items-center justify-center z-50">
        <div className="text-center">
          <div className="mb-4">
            <Image
              src="/logo_sidebar_signup.png"
              alt="Quick Verdicts Logo"
              width={200}
              height={80}
              priority
            />
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0A2342] transition-all duration-300"
              style={{
                width: `${(loadedImages / 1) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

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
          <Link href="/login" className="text-sm text-gray-600 hover:underline flex items-center gap-1">
            ← Back
          </Link>
        </div>

        {/* Top-right sign-up link */}
        <div className="absolute top-6 right-10 flex items-center space-x-3 text-sm">
          <span className="text-gray-600">Don&apos;t have an account?</span>
          <Link
            href="/signup/attorney"
            className="border text-gray-600 border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
          >
            Sign Up
          </Link>
        </div>

        {/* Login form */}
        <div className="flex flex-1 items-center">
          <div className="max-w-md w-full ml-16">
            <h1 className="text-2xl font-bold mb-8" style={{ color: BLUE }}>
              Log In: Attorney
            </h1>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#0A2342] outline-none text-black"
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
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-[#0A2342] outline-none text-black"
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

              {/* Submit + Error */}
              <div>
                <button
                  type="submit"
                  className={`w-full bg-[#0A2342] text-white rounded px-4 py-2 hover:bg-[#132c54] transition ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>
                {error && (
                  <div className="mt-2 text-red-500 text-sm">{error}</div>
                )}
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