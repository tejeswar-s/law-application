"use client";

export const ssr = false;

import React, { Suspense } from 'react';
import { useState, useEffect, useRef } from "react";
// import { states, countiesByState, citiesByCounty } from "./data/usLocations";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function AttorneySignupInner() {
  useEffect(() => {
    console.log("AttorneySignup component mounted — current step:", step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main form state
  const [form, setForm] = useState({
    isAttorney: false,
    firstName: "",
    middleName: "",
    lastName: "",
    lawFirmName: "",
    phoneNumber: "",
    state: "",        // label, e.g. "California" (what backend expects)
    stateCode: "",    // code, e.g. "06" (for census API)
    stateBarNumber: "",
    officeAddress1: "",
    officeAddress2: "",
    county: "",       // label, e.g. "Alpine County, California"
    countyCode: "",
    city: "",         // label, e.g. "Home Garden CDP, California"
    cityCode: "",
    addressState:"",
    zipCode: "",
    email: "",
    password: "",
    confirmPassword: "",
    userAgreementAccepted: false,
    verificationToken: "",
  });

  // Stepper state
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const steps = [
    "Personal Details",
    "Registered Address",
    "Email & Password",
    "User Agreement",
    "Success!",
  ];
  
  // UI/validation state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasCapital: false,
    hasSpecial: false,
    noConsecutive: false,
    notAccountName: true,
  });
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const agreementScrollRef = useRef<HTMLDivElement>(null);

  // Dropdown state
  const [availableStates, setAvailableStates] = useState<{ label: string; value: string }[]>([]);
  const [availableCounties, setAvailableCounties] = useState<{ label: string; value: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<{ label: string; value: string }[]>([]);
  // Fetch all US states from Census API on mount
  useEffect(() => {
    async function fetchStates() {
      try {
        const res = await fetch(`https://api.census.gov/data/2020/dec/pl?get=NAME&for=state:*`);
        const data = await res.json();
        // Remove header row and map to label/value
        setAvailableStates(data.slice(1).map((row: [string, string]) => {
          const [name, code] = row;
          return { label: name, value: code };
        }));
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    }
    fetchStates();
  }, []);
  const [stateSearch, setStateSearch] = useState("");
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [countySearch, setCountySearch] = useState("");
  const [countyDropdownOpen, setCountyDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Dynamic dropdown logic
  // Fetch counties for selected state
  useEffect(() => {
    async function fetchCounties() {
      if (form.stateCode) {
        try {
          // Census API: state FIPS code is two digits, pad if needed
          const stateCode = form.stateCode.padStart(2, '0');
          const res = await fetch(`https://api.census.gov/data/2020/dec/pl?get=NAME&for=county:*&in=state:${stateCode}`);
          const data = await res.json();
          setAvailableCounties(data.slice(1).map((row: [string, string, string]) => {
            const [name, , countyCode] = row;
            return { label: name, value: countyCode };
          }));
        } catch (error) {
          console.error('Error fetching counties:', error);
          setAvailableCounties([]);
        }
      } else {
        setAvailableCounties([]);
      }
      setAvailableCities([]);
      setForm(prev => ({ ...prev, county: "", countyCode: "", city: "", cityCode: "" }));
    }
    fetchCounties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.stateCode]);
  
  // Fetch cities for selected county
  useEffect(() => {
    async function fetchCities() {
      if (form.stateCode && form.countyCode) {
        try {
          const stateCode = form.stateCode.padStart(2, '0');
          const res = await fetch(`https://api.census.gov/data/2020/dec/pl?get=NAME&for=place:*&in=state:${stateCode}`);
          const data = await res.json();
          setAvailableCities(data.slice(1).map((row: [string, string, string]) => {
            const [name, , placeCode] = row;
            return { label: name, value: placeCode };
          }));
        } catch (error) {
          console.error('Error fetching cities:', error);
          setAvailableCities([]);
        }
      } else {
        setAvailableCities([]);
      }
      setForm(prev => ({ ...prev, city: "", cityCode: "" }));
    }
    fetchCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.countyCode]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    // NOTE: dropdowns set label/code directly via onMouseDown.
    // Do not block handleChange — allow text inputs and checkboxes to update form.
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name] : ""
      }));
    }
  }
  // Validation functions
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!form.isAttorney) {
      errors.isAttorney = "You must confirm you are the attorney registering";
    }
    if (!form.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!form.lawFirmName.trim()) {
      errors.lawFirmName = "Law firm entity name is required";
    }
    if (!form.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    }
    if (!form.state) {
      errors.state = "State is required";
    }
    if (!form.stateBarNumber.trim()) {
      errors.stateBarNumber = "State bar number is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    
    if (!form.officeAddress1.trim()) {
      errors.officeAddress1 = "Office address 1 is required";
    }
    if (!form.county) {
      errors.county = "County is required";
    }
    if (!form.city) {
      errors.city = "City is required";
    }
    if (!form.zipCode.trim()) {
      errors.zipCode = "ZIP code is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!form.password) {
      errors.password = "Password is required";
    } else if (!Object.values(passwordValidation).every(Boolean)) {
      errors.password = "Password does not meet all requirements";
    }
    
    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = () => {
    const errors: Record<string, string> = {};
    
    if (!hasScrolledToBottom) {
      errors.scroll = "Please scroll to the bottom to read the complete agreement";
    }
    if (!form.userAgreementAccepted) {
      errors.userAgreementAccepted = "You must agree to the user agreement";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle scroll in user agreement
  const handleAgreementScroll = () => {
    const element = agreementScrollRef.current;
    if (element) {
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 5;
      setHasScrolledToBottom(isAtBottom);
    }
  };

  // Next step with validation
  const nextStep = async () => {
    setError(null);
    let isValid = false;

    console.log("nextStep() called — step:", step);
    console.log("form snapshot:", JSON.stringify(form, null, 2));
    
    // Validate current step
    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      default:
        isValid = true;
    }

    if (!isValid) {
      console.log("Validation failed:", validationErrors);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // On last step, submit
    if (step === totalSteps - 1) {
      setLoading(true);
      try {
        // Build payload that matches backend expectations (labels)
        const stateLabel = form.stateCode ? (availableStates.find(s => s.value === form.stateCode)?.label ?? form.state) : form.state;
        const countyLabel = form.countyCode ? (availableCounties.find(c => c.value === form.countyCode)?.label ?? form.county) : form.county;
        const cityLabel = form.cityCode ? (availableCities.find(c => c.value === form.cityCode)?.label ?? form.city) : form.city;
        
        const payloadObj = {
          ...form,
          state: stateLabel,
          county: countyLabel,
          city: cityLabel,
          addressState: stateLabel || form.addressState,
        };
        // remove internal code props so backend receives clean payload
        delete (payloadObj as any).stateCode;
        delete (payloadObj as any).countyCode;
        delete (payloadObj as any).cityCode;
        
        const payload = JSON.stringify(payloadObj);
        console.log("Submitting attorney signup payload:", payload);
        const res = await fetch(`${API_BASE}/api/auth/attorney/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        const text = await res.text();
        console.log("Fetch returned status:", res.status, "response:", text);
        if (!res.ok) {
          let data;
          try { data = JSON.parse(text); } catch (e) { data = text; }
          console.log("Signup error response body:", data);
          setError((data && data.message) || "Signup failed");
          setLoading(false);
          return;
        }
         // success -> clear draft and go to success step
         try { localStorage.removeItem("attorneySignupDraft"); } catch (e) { /* ignore */ }
         setStep(step + 1);
       } catch (err) {
         console.error("Network/fetch error in nextStep:", err);
         setError("Network error");
         setLoading(false);
       }
     } else if (step === 3) {
      console.log("Sending verification email for:", form.email);
      // For step 3, send verification email and move to step 4 (like juror flow)
      try {
        setLoading(true);
        // persist draft so we can restore when user clicks the verification link
        try { localStorage.setItem("attorneySignupDraft", JSON.stringify(form)); } catch (e) { /* ignore */ }
        const verificationPayload = { email: form.email };
        console.log("Verification payload:", JSON.stringify(verificationPayload));
        const res = await fetch(`${API_BASE}/api/auth/attorney/send-email-verification`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(verificationPayload),
         });
        console.log("Verification fetch status:", res.status);
        // Advance regardless of preview/delivery; duplicate email will be handled by server if 409
        if (res.status === 409) {
          const data = await res.json();
          setValidationErrors(prev => ({ ...prev, email: data.message || "Email already in use" }));
          setLoading(false);
          return;
        }
        setStep(step + 1);
      } catch (err) {
        console.error("send-email-verification error:", err);
        setError("Failed to send verification email. Try again.");
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  // Previous step
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setValidationErrors({});
    }
  };

  // Get today's date for the agreement
  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const [authSubStep, setAuthSubStep] = useState(1);
  const searchParams = useSearchParams();
  const draftRef = useRef<any>(null);

  useEffect(() => {
    const verifyToken = searchParams.get("verifyToken");
    if (!verifyToken) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-email-token?token=${encodeURIComponent(verifyToken)}`);
        const data = await res.json();
        if (data.ok) {
          let draft = {};
          try {
            const raw = localStorage.getItem("attorneySignupDraft");
            if (raw) draft = JSON.parse(raw);
          } catch (e) { /* ignore parse error */ }
          draftRef.current = draft;

          setForm(prev => ({
            ...prev,
            ...draft,
            verificationToken: verifyToken,
            email: (data.email || (draft as any).email || prev.email),
          }));

          if ((draft as any).stateCode) setTimeout(() => setForm(f => ({ ...f, stateCode: (draft as any).stateCode })), 0);
          if ((draft as any).countyCode) setTimeout(() => setForm(f => ({ ...f, countyCode: (draft as any).countyCode })), 0);

          setAuthSubStep(2);
          setStep(4);
        }
      } catch (e) {}
    })();
   }, [searchParams]);

  // Restore county/city after dropdowns are loaded
  useEffect(() => {
    if (authSubStep === 2 && draftRef.current?.county && availableCounties.length > 0) {
      setForm(f => ({
        ...f,
        county: draftRef.current.county,
        countyCode: draftRef.current.countyCode,
      }));
    }
  }, [authSubStep, availableCounties]);

  useEffect(() => {
    if (authSubStep === 2 && draftRef.current?.city && availableCities.length > 0) {
      setForm(f => ({
        ...f,
        city: draftRef.current.city,
        cityCode: draftRef.current.cityCode,
      }));
    }
  }, [authSubStep, availableCities]);

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[265px]">
        <div className="flex-1 text-white bg-[#16305B] relative">
          {/* Full-width Logo Plate */}
          <div className="absolute top-15 left-0 w-full">
            <Link href={"/"}>
              <Image
                src="/logo_sidebar_signup.png"
                alt="Quick Verdicts Logo"
                width={300}
                height={120}
                className="w-full object-cover"
                priority
              />
            </Link>
          </div>

          {/* Content Section */}
          <div className="px-8 py-8 mt-30">
            <h2 className="text-3xl font-medium mb-4">Sign Up: <br />Attorney</h2>

            {/* Dynamic text content */}
            <div className="text-sm leading-relaxed text-blue-100 space-y-3">
              {/* Step 1 and Step 2 */}
              {(step === 1 || step === 2) && (
                <>
                  <p>Please fill out the following fields with the necessary information.</p>
                  <p>Any with * is required.</p>
                </>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <>
                  <p>Please fill out the following fields with the necessary information.</p>
                  <p>Any field with a star is required, and the same goes for the registered address.</p>
                  <p>Your password must meet the listed minimum requirements.</p>
                  <p>Retyped password must match with the first password you have chosen.</p>
                </>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <>
                  <p>
                    Please read the user agreement and agree to sign up and create an account on Quick Verdict.
                  </p>
                </>
              )}

              {/* Step 5 */}
              {step === 5 && (
                <>
                  <p>Welcome to Quick Verdicts!</p>
                  <p>Your account has been created successfully.</p>
                  <p>
                    Please note: you will have limited functionalities until your bar license has been verified.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        {/* Container for Top Row + Stepper */}
        <div className="w-full max-w-6xl mx-auto px-20">
          {/* Top Row */}
          <div className="flex items-center justify-between pt-8 pb-8 px-8">
            <div className="flex items-center gap-2">
              <button
                onClick={prevStep}
                className="text-[#16305B] text-base flex items-center gap-2 hover:underline"
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
          <div className="flex items-center justify-between px-8 pb-8">
            {steps.map((label, idx) => {
              const isActive = step === idx + 1;
              const isCompleted = step > idx + 1;

              return (
                <div key={label} className="flex items-center flex-1">
                  {/* Circle + Label side by side */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
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
                    </div>

                    <span
                      className={`text-xs leading-tight max-w-[90px] ${
                        isActive
                          ? "text-[#16305B] font-semibold"
                          : isCompleted
                          ? "text-[#16305B]"
                          : "text-[#bfc6d1]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Connector line with equal spacing */}
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-[1px] bg-[#bfc6d1] ml-4 mr-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 1 (Personal Details) */}
        {step === 1 && (
          <div className="flex-1 flex flex-col pl-28">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Sign Up: Attorney
              </h1>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Checkbox */}
                <div>
                  <label className="block mb-2 text-[#16305B] font-medium">
                    Who is signing up? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      name="isAttorney"
                      checked={!!form.isAttorney}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#16305B]"
                    />
                    <span className="text-[#16305B] text-sm">
                      I confirm I am the attorney registering.
                    </span>
                  </div>
                  {validationErrors.isAttorney && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.isAttorney}</p>
                  )}
                </div>

                {/* First Name */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                  )}
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={form.middleName}
                    onChange={handleChange}
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
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                  )}
                </div>

                {/* Law Firm */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Law Firm Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lawFirmName"
                    value={form.lawFirmName}
                    onChange={handleChange}
                    placeholder="Law Firm Entity Name"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.lawFirmName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.lawFirmName}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="(000) 000-0000"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    State <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for your state"
                      className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B] mb-2"
                      value={stateSearch}
                      onChange={e => {
                        setStateSearch(e.target.value);
                        setStateDropdownOpen(true);
                      }}
                      onFocus={() => setStateDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setStateDropdownOpen(false), 100)}
                      autoComplete="off"
                      readOnly={false}
                    />
                    {stateDropdownOpen && (
                      <div className="absolute z-10 w-full bg-white border border-[#bfc6d1] rounded-md shadow max-h-60 overflow-y-auto">
                        {availableStates
                          .filter(s => s.label.toLowerCase().includes(stateSearch.toLowerCase()))
                          .map((state) => (
                            <div
                              key={state.value}
                              className={`px-4 py-2 cursor-pointer hover:bg-[#f3f6fa] ${form.state === state.label ? 'bg-[#e6ecf5] font-semibold' : ''}`}
                              onMouseDown={() => {
                                setForm(prev => ({ 
                                  ...prev, 
                                  state: state.label,       // label sent to backend
                                  stateCode: state.value,   // code used for fetching counties
                                  addressState: state.label
                                }));
                                setStateSearch(state.label);
                                setStateDropdownOpen(false);
                              }}
                            >
                              {state.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {validationErrors.state && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                  )}
                </div>

                {/* State Bar */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    State Bar Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="stateBarNumber"
                    value={form.stateBarNumber}
                    onChange={handleChange}
                    placeholder="State Bar Number"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.stateBarNumber && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.stateBarNumber}</p>
                  )}
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

        {/* Section 2 (Registered Address Form) */}
        {step === 2 && (
          <div className="flex-1 flex flex-col pl-28">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Sign Up: Attorney
              </h1>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Office Address 1 */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Office Address 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="officeAddress1"
                    value={form.officeAddress1}
                    onChange={handleChange}
                    placeholder="Office Address 1"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.officeAddress1 && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.officeAddress1}</p>
                  )}
                </div>

                {/* Office Address 2 */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Office Address 2
                  </label>
                  <input
                    type="text"
                    name="officeAddress2"
                    value={form.officeAddress2}
                    onChange={handleChange}
                    placeholder="Office Address 2"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                </div>

                {/* County (Searchable Dropdown) */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    County <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for your county"
                      className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md mb-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                      value={countySearch}
                      onChange={e => {
                        setCountySearch(e.target.value);
                        setCountyDropdownOpen(true);
                      }}
                      autoComplete="off"
                      disabled={!form.state}
                      onFocus={e => {
                        e.target.select();
                        setCountyDropdownOpen(true);
                      }}
                      onBlur={() => setTimeout(() => setCountyDropdownOpen(false), 100)}
                      readOnly={!form.state}
                    />
                    {form.stateCode && countyDropdownOpen && (
                      <div className="absolute z-10 w-full bg-white border border-[#bfc6d1] rounded-md shadow max-h-60 overflow-y-auto">
                        {availableCounties
                          .filter(c => c.label.toLowerCase().includes(countySearch.toLowerCase()))
                          .slice(0, 10)
                          .map(c => (
                            <div
                              key={c.value}
                              className={`px-4 py-2 cursor-pointer hover:bg-[#f3f6fa] ${form.county === c.label ? 'bg-[#e6ecf5] font-semibold' : ''}`}
                              onMouseDown={() => {
                                setForm(prev => ({ ...prev, county: c.label, countyCode: c.value }));
                                setCountySearch(c.label);
                                setCountyDropdownOpen(false);
                              }}
                            >
                              {c.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {validationErrors.county && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.county}</p>
                  )}
                </div>

                {/* City (Searchable Dropdown) */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for your city"
                      className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md mb-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                      value={citySearch}
                      onChange={e => {
                        setCitySearch(e.target.value);
                        setCityDropdownOpen(true);
                      }}
                      autoComplete="off"
                      disabled={!form.county}
                      onFocus={e => {
                        e.target.select();
                        setCityDropdownOpen(true);
                      }}
                      onBlur={() => setTimeout(() => setCityDropdownOpen(false), 100)}
                      readOnly={!form.county}
                    />
                    {form.county && cityDropdownOpen && (
                      <div className="absolute z-10 w-full bg-white border border-[#bfc6d1] rounded-md shadow max-h-60 overflow-y-auto">
                        {availableCities
                          .filter(ct => ct.label.toLowerCase().includes(citySearch.toLowerCase()))
                          .slice(0, 10)
                          .map(ct => (
                            <div
                              key={ct.value}
                              className={`px-4 py-2 cursor-pointer hover:bg-[#f3f6fa] ${form.city === ct.label ? 'bg-[#e6ecf5] font-semibold' : ''}`}
                              onMouseDown={() => {
                                setForm(prev => ({ ...prev, city: ct.label, cityCode: ct.value }));
                                setCitySearch(ct.label);
                                setCityDropdownOpen(false);
                              }}
                            >
                              {ct.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {validationErrors.city && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                  )}
                </div>

                {/* Zip */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={form.zipCode}
                    onChange={handleChange}
                    placeholder="ZIP Code"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.zipCode && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.zipCode}</p>
                  )}
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
          <div className="flex-1 flex flex-col pl-28">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Sign Up: Attorney
              </h1>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Email */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={e => {
                      handleChange(e);
                      // Trigger password validation live
                      const password = e.target.value;
                      const minLength = password.length >= 8;
                      const hasNumber = /\d/.test(password);
                      const hasCapital = /[A-Z]/.test(password);
                      const hasSpecial = /[!@#$\.\-\+,;]/.test(password);
                      const noConsecutive = !/(.)\\1{2,}/.test(password);
                      const notAccountName =
                        !!password &&
                        ![form.firstName, form.lastName, form.email].some(
                          (n) => n && password.toLowerCase().includes(n.toLowerCase())
                        );
                      setPasswordValidation({
                        minLength,
                        hasNumber,
                        hasCapital,
                        hasSpecial,
                        noConsecutive,
                        notAccountName,
                      });
                    }}
                    placeholder="Password"
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                  )}

                  {/* Password Rules */}
                  <div className="mt-2 space-y-1 text-[14px] text-[#16305B]">
                    {[
                      { key: "minLength", text: "Be at least 8 characters", valid: passwordValidation.minLength },
                      { key: "hasNumber", text: "Have at least one number", valid: passwordValidation.hasNumber },
                      { key: "notAccountName", text: "Not be the same as the account name", valid: passwordValidation.notAccountName },
                      { key: "noConsecutive", text: "Your password must not contain more than 2 consecutive identical characters", valid: passwordValidation.noConsecutive },
                      { key: "hasCapital", text: "Have at least one capital letter", valid: passwordValidation.hasCapital },
                      { key: "hasSpecial", text: "Have at least one special character (! @ # $ . – + , ;)", valid: passwordValidation.hasSpecial },
                      { key: "passwordsMatch", text: "Re-typed password matches", valid: form.password && form.confirmPassword && form.password === form.confirmPassword },
                    ].map((rule) => (
                      <div key={rule.key} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={!!rule.valid}
                          readOnly
                          className="w-4 h-4 accent-[#16305B]" 
                        />
                        <span className={rule.valid ? "text-green-600" : "text-[#16305B]"}>{rule.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Re-type Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
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
        {step === 4 && authSubStep === 1 && (
          <div className="flex-1 flex flex-col pl-28">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Verify Your Email
              </h1>
              <div className="text-[#16305B] text-base mb-6">
                {loading ? (
                  <div>
                    <p>Sending verification email to <b>{form.email}</b>...</p>
                  </div>
                ) : (
                  <>
                    <p>
                      We have sent a verification link to <b>{form.email}</b>.<br />
                      Please check your inbox and click the link to verify your email address.
                    </p>
                    <p className="mt-4">
                      Once verified, this page will automatically update and allow you to continue.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && authSubStep === 2 && (
          <div className="flex-1 flex flex-col pl-28">
            <div className="w-full max-w-4xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Attorney User Agreement for QuickVerdicts
              </h1>
              
              {/* Agreement Content */}
              <div 
                ref={agreementScrollRef}
                onScroll={handleAgreementScroll}
                className="border border-[#bfc6d1] rounded-md bg-white p-6 h-96 overflow-y-auto mb-6 text-[#16305B] text-sm leading-relaxed"
              >
                <div className="space-y-4">
                  <p><strong>Effective Date:</strong> {getTodayDate()}</p>
                  
                  <p>Welcome to QuickVerdict. This Attorney User Agreement ("Agreement") governs your use of our virtual courtroom platform ("Platform"). By registering or using QuickVerdict as an attorney, you ("Attorney," "You," or "Your") agree to the following terms and conditions.</p>

                  <div>
                    <h3 className="font-bold mb-2">1. Eligibility and Verification</h3>
                    <p>You must be a licensed attorney in good standing with the relevant jurisdiction(s) to participate on QuickVerdict.</p>
                    <p>• You agree to provide accurate and current verification information, including your bar license number and jurisdiction.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">2. Use of the Platform</h3>
                    <p>You may use QuickVerdict solely for legitimate legal proceedings and in compliance with all applicable laws, court rules, and ethical obligations.</p>
                    <p>• You are responsible for all activity conducted under your account, including compliance with this Agreement and any posted community standards or platform guidelines.</p>
                    <p>• You agree not to misuse the platform, including, but not limited to, attempting unauthorized access, disrupting proceedings, or harassing other users.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">3. Case Management and Proceedings</h3>
                    <p>• You acknowledge that virtual proceedings may differ from traditional in-person court appearances and agree to adapt accordingly to ensure a fair and professional process.</p>
                    <p>• You are responsible for uploading, managing, and presenting case materials securely and in accordance with applicable confidentiality requirements.</p>
                    <p>• You agree to respect all deadlines, schedules, and platform instructions issued for cases handled via QuickVerdict.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">4. Professional Conduct and Compliance</h3>
                    <p>• You agree to maintain professional standards of conduct at all times while using the Platform.</p>
                    <p>• You must comply with all applicable bar rules, ethical guidelines, and legal professional standards.</p>
                    <p>• You are responsible for ensuring that your use of the Platform complies with client confidentiality requirements and attorney-client privilege.</p>
                    <p className="text-red-600 font-medium">Note: Tejeswar - Please remember to update this section with more relevant QuickVerdicts-specific information.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">5. Fees and Payment</h3>
                    <p>• QuickVerdict may charge service fees or case handling fees, which will be communicated at the time of case submission or scheduling.</p>
                    <p>• Payment terms for any applicable fees will be outlined separately and must be adhered to in order to maintain active use of the platform.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">6. Limitation of Liability</h3>
                    <p>• QuickVerdict provides the platform "as is" and does not guarantee outcomes or case results.</p>
                    <p>• QuickVerdict is not liable for delays, technical failures, or any indirect, incidental, or consequential damages arising out of your use of the platform.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">7. Account Termination</h3>
                    <p>• QuickVerdict reserves the right to suspend or terminate your access at any time for violations of this Agreement, unethical conduct, or misuse of the platform.</p>
                    <p>• You may terminate your account at any time by contacting [Insert Support Contact Information].</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">8. Updates to the Agreement</h3>
                    <p>• QuickVerdict may modify this Agreement at any time. Updated terms will be communicated to you, and continued use of the Platform after notice constitutes acceptance of the changes.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">9. Governing Law</h3>
                    <p>This Agreement shall be governed by the laws of the State of Texas, without regard to conflict of law principles.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">10. Contact Information</h3>
                    <p>For questions, account issues, or support, please contact us at [Insert Contact Information].</p>
                  </div>

                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  name="userAgreementAccepted"
                  checked={form.userAgreementAccepted}
                  onChange={handleChange}
                  className="w-5 h-5 mt-1 accent-[#16305B] flex-shrink-0"
                  disabled={!hasScrolledToBottom}
                />
                <div className="text-[#16305B] text-sm leading-relaxed">
                  <p>
                    I have read and agree to the Attorney User Agreement for QuickVerdicts <span className="text-red-500">*</span>
                  </p>
                </div>
              </div>
              {validationErrors.userAgreementAccepted && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.userAgreementAccepted}</p>
              )}

              <div className="text-[#16305B] text-sm bg-gray-50 p-3 rounded border">
                <p className="font-medium">By clicking "Agree and Create Account", you acknowledge that you have read, understood, and accepted this Attorney User Agreement.</p>
              </div>
              
              <div className="pt-2">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!hasScrolledToBottom || !form.userAgreementAccepted || loading}
                  className={`w-full font-semibold px-8 py-3 rounded-md transition ${
                    hasScrolledToBottom && form.userAgreementAccepted && !loading
                      ? "bg-[#16305B] text-white hover:bg-[#0A2342] cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Creating Account..." : "Agree and Create Account"}
                </button>
                {error && (
                  <div className="text-red-500 mt-2 text-sm">{error}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 5 (Complete) */}
        {step === 5 && (
          <div className="flex-1 flex flex-col pl-28">
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
                Account Creation Successful
              </h1>
              <div className="flex flex-col items-start">
                <div className="flex justify-center w-full mb-6">
                  <svg width="90" height="90" viewBox="0 0 90 90">
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
                </div>
                <div className="text-lg font-semibold text-[#222] mb-4 w-full text-center">
                  Your Account has been created successfully.
                </div>
                <div className="text-[#222] text-base mb-8 w-full text-center">
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
                <div className="w-full">
                  <Link href="/login/attorney">
                    <button className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition">
                      Proceed to Attorney Portal
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AttorneySignup() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttorneySignupInner />
    </Suspense>
  );
}
