import React, { useState, useRef, useEffect } from 'react';
import { FormField, TextInput } from '../../../../components/forms/FormField';
import { AttorneyFormData, ValidationErrors } from '../../../../types/signup.types';
import { validatePasswordRequirements } from '../../../../lib/validation/validators';
import { Eye, EyeOff, Mail, Shield, ShieldCheck, Check } from 'lucide-react';

interface Step3EmailPasswordProps {
  formData: AttorneyFormData;
  onUpdate: (data: Partial<AttorneyFormData>) => void;
  validationErrors: ValidationErrors;
  onClearError: (field: string) => void;
  authSubStep: 1 | 2;
  onNext: () => void;
  loading?: boolean;
  onResendOTP?: () => void;
  error?: string | null;
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

export function Step3EmailPassword({
  formData,
  onUpdate,
  validationErrors,
  onClearError,
  authSubStep,
  onNext,
  loading = false,
  onResendOTP,
  error,
}: Step3EmailPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const passwordValidation = validatePasswordRequirements(
    formData.password,
    `${formData.firstName} ${formData.lastName}`.trim()
  );

  // Handle OTP input
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const otpArray = (formData.otp || '').split('');
    otpArray[index] = value;
    const newOTP = otpArray.join('');
    
    onUpdate({ otp: newOTP });
    onClearError('otp');
    
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onUpdate({ otp: pastedData });
    onClearError('otp');
    
    const nextEmptyIndex = pastedData.length < 6 ? pastedData.length : 5;
    otpInputsRef.current[nextEmptyIndex]?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!formData.otp?.[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      } else if (formData.otp?.[index]) {
        const otpArray = (formData.otp || '').split('');
        otpArray[index] = '';
        onUpdate({ otp: otpArray.join('') });
      }
    }
  };

  useEffect(() => {
    if (authSubStep === 2) {
      otpInputsRef.current[0]?.focus();
    }
  }, [authSubStep]);

  // OTP Verification Screen
  if (authSubStep === 2) {
    const otpDigits = (formData.otp || '').padEnd(6, ' ').split('');
    const isComplete = otpDigits.every(d => d !== ' ');
    
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[#0A2342] mb-3 text-center">
            Verify Your Email
          </h1>
          
          <p className="text-gray-600 text-center mb-8">
            We sent a 6-digit code to<br />
            <span className="font-bold text-[#0A2342] text-lg">{formData.email}</span>
          </p>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
            <div>
              <label className="block text-sm font-semibold text-[#0A2342] mb-4 text-center">
                Enter Verification Code
              </label>
              <div className="flex gap-3 justify-center mb-2">
                {otpDigits.map((digit, index) => {
                  const hasValue = digit !== ' ';
                  const isError = !!validationErrors.otp;
                  
                  return (
                    <div key={index} className="relative">
                      <input
                        ref={(el) => { otpInputsRef.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit === ' ' ? '' : digit}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                        onPaste={handleOTPPaste}
                        className={`
                          w-14 h-16 text-center text-2xl font-bold rounded-xl
                          border-2 transition-all duration-200
                          focus:outline-none focus:ring-4
                          ${isError 
                            ? 'border-red-400 bg-red-50 text-red-600 focus:ring-red-100 focus:border-red-500' 
                            : hasValue 
                            ? 'border-blue-500 bg-blue-50 text-[#0A2342] focus:ring-blue-100 focus:border-blue-600 shadow-sm' 
                            : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-50 focus:border-blue-400 hover:border-gray-400'
                          }
                        `}
                      />
                      {hasValue && !isError && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                          <Check size={12} className="text-white font-bold" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {validationErrors.otp && (
                <p className="text-red-500 text-sm mt-3 text-center flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.otp}
                </p>
              )}
              {isComplete && !validationErrors.otp && (
                <p className="text-green-600 text-sm mt-3 text-center flex items-center justify-center gap-1 font-medium">
                  <Check size={16} />
                  Code entered successfully!
                </p>
              )}
            </div>

            {error && (
              <div className={`p-4 rounded-xl text-sm text-center font-medium ${
                error.includes('resent') 
                  ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                  : 'bg-red-50 text-red-700 border-2 border-red-200'
              }`}>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || !isComplete}
                className={`w-full font-semibold px-8 py-4 rounded-xl transition-all shadow-md ${
                  loading || !isComplete
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0A2342] to-[#132c54] text-white hover:shadow-xl transform hover:scale-[1.02]"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying Code...
                  </span>
                ) : (
                  "Verify Email"
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={onResendOTP}
                  disabled={loading}
                  className="text-[#0A2342] text-sm font-semibold hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Mail size={14} />
                  Resend verification code
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <p className="font-medium text-sm mb-2 text-gray-700">💡 Helpful Tips:</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Check your spam/junk folder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Code expires in 10 minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Make sure your email is correct</span>
                </li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Email & Password Form
  const passwordChecks = [
    { ok: passwordValidation.hasLen, text: "At least 8 characters long" },
    { ok: passwordValidation.hasNum, text: "Contains at least 1 number" },
    { ok: passwordValidation.hasUpper, text: "Contains at least 1 uppercase letter" },
    { ok: passwordValidation.hasSpecial, text: "Contains at least 1 special character" },
    { ok: passwordValidation.notSameAsName, text: "Not the same as your name" },
    { ok: passwordValidation.noTriple, text: "No more than 2 consecutive identical characters" },
  ];

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
        {/* Email Card */}
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
                placeholder="attorney@lawfirm.com"
                value={formData.email}
                onChange={(value) => {
                  onUpdate({ email: value });
                  onClearError('email');
                }}
                hasError={!!validationErrors.email}
                autoComplete="email"
                className="pl-10"
              />
            </div>
          </FormField>
        </div>

        {/* Password Card */}
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
                onChange={(value) => {
                  onUpdate({ password: value });
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
              <Checklist items={passwordChecks} />
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
                onChange={(value) => {
                  onUpdate({ confirmPassword: value });
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