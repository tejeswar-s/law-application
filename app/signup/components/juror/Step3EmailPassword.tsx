import React, { useState } from 'react';
import { FormField, TextInput } from '../../../../components/forms/FormField';
import { JurorFormData, ValidationErrors } from '../../../../types/signup.types';
import { validatePasswordRequirements } from '../../../../lib/validation/validators';
import { Eye, EyeOff, Check, Mail, Shield } from 'lucide-react';

interface Step3EmailPasswordProps {
  formData: JurorFormData;
  onUpdate: (data: Partial<JurorFormData>) => void;
  validationErrors: ValidationErrors;
  onClearError: (field: string) => void;
  authSubStep: 1 | 2;
  onNext: () => void;
  loading?: boolean;
  onResendEmail?: () => void;
}

interface ChecklistItem {
  ok: boolean;
  text: string;
}

function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="text-sm space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <div
            className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
              item.ok ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
            }`}
          >
            {item.ok && <Check size={12} className="text-white font-bold" />}
          </div>
          <div className={`flex-1 ${item.ok ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
            {item.text}
          </div>
        </li>
      ))}
    </ul>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function Step3EmailPassword({
  formData,
  onUpdate,
  validationErrors,
  onClearError,
  authSubStep,
  onNext,
  loading = false,
  onResendEmail,
}: Step3EmailPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const passwordValidation = validatePasswordRequirements(
    formData.password,
    formData.personalDetails2.name
  );

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError('Please enter a valid 6-digit code');
      return;
    }

    setVerifyingCode(true);
    setCodeError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/juror/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: verificationCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.message || 'Invalid verification code');
        return;
      }

      // Success - mark as verified and move to next step
      onUpdate({ emailVerified: true });
      onNext();
    } catch (err) {
      setCodeError('Network error. Please try again.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setCodeError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/juror/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      if (res.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (err) {
      setCodeError('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (authSubStep === 2) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#0A2342]" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[#0A2342] mb-3 text-center">
            Verify Your Email
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            We sent a 6-digit verification code to<br />
            <strong className="text-[#0A2342]">{formData.email}</strong>
          </p>

          <div className="mb-6">
            <FormField label="Enter Verification Code" required>
              <div className="flex gap-2">
                <TextInput
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(val) => {
                    setVerificationCode(val.replace(/\D/g, '').slice(0, 6));
                    setCodeError('');
                  }}
                  className="text-center text-2xl font-bold tracking-widest"
                  hasError={!!codeError}
                />
              </div>
            </FormField>
            {codeError && (
              <p className="text-red-500 text-sm mt-2">{codeError}</p>
            )}
            {resendSuccess && (
              <p className="text-green-600 text-sm mt-2">✓ Code resent successfully!</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={verifyingCode || verificationCode.length !== 6}
            className={`w-full font-semibold px-8 py-4 rounded-xl transition-all shadow-md mb-4 ${
              verifyingCode || verificationCode.length !== 6
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#0A2342] text-white hover:bg-[#132c54] hover:shadow-lg transform hover:scale-[1.02]"
            }`}
          >
            {verifyingCode ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>

          <div className="text-center text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendLoading}
              className="text-[#0A2342] font-semibold hover:underline disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-2">
          Create Your Account
        </h1>
        <p className="text-gray-600">
          Set up your login credentials. Your password must meet all security requirements.
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <FormField
            label="Email Address"
            required
            validationErrors={validationErrors}
            fieldName="email"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <TextInput
                type="email"
                placeholder="johndoe@gmail.com"
                value={formData.email}
                onChange={(val) => {
                  onUpdate({ email: val });
                  onClearError('email');
                }}
                hasError={!!validationErrors.email}
                autoComplete="email"
                className="pl-10"
              />
            </div>
          </FormField>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-6">
          <FormField
            label="Password"
            required
            validationErrors={validationErrors}
            fieldName="password"
          >
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
              <TextInput
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(val) => {
                  onUpdate({ password: val });
                  onClearError('password');
                }}
                hasError={!!validationErrors.password}
                autoComplete="new-password"
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 z-10"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-3">Password Requirements:</p>
              <Checklist
                items={[
                  { ok: passwordValidation.hasLen, text: "At least 8 characters long" },
                  { ok: passwordValidation.hasNum, text: "Contains at least 1 number" },
                  { ok: passwordValidation.hasUpper, text: "Contains at least 1 uppercase letter" },
                  { ok: passwordValidation.hasSpecial, text: "Contains at least 1 special character" },
                  { ok: passwordValidation.notSameAsName, text: "Not the same as your name" },
                  { ok: passwordValidation.noTriple, text: "No more than 2 consecutive identical characters" },
                ]}
              />
            </div>
          </FormField>

          <FormField
            label="Confirm Password"
            required
            validationErrors={validationErrors}
            fieldName="confirmPassword"
          >
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
              <TextInput
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(val) => {
                  onUpdate({ confirmPassword: val });
                  onClearError('confirmPassword');
                }}
                hasError={!!validationErrors.confirmPassword}
                autoComplete="new-password"
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 z-10"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <Checklist 
                items={[{ 
                  ok: formData.confirmPassword === formData.password && formData.password.length > 0, 
                  text: "Passwords match" 
                }]} 
              />
            </div>
          </FormField>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={onNext}
            disabled={loading || !passwordValidation.all || formData.password !== formData.confirmPassword}
            className={`w-full font-semibold px-8 py-4 rounded-xl transition-all shadow-md ${
              loading || !passwordValidation.all || formData.password !== formData.confirmPassword
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-[#0A2342] text-white hover:bg-[#132c54] hover:shadow-lg transform hover:scale-[1.02]"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Code...
              </span>
            ) : (
              "Continue to Verification"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}