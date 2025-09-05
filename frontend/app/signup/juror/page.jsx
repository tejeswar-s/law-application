"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function SignupFlow() {
  const [step, setStep] = useState(1);
  const [personalSubStep, setPersonalSubStep] = useState(1); // 1 or 2

  const handleNext = () => {
    // If on Personal Details (step 2), handle sub-step
    if (step === 2 && personalSubStep === 1) {
      setPersonalSubStep(2);
      return;
    }
    setPersonalSubStep(1); // reset for next time
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    // If on Personal Details (step 2) and substep 2, go back to substep 1
    if (step === 2 && personalSubStep === 2) {
      setPersonalSubStep(1);
      return;
    }
    setStep((prev) => Math.max(prev - 1, 1));
    setPersonalSubStep(1); // reset for previous step
  };

  return (
    <main className="min-h-screen flex bg-[#f9f7f2]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col bg-[#0A2342] text-white w-[300px] px-8 py-10">
        <div className="flex items-center gap-2 mb-8">
          <Image src="/images/logo.png" alt="Quick Verdicts Logo" width={36} height={36} />
          <span className="font-semibold text-lg tracking-tight">QUICK VERDICTS</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {step === 1 && "Criteria Verification"}
          {step === 2 && (personalSubStep === 1 ? "Personal Details (1/2)" : "Personal Details (2/2)")}
          {step === 3 && "Email & Password"}
          {step === 4 && "User Agreement"}
          {step === 5 && "Complete"}
        </h2>
        <p className="text-sm text-gray-200 leading-relaxed">
          Please fill out the following fields with the necessary information.
        </p>
      </aside>

      {/* Main Content */}
      <section className="flex-1 px-6 py-10 md:px-12 max-w-5xl w-full mx-auto">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-6">
          {step > 1 || (step === 2 && personalSubStep === 2) ? (
            <button
              onClick={handleBack}
              className="text-sm text-gray-600 hover:underline flex items-center gap-1"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <Link href="/signup" className="text-sm text-gray-600 hover:underline flex items-center gap-1">
              <ArrowLeft size={16} /> Back
            </Link>
          )}
          <div>
            <span className="text-sm text-gray-600 mr-4">Already have an account?</span>
            <Link href="/login">
              <button className="text-sm border border-gray-400 rounded-md px-4 py-1.5 hover:bg-gray-100">
                Log in
              </button>
            </Link>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
          {["Criteria Verification", "Personal Details", "Email & Password", "User Agreement", "Sign Up Complete"].map(
            (label, index) => {
              const stepIndex = index + 1;
              const isActive = step === stepIndex;
              const isCompleted = step > stepIndex;
              return (
                <div key={label} className="flex items-center gap-2 min-w-[140px]">
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      isActive
                        ? "border-[#0A2342]"
                        : isCompleted
                        ? "border-green-600 bg-green-600"
                        : "border-gray-400"
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full ${
                        isActive
                          ? "bg-white"
                          : isCompleted
                          ? "bg-white"
                          : "bg-[#f9f7f2]"
                      }`}
                    ></span>
                  </span>
                  <span
                    className={`leading-tight ${
                      isActive
                        ? "font-bold text-[#0A2342]"
                        : isCompleted
                        ? "font-medium text-green-600"
                        : "font-medium text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                  {stepIndex < 5 && <div className="flex-1 h-px bg-gray-300 mx-2" />}
                </div>
              );
            }
          )}
        </div>

        {/* Step Content */}
        <h1 className="text-3xl font-bold text-[#0A2342] mb-6">Sign Up</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
          className="space-y-6 max-w-2xl mx-auto pb-8"
        >
          {/* Step 1: Criteria Verification */}
          {step === 1 && (
            <>
              <Question label="Are you at least 18 years old?" name="age" />
              <Question label="Are you a citizen of the United States?" name="citizen" />
              <Question
                label="Do you or your spouse, parents, or children work for a law firm, an insurance company or a claims adjusting company?"
                name="work1"
              />
              <Question
                label="Have you, your spouse, parents or children worked for a law firm, an insurance company or a claims adjusting company within the past year?"
                name="work2"
              />
              <Question
                label="Have you been convicted of a felony or other disqualifying offense (and if so, has your right to serve been restored)?"
                name="felony"
              />
              <Question label="Are you currently under indictment or legal charges for a felony?" name="indictment" />
            </>
          )}

          {/* Step 2: Personal Details (1/2) */}
          {step === 2 && personalSubStep === 1 && (
            <>
              <Input label="First Name" required />
              <Input label="Last Name" required />
              <Input label="Law Firm Entity Name" required />
            </>
          )}

          {/* Step 2: Personal Details (2/2) */}
          {step === 2 && personalSubStep === 2 && (
            <>
              <Input label="Phone Number" required type="tel" />
              <Input label="State" required type="text" />
              <Input label="State Bar Number" required />
            </>
          )}

          {/* Step 3: Email & Password */}
          {step === 3 && (
            <>
              <Input label="Email" required type="email" />
              <Input label="Password" required type="password" />
              <Input label="Confirm Password" required type="password" />
            </>
          )}

          {/* Step 4: User Agreement */}
          {step === 4 && (
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-[#0A2342]" /> I agree to the Terms and Conditions
            </label>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <p className="text-lg text-green-600 font-semibold">🎉 Your registration is complete!</p>
          )}

          {/* Next Button */}
          {step < 5 && (
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#0A2342] text-white font-medium px-8 py-2 rounded-md hover:bg-[#132c54] transition"
              >
                Next
              </button>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}

/* Reusable Question Component */
function Question({ label, name }) {
  return (
    <div>
      <label className="block mb-2 text-base text-[#0A2342] font-medium">{label}</label>
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="yes" className="accent-[#0A2342]" /> Yes
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="no" className="accent-[#0A2342]" /> No
        </label>
      </div>
    </div>
  );
}

/* Reusable Input Component */
function Input({ label, required, type = "text" }) {
  return (
    <div>
      <label className="block mb-2 text-base text-[#0A2342] font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[#0A2342] outline-none text-[#0A2342] bg-white"
      />
    </div>
  );
}
