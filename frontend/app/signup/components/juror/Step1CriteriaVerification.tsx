import React from 'react';
import { FormField } from '../../../../components/forms/FormField';
import { JurorFormData, ValidationErrors } from '../../../../types/signup.types';
import { CheckCircle2, Circle } from 'lucide-react';

interface Step1CriteriaVerificationProps {
  formData: JurorFormData;
  onUpdate: (data: Partial<JurorFormData>) => void;
  validationErrors: ValidationErrors;
  onClearError: (field: string) => void;
  onNext: () => void;
}

interface QuestionProps {
  label: string;
  name: keyof JurorFormData['criteriaAnswers'];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function Question({ label, name, value, onChange, error }: QuestionProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#0A2342] transition-all shadow-sm hover:shadow-md">
      <FormField
        label={label}
        required
        error={error}
      >
        <div className="flex gap-6 mt-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="radio" 
                name={name} 
                value="yes" 
                checked={value === "yes"}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only" 
              />
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                value === "yes" 
                  ? "border-[#0A2342] bg-[#0A2342]" 
                  : "border-gray-300 group-hover:border-[#0A2342]"
              }`}>
                {value === "yes" && <CheckCircle2 size={16} className="text-white" />}
              </div>
            </div>
            <span className={`font-medium transition-colors ${
              value === "yes" ? "text-[#0A2342]" : "text-gray-600 group-hover:text-[#0A2342]"
            }`}>
              Yes
            </span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="radio" 
                name={name} 
                value="no" 
                checked={value === "no"}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only" 
              />
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                value === "no" 
                  ? "border-[#0A2342] bg-[#0A2342]" 
                  : "border-gray-300 group-hover:border-[#0A2342]"
              }`}>
                {value === "no" && <CheckCircle2 size={16} className="text-white" />}
              </div>
            </div>
            <span className={`font-medium transition-colors ${
              value === "no" ? "text-[#0A2342]" : "text-gray-600 group-hover:text-[#0A2342]"
            }`}>
              No
            </span>
          </label>
        </div>
      </FormField>
    </div>
  );
}

export function Step1CriteriaVerification({
  formData,
  onUpdate,
  validationErrors,
  onClearError,
  onNext,
}: Step1CriteriaVerificationProps) {
  const handleCriteriaChange = (field: keyof JurorFormData['criteriaAnswers'], value: string) => {
    onUpdate({
      criteriaAnswers: {
        ...formData.criteriaAnswers,
        [field]: value,
      },
    });
    onClearError(`criteriaAnswers.${field}`);
    onClearError('criteriaAnswers.eligibility');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-2">
          Eligibility Verification
        </h1>
        <p className="text-gray-600">
          Please answer the following questions honestly to determine your eligibility for jury service.
        </p>
      </div>
      
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <Question 
          label="Have you been convicted of a felony within the past ten (10) years for which your rights have not been restored?" 
          name="felony" 
          value={formData.criteriaAnswers.felony}
          onChange={(value) => handleCriteriaChange('felony', value)}
          error={validationErrors['criteriaAnswers.felony']}
        />
        
        <Question 
          label="Are you currently under indictment for or charged with a felony?" 
          name="indictment" 
          value={formData.criteriaAnswers.indictment}
          onChange={(value) => handleCriteriaChange('indictment', value)}
          error={validationErrors['criteriaAnswers.indictment']}
        />
        
        <Question 
          label="Are you at least 18 years old?" 
          name="age" 
          value={formData.criteriaAnswers.age}
          onChange={(value) => handleCriteriaChange('age', value)}
          error={validationErrors['criteriaAnswers.age']}
        />
        
        <Question 
          label="Are you a citizen of the United States?" 
          name="citizen" 
          value={formData.criteriaAnswers.citizen}
          onChange={(value) => handleCriteriaChange('citizen', value)}
          error={validationErrors['criteriaAnswers.citizen']}
        />
        
        <Question
          label="Do you or your spouse, parents, or children work for a law firm, an insurance company or a claims adjusting company?"
          name="work1"
          value={formData.criteriaAnswers.work1}
          onChange={(value) => handleCriteriaChange('work1', value)}
          error={validationErrors['criteriaAnswers.work1']}
        />
        
        <Question
          label="Have you, your spouse, parents or children worked for a law firm, an insurance company or a claims adjusting company within the past year?"
          name="work2"
          value={formData.criteriaAnswers.work2}
          onChange={(value) => handleCriteriaChange('work2', value)}
          error={validationErrors['criteriaAnswers.work2']}
        />
        
        {validationErrors['criteriaAnswers.eligibility'] && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-red-100 rounded-full p-2">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-700 text-sm font-medium flex-1">{validationErrors['criteriaAnswers.eligibility']}</p>
          </div>
        )}

        <div className="pt-6">
          <button
            type="button"
            onClick={onNext}
            className="w-full font-semibold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg bg-[#0A2342] text-white hover:bg-[#132c54] transform hover:scale-[1.02]"
          >
            Continue to Personal Details
          </button>
        </div>
      </form>
    </div>
  );
}