"use client";

import React, { useMemo, useState } from "react";
import type { FC, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";

/*
  All-in-one Juror Signup Flow - TSX
  - Place in: app/signup/juror/page.tsx
  - Make sure lucide-react is installed and the logo path /logo_sidebar_signup.png exists.
*/

const BLUE = "#0A2342";
const PAGE_BG = "#f9f7f2";
const BAND_YELLOW = "#EDE3B8"; // slightly darker yellow band (kept for parity)
const TICK_YELLOW = "#F6E27F";

type Step = 1 | 2 | 3 | 4 | 5;
type PersonalSubStep = 1 | 2;

type PD1 = {
  maritalStatus: string;
  spouseEmployer: string;
  employerName: string;
  employerAddress: string;
  yearsInCounty: string;
  ageRange: string;
  gender: string;
  education: string;
};

type PD2 = {
  name: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  county: string;
};

type PayMethod = "venmo" | "paypal" | "cashapp" | null;

type PwChecks = {
  hasLen: boolean;
  hasNum: boolean;
  notSameAsName: boolean;
  noTriple: boolean;
  hasUpper: boolean;
  hasSpecial: boolean;
  confirmMatch: boolean;
  all: boolean;
};

export default function SignupFlow(): JSX.Element {
  // steps
  const [step, setStep] = useState<Step>(1);
  const [personalSubStep, setPersonalSubStep] = useState<PersonalSubStep>(1);

  // Personal details (1/2) - placeholders only (start empty)
  const [pd1, setPd1] = useState<PD1>({
    maritalStatus: "",
    spouseEmployer: "",
    employerName: "",
    employerAddress: "",
    yearsInCounty: "",
    ageRange: "",
    gender: "",
    education: "",
  });

  // Personal details (2/2)
  const [pd2, setPd2] = useState<PD2>({
    name: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    county: "",
  });

  const [payMethod, setPayMethod] = useState<PayMethod>(null); // "venmo" | "paypal" | "cashapp"

  // credentials
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");

  // agreement
  const [agreed, setAgreed] = useState<boolean>(false);

  // password rule checks
  const pwChecks: PwChecks = useMemo(() => {
    const hasLen = password.length >= 8;
    const hasNum = /\d/.test(password);
    const notSameAsName =
      pd2.name.trim().length > 0 ? password.toLowerCase() !== pd2.name.trim().toLowerCase() : true;
    const noTriple = !/(.)\1\1/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*()[\]{};:'",.<>/?\\|`~_\-+=]/.test(password);
    const confirmMatch = confirm === password && password.length > 0;

    return {
      hasLen,
      hasNum,
      notSameAsName,
      noTriple,
      hasUpper,
      hasSpecial,
      confirmMatch,
      all:
        hasLen && hasNum && notSameAsName && noTriple && hasUpper && hasSpecial && confirmMatch,
    } as PwChecks;
  }, [password, confirm, pd2.name]);

  // gating logic for enabling Next
  const canProceed: boolean = (() => {
    if (step === 1) return true; // criteria step just moves ahead
    if (step === 2 && personalSubStep === 1) return true; // sub-step 1 has optional fields
    if (step === 2 && personalSubStep === 2) {
      // required: name, phone, address1, city, state, zip, county, payment method
      return (
        Boolean(pd2.name.trim()) &&
        Boolean(pd2.phone.trim()) &&
        Boolean(pd2.address1.trim()) &&
        Boolean(pd2.city.trim()) &&
        Boolean(pd2.state.trim()) &&
        Boolean(pd2.zip.trim()) &&
        Boolean(pd2.county.trim()) &&
        Boolean(payMethod)
      );
    }
    if (step === 3) return pwChecks.all && Boolean(email.trim());
    if (step === 4) return agreed;
    return true;
  })();

  const goNext = (): void => {
    if (!canProceed) return;
    if (step === 2 && personalSubStep === 1) {
      setPersonalSubStep(2);
      return;
    }
    setPersonalSubStep(1);
    setStep((s) => (Math.min(s + 1, 5) as Step));
  };

  const goBack = (): void => {
    if (step === 2 && personalSubStep === 2) {
      setPersonalSubStep(1);
      return;
    }
    setStep((s) => (Math.max(s - 1, 1) as Step));
    setPersonalSubStep(1);
  };

  // Step labels
  const stepLabels: string[] = [
    "Criteria Verification",
    "Personal Details",
    "Email & Password Set Up",
    "User Agreement",
    "Sign Up Complete",
  ];

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    goNext();
  };

  return (
    <main style={{ backgroundColor: PAGE_BG }} className="min-h-screen flex font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[300px]">
        <div className="flex-1 text-white bg-[#0A2342] relative">
          {/* Full-width Logo Plate */}
          <div className="absolute top-15 left-0 w-full">
            <Image
              src="/logo_sidebar_signup.png"
              alt="Quick Verdicts Logo"
              width={300}
              height={120}
              className="w-full object-cover"
              priority
            />
          </div>

          {/* Content Section */}
          <div className="px-8 py-8 mt-44">
            <h2 className="text-xl font-semibold mb-4">
              {step === 1 && "Criteria Verification"}
              {step === 2 && (personalSubStep === 1 ? "Personal Details (1/2)" : "Personal Details (2/2)")}
              {step === 3 && "Email & Password Set Up"}
              {step === 4 && "User Agreement"}
              {step === 5 && "Sign Up Complete"}
            </h2>

            {/* Dynamic text content */}
            <div className="text-sm leading-relaxed text-blue-100 space-y-3">
              {step === 1 && (
                <p>Please fill out the following fields with the necessary information.</p>
              )}

              {step === 2 && personalSubStep === 1 && (
                <p>Please fill out the following fields with necessary information.</p>
              )}

              {step === 2 && personalSubStep === 2 && (
                <>
                  <p>Please fill out the following fields with necessary information.</p>
                  <p className="mt-3">Any field with * is required.</p>
                </>
              )}

              {step === 3 && (
                <>
                  <p>Create your login information in order to re-enter the platform.</p>
                  <p>Your password must meet the listed minimum requirements.</p>
                  <p>Re-typed password must match with the first password you have chosen.</p>
                </>
              )}

              {step === 4 && (
                <p>In order to proceed, you must agree to the terms outlined below.</p>
              )}

              {step === 5 && (
                <>
                  <p>Welcome to Quick Verdicts.</p>
                  <p>Your account has been created successfully.</p>
                  <p>Please note: you will have limited functionalities until your bar license has been verified.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 px-6 py-10 md:px-12 max-w-6xl w-full mx-auto">
        {/* Top row: back + login */}
        <div className="flex justify-between items-center mb-6">
          {step > 1 || (step === 2 && personalSubStep === 2) ? (
            <button onClick={goBack} className="text-sm text-gray-600 hover:underline flex items-center gap-1">
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
              <button className="text-sm border border-gray-400 rounded-md px-4 py-1.5 hover:bg-gray-100">Log in</button>
            </Link>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 mx-auto" style={{ maxWidth: "980px" }}>
          {stepLabels.map((label, idx) => {
            const i = (idx + 1) as Step;
            const isActive = step === i;
            const isCompleted = step > i || (i === 5 && step === 5); // last step appears completed once reached
            return (
              <div key={label} className="flex items-center flex-1 min-w-0">
                {/* Circle */}
                <div
                  className={`flex items-center justify-center rounded-full border-2`}
                  style={{
                    width: 20,
                    height: 20,
                    minWidth: 20,
                    borderColor: isCompleted ? BLUE : "#c5cbd1", // blue for completed, gray for others
                    backgroundColor: isCompleted ? BLUE : "white",
                    borderWidth: 2,
                    boxSizing: "content-box",
                  }}
                >
                  {isCompleted ? (
                    <Check size={14} color={TICK_YELLOW} />
                  ) : (
                    // empty circle (active and future)
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 9999,
                        backgroundColor: "transparent",
                        display: "inline-block",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="ml-3 truncate">
                  <div
                    className={`text-sm truncate ${isActive ? "font-semibold" : "font-medium"}`}
                    style={{
                      color: isActive ? BLUE : "#9aa3ad",
                      fontSize: isActive ? 14 : 13,
                      lineHeight: 1,
                    }}
                  >
                    {label}
                  </div>
                </div>

                {/* Connector */}
                {i < (stepLabels.length as Step) && (
                  <div
                    className="flex-1"
                    style={{
                      height: 1,
                      marginLeft: 16,
                      marginRight: 12,
                      background:
                        // show light gray line for all; keep subtle
                        "linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.04))",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Page title */}
        <h1 className="text-3xl font-bold mb-6" style={{ color: BLUE }}>
          Sign Up: Juror
        </h1>

        {/* Form body */}
        <form onSubmit={onSubmit} className="space-y-6 max-w-3xl mx-auto pb-8">
          {/* Step 1 - Criteria */}
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

          {/* Step 2 - Personal Details (1/2) */}
          {step === 2 && personalSubStep === 1 && (
            <>
              <Select
                label="Marital Status"
                placeholder="Select marital status"
                value={pd1.maritalStatus}
                onChange={(val) => setPd1((s) => ({ ...s, maritalStatus: val }))}
                options={["Single", "Married", "Divorced", "Widowed", "Prefer not to say"]}
              />
              <Input
                label="Spouse Employer Name"
                placeholder="Dallas Marketing Services"
                value={pd1.spouseEmployer}
                onChange={(val) => setPd1((s) => ({ ...s, spouseEmployer: val }))}
              />
              <Input
                label="Employer Name"
                placeholder="Lone Star Innovations LLC"
                value={pd1.employerName}
                onChange={(val) => setPd1((s) => ({ ...s, employerName: val }))}
              />
              <Input
                label="Employer Address"
                placeholder="1425 Mockingbird Plaza, Suite 320 Dallas, TX 75247"
                value={pd1.employerAddress}
                onChange={(val) => setPd1((s) => ({ ...s, employerAddress: val }))}
              />
              <Select
                label="Years in county"
                placeholder="Select years in county"
                value={pd1.yearsInCounty}
                onChange={(val) => setPd1((s) => ({ ...s, yearsInCounty: val }))}
                options={["One", "Two", "Three", "Four", "Five", "Six or more"]}
              />
              <Select
                label="Age range"
                placeholder="Select age range"
                value={pd1.ageRange}
                onChange={(val) => setPd1((s) => ({ ...s, ageRange: val }))}
                options={["18-24", "25-29", "30-39", "40-49", "50-59", "60+"]}
              />
              <Select
                label="Gender"
                placeholder="Select gender"
                value={pd1.gender}
                onChange={(val) => setPd1((s) => ({ ...s, gender: val }))}
                options={["Male", "Female", "Other", "Prefer not to say"]}
              />
              <Select
                label="Highest-level of education"
                placeholder="Select education level"
                value={pd1.education}
                onChange={(val) => setPd1((s) => ({ ...s, education: val }))}
                options={[
                  "High School",
                  "Associate's Degree",
                  "Bachelor's Degree",
                  "Master's Degree",
                  "Doctorate",
                ]}
              />
            </>
          )}

          {/* Step 2 - Personal Details (2/2) */}
          {step === 2 && personalSubStep === 2 && (
            <>
              <Input
                label="Name"
                required
                placeholder="John Doe"
                value={pd2.name}
                onChange={(val) => setPd2((s) => ({ ...s, name: val }))}
              />

              <Input
                label="Phone"
                required
                placeholder="832-674-8776"
                value={pd2.phone}
                onChange={(val) => setPd2((s) => ({ ...s, phone: val }))}
              />

              <Input
                label="Address Line 1"
                required
                placeholder="7423 Maple Hollow Dr"
                value={pd2.address1}
                onChange={(val) => setPd2((s) => ({ ...s, address1: val }))}
              />

              <Input
                label="Address Line 2"
                placeholder="Apt, Suite, etc. (optional)"
                value={pd2.address2}
                onChange={(val) => setPd2((s) => ({ ...s, address2: val }))}
              />

              {/* City / State / Zip in one row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  required
                  placeholder="Dallas"
                  value={pd2.city}
                  onChange={(val) => setPd2((s) => ({ ...s, city: val }))}
                />
                <Input
                  label="State"
                  required
                  placeholder="TX"
                  value={pd2.state}
                  onChange={(val) =>
                    setPd2((s) => ({ ...s, state: val.toUpperCase().slice(0, 2) }))
                  }
                />
                <Input
                  label="Zip"
                  required
                  placeholder="75123"
                  value={pd2.zip}
                  onChange={(val) => setPd2((s) => ({ ...s, zip: val }))}
                />
              </div>

              <Input
                label="County"
                required
                placeholder="Dallas County"
                value={pd2.county}
                onChange={(val) => setPd2((s) => ({ ...s, county: val }))}
              />

              {/* Payment method buttons */}
              <div>
                <label className="block mb-2 text-base font-medium" style={{ color: BLUE }}>
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <PaymentMethodButton
                    label="Venmo"
                    selected={payMethod === "venmo"}
                    onClick={() => setPayMethod("venmo")}
                  />
                  <PaymentMethodButton
                    label="PayPal"
                    selected={payMethod === "paypal"}
                    onClick={() => setPayMethod("paypal")}
                  />
                  <PaymentMethodButton
                    label="Cash App"
                    selected={payMethod === "cashapp"}
                    onClick={() => setPayMethod("cashapp")}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3 - Email & Password Set Up */}
          {step === 3 && (
            <>
              <Input
                label="Email"
                required
                type="email"
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(val) => setEmail(val)}
              />

              <Input
                label="Password"
                required
                type="password"
                placeholder=""
                value={password}
                onChange={(val) => setPassword(val)}
              />

              {/* Password rules reactive checklist */}
              <div className="mt-2">
                <Checklist
                  items={[
                    { ok: pwChecks.hasLen, text: "Be at least 8 characters" },
                    { ok: pwChecks.hasNum, text: "Have at least 1 number" },
                    { ok: pwChecks.notSameAsName, text: "Not be the same as the account name" },
                    {
                      ok: pwChecks.noTriple,
                      text: "Your password must not contain more than 2 consecutive identical characters",
                    },
                    { ok: pwChecks.hasUpper, text: "Have at least 1 capital letter" },
                    { ok: pwChecks.hasSpecial, text: "Have at least 1 special character" },
                  ]}
                />
              </div>

              <Input
                label="Re-type Password"
                required
                type="password"
                placeholder=""
                value={confirm}
                onChange={(val) => setConfirm(val)}
              />

              {/* confirm match */}
              <div className="mt-2">
                <Checklist items={[{ ok: pwChecks.confirmMatch, text: "Re-typed password must match" }]} />
              </div>
            </>
          )}

          {/* Step 4 - User Agreement */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-semibold mb-3" style={{ color: BLUE }}>
                Juror User Agreement for Quick Verdicts
              </h2>

              <div className="max-h-64 overflow-y-auto p-4 border rounded-md bg-white text-sm text-gray-800 leading-relaxed">
                {/* Placeholder long agreement text */}
                <p>Effective Date: [Insert Date]</p>

                <p className="mt-3">
                  Welcome to QuickVerdicts. This Juror User Agreement ("Agreement") governs your use of
                  our virtual platform. By registering or using QuickVerdicts as a juror, you agree to
                  the following terms and conditions.
                </p>

                <p className="mt-3 font-medium">1. Eligibility and Verification</p>
                <ul className="list-disc pl-6">
                  <li>You must provide accurate and current verification information.</li>
                  <li>Verification steps may be required before you can access full features.</li>
                </ul>

                <p className="mt-3 font-medium">2. Use of the Platform</p>
                <ul className="list-disc pl-6">
                  <li>Use QuickVerdicts only for legitimate purposes and follow platform guidance.</li>
                  <li>Respect privacy and confidentiality of case materials.</li>
                </ul>

                <p className="mt-3 font-medium">3. Conduct</p>
                <ul className="list-disc pl-6">
                  <li>Maintain professional conduct. Do not harass or disrupt proceedings.</li>
                </ul>

                <p className="mt-3">[More terms... you can replace with the actual text later]</p>
              </div>

              <label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  className="accent-[#0A2342]"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                I agree to the Juror User Agreement.
              </label>
            </div>
          )}

          {/* Step 5 - Complete */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold" style={{ color: BLUE }}>
                Account Creation Successful
              </h2>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={20} color="white" />
                </div>
                <div>
                  <p className="text-base font-medium" style={{ color: BLUE }}>
                    Your Account has been created successfully.
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 max-w-2xl">
                Please note: You will have limited functionalities until your bar license has been verified.
                To view updates on your application, please refer to your <span className="underline">Profile</span> or{" "}
                <span className="underline">contact us</span> directly.
              </p>

              <Link href="/juror/portal">
                <button className="mt-2 px-6 py-2 bg-[#0A2342] text-white rounded-md hover:bg-[#132c54]">
                  Proceed to Juror Portal
                </button>
              </Link>
            </div>
          )}

          {/* Bottom action */}
          {step < 5 && (
            <div className="pt-4">
              <button
                type="submit"
                disabled={!canProceed}
                className={`w-full text-white font-medium px-8 py-2 rounded-md transition ${
                  canProceed ? "bg-[#0A2342] hover:bg-[#132c54]" : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {step === 4 ? "Agree and Create Account" : "Next"}
              </button>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}

/* -------------------- Small Reusable UI parts (TSX) -------------------- */

interface QuestionProps {
  label: string;
  name: string;
}

const Question: FC<QuestionProps> = ({ label, name }) => {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-base font-medium" style={{ color: BLUE }}>
        {label}
      </label>
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="yes" className="accent-[#0A2342]" /> <span>Yes</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={name} value="no" className="accent-[#0A2342]" /> <span>No</span>
        </label>
      </div>
    </div>
  );
};

interface InputProps {
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
}

const Input: FC<InputProps> = ({ label, required, type = "text", placeholder = "", value = "", onChange }) => {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-base font-medium" style={{ color: BLUE }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[#0A2342] outline-none text-[#0A2342] bg-white placeholder-gray-400"
      />
    </div>
  );
};

interface SelectProps {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  options?: string[];
  placeholder?: string;
}

const Select: FC<SelectProps> = ({ label, value, onChange = () => {}, options = [], placeholder = "" }) => {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-base font-medium" style={{ color: BLUE }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-4 py-2 text-[#0A2342] bg-white focus:ring-2 focus:ring-[#0A2342] outline-none"
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
};

interface PaymentMethodButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const PaymentMethodButton: FC<PaymentMethodButtonProps> = ({ label, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border rounded-md px-4 py-2 text-left transition ${
        selected ? "border-[#0A2342] ring-2 ring-[#0A2342]" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-6 h-6 rounded-full border flex items-center justify-center ${
            selected ? "bg-[#0A2342] border-[#0A2342]" : "bg-white border-gray-300"
          }`}
        >
          {selected && <Check size={14} color={TICK_YELLOW} />}
        </div>
        <div className="text-[#0A2342] font-medium">{label}</div>
      </div>
    </button>
  );
};

interface ChecklistItem {
  ok: boolean;
  text: string;
}

const Checklist: FC<{ items: ChecklistItem[] }> = ({ items }) => {
  return (
    <ul className="text-sm space-y-2">
      {items.map((it, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <div
            className={`mt-1 inline-flex items-center justify-center w-5 h-5 rounded-sm border ${
              it.ok ? "bg-[#0A2342] border-[#0A2342]" : "bg-white border-gray-300"
            }`}
          >
            {it.ok && <Check size={14} color={it.ok ? TICK_YELLOW : "transparent"} />}
          </div>
          <div className="text-gray-700">{it.text}</div>
        </li>
      ))}
    </ul>
  );
};
