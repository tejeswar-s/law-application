import React from 'react';
import { FormField, TextInput } from '../../../../components/forms/FormField';
import { LocationDropdown } from '../shared/LocationDropdown';
import { AttorneyFormData, LocationOption, ValidationErrors } from '../../../../types/signup.types';

interface Step2AddressDetailsProps {
  formData: AttorneyFormData;
  onUpdate: (data: Partial<AttorneyFormData>) => void;
  validationErrors: ValidationErrors;
  onClearError: (field: string) => void;
  availableCounties: LocationOption[];
  availableCities: LocationOption[];
  countiesLoading?: boolean;
  citiesLoading?: boolean;
  onNext: () => void;
}

export function Step2AddressDetails({
  formData,
  onUpdate,
  validationErrors,
  onClearError,
  availableCounties,
  availableCities,
  countiesLoading = false,
  citiesLoading = false,
  onNext,
}: Step2AddressDetailsProps) {
  const handleCountyChange = (option: LocationOption) => {
    onUpdate({
      county: option.label,
      countyCode: option.value,
      // Clear city when county changes
      city: '',
      cityCode: '',
    });
    onClearError('county');
  };

  const handleCityChange = (option: LocationOption) => {
    onUpdate({
      city: option.label,
      cityCode: option.value,
    });
    onClearError('city');
  };

  return (
    <div className="flex-1 flex flex-col pl-28">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
          Sign Up: Attorney
        </h1>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FormField
            label="Office Address 1"
            required
            validationErrors={validationErrors}
            fieldName="officeAddress1"
          >
            <TextInput
              placeholder="Office Address 1"
              value={formData.officeAddress1}
              onChange={(value) => {
                onUpdate({ officeAddress1: value });
                onClearError('officeAddress1');
              }}
              hasError={!!validationErrors.officeAddress1}
            />
          </FormField>

          <FormField
            label="Office Address 2"
            validationErrors={validationErrors}
            fieldName="officeAddress2"
          >
            <TextInput
              placeholder="Office Address 2"
              value={formData.officeAddress2}
              onChange={(value) => onUpdate({ officeAddress2: value })}
            />
          </FormField>

          <LocationDropdown
            label="County"
            value={formData.county}
            onChange={handleCountyChange}
            options={availableCounties}
            placeholder="Search for your county"
            required
            disabled={!formData.state}
            loading={countiesLoading}
            error={validationErrors.county}
            searchPlaceholder="Type to search counties..."
          />

          <LocationDropdown
            label="City"
            value={formData.city}
            onChange={handleCityChange}
            options={availableCities}
            placeholder="Search for your city"
            required
            disabled={!formData.county}
            loading={citiesLoading}
            error={validationErrors.city}
            searchPlaceholder="Type to search cities..."
          />

          <FormField
            label="ZIP Code"
            required
            validationErrors={validationErrors}
            fieldName="zipCode"
          >
            <TextInput
              placeholder="ZIP Code"
              value={formData.zipCode}
              onChange={(value) => {
                onUpdate({ zipCode: value });
                onClearError('zipCode');
              }}
              hasError={!!validationErrors.zipCode}
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