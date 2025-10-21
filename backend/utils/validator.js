/**
 * Validate password according to requirements
 * @param {string} password - Password to validate
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} email - User's email
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validatePassword(password, firstName, lastName, email) {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  // Check minimum length (8 characters)
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  // Check for at least one capital letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one capital letter' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()[\]{};:'",.<>/?\\|`~_\-+=]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (!@#$.–+,;)' };
  }

  // Check for no more than 2 consecutive identical characters
  if (/(.)\1\1/.test(password)) {
    return { isValid: false, error: 'Password must not contain more than 2 consecutive identical characters' };
  }

  // Check that password is not the same as account name (first + last name)
  const accountName = `${firstName}${lastName}`.toLowerCase();
  if (password.toLowerCase() === accountName) {
    return { isValid: false, error: 'Password must not be the same as the account name' };
  }

  // Check that password is not the same as email
  if (password.toLowerCase() === email.toLowerCase()) {
    return { isValid: false, error: 'Password must not be the same as the email address' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email regex pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for common invalid patterns
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check length limits
  if (email.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validatePhone(phone) {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-numeric characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits, or 11 digits starting with 1)
  if (cleanPhone.length === 10) {
    return { isValid: true, error: null };
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    return { isValid: true, error: null };
  } else {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
}

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      error: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate ZIP code format
 * @param {string} zipCode - ZIP code to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateZipCode(zipCode) {
  if (!zipCode) {
    return { isValid: false, error: 'ZIP code is required' };
  }

  // US ZIP code pattern (5 digits or 5+4 format)
  const zipPattern = /^\d{5}(-\d{4})?$/;
  
  if (!zipPattern.test(zipCode.trim())) {
    return { isValid: false, error: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate US state code
 * @param {string} state - State code to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateStateCode(state) {
  if (!state) {
    return { isValid: false, error: 'State is required' };
  }

  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'AS', 'GU', 'MP', 'PR', 'VI'
  ];

  const stateCode = state.trim().toUpperCase();
  
  if (stateCode.length !== 2) {
    return { isValid: false, error: 'State code must be 2 letters (e.g., TX, CA)' };
  }

  if (!validStates.includes(stateCode)) {
    return { isValid: false, error: 'Please enter a valid US state code' };
  }

  return { isValid: true, error: null };
}

/**
 * Sanitize input string
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could cause SQL issues
    .substring(0, 255); // Limit length
}

/**
 * Validate name field
 * @param {string} name - Name to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateName(name, fieldName = 'Name') {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmedName = name.trim();
  
  // Check length
  if (trimmedName.length < 1) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: `${fieldName} cannot exceed 50 characters` };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const namePattern = /^[a-zA-Z\s\-'\.]+$/;
  if (!namePattern.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { isValid: true, error: null };
}

/**
 * Validate attorney-specific fields
 * @param {Object} data - Attorney data to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateAttorneyData(data) {
  const errors = [];

  // Validate state bar number
  if (!data.stateBarNumber || !data.stateBarNumber.trim()) {
    errors.push('State bar number is required');
  } else if (data.stateBarNumber.trim().length < 3) {
    errors.push('State bar number appears to be too short');
  }

  // Validate law firm name
  if (!data.lawFirmName || !data.lawFirmName.trim()) {
    errors.push('Law firm name is required');
  } else if (data.lawFirmName.trim().length > 200) {
    errors.push('Law firm name cannot exceed 200 characters');
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    errors
  };
}

/**
 * Validate juror-specific fields
 * @param {Object} data - Juror data to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateJurorData(data) {
  const errors = [];

  // Validate payment method
  const validPaymentMethods = ['venmo', 'paypal', 'cashapp', 'zelle'];
  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  } else if (!validPaymentMethods.includes(data.paymentMethod.toLowerCase())) {
    errors.push('Invalid payment method selected');
  }

  // Validate county
  if (!data.county || !data.county.trim()) {
    errors.push('County is required');
  } else if (data.county.trim().length > 100) {
    errors.push('County name cannot exceed 100 characters');
  }

  // Validate criteria responses if provided
  if (data.criteriaResponses) {
    try {
      const criteria = JSON.parse(data.criteriaResponses);
      
      // Check for disqualifying responses
      if (criteria.age === 'no') {
        errors.push('You must be at least 18 years old to serve as a juror');
      }
      if (criteria.citizen === 'no') {
        errors.push('You must be a US citizen to serve as a juror');
      }
      if (criteria.indictment === 'yes') {
        errors.push('Individuals currently under indictment are not eligible to serve');
      }
    } catch (error) {
      errors.push('Invalid criteria responses format');
    }
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    errors
  };
}

module.exports = {
  validatePassword,
  validateEmail,
  validatePhone,
  validateRequiredFields,
  validateZipCode,
  validateStateCode,
  sanitizeInput,
  validateName,
  validateAttorneyData,
  validateJurorData
};