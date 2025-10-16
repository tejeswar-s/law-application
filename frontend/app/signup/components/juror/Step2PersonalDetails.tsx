import React, { useEffect } from 'react';
import { FormField, TextInput, Select } from '../../../../components/forms/FormField';
import { LocationDropdown } from '../shared/LocationDropdown';
import { JurorFormData, LocationOption, ValidationErrors } from '../../../../types/signup.types';
import { Check, CreditCard } from 'lucide-react';

interface Step2PersonalDetailsProps {
  formData: JurorFormData;
  onUpdate: (data: Partial<JurorFormData>) => void;
  validationErrors: ValidationErrors;
  onClearError: (field: string) => void;
  personalSubStep: 1 | 2;
  availableStates: LocationOption[];
  availableCounties: LocationOption[];
  availableCities: LocationOption[];
  countiesLoading?: boolean;
  citiesLoading?: boolean;
  onNext: () => void;
}

interface PaymentMethodButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

function PaymentMethodButton({ label, selected, onClick, icon }: PaymentMethodButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border-2 rounded-xl px-4 py-4 text-left transition-all shadow-sm hover:shadow-md ${
        selected 
          ? "border-[#0A2342] ring-2 ring-[#0A2342] ring-offset-2 bg-blue-50" 
          : "border-gray-300 hover:border-[#0A2342] bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            selected ? "bg-[#0A2342] border-[#0A2342]" : "bg-white border-gray-300"
          }`}
        >
          {selected && <Check size={14} className="text-white font-bold" />}
        </div>
        <div className="flex items-center gap-2 flex-1">
          {icon}
          <div className="text-[#0A2342] font-semibold">{label}</div>
        </div>
      </div>
    </button>
  );
}

export function Step2PersonalDetails({
  formData,
  onUpdate,
  validationErrors,
  onClearError,
  personalSubStep,
  availableStates,
  availableCounties,
  availableCities,
  countiesLoading = false,
  citiesLoading = false,
  onNext,
}: Step2PersonalDetailsProps) {
  const isMarried = formData.personalDetails1.maritalStatus === "Married";

  // Auto-fill "Not Applicable" when not married
  useEffect(() => {
    if (!isMarried) {
      if (formData.personalDetails1.spouseEmployer !== "Not Applicable" ||
          formData.personalDetails1.employerName !== "Not Applicable" ||
          formData.personalDetails1.employerAddress !== "Not Applicable") {
        onUpdate({
          personalDetails1: {
            ...formData.personalDetails1,
            spouseEmployer: "Not Applicable",
            employerName: "Not Applicable",
            employerAddress: "Not Applicable"
          }
        });
      }
    }
  }, [isMarried]);

  const handleStateChange = (option: LocationOption) => {
    onUpdate({
      stateCode: option.value,
      personalDetails2: {
        ...formData.personalDetails2,
        state: option.label,
        county: '',
        city: '',
      },
      countyCode: '',
      cityCode: '',
    });
    onClearError('personalDetails2.state');
  };

  const handleCountyChange = (option: LocationOption) => {
    onUpdate({
      countyCode: option.value,
      personalDetails2: {
        ...formData.personalDetails2,
        county: option.label,
        city: '',
      },
      cityCode: '',
    });
    onClearError('personalDetails2.county');
  };

  const handleCityChange = (option: LocationOption) => {
    onUpdate({
      cityCode: option.value,
      personalDetails2: {
        ...formData.personalDetails2,
        city: option.label,
      },
    });
    onClearError('personalDetails2.city');
  };

  if (personalSubStep === 1) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0A2342] mb-2">
            Demographic Information
          </h1>
          <p className="text-gray-600">
            Help us understand your background better. All fields on this page are required.
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <FormField label="Marital Status" required>
              <Select
                value={formData.personalDetails1.maritalStatus}
                onChange={(val) => {
                  onUpdate({
                    personalDetails1: { ...formData.personalDetails1, maritalStatus: val }
                  });
                }}
                options={["Single", "Married", "Divorced", "Widowed", "Prefer not to say"]}
                placeholder="Select your marital status"
              />
            </FormField>
          </div>

          {isMarried && (
            <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0A2342] mb-4">Spouse Information</h3>
              
              <div className="space-y-4">
                <FormField label="Spouse Employer Name" required>
                  <TextInput
                    placeholder="e.g., Dallas Marketing Services"
                    value={formData.personalDetails1.spouseEmployer}
                    onChange={(val) => onUpdate({
                      personalDetails1: { ...formData.personalDetails1, spouseEmployer: val }
                    })}
                  />
                </FormField>

                <FormField label="Spouse Employer Address" required>
                  <TextInput
                    placeholder="e.g., 1425 Mockingbird Plaza, Suite 320, Dallas, TX 75247"
                    value={formData.personalDetails1.employerAddress}
                    onChange={(val) => onUpdate({
                      personalDetails1: { ...formData.personalDetails1, employerAddress: val }
                    })}
                  />
                </FormField>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0A2342] mb-4">Employment Information</h3>
            
            <FormField label="Your Employer Name" required>
              <TextInput
                placeholder="e.g., Lone Star Innovations LLC"
                value={formData.personalDetails1.employerName}
                onChange={(val) => onUpdate({
                  personalDetails1: { ...formData.personalDetails1, employerName: val }
                })}
                disabled={!isMarried}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <FormField label="Years in County" required>
                <Select
                  value={formData.personalDetails1.yearsInCounty}
                  onChange={(val) => onUpdate({
                    personalDetails1: { ...formData.personalDetails1, yearsInCounty: val }
                  })}
                  options={["One", "Two", "Three", "Four", "Five", "Six or more"]}
                  placeholder="Select years"
                />
              </FormField>
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <FormField label="Age Range" required>
                <Select
                  value={formData.personalDetails1.ageRange}
                  onChange={(val) => onUpdate({
                    personalDetails1: { ...formData.personalDetails1, ageRange: val }
                  })}
                  options={["18-24", "25-29", "30-39", "40-49", "50-59", "60+"]}
                  placeholder="Select age range"
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <FormField label="Gender" required>
                <Select
                  value={formData.personalDetails1.gender}
                  onChange={(val) => onUpdate({
                    personalDetails1: { ...formData.personalDetails1, gender: val }
                  })}
                  options={["Male", "Female", "Other", "Prefer not to say"]}
                  placeholder="Select gender"
                />
              </FormField>
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <FormField label="Highest Level of Education" required>
                <Select
                  value={formData.personalDetails1.education}
                  onChange={(val) => onUpdate({
                    personalDetails1: { ...formData.personalDetails1, education: val }
                  })}
                  options={[
                    "High School",
                    "Associate's Degree",
                    "Bachelor's Degree",
                    "Master's Degree",
                    "Doctorate",
                  ]}
                  placeholder="Select education"
                />
              </FormField>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={onNext}
              className="w-full font-semibold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg bg-[#0A2342] text-white hover:bg-[#132c54] transform hover:scale-[1.02]"
            >
              Continue to Contact Information
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-2">
          Contact Information
        </h1>
        <p className="text-gray-600">
          Please provide your contact details and payment preferences. All fields are required.
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-4">
          <FormField
            label="Full Name"
            required
            validationErrors={validationErrors}
            fieldName="personalDetails2.name"
          >
            <TextInput
              placeholder="John Doe"
              value={formData.personalDetails2.name}
              onChange={(val) => {
                onUpdate({
                  personalDetails2: { ...formData.personalDetails2, name: val }
                });
                onClearError('personalDetails2.name');
              }}
              hasError={!!validationErrors['personalDetails2.name']}
            />
          </FormField>

          <FormField
            label="Phone Number"
            required
            validationErrors={validationErrors}
            fieldName="personalDetails2.phone"
          >
            <TextInput
              type="tel"
              placeholder="(832) 674-8776"
              value={formData.personalDetails2.phone}
              onChange={(val) => {
                onUpdate({
                  personalDetails2: { ...formData.personalDetails2, phone: val }
                });
                onClearError('personalDetails2.phone');
              }}
              hasError={!!validationErrors['personalDetails2.phone']}
            />
          </FormField>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2342] mb-4">Address</h3>
          
          <FormField
            label="Address Line 1"
            required
            validationErrors={validationErrors}
            fieldName="personalDetails2.address1"
          >
            <TextInput
              placeholder="7423 Maple Hollow Dr"
              value={formData.personalDetails2.address1}
              onChange={(val) => {
                onUpdate({
                  personalDetails2: { ...formData.personalDetails2, address1: val }
                });
                onClearError('personalDetails2.address1');
              }}
              hasError={!!validationErrors['personalDetails2.address1']}
            />
          </FormField>

          <FormField label="Address Line 2">
            <TextInput
              placeholder="Apt, Suite, etc. (optional)"
              value={formData.personalDetails2.address2}
              onChange={(val) => onUpdate({
                personalDetails2: { ...formData.personalDetails2, address2: val }
              })}
            />
          </FormField>

          <LocationDropdown
            label="State"
            value={formData.personalDetails2.state}
            onChange={handleStateChange}
            options={availableStates}
            placeholder="Search for your state"
            required
            error={validationErrors['personalDetails2.state']}
          />

          <LocationDropdown
            label="County"
            value={formData.personalDetails2.county}
            onChange={handleCountyChange}
            options={availableCounties}
            placeholder="Search for your county"
            required
            disabled={!formData.stateCode}
            loading={countiesLoading}
            error={validationErrors['personalDetails2.county']}
          />

          <LocationDropdown
            label="City"
            value={formData.personalDetails2.city}
            onChange={handleCityChange}
            options={availableCities}
            placeholder="Search for your city"
            required
            disabled={!formData.stateCode}
            loading={citiesLoading}
            error={validationErrors['personalDetails2.city']}
          />

          <FormField
            label="ZIP Code"
            required
            validationErrors={validationErrors}
            fieldName="personalDetails2.zip"
          >
            <TextInput
              placeholder="75123"
              value={formData.personalDetails2.zip}
              onChange={(val) => {
                onUpdate({
                  personalDetails2: { ...formData.personalDetails2, zip: val }
                });
                onClearError('personalDetails2.zip');
              }}
              hasError={!!validationErrors['personalDetails2.zip']}
            />
          </FormField>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
          <FormField
            label="Select Payment Method"
            required
            validationErrors={validationErrors}
            fieldName="paymentMethod"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <PaymentMethodButton
                label="Venmo"
                selected={formData.paymentMethod === "venmo"}
                onClick={() => {
                  onUpdate({ paymentMethod: "venmo" });
                  onClearError('paymentMethod');
                }}
                icon={<CreditCard size={20} className="text-[#0A2342]" />}
              />
              <PaymentMethodButton
                label="PayPal"
                selected={formData.paymentMethod === "paypal"}
                onClick={() => {
                  onUpdate({ paymentMethod: "paypal" });
                  onClearError('paymentMethod');
                }}
                icon={<CreditCard size={20} className="text-[#0A2342]" />}
              />
              <PaymentMethodButton
                label="Cash App"
                selected={formData.paymentMethod === "cashapp"}
                onClick={() => {
                  onUpdate({ paymentMethod: "cashapp" });
                  onClearError('paymentMethod');
                }}
                icon={<CreditCard size={20} className="text-[#0A2342]" />}
              />
            </div>
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