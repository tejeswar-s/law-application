'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignupForm } from '../../../hooks/useSignupForm';
import { JurorFormData, LocationOption } from '../../../types/signup.types';
import { validateWithSchema } from '../../../lib/validation/validators';
import { 
  jurorStep1Schema, 
  jurorStep2SubStep2Schema, 
  jurorStep3Schema, 
  jurorStep4Schema 
} from '../../../lib/validation/schemas';
import { ErrorBoundary } from '../../../components/errors/ErrorBoundary';

// Step Components
import { AuthLayout } from '../components/shared/AuthLayout';
import { StepperNav } from '../components/shared/StepperNav';
import { Step1CriteriaVerification } from '../components/juror/Step1CriteriaVerification';
import { Step2PersonalDetails } from '../components/juror/Step2PersonalDetails';
import { Step3EmailPassword } from '../components/juror/Step3EmailPassword';
import { Step4Agreement } from '../components/juror/Step4Agreement';
import { Step5Success } from '../components/juror/Step5Success';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const stepLabels = [
  "Criteria Verification",
  "Personal Details",
  "Email & Password Set Up",
  "User Agreement",
  "Sign Up Complete",
];

function JurorSignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, actions } = useSignupForm('juror');
  const emailVerificationHandled = useRef(false);
  
  // Location data
  const [availableStates, setAvailableStates] = useState<LocationOption[]>([]);
  const [availableCounties, setAvailableCounties] = useState<LocationOption[]>([]);
  const [availableCities, setAvailableCities] = useState<LocationOption[]>([]);
  const [countiesLoading, setCountiesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const formData = state.formData as JurorFormData;

  // Fetch states on mount
  useEffect(() => {
    async function fetchStates() {
      try {
        const res = await fetch(`https://api.census.gov/data/2020/dec/pl?get=NAME&for=state:*`);
        const data = await res.json();
        setAvailableStates(data.slice(1).map((row: [string, string]) => ({
          label: row[0],
          value: row[1]
        })));
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    }
    fetchStates();
  }, []);

  // Fetch counties when state changes
  useEffect(() => {
    async function fetchCounties() {
      if (formData.stateCode) {
        setCountiesLoading(true);
        try {
          const stateCode = formData.stateCode.padStart(2, '0');
          const res = await fetch(`https://api.census.gov/data/2020/dec/pl?get=NAME&for=county:*&in=state:${stateCode}`);
          const data = await res.json();
          setAvailableCounties(data.slice(1).map((row: [string, string, string]) => ({
            label: row[0],
            value: row[2]
          })));
        } catch (error) {
          console.error('Error fetching counties:', error);
          setAvailableCounties([]);
        } finally {
          setCountiesLoading(false);
        }
      } else {
        setAvailableCounties([]);
      }
    }
    fetchCounties();
  }, [formData.stateCode]);

  // Fetch cities when state changes
  useEffect(() => {
    async function fetchCities() {
      if (formData.stateCode) {
        setCitiesLoading(true);
        try {
          const stateCode = formData.stateCode.padStart(2, '0');
          const res = await fetch(`https://api.census.gov/data/2020/dec/pl?get=NAME&for=place:*&in=state:${stateCode}`);
          const data = await res.json();
          setAvailableCities(data.slice(1).map((row: [string, string, string]) => ({
            label: row[0],
            value: row[2]
          })));
        } catch (error) {
          console.error('Error fetching cities:', error);
          setAvailableCities([]);
        } finally {
          setCitiesLoading(false);
        }
      } else {
        setAvailableCities([]);
      }
    }
    fetchCities();
  }, [formData.stateCode]);

  // Handle email verification redirect - FIXED to prevent infinite loops
  useEffect(() => {
    const verifyToken = searchParams.get("verifyToken");
    
    if (verifyToken && !emailVerificationHandled.current) {
      emailVerificationHandled.current = true;
      console.log("Email verification token detected, processing...");
      
      // Simply go to step 4 - the form data should already be loaded by useSignupForm
      actions.setStep(4);
      actions.setAuthSubStep(1);
    }
  }, [searchParams]); // REMOVED actions from dependencies

  const handleNext = async () => {
    actions.setError(null);
    let validation;

    console.log("HandleNext called for step:", state.step);

    switch (state.step) {
      case 1:
        validation = validateWithSchema(jurorStep1Schema, { criteriaAnswers: formData.criteriaAnswers });
        break;
      case 2:
        if (state.personalSubStep === 1) {
          actions.setPersonalSubStep(2);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        } else {
          validation = validateWithSchema(jurorStep2SubStep2Schema, {
            personalDetails2: formData.personalDetails2,
            paymentMethod: formData.paymentMethod
          });
        }
        break;
      case 3:
        if (state.authSubStep === 1) {
          validation = validateWithSchema(jurorStep3Schema, formData);
          if (!validation.isValid) {
            actions.setValidationErrors(validation.errors);
            return;
          }
          // Send verification email
          try {
            actions.setLoading(true);
            const res = await fetch(`${API_BASE}/api/auth/juror/send-email-verification`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: formData.email }),
            });
            
            if (!res.ok) {
              const data = await res.json();
              actions.setError(data.message || "Failed to send verification email");
              return;
            }
            
            actions.setAuthSubStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (err) {
            actions.setError("Network error. Please try again.");
          } finally {
            actions.setLoading(false);
          }
          return;
        }
        return;
      case 4:
  validation = validateWithSchema(jurorStep4Schema, formData);
  if (!validation.isValid || !state.hasScrolledToBottom) {
    const errors = { ...validation.errors };
    if (!state.hasScrolledToBottom) {
      errors.scroll = "Please scroll to the bottom to read the complete agreement";
    }
    actions.setValidationErrors(errors);
    return;
  }
  
  // Final submission - FIXED
  try {
    actions.setLoading(true);
    
    console.log("Final submission attempt with form data:", {
      hasName: !!formData.personalDetails2?.name,
      hasEmail: !!formData.email,
      hasPassword: !!formData.password,
      hasPhone: !!formData.personalDetails2?.phone,
      hasPaymentMethod: !!formData.paymentMethod,
      step: state.step,
      authSubStep: state.authSubStep
    });
    
    // Validate all required fields are present
    if (!formData.personalDetails2?.name?.trim()) {
      actions.setError("Name is missing. Please go back to Step 2 and complete your information.");
      return;
    }
    if (!formData.personalDetails2?.phone?.trim()) {
      actions.setError("Phone number is missing. Please go back to Step 2 and complete your information.");
      return;
    }
    if (!formData.personalDetails2?.address1?.trim()) {
      actions.setError("Address is missing. Please go back to Step 2 and complete your information.");
      return;
    }
    if (!formData.personalDetails2?.state?.trim()) {
      actions.setError("State is missing. Please go back to Step 2 and complete your information.");
      return;
    }
    if (!formData.personalDetails2?.county?.trim()) {
      actions.setError("County is missing. Please go back to Step 2 and complete your information.");
      return;
    }
    if (!formData.personalDetails2?.city?.trim()) {
      actions.setError("City is missing. Please go back to Step 2 and complete your information.");
      return;
    }
    if (!formData.personalDetails2?.zip?.trim()) {
      actions.setError("ZIP Code is missing. Please go back to Step 2 and complete your information.");
      return;
    }
    if (!formData.paymentMethod) {
      actions.setError("Payment method is missing. Please go back to Step 2 and select a payment method.");
      return;
    }
    if (!formData.email?.trim()) {
      actions.setError("Email is missing. Please go back to Step 3 and enter your email.");
      return;
    }
    if (!formData.password?.trim()) {
      actions.setError("Password is missing. Please go back to Step 3 and enter your password.");
      return;
    }
    
    const submitData = {
      criteriaResponses: JSON.stringify(formData.criteriaAnswers),
      name: formData.personalDetails2.name.trim(),
      phoneNumber: formData.personalDetails2.phone.trim(),
      address1: formData.personalDetails2.address1.trim(),
      address2: formData.personalDetails2.address2?.trim() || "",
      city: formData.personalDetails2.city.trim(),
      cityCode: formData.cityCode || "",
      state: formData.personalDetails2.state.trim(),
      stateCode: formData.stateCode || "",
      zipCode: formData.personalDetails2.zip.trim(),
      county: formData.personalDetails2.county.trim(),
      countyCode: formData.countyCode || "",
      
      // Optional demographics
      maritalStatus: formData.personalDetails1.maritalStatus?.trim() || "",
      spouseEmployer: formData.personalDetails1.spouseEmployer?.trim() || "",
      employerName: formData.personalDetails1.employerName?.trim() || "",
      employerAddress: formData.personalDetails1.employerAddress?.trim() || "",
      yearsInCounty: formData.personalDetails1.yearsInCounty || "",
      ageRange: formData.personalDetails1.ageRange || "",
      gender: formData.personalDetails1.gender || "",
      education: formData.personalDetails1.education || "",
      
      // Required fields
      paymentMethod: formData.paymentMethod,
      email: formData.email.trim(),
      password: formData.password, // Now available!
      userAgreementAccepted: formData.userAgreementAccepted
    };
    
    console.log("Submitting with password present:", !!submitData.password);
    
    const res = await fetch(`${API_BASE}/api/auth/juror/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    });
    
    if (!res.ok) {
      const data = await res.json();
      console.error("Signup error response:", data);
      actions.setError(data.message || "Signup failed");
      return;
    }
    
    // Success - NOW clear sensitive data
    actions.clearSensitiveData();
    actions.setStep(5);
    
  } catch (err) {
    console.error("Juror signup network error:", err);
    actions.setError("Network error");
  } finally {
    actions.setLoading(false);
  }
  return;
    }

    if (!validation?.isValid) {
      console.log("Validation failed:", validation?.errors);
      actions.setValidationErrors(validation?.errors || {});
      return;
    }

    actions.setValidationErrors({});
    actions.setStep((state.step + 1) as any);
    actions.setPersonalSubStep(1);
    actions.setAuthSubStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (state.step === 2 && state.personalSubStep === 2) {
      actions.setPersonalSubStep(1);
      return;
    }
    if (state.step === 1) {
      router.push("/signup");
      return;
    }
    actions.setStep((Math.max(state.step - 1, 1)) as any);
    actions.setPersonalSubStep(1);
    actions.setValidationErrors({});
  };

  const handleResendEmail = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/juror/send-email-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
    } catch (err) {
      actions.setError("Network error. Please try again.");
    }
  };

  const getSidebarContent = () => {
    const titles = {
      1: "Criteria Verification",
      2: state.personalSubStep === 1 ? "Personal Details (1/2)" : "Personal Details (2/2)",
      3: "Email & Password Set Up",
      4: "User Agreement",
      5: "Sign Up Complete"
    };

    const descriptions = {
      1: "Please answer all questions honestly. Your responses help determine eligibility for jury service.",
      2: state.personalSubStep === 1 
        ? "Please provide your demographic information. All fields on this page are optional."
        : "Please fill out the following fields with necessary information. Any field with * is required.",
      3: "Create your login information to access the platform. Your password must meet all listed requirements.",
      4: "Please read and agree to the terms outlined below to complete your registration.",
      5: "Welcome to Quick Verdicts! Your account has been created successfully."
    };

    return {
      title: titles[state.step as keyof typeof titles],
      description: descriptions[state.step as keyof typeof descriptions]
    };
  };

  return (
    <AuthLayout
      userType="juror"
      step={state.step}
      sidebarContent={getSidebarContent()}
      onBack={handleBack}
    >
      <StepperNav steps={stepLabels} currentStep={state.step} />
      
      {state.step === 1 && (
        <Step1CriteriaVerification
          formData={formData}
          onUpdate={actions.updateFormData}
          validationErrors={state.validationErrors}
          onClearError={actions.clearFieldError}
          onNext={handleNext}
        />
      )}

      {state.step === 2 && (
        <Step2PersonalDetails
          formData={formData}
          onUpdate={actions.updateFormData}
          validationErrors={state.validationErrors}
          onClearError={actions.clearFieldError}
          personalSubStep={state.personalSubStep}
          availableStates={availableStates}
          availableCounties={availableCounties}
          availableCities={availableCities}
          countiesLoading={countiesLoading}
          citiesLoading={citiesLoading}
          onNext={handleNext}
        />
      )}

      {state.step === 3 && (
        <Step3EmailPassword
          formData={formData}
          onUpdate={actions.updateFormData}
          validationErrors={state.validationErrors}
          onClearError={actions.clearFieldError}
          authSubStep={state.authSubStep}
          onNext={handleNext}
          loading={state.loading}
          onResendEmail={handleResendEmail}
        />
      )}

      {state.step === 4 && (
        <Step4Agreement
          formData={formData}
          onUpdate={actions.updateFormData}
          validationErrors={state.validationErrors}
          onClearError={actions.clearFieldError}
          hasScrolledToBottom={state.hasScrolledToBottom}
          onScrolledToBottom={actions.setScrolledToBottom}
          onSubmit={handleNext}
          loading={state.loading}
          error={state.error}
        />
      )}

      {state.step === 5 && <Step5Success />}
    </AuthLayout>
  );
}

export default function JurorSignup() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <JurorSignupInner />
      </Suspense>
    </ErrorBoundary>
  );
}