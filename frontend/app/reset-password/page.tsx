"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState("");
  const [userType, setUserType] = useState<"attorney" | "juror">("attorney");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasCapital: false,
    hasSpecial: false,
    noConsecutive: false,
    notAccountName: true,
    passwordsMatch: false,
  });

  useEffect(() => {
    const urlToken = searchParams.get('token');
    const urlType = searchParams.get('type');
    
    if (!urlToken || !urlType || !['attorney', 'juror'].includes(urlType)) {
      setError("Invalid or missing reset link parameters");
      return;
    }
    
    setToken(urlToken);
    setUserType(urlType as "attorney" | "juror");
  }, [searchParams]);

  // Real-time password validation
  useEffect(() => {
    validatePassword(newPassword);
  }, [newPassword, confirmPassword, email]);

  const validatePassword = (password: string) => {
    const accountName = email.split('@')[0].toLowerCase();
    
    setPasswordValidation({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasCapital: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*()[\]{};:'",.<>/?\\|`~_\-+=]/.test(password),
      noConsecutive: !/(.)\1\1/.test(password),
      notAccountName: password.toLowerCase() !== accountName,
      passwordsMatch: confirmPassword === password && password.length > 0,
    });
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean) && confirmPassword !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid()) {
      setError("Please ensure your password meets all requirements and passwords match");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token, 
          userType, 
          newPassword 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to reset password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/login/${userType}`);
      }, 3000);

    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (error && !token) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: BLUE }}>Invalid Reset Link</h1>
          <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
          <Link 
            href="/forgot-password" 
            className="bg-[#0A2342] text-white px-6 py-2 rounded hover:bg-[#132c54]"
          >
            Request New Link
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: BLUE }}>Password Reset Successful</h1>
          <p className="text-gray-600 mb-6">Your password has been updated successfully.</p>
          <p className="text-sm text-gray-500">Redirecting you to login page...</p>
        </div>
      </main>
    );
  }

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
            <p className="text-sm text-blue-100 leading-relaxed">
              Please choose a new password for your account.
            </p>
            <p className="text-sm text-blue-100 leading-relaxed mt-4">
              Make sure to meet all the security criteria listed to ensure a strong and secure password.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 flex flex-col relative px-12 py-10">
        {/* Top-left back link */}
        <div className="absolute top-6 left-10">
          <Link href="/forgot-password" className="text-sm text-gray-600 hover:underline flex items-center gap-1">
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
            <h1 className="text-2xl font-bold mb-8" style={{ color: BLUE }}>
              Password Recovery
            </h1>
            
            <p className="text-sm text-gray-600 mb-6">
              Email: {email || "Loading..."}
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* New Password */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="JohnDoePassword1!"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
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

                {/* Password Requirements Checklist */}
                <div className="mt-3 space-y-1">
                  {[
                    { key: "minLength", text: "Be at least 8 characters", valid: passwordValidation.minLength },
                    { key: "hasNumber", text: "Have at least one number", valid: passwordValidation.hasNumber },
                    { key: "notAccountName", text: "Not be the same as the account name", valid: passwordValidation.notAccountName },
                    { key: "noConsecutive", text: "Your password must not contain more than 2 consecutive identical characters", valid: passwordValidation.noConsecutive },
                    { key: "hasCapital", text: "Have at least one capital letter", valid: passwordValidation.hasCapital },
                    { key: "hasSpecial", text: "Have at least one special character (!@#$%^&*())", valid: passwordValidation.hasSpecial },
                  ].map((rule) => (
                    <div key={rule.key} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={rule.valid}
                        readOnly
                        className="w-4 h-4 accent-[#0A2342]" 
                      />
                      <span className={rule.valid ? "text-green-600" : "text-gray-600"}>{rule.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Re-type Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="JohnDoePassword1!"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-[#0A2342] outline-none text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password match indicator */}
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={passwordValidation.passwordsMatch}
                      readOnly
                      className="w-4 h-4 accent-[#0A2342]" 
                    />
                    <span className={passwordValidation.passwordsMatch ? "text-green-600" : "text-gray-600"}>
                      Re-typed password must match
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={!isPasswordValid() || loading}
                  className={`w-full rounded px-4 py-2 transition ${
                    !isPasswordValid() || loading
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-[#0A2342] hover:bg-[#132c54]"
                  } text-white`}
                >
                  {loading ? "Updating Password..." : "Reset Password"}
                </button>
                
                {error && (
                  <div className="mt-2 text-red-500 text-sm">{error}</div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div>Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}