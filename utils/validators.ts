/** Email validation */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/** Password strength validation (min 8 chars, at least 1 uppercase, 1 number) */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

/** Phone number validation (basic international) */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-]{8,15}$/;
  return phoneRegex.test(phone.trim());
}

/** Non-empty string validation */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/** Minimum length validation */
export function hasMinLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

/** Validate form fields and return errors */
export function validateLoginForm(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  if (!isNotEmpty(password)) errors.password = 'Password is required.';
  return errors;
}

export function validateSignupForm(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isNotEmpty(data.firstName)) errors.firstName = 'First name is required.';
  if (!isNotEmpty(data.lastName)) errors.lastName = 'Last name is required.';
  if (!isValidEmail(data.email)) errors.email = 'Please enter a valid email address.';
  if (!isValidPhone(data.phone)) errors.phone = 'Please enter a valid phone number.';
  if (!isValidPassword(data.password)) {
    errors.password =
      'Password must be at least 8 characters with 1 uppercase letter and 1 number.';
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateForgotPasswordForm(email: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  return errors;
}
