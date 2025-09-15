"use client";

import React, { useMemo, useState, useRef } from "react";
import type { FC, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";

const BLUE = "#0A2342";
const PAGE_BG = "#f9f7f2";
const TICK_YELLOW = "#F6E27F";

type Step = 1 | 2 | 3 | 4 | 5;
type PersonalSubStep = 1 | 2;

type CriteriaAnswers = {
  age: string;
  citizen: string;
  work1: string;
  work2: string;
  felony: string;
  indictment: string;
};

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

type ValidationErrors = {
  [key: string]: string;
};

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

export default function SignupFlow() {
  // Steps
  const [step, setStep] = useState<Step>(1);
  const [personalSubStep, setPersonalSubStep] = useState<PersonalSubStep>(1);

  // Form data
  const [criteriaAnswers, setCriteriaAnswers] = useState<CriteriaAnswers>({
    age: "",
    citizen: "",
    work1: "",
    work2: "",
    felony: "",
    indictment: "",
  });

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

  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [agreed, setAgreed] = useState<boolean>(false);

  // Validation and loading states
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");

  // Agreement scroll tracking
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const agreementScrollRef = useRef<HTMLDivElement>(null);

  // Password validation
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
      all: hasLen && hasNum && notSameAsName && noTriple && hasUpper && hasSpecial && confirmMatch,
    } as PwChecks;
  }, [password, confirm, pd2.name]);

  // Validation functions
  const validateStep1 = (): boolean => {
    const errors: ValidationErrors = {};
    
    Object.keys(criteriaAnswers).forEach(key => {
      if (!criteriaAnswers[key as keyof CriteriaAnswers]) {
        errors[key] = "This question is required";
      }
    });

    // Check eligibility based on answers
    if (criteriaAnswers.age === "no") {
      errors.eligibility = "You must be at least 18 years old to serve as a juror";
    }
    if (criteriaAnswers.citizen === "no") {
      errors.eligibility = "You must be a US citizen to serve as a juror";
    }
    if (criteriaAnswers.indictment === "yes") {
      errors.eligibility = "Individuals currently under indictment are not eligible to serve";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2SubStep2 = (): boolean => {
    const errors: ValidationErrors = {};

    // Required fields validation
    if (!pd2.name.trim()) errors.name = "Name is required";
    if (!pd2.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(pd2.phone.trim())) {
      errors.phone = "Please enter a valid phone number";
    }
    
    if (!pd2.address1.trim()) errors.address1 = "Address is required";
    if (!pd2.city.trim()) errors.city = "City is required";
    if (!pd2.state.trim()) {
      errors.state = "State is required";
    } else if (!/^[A-Z]{2}$/.test(pd2.state.trim())) {
      errors.state = "State must be 2 letters (e.g., TX)";
    }
    
    if (!pd2.zip.trim()) {
      errors.zip = "ZIP code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(pd2.zip.trim())) {
      errors.zip = "Please enter a valid ZIP code";
    }
    
    if (!pd2.county.trim()) errors.county = "County is required";
    if (!payMethod) errors.paymentMethod = "Please select a payment method";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (!pwChecks.all) {
      errors.password = "Password does not meet all requirements";
    }
    
    if (!confirm) {
      errors.confirmPassword = "Please confirm your password";
    } else if (!pwChecks.confirmMatch) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!hasScrolledToBottom) {
      errors.scroll = "Please scroll to the bottom to read the complete agreement";
    }
    if (!agreed) {
      errors.agreement = "You must agree to the user agreement to continue";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle agreement scroll
  const handleAgreementScroll = () => {
    const element = agreementScrollRef.current;
    if (element) {
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 5;
      setHasScrolledToBottom(isAtBottom);
    }
  };

  // Clear validation error when user starts typing/selecting
  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: ""
      }));
    }
  };

  // Handle criteria answers
  const handleCriteriaChange = (questionKey: keyof CriteriaAnswers, value: string) => {
    setCriteriaAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
    clearFieldError(questionKey);
    clearFieldError('eligibility');
  };

  // Navigation functions
  const canProceed: boolean = (() => {
    if (step === 1) return true; // Will validate on next
    if (step === 2 && personalSubStep === 1) return true; // Optional fields
    if (step === 2 && personalSubStep === 2) {
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
    if (step === 4) return agreed && hasScrolledToBottom;
    return true;
  })();

  const goNext = async (): Promise<void> => {
    setSubmitError("");
    let isValid = false;

    // Validate current step
    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = personalSubStep === 1 ? true : validateStep2SubStep2();
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

    if (!isValid) return;

    // Handle sub-step navigation for step 2
    if (step === 2 && personalSubStep === 1) {
      setPersonalSubStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Handle final submission
    if (step === 4) {
      setLoading(true);
      try {
        const formData = {
          // Criteria responses
          criteriaResponses: JSON.stringify(criteriaAnswers),
          
          // Personal details
          name: pd2.name.trim(),
          phoneNumber: pd2.phone.trim(),
          address1: pd2.address1.trim(),
          address2: pd2.address2.trim() || null,
          city: pd2.city.trim(),
          state: pd2.state.trim().toUpperCase(),
          zipCode: pd2.zip.trim(),
          county: pd2.county.trim(),
          
          // Optional demographics
          maritalStatus: pd1.maritalStatus || null,
          spouseEmployer: pd1.spouseEmployer.trim() || null,
          employerName: pd1.employerName.trim() || null,
          employerAddress: pd1.employerAddress.trim() || null,
          yearsInCounty: pd1.yearsInCounty || null,
          ageRange: pd1.ageRange || null,
          gender: pd1.gender || null,
          education: pd1.education || null,
          
          // Payment and auth
          paymentMethod: payMethod,
          email: email.trim(),
          password: password,
          userAgreementAccepted: agreed
        };

        const response = await fetch("http://localhost:4000/api/auth/juror/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          setSubmitError(data.message || "Signup failed. Please try again.");
          setLoading(false);
          return;
        }

        setStep(5); // Success step
      } catch (error) {
        console.error('Signup error:', error);
        setSubmitError("Network error. Please check your connection and try again.");
        setLoading(false);
        return;
      }
    } else {
      // Regular step progression
      setStep((s) => (Math.min(s + 1, 5) as Step));
      setPersonalSubStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = (): void => {
    if (step === 2 && personalSubStep === 2) {
      setPersonalSubStep(1);
      return;
    }
    setStep((s) => (Math.max(s - 1, 1) as Step));
    setPersonalSubStep(1);
    setValidationErrors({});
  };

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
          {/* Logo */}
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

          {/* Content */}
          <div className="px-8 py-8 mt-44">
            <h2 className="text-xl font-semibold mb-4">
              {step === 1 && "Criteria Verification"}
              {step === 2 && (personalSubStep === 1 ? "Personal Details (1/2)" : "Personal Details (2/2)")}
              {step === 3 && "Email & Password Set Up"}
              {step === 4 && "User Agreement"}
              {step === 5 && "Sign Up Complete"}
            </h2>

            <div className="text-sm leading-relaxed text-blue-100 space-y-3">
              {step === 1 && (
                <p>Please answer all questions honestly. Your responses help determine eligibility for jury service.</p>
              )}
              {step === 2 && personalSubStep === 1 && (
                <p>Please provide your demographic information. All fields on this page are optional.</p>
              )}
              {step === 2 && personalSubStep === 2 && (
                <>
                  <p>Please fill out the following fields with necessary information.</p>
                  <p className="mt-3">Any field with * is required.</p>
                </>
              )}
              {step === 3 && (
                <>
                  <p>Create your login information to access the platform.</p>
                  <p>Your password must meet all listed requirements.</p>
                </>
              )}
              {step === 4 && (
                <p>Please read and agree to the terms outlined below to complete your registration.</p>
              )}
              {step === 5 && (
                <>
                  <p>Welcome to Quick Verdicts!</p>
                  <p>Your account has been created successfully.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 px-6 py-10 md:px-12 max-w-6xl w-full mx-auto">
        {/* Top row */}
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
            const isCompleted = step > i;
            return (
              <div key={label} className="flex items-center flex-1 min-w-0">
                <div
                  className={`flex items-center justify-center rounded-full border-2`}
                  style={{
                    width: 20,
                    height: 20,
                    minWidth: 20,
                    borderColor: isCompleted ? BLUE : "#c5cbd1",
                    backgroundColor: isCompleted ? BLUE : "white",
                    borderWidth: 2,
                  }}
                >
                  {isCompleted ? (
                    <Check size={14} color={TICK_YELLOW} />
                  ) : (
                    <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "transparent", display: "inline-block" }} />
                  )}
                </div>

                <div className="ml-3 truncate">
                  <div
                    className={`text-sm truncate ${isActive ? "font-semibold" : "font-medium"}`}
                    style={{
                      color: isActive ? BLUE : "#9aa3ad",
                      fontSize: isActive ? 14 : 13,
                    }}
                  >
                    {label}
                  </div>
                </div>

                {i < stepLabels.length && (
                  <div
                    className="flex-1"
                    style={{
                      height: 1,
                      marginLeft: 16,
                      marginRight: 12,
                      background: "linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.04))",
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

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6 max-w-3xl mx-auto pb-8">
          
          {/* Step 1 - Criteria */}
          {step === 1 && (
            <>
              <Question 
                label="Are you at least 18 years old?" 
                name="age" 
                value={criteriaAnswers.age}
                onChange={(value) => handleCriteriaChange('age', value)}
                error={validationErrors.age}
              />
              <Question 
                label="Are you a citizen of the United States?" 
                name="citizen" 
                value={criteriaAnswers.citizen}
                onChange={(value) => handleCriteriaChange('citizen', value)}
                error={validationErrors.citizen}
              />
              <Question
                label="Do you or your spouse, parents, or children work for a law firm, an insurance company or a claims adjusting company?"
                name="work1"
                value={criteriaAnswers.work1}
                onChange={(value) => handleCriteriaChange('work1', value)}
                error={validationErrors.work1}
              />
              <Question
                label="Have you, your spouse, parents or children worked for a law firm, an insurance company or a claims adjusting company within the past year?"
                name="work2"
                value={criteriaAnswers.work2}
                onChange={(value) => handleCriteriaChange('work2', value)}
                error={validationErrors.work2}
              />
              <Question 
                label="Have you been convicted of a felony or other disqualifying offense (and if so, has your right to serve been restored)?" 
                name="felony" 
                value={criteriaAnswers.felony}
                onChange={(value) => handleCriteriaChange('felony', value)}
                error={validationErrors.felony}
              />
              <Question 
                label="Are you currently under indictment or legal charges for a felony?" 
                name="indictment" 
                value={criteriaAnswers.indictment}
                onChange={(value) => handleCriteriaChange('indictment', value)}
                error={validationErrors.indictment}
              />
              
              {validationErrors.eligibility && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600 text-sm">{validationErrors.eligibility}</p>
                </div>
              )}
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
                onChange={(val) => {
                  setPd2((s) => ({ ...s, name: val }));
                  clearFieldError('name');
                }}
                error={validationErrors.name}
              />

              <Input
                label="Phone"
                required
                placeholder="(832) 674-8776"
                value={pd2.phone}
                onChange={(val) => {
                  setPd2((s) => ({ ...s, phone: val }));
                  clearFieldError('phone');
                }}
                error={validationErrors.phone}
              />

              <Input
                label="Address Line 1"
                required
                placeholder="7423 Maple Hollow Dr"
                value={pd2.address1}
                onChange={(val) => {
                  setPd2((s) => ({ ...s, address1: val }));
                  clearFieldError('address1');
                }}
                error={validationErrors.address1}
              />

              <Input
                label="Address Line 2"
                placeholder="Apt, Suite, etc. (optional)"
                value={pd2.address2}
                onChange={(val) => setPd2((s) => ({ ...s, address2: val }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  required
                  placeholder="Dallas"
                  value={pd2.city}
                  onChange={(val) => {
                    setPd2((s) => ({ ...s, city: val }));
                    clearFieldError('city');
                  }}
                  error={validationErrors.city}
                />
                <Input
                  label="State"
                  required
                  placeholder="TX"
                  value={pd2.state}
                  onChange={(val) => {
                    setPd2((s) => ({ ...s, state: val.toUpperCase().slice(0, 2) }));
                    clearFieldError('state');
                  }}
                  error={validationErrors.state}
                />
                <Input
                  label="Zip"
                  required
                  placeholder="75123"
                  value={pd2.zip}
                  onChange={(val) => {
                    setPd2((s) => ({ ...s, zip: val }));
                    clearFieldError('zip');
                  }}
                  error={validationErrors.zip}
                />
              </div>

              <Input
                label="County"
                required
                placeholder="Dallas County"
                value={pd2.county}
                onChange={(val) => {
                  setPd2((s) => ({ ...s, county: val }));
                  clearFieldError('county');
                }}
                error={validationErrors.county}
              />

              <div>
                <label className="block mb-2 text-base font-medium" style={{ color: BLUE }}>
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <PaymentMethodButton
                    label="Venmo"
                    selected={payMethod === "venmo"}
                    onClick={() => {
                      setPayMethod("venmo");
                      clearFieldError('paymentMethod');
                    }}
                  />
                  <PaymentMethodButton
                    label="PayPal"
                    selected={payMethod === "paypal"}
                    onClick={() => {
                      setPayMethod("paypal");
                      clearFieldError('paymentMethod');
                    }}
                  />
                  <PaymentMethodButton
                    label="Cash App"
                    selected={payMethod === "cashapp"}
                    onClick={() => {
                      setPayMethod("cashapp");
                      clearFieldError('paymentMethod');
                    }}
                  />
                </div>
                {validationErrors.paymentMethod && (
                  <p className="text-red-500 text-sm mt-2">{validationErrors.paymentMethod}</p>
                )}
              </div>
            </>
          )}

          {/* Step 3 - Email & Password */}
          {step === 3 && (
            <>
              <Input
                label="Email"
                required
                type="email"
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(val) => {
                  setEmail(val);
                  clearFieldError('email');
                }}
                error={validationErrors.email}
              />

              <Input
                label="Password"
                required
                type="password"
                placeholder=""
                value={password}
                onChange={(val) => {
                  setPassword(val);
                  clearFieldError('password');
                }}
                error={validationErrors.password}
              />

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
                onChange={(val) => {
                  setConfirm(val);
                  clearFieldError('confirmPassword');
                }}
                error={validationErrors.confirmPassword}
              />

              <div className="mt-2">
                <Checklist items={[{ ok: pwChecks.confirmMatch, text: "Re-typed password must match" }]} />
              </div>
            </>
          )}

          {/* Step 4 - User Agreement */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4" style={{ color: BLUE }}>
                Juror User Agreement for Quick Verdicts
              </h2>

              <div 
                ref={agreementScrollRef}
                onScroll={handleAgreementScroll}
                className="max-h-80 overflow-y-auto p-6 border rounded-md bg-white text-sm text-gray-800 leading-relaxed border-gray-300"
              >
                <p><strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <p className="mt-4">
                  Welcome to QuickVerdicts. This Juror User Agreement ("Agreement") governs your use of
                  our virtual courtroom platform ("Platform"). By registering or using QuickVerdicts as a juror, 
                  you ("Juror," "You," or "Your") agree to the following terms and conditions.
                </p>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">1. Eligibility and Verification</h3>
                  <p>You must meet all eligibility requirements to participate as a juror on QuickVerdicts.</p>
                  <p>• You agree to provide accurate and current verification information.</p>
                  <p>• You acknowledge that verification steps may be required before you can access full platform features.</p>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">2. Use of the Platform</h3>
                  <p>You may use QuickVerdicts solely for legitimate jury service and in compliance with all applicable laws and regulations.</p>
                  <p>• You are responsible for all activity conducted under your account.</p>
                  <p>• You agree not to misuse the platform, including attempting unauthorized access, disrupting proceedings, or engaging in inappropriate conduct.</p>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">3. Jury Service and Proceedings</h3>
                  <p>• You acknowledge that virtual jury proceedings may differ from traditional in-person jury service and agree to adapt accordingly.</p>
                  <p>• You are responsible for maintaining confidentiality of case materials and deliberations as required by law.</p>
                  <p>• You agree to participate actively and professionally in all assigned proceedings.</p>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">4. Professional Conduct</h3>
                  <p>• You agree to maintain appropriate standards of conduct at all times while using the Platform.</p>
                  <p>• You must not discuss cases outside of official proceedings or with unauthorized individuals.</p>
                  <p>• You are responsible for ensuring your environment is appropriate for jury service.</p>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">5. Compensation and Payment</h3>
                  <p>• QuickVerdicts will provide compensation for jury service as outlined in individual case assignments.</p>
                  <p>• Payment will be processed through your selected payment method after completion of service.</p>
                  <p>• You are responsible for any applicable taxes on compensation received.</p>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">6. Limitation of Liability</h3>
                  <p>• QuickVerdicts provides the platform "as is" and does not guarantee specific outcomes.</p>
                  <p>• QuickVerdicts is not liable for technical failures, delays, or any indirect consequences arising from platform use.</p>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">7. Account Termination</h3>
                  <p>• QuickVerdicts reserves the right to suspend or terminate your access for violations of this Agreement.</p>
                  <p>• You may deactivate your account at any time by contacting support.</p>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">8. Updates to Agreement</h3>
                  <p>• QuickVerdicts may modify this Agreement at any time with notice to users.</p>
                  <p>• Continued use after changes constitutes acceptance of updated terms.</p>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold mb-2">9. Governing Law</h3>
                  <p>This Agreement shall be governed by the laws of the State of Texas.</p>
                </div>

                <div className="mt-4 mb-6">
                  <h3 className="font-bold mb-2">10. Contact Information</h3>
                  <p>For questions or support, please contact us at [Insert Contact Information].</p>
                </div>
              </div>

              {validationErrors.scroll && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.scroll}</p>
              )}

              <label className="flex items-start gap-3 mt-6">
                <input
                  type="checkbox"
                  className="accent-[#0A2342] mt-1"
                  checked={agreed}
                  disabled={!hasScrolledToBottom}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    clearFieldError('agreement');
                  }}
                />
                <div>
                  <span className="text-gray-700">
                    I have read and agree to the Juror User Agreement for QuickVerdicts *
                  </span>
                  {!hasScrolledToBottom && (
                    <p className="text-sm text-gray-500 mt-1">Please scroll to the bottom of the agreement first</p>
                  )}
                </div>
              </label>
              
              {validationErrors.agreement && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.agreement}</p>
              )}
            </div>
          )}

          {/* Step 5 - Complete */}
          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={32} color="white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold" style={{ color: BLUE }}>
                Account Creation Successful!
              </h2>

              <p className="text-gray-700 max-w-2xl mx-auto">
                Welcome to Quick Verdicts! Your juror account has been created successfully. 
                You can now access your dashboard and complete any remaining onboarding tasks.
              </p>

              <Link href="/login/juror">
                <button className="mt-6 px-8 py-3 bg-[#0A2342] text-white rounded-md hover:bg-[#132c54] font-medium">
                  Proceed to Juror Login
                </button>
              </Link>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

          {/* Bottom action */}
          {step < 5 && (
            <div className="pt-6">
              <button
                type="submit"
                disabled={!canProceed || loading}
                className={`w-full font-medium px-8 py-3 rounded-md transition ${
                  canProceed && !loading 
                    ? "bg-[#0A2342] text-white hover:bg-[#132c54]" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  step === 4 ? "Agree and Create Account" : "Next"
                )}
              </button>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}

/* -------------------- Reusable Components -------------------- */

interface QuestionProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const Question: FC<QuestionProps> = ({ label, name, value, onChange, error }) => {
  return (
    <div className="mb-4">
      <label className="block mb-3 text-base font-medium" style={{ color: BLUE }}>
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input 
            type="radio" 
            name={name} 
            value="yes" 
            checked={value === "yes"}
            onChange={(e) => onChange(e.target.value)}
            className="accent-[#0A2342]" 
          /> 
          <span>Yes</span>
        </label>
        <label className="flex items-center gap-2">
          <input 
            type="radio" 
            name={name} 
            value="no" 
            checked={value === "no"}
            onChange={(e) => onChange(e.target.value)}
            className="accent-[#0A2342]" 
          /> 
          <span>No</span>
        </label>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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
  error?: string;
}

const Input: FC<InputProps> = ({ 
  label, 
  required, 
  type = "text", 
  placeholder = "", 
  value = "", 
  onChange,
  error 
}) => {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-base font-medium" style={{ color: BLUE }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-md px-4 py-3 focus:ring-2 focus:ring-[#0A2342] outline-none text-[#0A2342] bg-white placeholder-gray-400 transition ${
          error ? "border-red-300 focus:ring-red-200" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface SelectProps {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  options?: string[];
  placeholder?: string;
  error?: string;
}

const Select: FC<SelectProps> = ({ 
  label, 
  value, 
  onChange = () => {}, 
  options = [], 
  placeholder = "",
  error 
}) => {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-base font-medium" style={{ color: BLUE }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-md px-4 py-3 text-[#0A2342] bg-white focus:ring-2 focus:ring-[#0A2342] outline-none transition ${
          error ? "border-red-300 focus:ring-red-200" : "border-gray-300"
        }`}
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
      className={`w-full border rounded-md px-4 py-3 text-left transition ${
        selected ? "border-[#0A2342] ring-2 ring-[#0A2342] bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white"
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
            {it.ok && <Check size={12} color={TICK_YELLOW} />}
          </div>
          <div className={`text-gray-700 ${it.ok ? 'text-green-700' : ''}`}>{it.text}</div>
        </li>
      ))}
    </ul>
  );
};