"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function JurorLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  // If a valid token cookie exists, redirect to juror home
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
        if (data?.valid && data?.user?.type === "juror") {
          router.replace("/juror");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/juror/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // Store token in cookie
        document.cookie = `token=${data.token}; path=/;`;
        
        // Store auth token and user type for protected route
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userType', 'juror');
        
        // Clear signup drafts after successful login
        try {
          localStorage.removeItem('attorneySignupDraft');
          localStorage.removeItem('jurorSignupDraft');
        } catch (error) {
          console.warn('Failed to clear signup drafts:', error);
        }
        
        router.push("/juror");
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
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
              priority
            />
          </div>

          {/* Sidebar text */}
          <div className="px-6 py-8 mt-48">
            <h2 className="text-lg font-semibold mb-3">Log In: Juror</h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Please enter your Log In credentials to access your Juror portal.
            </p>
            <p className="text-sm text-blue-100 leading-relaxed mt-4">
              In your Juror portal, you can apply and view cases.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 flex flex-col relative px-12 py-10">
        {/* Top-left back link */}
        <div className="absolute top-6 left-10">
          <Link href="/login" className="text-sm text-gray-600 hover:underline flex items-center gap-1" aria-label="Go back">
            ← Back
          </Link>
        </div>

        {/* Top-right sign-up link */}
        <div className="absolute top-6 right-10 flex items-center space-x-3 text-sm">
          <span className="text-gray-600">Don&apos;t have an account?</span>
          <Link
            href="/signup/juror"
            className="border text-gray-600 border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
          >
            Sign up
          </Link>
        </div>

        {/* Login form */}
        <div className="flex flex-1 items-center">
          <div className="max-w-md w-full ml-16">
            <h1 className="text-2xl font-bold mb-8" style={{ color: BLUE }}>
              Log In: Juror
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {error && (
                <div className="text-red-600 text-sm font-medium mb-2">{error}</div>
              )}
              {/* Email */}
              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border text-gray-800 border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#0A2342] outline-none"
                  disabled={loading}
                />
              </div>

              {/* Password with eye toggle */}
              <div>
                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-gray-800 border border-gray-300 rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-[#0A2342] outline-none"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
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
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Log in"}
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