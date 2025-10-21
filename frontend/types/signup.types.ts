export type UserType = 'attorney' | 'juror';

export type SignupStep = 1 | 2 | 3 | 4 | 5;

export interface ValidationErrors {
  [key: string]: string;
}

export interface LocationOption {
  label: string;
  value: string;
}

// Attorney Types - NO CHANGES NEEDED, already has verificationToken
export interface AttorneyFormData {
  // Step 1 - Personal Details
  isAttorney: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  lawFirmName: string;
  phoneNumber: string;
  state: string;
  stateCode: string;
  stateBarNumber: string;
  
  // Step 2 - Address
  officeAddress1: string;
  officeAddress2: string;
  county: string;
  countyCode: string;
  city: string;
  cityCode: string;
  addressState: string;
  zipCode: string;
  
  // Step 3 - Auth
  email: string;
  password: string;
  confirmPassword: string;
  
  // Step 4 - Agreement
  userAgreementAccepted: boolean;
  verificationToken: string; // Already exists!

  otp?: string; // NEW: OTP field
  emailVerified?: boolean; // NEW: Email verification flag
}

// Juror Types (unchanged)
export interface CriteriaAnswers {
  age: string;
  citizen: string;
  work1: string;
  work2: string;
  felony: string;
  indictment: string;
}

export interface PersonalDetails1 {
  maritalStatus: string;
  spouseEmployer: string;
  employerName: string;
  employerAddress: string;
  yearsInCounty: string;
  ageRange: string;
  gender: string;
  education: string;
}

export interface PersonalDetails2 {
  name: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

export interface JurorFormData {
  criteriaAnswers: CriteriaAnswers;
  personalDetails1: PersonalDetails1;
  personalDetails2: PersonalDetails2;
  paymentMethod: 'venmo' | 'paypal' | 'cashapp' | null;
  email: string;
  password: string;
  confirmPassword: string;
  emailVerified?: boolean; 
  userAgreementAccepted: boolean;
  stateCode: string;
  countyCode: string;
  cityCode: string;
}

// Common State (unchanged)
export interface SignupState {
  step: SignupStep;
  personalSubStep: 1 | 2;
  authSubStep: 1 | 2;
  formData: AttorneyFormData | JurorFormData;
  validationErrors: ValidationErrors;
  loading: boolean;
  error: string | null;
  hasScrolledToBottom: boolean;
}

// Actions (unchanged)
export type SignupAction =
  | { type: 'SET_STEP'; payload: SignupStep }
  | { type: 'SET_PERSONAL_SUB_STEP'; payload: 1 | 2 }
  | { type: 'SET_AUTH_SUB_STEP'; payload: 1 | 2 }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<AttorneyFormData | JurorFormData> }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationErrors }
  | { type: 'CLEAR_FIELD_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SCROLLED_TO_BOTTOM'; payload: boolean }
  | { type: 'RESET_FORM' };