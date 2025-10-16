import React, { useState, useRef, useEffect } from 'react';
import { FormField, TextInput } from '../../../../components/forms/FormField';
import { AttorneyFormData, ValidationErrors } from '../../../../types/signup.types';
import { validatePasswordRequirements } from '../../../../lib/validation/validators';
import { Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';

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

  const passwordChecks = [
    { key: "hasLen", text: "Be at least 8 characters", valid: passwordValidation.hasLen },
    { key: "hasNum", text: "Have at least one number", valid: passwordValidation.hasNum },
    { key: "notSameAsName", text: "Not be the same as the account name", valid: passwordValidation.notSameAsName },
    { key: "noTriple", text: "Your password must not contain more than 2 consecutive identical characters", valid: passwordValidation.noTriple },
    { key: "hasUpper", text: "Have at least one capital letter", valid: passwordValidation.hasUpper },
    { key: "hasSpecial", text: "Have at least one special character (! @ # $ . – + , ;)", valid: passwordValidation.hasSpecial },
    { key: "passwordsMatch", text: "Re-typed password matches", valid: formData.password && formData.confirmPassword && formData.password === formData.confirmPassword },
  ];

  // Handle OTP input with auto-focus on next field
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const otpArray = (formData.otp || '').split('');
    otpArray[index] = value;
    const newOTP = otpArray.join('');
    
    onUpdate({ otp: newOTP });
    onClearError('otp');
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onUpdate({ otp: pastedData });
    onClearError('otp');
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = pastedData.length < 6 ? pastedData.length : 5;
    otpInputsRef.current[nextEmptyIndex]?.focus();
  };

  // Handle backspace
  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !formData.otp?.[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Auto-focus first OTP input when switching to sub-step 2
  useEffect(() => {
    if (authSubStep === 2) {
      otpInputsRef.current[0]?.focus();
    }
  }, [authSubStep]);

  // OTP verification screen (authSubStep 2)
  if (authSubStep === 2) {
    const otpDigits = (formData.otp || '').padEnd(6, ' ').split('');
    
    return (
      <div className="flex-1 flex flex-col pl-28">
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-full">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#16305B]">
              Verify Your Email
            </h1>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-[#16305B] font-medium mb-1">
                  We sent a 6-digit code to:
                </p>
                <p className="text-blue-900 font-bold text-lg">{formData.email}</p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
            <div>
              <label className="block text-sm font-semibold text-[#16305B] mb-3">
                Enter Verification Code *
              </label>
              <div className="flex gap-3 justify-start">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el: HTMLInputElement | null) => { otpInputsRef.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit === ' ' ? '' : digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    onPaste={handleOTPPaste}
                    className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      validationErrors.otp 
                        ? 'border-red-500 bg-red-50' 
                        : digit !== ' ' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 bg-white'
                    }`}
                  />
                ))}
              </div>
              {validationErrors.otp && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.otp}
                </p>
              )}
            </div>

            {error && (
              <div className={`p-3 rounded-lg text-sm ${
                error.includes('resent') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || (formData.otp || '').length !== 6}
                className={`w-full font-semibold px-8 py-3 rounded-md transition ${
                  loading || (formData.otp || '').length !== 6
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#16305B] text-white hover:bg-[#0A2342]"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
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
                  className="text-[#16305B] text-sm font-semibold hover:underline disabled:opacity-50"
                >
                  Resend verification code
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium mb-2">💡 Tips:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Check your spam/junk folder if you don't see the email</li>
                <li>The code expires in 10 minutes</li>
                <li>Make sure you entered the correct email address</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Original email/password form (authSubStep 1)
  return (
    <div className="flex-1 flex flex-col pl-28">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
          Sign Up: Attorney
        </h1>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FormField
            label="Email"
            required
            validationErrors={validationErrors}
            fieldName="email"
          >
            <TextInput
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(value) => {
                onUpdate({ email: value });
                onClearError('email');
              }}
              hasError={!!validationErrors.email}
              autoComplete="email"
            />
          </FormField>

          <FormField
            label="Password"
            required
            validationErrors={validationErrors}
            fieldName="password"
          >
            <div className="relative">
              <TextInput
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(value) => {
                  onUpdate({ password: value });
                  onClearError('password');
                }}
                hasError={!!validationErrors.password}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="mt-3 space-y-2 text-sm">
              {passwordChecks.slice(0, -1).map((check) => (
                <div key={check.key} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={Boolean(check.valid)}
                    readOnly
                    className="w-4 h-4 accent-[#16305B]" 
                  />
                  <span className={check.valid ? "text-green-600" : "text-[#16305B]"}>
                    {check.text}
                  </span>
                </div>
              ))}
            </div>
          </FormField>

          <FormField
            label="Re-type Password"
            required
            validationErrors={validationErrors}
            fieldName="confirmPassword"
          >
            <div className="relative">
              <TextInput
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-type Password"
                value={formData.confirmPassword}
                onChange={(value) => {
                  onUpdate({ confirmPassword: value });
                  onClearError('confirmPassword');
                }}
                hasError={!!validationErrors.confirmPassword}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Match Check */}
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={Boolean(passwordChecks[passwordChecks.length - 1].valid)} 
                  readOnly
                  className="w-4 h-4 accent-[#16305B]" 
                />
                <span className={passwordChecks[passwordChecks.length - 1].valid ? "text-green-600" : "text-[#16305B]"}>
                  {passwordChecks[passwordChecks.length - 1].text}
                </span>
              </div>
            </div>
          </FormField>

          <div className="pt-2">
            <button
              type="button"
              onClick={onNext}
              disabled={loading || !passwordValidation.all || formData.password !== formData.confirmPassword}
              className={`w-full font-semibold px-8 py-2 rounded-md transition ${
                loading || !passwordValidation.all || formData.password !== formData.confirmPassword
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#16305B] text-white hover:bg-[#0A2342]"
              }`}
            >
              {loading ? "Sending Verification Code..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}