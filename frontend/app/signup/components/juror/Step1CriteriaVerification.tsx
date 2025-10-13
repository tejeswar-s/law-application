import React from 'react';
import { FormField } from '../../../../components/forms/FormField';
import { JurorFormData, ValidationErrors } from '../../../../types/signup.types';

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
    <FormField
      label={label}
      required
      error={error}
    >
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-gray-600">
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
        <label className="flex items-center gap-2 text-gray-600">
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
    </FormField>
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
      <h1 className="text-3xl font-bold text-[#0A2342] mb-8">
        Sign Up: Juror
      </h1>
      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
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
        
        <Question 
          label="Have you been convicted of a felony or other disqualifying offense (and if so, has your right to serve been restored)?" 
          name="felony" 
          value={formData.criteriaAnswers.felony}
          onChange={(value) => handleCriteriaChange('felony', value)}
          error={validationErrors['criteriaAnswers.felony']}
        />
        
        <Question 
          label="Are you currently under indictment or legal charges for a felony?" 
          name="indictment" 
          value={formData.criteriaAnswers.indictment}
          onChange={(value) => handleCriteriaChange('indictment', value)}
          error={validationErrors['criteriaAnswers.indictment']}
        />
        
        {validationErrors['criteriaAnswers.eligibility'] && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">{validationErrors['criteriaAnswers.eligibility']}</p>
          </div>
        )}

        <div className="pt-6">
          <button
            type="button"
            onClick={onNext}
            className="w-full font-medium px-8 py-3 rounded-md transition bg-[#0A2342] text-white hover:bg-[#132c54]"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}