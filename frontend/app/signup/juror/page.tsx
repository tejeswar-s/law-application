'use client';

import React, { Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSignupForm } from '../../../hooks/useSignupForm';
import type { JurorFormData, LocationOption } from '../../../types/signup.types';
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
  const { state, actions } = useSignupForm('juror');
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

  const formData = state.formData as JurorFormData;

  // Fetch states on mount
  useEffect(() => {
    async function fetchStates() {
      try {
      const res = await fetch(`https://api.census.gov/data/2020/dec/pl?get=NAME&for=state:*`);
      const data = await res.json();
      const states = data.slice(1).map((row: [string, string]) => ({
        label: row[0],
        value: row[1]
      }));
      // Sort states alphabetically by label
      states.sort((a: LocationOption, b: LocationOption) => a.label.localeCompare(b.label));
      setAvailableStates(states);
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
          // Send OTP
          try {
            actions.setLoading(true);
            const res = await fetch(`${API_BASE}/api/auth/juror/send-otp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: formData.email }),
            });
            
            if (!res.ok) {
              const data = await res.json();
              actions.setError(data.message || "Failed to send verification code");
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
        } else {
          // authSubStep 2 - OTP verification handled in Step3 component
          // Once verified, it will call onNext which brings us to step 4
          actions.setStep(4);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
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
        
        // Check if email was verified
        if (!formData.emailVerified) {
          actions.setError("Email verification is required. Please go back to Step 3.");
          return;
        }
        
        // Final submission
        try {
          actions.setLoading(true);
          
          console.log("Final submission attempt with form data");
          
          // Validate all required fields are present
          const requiredChecks = [
            { field: 'name', value: formData.personalDetails2?.name, step: 2 },
            { field: 'phone', value: formData.personalDetails2?.phone, step: 2 },
            { field: 'address', value: formData.personalDetails2?.address1, step: 2 },
            { field: 'state', value: formData.personalDetails2?.state, step: 2 },
            { field: 'county', value: formData.personalDetails2?.county, step: 2 },
            { field: 'city', value: formData.personalDetails2?.city, step: 2 },
            { field: 'zip', value: formData.personalDetails2?.zip, step: 2 },
            { field: 'paymentMethod', value: formData.paymentMethod, step: 2 },
            { field: 'email', value: formData.email, step: 3 },
            { field: 'password', value: formData.password, step: 3 },
          ];

          for (const check of requiredChecks) {
            if (!check.value || (typeof check.value === 'string' && !check.value.trim())) {
              actions.setError(`${check.field} is missing. Please go back to Step ${check.step} and complete your information.`);
              return;
            }
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
            password: formData.password,
            userAgreementAccepted: formData.userAgreementAccepted
          };
          
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
          
          // Success - clear sensitive data and go to success page
          actions.clearSensitiveData();
          actions.setStep(5);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (state.step === 3 && state.authSubStep === 2) {
      actions.setAuthSubStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (state.step === 1) {
      router.push("/signup");
      return;
    }
    actions.setStep((Math.max(state.step - 1, 1)) as any);
    actions.setPersonalSubStep(1);
    actions.setAuthSubStep(1);
    actions.setValidationErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSidebarContent = () => {
    const titles = {
      1: "Criteria Verification",
      2: state.personalSubStep === 1 ? "Demographic Information" : "Contact Information",
      3: state.authSubStep === 1 ? "Email & Password Set Up" : "Email Verification",
      4: "User Agreement",
      5: "Sign Up Complete"
    };

    const descriptions = {
      1: "Please answer all questions honestly. Your responses help determine eligibility for jury service.",
      2: state.personalSubStep === 1 
        ? "Help us understand your background better. All fields on this page are required."
        : "Please fill out the following fields with necessary information. Any field with * is required.",
      3: state.authSubStep === 1
        ? "Create your login information to access the platform. Your password must meet all listed requirements."
        : "Enter the 6-digit verification code sent to your email to confirm your account.",
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