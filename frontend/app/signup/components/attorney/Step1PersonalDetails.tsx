import React from 'react';
import { FormField, TextInput } from '../../../../components/forms/FormField';
import { LocationDropdown } from '../shared/LocationDropdown';
import { AttorneyFormData, LocationOption, ValidationErrors } from '../../../../types/signup.types';

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
    <div className="flex-1 flex flex-col pl-28">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
          Sign Up: Attorney
        </h1>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FormField
            label="Who is signing up?"
            required
            validationErrors={validationErrors}
            fieldName="isAttorney"
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.isAttorney}
                onChange={(e) => {
                  onUpdate({ isAttorney: e.target.checked });
                  onClearError('isAttorney');
                }}
                className="w-4 h-4 accent-[#16305B]"
              />
              <span className="text-[#16305B] text-sm">
                I confirm I am the attorney registering.
              </span>
            </div>
          </FormField>

          <FormField
            label="First Name"
            required
            validationErrors={validationErrors}
            fieldName="firstName"
          >
            <TextInput
              placeholder="First Name"
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
              placeholder="Middle Name"
              value={formData.middleName}
              onChange={(value) => onUpdate({ middleName: value })}
            />
          </FormField>

          <FormField
            label="Last Name"
            required
            validationErrors={validationErrors}
            fieldName="lastName"
          >
            <TextInput
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(value) => {
                onUpdate({ lastName: value });
                onClearError('lastName');
              }}
              hasError={!!validationErrors.lastName}
            />
          </FormField>

          <FormField
            label="Law Firm Entity Name"
            required
            validationErrors={validationErrors}
            fieldName="lawFirmName"
          >
            <TextInput
              placeholder="Law Firm Entity Name"
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
            <TextInput
              type="tel"
              placeholder="(000) 000-0000"
              value={formData.phoneNumber}
              onChange={(value) => {
                onUpdate({ phoneNumber: value });
                onClearError('phoneNumber');
              }}
              hasError={!!validationErrors.phoneNumber}
            />
          </FormField>

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
              placeholder="State Bar Number"
              value={formData.stateBarNumber}
              onChange={(value) => {
                onUpdate({ stateBarNumber: value });
                onClearError('stateBarNumber');
              }}
              hasError={!!validationErrors.stateBarNumber}
            />
          </FormField>

          <div className="pt-2">
            <button
              type="button"
              onClick={onNext}
              className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}