import React, { useState } from 'react';
import { FormField, TextInput } from '../../../../components/forms/FormField';
import { JurorFormData, ValidationErrors } from '../../../../types/signup.types';
import { validatePasswordRequirements } from '../../../../lib/validation/validator';
import { Eye, EyeOff, Check } from 'lucide-react';

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
            className={`mt-1 inline-flex items-center justify-center w-5 h-5 rounded-sm border ${
              item.ok ? "bg-[#0A2342] border-[#0A2342]" : "bg-white border-gray-300"
            }`}
          >
            {item.ok && <Check size={12} color="#F6E27F" />}
          </div>
          <div className={`text-gray-700 ${item.ok ? 'text-green-700' : ''}`}>{item.text}</div>
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
  onResendEmail,
}: Step3EmailPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValidation = validatePasswordRequirements(
    formData.password,
    formData.personalDetails2.name
  );

  if (authSubStep === 2) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-8">
          Verify your email
        </h1>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            We sent a verification link to <strong>{formData.email}</strong>. Open the link from your inbox.
            It will open a new tab and continue this signup to Step 4 automatically.
          </p>
          <p className="text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              type="button"
              className="underline text-[#0A2342] hover:text-[#132c54]"
              onClick={onResendEmail}
            >
              resend the link
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-[#0A2342] mb-8">
        Sign Up: Juror
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
            placeholder="johndoe@gmail.com"
            value={formData.email}
            onChange={(val) => {
              onUpdate({ email: val });
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
              placeholder=""
              value={formData.password}
              onChange={(val) => {
                onUpdate({ password: val });
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

          <div className="mt-2">
            <Checklist
              items={[
                { ok: passwordValidation.hasLen, text: "Be at least 8 characters" },
                { ok: passwordValidation.hasNum, text: "Have at least 1 number" },
                { ok: passwordValidation.notSameAsName, text: "Not be the same as the account name" },
                { ok: passwordValidation.noTriple, text: "Your password must not contain more than 2 consecutive identical characters" },
                { ok: passwordValidation.hasUpper, text: "Have at least 1 capital letter" },
                { ok: passwordValidation.hasSpecial, text: "Have at least 1 special character" },
              ]}
            />
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
              placeholder=""
              value={formData.confirmPassword}
              onChange={(val) => {
                onUpdate({ confirmPassword: val });
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

          <div className="mt-2">
            <Checklist 
              items={[{ 
                ok: formData.confirmPassword === formData.password && formData.password.length > 0, 
                text: "Re-typed password must match" 
              }]} 
            />
          </div>
        </FormField>

        <div className="pt-6">
          <button
            type="button"
            onClick={onNext}
            disabled={loading || !passwordValidation.all || formData.password !== formData.confirmPassword}
            className={`w-full font-medium px-8 py-3 rounded-md transition ${
              loading || !passwordValidation.all || formData.password !== formData.confirmPassword
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-[#0A2342] text-white hover:bg-[#132c54]"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating email...
              </span>
            ) : (
              "Next"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}