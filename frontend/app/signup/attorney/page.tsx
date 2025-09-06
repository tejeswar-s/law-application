"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function AttorneySignup() {
  const [step, setStep] = useState<number>(2); // Start at section 2 for dev/testing

  const totalSteps = 5;
  const steps: string[] = [
    "Personal Details",
    "Registered Address",
    "Email & Password Set Up",
    "User Agreement",
    "Sign Up Complete",
  ];

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[300px] bg-[#16305B]">
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center gap-3 bg-[#F6EEDC] px-8 py-6 border-b border-[#e3e3e3]">
            <Image
              src="/logo.jpg"
              alt="Quick Verdicts Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base text-[#16305B] tracking-tight">
                QUICK VERDICTS
              </span>
              <span
                className="text-xs text-[#16305B] tracking-wide"
                style={{ letterSpacing: "0.04em" }}
              >
                VIRTUAL TRIALS • DELIBERATED VERDICTS
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center px-8">
            <h2 className="text-2xl font-bold mb-2 text-white leading-tight">
              Sign Up:
              <br />
              Attorney
            </h2>
            <p className="text-sm text-[#e3e3e3] leading-relaxed mb-2">
              Please fill out the following fields with the necessary
              information.
            </p>
            <p className="text-sm text-[#e3e3e3]">
              Any with <span className="text-red-400">*</span> is required.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0">
        {/* Top Row */}
        <div className="flex items-center justify-between pt-8 pb-2 px-8">
          <div className="flex items-center gap-2">
            <button
              onClick={prevStep}
              className="text-[#16305B] text-base flex items-center gap-1 hover:underline"
              disabled={step === 1}
              tabIndex={step === 1 ? -1 : 0}
              style={{
                opacity: step === 1 ? 0.5 : 1,
                pointerEvents: step === 1 ? "none" : "auto",
              }}
            >
              <ArrowLeft size={18} /> Back
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#16305B] text-sm">
              Already have an account?
            </span>
            <Link href="/login">
              <button className="border border-[#16305B] text-[#16305B] rounded-md px-4 py-1.5 text-sm hover:bg-[#f3f6fa] transition">
                Log In
              </button>
            </Link>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 px-8 pb-8">
          {steps.map((label, idx) => {
            const isActive = step === idx + 1;
            const isCompleted = step > idx + 1;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${
                        isActive
                          ? "border-[#16305B]"
                          : isCompleted
                          ? "border-[#16305B] bg-[#16305B]"
                          : "border-[#bfc6d1] bg-transparent"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        className="text-white"
                      >
                        <path
                          d="M4 7.5l2 2 4-4"
                          stroke="white"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    ) : (
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isActive ? "bg-[#16305B]" : "bg-transparent"
                        }`}
                      ></span>
                    )}
                  </span>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isActive
                        ? "text-[#16305B]"
                        : isCompleted
                        ? "text-[#16305B]"
                        : "text-[#bfc6d1]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-16 h-px bg-[#bfc6d1] mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Section 2 (Registered Address Form) */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center px-8">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Sign Up: Attorney
              </h1>
              <form className="space-y-6">
                {/* Office Address 1 */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Office Address 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Office Address 1"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* Office Address 2 */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Office Address 2
                  </label>
                  <input
                    type="text"
                    placeholder="Office Address 2"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* City */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* State */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a State
                    </option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="NY">New York</option>
                  </select>
                </div>
                {/* Zip */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ZIP Code"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section 1 (Personal Details) */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center px-8">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Sign Up: Attorney
              </h1>
              <form className="space-y-6">
                {/* Checkbox */}
                <div>
                  <label className="block mb-2 text-[#16305B] font-medium">
                    Who is signing up? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#16305B]"
                      required
                    />
                    <span className="text-[#16305B] text-sm">
                      I confirm I am the attorney registering.
                    </span>
                  </div>
                </div>
                {/* First Name */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* Middle Name */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    placeholder="Middle Name"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* Last Name */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* Law Firm */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Law Firm Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Law Firm Entity Name"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* Phone */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(000) 000-0000"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* State */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a State
                    </option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="NY">New York</option>
                  </select>
                </div>
                {/* State Bar */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    State Bar Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="State Bar Number"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section 3 (Email & Password) */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center px-8">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Sign Up: Attorney
              </h1>
              <form className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                {/* Password */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {/* Password Rules */}
                  <div className="mt-2 space-y-1 text-[14px] text-[#16305B]">
                    {[
                      "Be at least 8 characters",
                      "Have at least one number",
                      "Not be the same as the account name",
                      "Your password must not contain more than 2 consecutive identical characters",
                      "Have at least one capital letter",
                      "Have at least one special character (! @ # $ . – + , ;)",
                    ].map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="checkbox" disabled className="accent-[#16305B]" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Confirm Password */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Re-type Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type Password"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section 4 (User Agreement) */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center px-8">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Sign Up: Attorney
              </h1>
              <form className="space-y-6">
                <div>
                  <label className="block mb-2 text-[#16305B] font-medium">
                    <input
                      type="checkbox"
                      className="mr-2 accent-[#16305B]"
                      required
                    />
                    I agree to the{" "}
                    <span className="underline">User Agreement</span>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section 5 (Complete) */}
        {step === 5 && (
          <div className="flex-1 flex flex-col items-center px-8">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2 text-center">
                Account Creation Successful
              </h1>
              <div className="flex flex-col items-center justify-center">
                <svg width="90" height="90" viewBox="0 0 90 90" className="mb-6">
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    fill="none"
                    stroke="#19C900"
                    strokeWidth="6"
                  />
                  <polyline
                    points="30,48 42,60 62,36"
                    fill="none"
                    stroke="#19C900"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-lg font-semibold text-[#222] mb-4 text-center">
                  Your Account has been created successfully.
                </div>
                <div className="text-[#222] text-base mb-8 text-center max-w-xl">
                  Please note: You will have limited functionalities until your
                  bar license has been verified. To view updates on your
                  verification, please refer to your{" "}
                  <Link
                    href="/profile"
                    className="underline text-[#16305B] font-medium"
                  >
                    Profile
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/contact"
                    className="underline text-[#16305B] font-medium"
                  >
                    contact us
                  </Link>{" "}
                  directly.
                </div>
                <Link href="/attorney-portal" className="w-full">
                  <button className="w-full max-w-md bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition mx-auto">
                    Proceed to Attorney Portal
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
