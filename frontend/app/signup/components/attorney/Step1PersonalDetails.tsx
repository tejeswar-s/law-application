import React from 'react';
import { FormField, TextInput, Select } from '../../../../components/forms/FormField';
import { LocationDropdown } from '../shared/LocationDropdown';
import { AttorneyFormData, LocationOption, ValidationErrors } from '../../../../types/signup.types';
import { User, Building2, Phone, MapPin, Award } from 'lucide-react';

interface Step1PersonalDetailsProps {
  formData: AttorneyFormData;
  onUpdate: (data: Partial<AttorneyFormData>) => void;
  validationErrors: ValidationErrors;
  onClearError: (field: string) => void;
  availableStates: LocationOption[];
  onNext: () => void;
}

export function Step1PersonalDetails({
  formData,
  onUpdate,
  validationErrors,
  onClearError,
  availableStates,
  onNext,
}: Step1PersonalDetailsProps) {
  const handleStateChange = (option: LocationOption) => {
    onUpdate({
      state: option.label,
      stateCode: option.value,
      addressState: option.label,
    });
    onClearError('state');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-2">
          Personal Information
        </h1>
        <p className="text-gray-600">
          Please provide your professional details. All fields marked with * are required.
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Attorney Confirmation */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
          <FormField
            label="Attorney Confirmation"
            required
            validationErrors={validationErrors}
            fieldName="isAttorney"
          >
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.isAttorney}
                  onChange={(e) => {
                    onUpdate({ isAttorney: e.target.checked });
                    onClearError('isAttorney');
                  }}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  formData.isAttorney 
                    ? "bg-[#0A2342] border-[#0A2342]" 
                    : "bg-white border-gray-300 group-hover:border-[#0A2342]"
                }`}>
                  {formData.isAttorney && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`font-medium transition-colors ${
                formData.isAttorney ? "text-[#0A2342]" : "text-gray-600 group-hover:text-[#0A2342]"
              }`}>
                I confirm I am the attorney registering
              </span>
            </label>
          </FormField>
        </div>

        {/* Personal Details Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            Personal Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="First Name"
              required
              validationErrors={validationErrors}
              fieldName="firstName"
            >
              <TextInput
                placeholder="John"
                value={formData.firstName}
                onChange={(value) => {
                  onUpdate({ firstName: value });
                  onClearError('firstName');
                }}
                hasError={!!validationErrors.firstName}
              />
            </FormField>

            <FormField
              label="Middle Name"
              validationErrors={validationErrors}
              fieldName="middleName"
            >
              <TextInput
                placeholder="Michael"
                value={formData.middleName}
                onChange={(value) => onUpdate({ middleName: value })}
              />
            </FormField>
          </div>

          <FormField
            label="Last Name"
            required
            validationErrors={validationErrors}
            fieldName="lastName"
          >
            <TextInput
              placeholder="Doe"
              value={formData.lastName}
              onChange={(value) => {
                onUpdate({ lastName: value });
                onClearError('lastName');
              }}
              hasError={!!validationErrors.lastName}
            />
          </FormField>
        </div>

        {/* Professional Details Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
            <Building2 className="text-blue-600" size={20} />
            Professional Information
          </h3>

          <FormField
            label="Law Firm Entity Name"
            required
            validationErrors={validationErrors}
            fieldName="lawFirmName"
          >
            <TextInput
              placeholder="Smith & Associates Law Firm"
              value={formData.lawFirmName}
              onChange={(value) => {
                onUpdate({ lawFirmName: value });
                onClearError('lawFirmName');
              }}
              hasError={!!validationErrors.lawFirmName}
            />
          </FormField>

          <FormField
            label="Phone Number"
            required
            validationErrors={validationErrors}
            fieldName="phoneNumber"
          >
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <TextInput
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phoneNumber}
                onChange={(value) => {
                  onUpdate({ phoneNumber: value });
                  onClearError('phoneNumber');
                }}
                hasError={!!validationErrors.phoneNumber}
                className="pl-10"
              />
            </div>
          </FormField>
        </div>

        {/* Bar License Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
            <Award className="text-blue-600" size={20} />
            Bar License Information
          </h3>

          <LocationDropdown
            label="State"
            value={formData.state}
            onChange={handleStateChange}
            options={availableStates}
            placeholder="Search for your state"
            required
            error={validationErrors.state}
          />

          <FormField
            label="State Bar Number"
            required
            validationErrors={validationErrors}
            fieldName="stateBarNumber"
          >
            <TextInput
              placeholder="123456789"
              value={formData.stateBarNumber}
              onChange={(value) => {
                onUpdate({ stateBarNumber: value });
                onClearError('stateBarNumber');
              }}
              hasError={!!validationErrors.stateBarNumber}
            />
          </FormField>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={onNext}
            className="w-full font-semibold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg bg-[#0A2342] text-white hover:bg-[#132c54] transform hover:scale-[1.02]"
          >
            Continue to Address Details
          </button>
        </div>
      </form>
    </div>
  );
}