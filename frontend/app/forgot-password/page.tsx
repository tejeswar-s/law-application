"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type Step = 'request' | 'sent';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"attorney" | "juror">("attorney");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send reset link");
        setLoading(false);
        return;
      }

      setStep('sent');
      startResendCooldown();
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (resendCooldown > 0) return;
    
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userType }),
      });

      if (res.ok) {
        startResendCooldown();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to resend link");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    
    setLoading(false);
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <main className="min-h-screen flex font-sans" style={{ backgroundColor: BG }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px]">
        <div className="flex-1 bg-[#0A2342] text-white relative">
          {/* Logo */}
          <div className="absolute top-10 left-0 w-full">
            <Image
              src="/logo_sidebar_signup.png"
              alt="Quick Verdicts Logo"
              width={280}
              height={120}
              className="w-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="px-6 py-8 mt-48">
            <h2 className="text-lg font-semibold mb-3">Password Recovery</h2>
            
            {step === 'request' ? (
              <>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Enter the email address you have registered on QuickVerdict.com
                </p>
                <p className="text-sm text-blue-100 leading-relaxed mt-4">
                  A Password Recovery link will be sent to your email to complete the recovery process.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-blue-100 leading-relaxed">
                  If an account exists, we'll send instructions to your email for resetting your password.
                </p>
                <p className="text-sm text-blue-100 leading-relaxed mt-4">
                  Did not receive an email from us? Please check the email address or ask to resend the instructions.
                </p>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 flex flex-col relative px-12 py-10">
        {/* Top-left back link */}
        <div className="absolute top-6 left-10">
          <Link href="/login" className="text-sm text-gray-600 hover:underline flex items-center gap-1">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>

        {/* Top-right sign-up link */}
        <div className="absolute top-6 right-10 flex items-center space-x-3 text-sm">
          <span className="text-gray-600">Don&apos;t have an account?</span>
          <Link
            href="/signup"
            className="border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
          >
            Sign Up
          </Link>
        </div>

        {/* Form content */}
        <div className="flex flex-1 items-center">
          <div className="max-w-md w-full ml-16">
            
            {step === 'request' ? (
              <>
                <h1 className="text-2xl font-bold mb-8" style={{ color: BLUE }}>
                  Password Recovery
                </h1>
                
                <p className="text-sm text-gray-600 mb-6">
                  Enter the email you use for QuickVerdicts.com
                </p>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* User Type Selection */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Account Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="userType"
                          value="attorney"
                          checked={userType === "attorney"}
                          onChange={(e) => setUserType(e.target.value as "attorney" | "juror")}
                          className="mr-2 accent-[#0A2342]"
                        />
                        Attorney
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="userType"
                          value="juror"
                          checked={userType === "juror"}
                          onChange={(e) => setUserType(e.target.value as "attorney" | "juror")}
                          className="mr-2 accent-[#0A2342]"
                        />
                        Juror
                      </label>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="johndoe@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#0A2342] outline-none text-black"
                    />
                  </div>

                  {/* Submit */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full rounded px-4 py-2 transition ${
                        loading 
                          ? "bg-gray-400 cursor-not-allowed" 
                          : "bg-[#0A2342] hover:bg-[#132c54]"
                      } text-white`}
                    >
                      {loading ? "Sending..." : "Send Link"}
                    </button>
                    
                    {error && (
                      <div className="mt-2 text-red-500 text-sm">{error}</div>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-8" style={{ color: BLUE }}>
                  Reset Your Password
                </h1>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    If an account exists, we&apos;ll send instructions to your email for resetting your password.
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    Did not receive an email from us? Please check the email address or ask to resend the instructions.
                  </p>

                  <button
                    onClick={handleResendLink}
                    disabled={resendCooldown > 0 || loading}
                    className={`w-full rounded px-4 py-2 transition text-sm ${
                      resendCooldown > 0 || loading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "border border-[#0A2342] text-[#0A2342] hover:bg-[#0A2342] hover:text-white"
                    }`}
                  >
                    {loading 
                      ? "Sending..." 
                      : resendCooldown > 0 
                        ? `Send link again (${resendCooldown}s)` 
                        : "Send link again"
                    }
                  </button>

                  {error && (
                    <div className="mt-2 text-red-500 text-sm">{error}</div>
                  )}
                  
                  <div className="text-center mt-6">
                    <Link 
                      href="/login" 
                      className="text-sm text-[#0A2342] hover:underline"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}