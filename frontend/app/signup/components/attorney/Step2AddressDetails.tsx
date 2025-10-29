import React from 'react';
import { FormField, TextInput } from '../../../../components/forms/FormField';
import { LocationDropdown } from '../shared/LocationDropdown';
import { AttorneyFormData, LocationOption, ValidationErrors } from '../../../../types/signup.types';
import { Building, MapPin } from 'lucide-react';

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
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-2">
          Office Address
        </h1>
        <p className="text-gray-600">
          Please provide your registered office address. All fields marked with * are required.
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Office Address Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
            <Building className="text-blue-600" size={20} />
            Street Address
          </h3>

          <FormField
            label="Office Address Line 1"
            required
            validationErrors={validationErrors}
            fieldName="officeAddress1"
          >
            <TextInput
              placeholder="123 Main Street, Suite 400"
              value={formData.officeAddress1}
              onChange={(value) => {
                onUpdate({ officeAddress1: value });
                onClearError('officeAddress1');
              }}
              hasError={!!validationErrors.officeAddress1}
            />
          </FormField>

          <FormField
            label="Office Address Line 2"
            validationErrors={validationErrors}
            fieldName="officeAddress2"
          >
            <TextInput
              placeholder="Building B, Floor 3 (optional)"
              value={formData.officeAddress2}
              onChange={(value) => onUpdate({ officeAddress2: value })}
            />
          </FormField>
        </div>

        {/* Location Details Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
            <MapPin className="text-blue-600" size={20} />
            Location Details
          </h3>

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

          {!formData.state && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Please select a state in Step 1 before choosing a county.
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {formData.state && !formData.county && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Please select a county before choosing a city.
                  </p>
                </div>
              </div>
            </div>
          )}

          <FormField
            label="ZIP Code"
            required
            validationErrors={validationErrors}
            fieldName="zipCode"
          >
            <TextInput
              placeholder="12345"
              value={formData.zipCode}
              onChange={(value) => {
                const trimmed = value.slice(0, 10);
                onUpdate({ zipCode: trimmed });
                onClearError('zipCode');
              }}
              hasError={!!validationErrors.zipCode}
            />
          </FormField>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={onNext}
            className="w-full font-semibold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg bg-[#0A2342] text-white hover:bg-[#132c54] transform hover:scale-[1.02]"
          >
            Continue to Email & Password
          </button>
        </div>
      </form>
    </div>
  );
}