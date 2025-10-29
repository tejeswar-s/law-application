'use client';

import React, { Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSignupForm } from '../../../hooks/useSignupForm';
import type { AttorneyFormData, LocationOption } from '../../../types/signup.types';
import { validateWithSchema } from '../../../lib/validation/validators';
import { 
  attorneyStep1Schema, 
  attorneyStep2Schema, 
  attorneyStep3Schema, 
  attorneyStep4Schema 
} from '../../../lib/validation/schemas';
import { ErrorBoundary } from '../../../components/errors/ErrorBoundary';

// Step Components
import { AuthLayout } from '../components/shared/AuthLayout';
import { StepperNav } from '../components/shared/StepperNav';
import { Step1PersonalDetails } from '../components/attorney/Step1PersonalDetails';
import { Step2AddressDetails } from '../components/attorney/Step2AddressDetails';
import { Step3EmailPassword } from '../components/attorney/Step3EmailPassword';
import { Step4Agreement } from '../components/attorney/Step4Agreement';
import { Step5Success } from '../components/attorney/Step5Success';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const stepLabels = [
  "Personal Details",
  "Registered Address",
  "Email & Password",
  "User Agreement",
  "Success!"
];

function AttorneySignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, actions } = useSignupForm('attorney');
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState(0);

  // Preload critical images
  useEffect(() => {
    const imagesToLoad = [
      "/logo_sidebar_signup.png",
      "/Image1.png"
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
                width: `${(loadedImages / 2) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Location data
  const [availableStates, setAvailableStates] = useState<LocationOption[]>([]);
  const [availableCounties, setAvailableCounties] = useState<LocationOption[]>([]);
  const [availableCities, setAvailableCities] = useState<LocationOption[]>([]);
  const [countiesLoading, setCountiesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const formData = state.formData as AttorneyFormData;

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

  const handleNext = async () => {
    actions.setError(null);
    let validation;

    console.log("Attorney HandleNext called for step:", state.step, "substep:", state.authSubStep);

    switch (state.step) {
      case 1:
        validation = validateWithSchema(attorneyStep1Schema, formData);
        break;
      case 2:
        validation = validateWithSchema(attorneyStep2Schema, formData);
        break;
      case 3:
        // NEW: OTP verification flow
        if (state.authSubStep === 1) {
          // Sub-step 1: Email & Password form
          validation = validateWithSchema(attorneyStep3Schema, formData);
          if (!validation.isValid) {
            actions.setValidationErrors(validation.errors);
            return;
          }
          // Send OTP email
          try {
            actions.setLoading(true);
            const res = await fetch(`${API_BASE}/api/auth/attorney/send-otp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: formData.email }),
            });
            
            if (res.status === 409) {
              const data = await res.json();
              actions.setValidationErrors({ email: data.message || "Email already in use" });
              return;
            }
            
            if (!res.ok) {
              const data = await res.json();
              actions.setError(data.message || "Failed to send verification code");
              return;
            }
            
            // Move to OTP input screen
            actions.setAuthSubStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (err) {
            actions.setError("Network error. Please try again.");
          } finally {
            actions.setLoading(false);
          }
          return;
        } else if (state.authSubStep === 2) {
          // Sub-step 2: OTP verification
          if (!formData.otp || formData.otp.length !== 6) {
            actions.setValidationErrors({ otp: "Please enter the 6-digit code" });
            return;
          }
          
          try {
            actions.setLoading(true);
            const res = await fetch(`${API_BASE}/api/auth/attorney/verify-otp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                email: formData.email,
                otp: formData.otp 
              }),
            });
            
            if (!res.ok) {
              const data = await res.json();
              actions.setValidationErrors({ otp: data.message || "Invalid verification code" });
              return;
            }
            
            // OTP verified - mark as verified and move to next step
            actions.updateFormData({ emailVerified: true });
            actions.setStep(4);
            actions.setAuthSubStep(1);
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
        validation = validateWithSchema(attorneyStep4Schema, formData);
        if (!validation.isValid || !state.hasScrolledToBottom) {
          const errors = { ...validation.errors };
          if (!state.hasScrolledToBottom) {
            errors.scroll = "Please scroll to the bottom to read the complete agreement";
          }
          actions.setValidationErrors(errors);
          return;
        }

        // Final submission
        try {
          actions.setLoading(true);
          
          // Check for email verification
          if (!formData.emailVerified) {
            actions.setError("Email verification is required. Please complete email verification first.");
            return;
          }

          // Validate all required fields are present
          const missingFields = [];
          if (!formData.firstName?.trim()) missingFields.push("First Name");
          if (!formData.lastName?.trim()) missingFields.push("Last Name");
          if (!formData.lawFirmName?.trim()) missingFields.push("Law Firm Name");
          if (!formData.phoneNumber?.trim()) missingFields.push("Phone Number");
          if (!formData.state?.trim()) missingFields.push("State");
          if (!formData.stateBarNumber?.trim()) missingFields.push("State Bar Number");
          if (!formData.officeAddress1?.trim()) missingFields.push("Office Address");
          if (!formData.county?.trim()) missingFields.push("County");
          if (!formData.city?.trim()) missingFields.push("City");
          if (!formData.zipCode?.trim()) missingFields.push("ZIP Code");
          if (!formData.email?.trim()) missingFields.push("Email");
          if (!formData.password?.trim()) missingFields.push("Password");

          if (missingFields.length > 0) {
            actions.setError(`Missing required information: ${missingFields.join(", ")}. Please restart the signup process.`);
            actions.setLoading(false);
            return;
          }
          
          const submitData = {
            ...formData,
            addressState: formData.state,
            emailVerified: true,
          };
          
          console.log("Attorney submitting with emailVerified:", submitData.emailVerified);
          
          const res = await fetch(`${API_BASE}/api/auth/attorney/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData),
          });
          
          if (!res.ok) {
            const data = await res.json();
            console.error("Attorney signup error response:", data);
            actions.setError(data.message || "Signup failed");
            return;
          }
          
          // Success - clear sensitive data
          actions.clearSensitiveData();
          actions.setStep(5);
        } catch (err) {
          console.error("Attorney signup network error:", err);
          actions.setError("Network error");
        } finally {
          actions.setLoading(false);
        }
        return;
    }

    if (!validation?.isValid) {
      console.log("Attorney validation failed:", validation?.errors);
      actions.setValidationErrors(validation?.errors || {});
      return;
    }

    // Success - move to next step
    actions.setValidationErrors({});
    actions.setStep((state.step + 1) as any);
    actions.setAuthSubStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (state.step === 3 && state.authSubStep === 2) {
      // Go back from OTP screen to email/password screen
      actions.setAuthSubStep(1);
      actions.setError(null);
      actions.setValidationErrors({});
      return;
    }
    
    if (state.step === 1) {
      router.push("/signup");
      return;
    }
    actions.setStep((Math.max(state.step - 1, 1)) as any);
    actions.setValidationErrors({});
  };

  const handleResendOTP = async () => {
    try {
      actions.setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/attorney/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      
      if (res.ok) {
        actions.setError("Verification code resent to your email");
        setTimeout(() => actions.setError(null), 3000);
      } else {
        actions.setError("Failed to resend code. Please try again.");
      }
    } catch (err) {
      actions.setError("Network error. Please try again.");
    } finally {
      actions.setLoading(false);
    }
  };

  const getSidebarContent = () => {
    const titles = {
      1: "Sign Up: Attorney",
      2: "Sign Up: Attorney", 
      3: state.authSubStep === 1 ? "Email & Password Set Up" : "Verify Your Email",
      4: "User Agreement",
      5: "Sign Up Complete"
    };

    const descriptions = {
      1: "Please fill out the following fields with the necessary information. Any field with * is required.",
      2: "Please fill out the following fields with the necessary information. Any field with * is required, and the same goes for the registered address.",
      3: state.authSubStep === 1 
        ? "Please fill out the following fields with the necessary information. Your password must meet the listed minimum requirements."
        : "We sent a 6-digit verification code to your email. Please enter the code below to verify your email address.",
      4: "Please read the user agreement and agree to sign up and create an account on Quick Verdict.",
      5: "Welcome to Quick Verdicts! Your account has been created successfully. Please note: you will have limited functionalities until your bar license has been verified."
    };

    return {
      title: titles[state.step as keyof typeof titles],
      description: descriptions[state.step as keyof typeof descriptions]
    };
  };

  return (
    <AuthLayout
      userType="attorney"
      step={state.step}
      sidebarContent={getSidebarContent()}
      onBack={handleBack}
    >
      <StepperNav steps={stepLabels} currentStep={state.step} />
      
      {state.step === 1 && (
        <Step1PersonalDetails
          formData={formData}
          onUpdate={actions.updateFormData}
          validationErrors={state.validationErrors}
          onClearError={actions.clearFieldError}
          availableStates={availableStates}
          onNext={handleNext}
        />
      )}

      {state.step === 2 && (
        <Step2AddressDetails
          formData={formData}
          onUpdate={actions.updateFormData}
          validationErrors={state.validationErrors}
          onClearError={actions.clearFieldError}
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
          onResendOTP={handleResendOTP}
          error={state.error}
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

export default function AttorneySignup() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <AttorneySignupInner />
      </Suspense>
    </ErrorBoundary>
  );
}