import { APP_CONFIG } from '@/config/app.config';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!APP_CONFIG.VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < APP_CONFIG.VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${APP_CONFIG.VALIDATION_RULES.MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null; // Phone is optional
  if (!APP_CONFIG.VALIDATION_RULES.PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
    return 'Please enter a valid phone number';
  }
  return null;
};

export const validateName = (name: string, fieldName: string = 'Name'): string | null => {
  if (!name) return `${fieldName} is required`;
  if (name.length > APP_CONFIG.VALIDATION_RULES.MAX_NAME_LENGTH) {
    return `${fieldName} must be less than ${APP_CONFIG.VALIDATION_RULES.MAX_NAME_LENGTH} characters`;
  }
  return null;
};

export const validateDescription = (description: string, fieldName: string = 'Description'): string | null => {
  if (!description) return null; // Description is optional
  if (description.length > APP_CONFIG.VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    return `${fieldName} must be less than ${APP_CONFIG.VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} characters`;
  }
  return null;
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => string | null>): ValidationResult => {
  const errors: ValidationError[] = [];

  Object.entries(rules).forEach(([field, validator]) => {
    const error = validator(data[field]);
    if (error) {
      errors.push({ field, message: error });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
