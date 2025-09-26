import React, { useState } from 'react';
import { FormField, TextInput } from '../../../../components/forms/FormField';
import { AttorneyFormData, ValidationErrors } from '../../../../types/signup.types';
import { validatePasswordRequirements } from '@/lib/validation/validator';
import { Eye, EyeOff } from 'lucide-react';

interface Step3EmailPasswordProps {
  formData: AttorneyFormData;
  onUpdate: (data: Partial<AttorneyFormData>) => void;
  validationErrors: ValidationErrors;
  onClearError: (field: string) => void;
  onNext: () => void;
  loading?: boolean;
}

export function Step3EmailPassword({
  formData,
  onUpdate,
  validationErrors,
  onClearError,
  onNext,
  loading = false,
}: Step3EmailPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                    onChange={() => {}} 
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
                    onChange={() => {}} 
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
              {loading ? "Processing..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}