const isValidUUID = (uuid) => {
  // Check for null, undefined, or string representations
  if (!uuid || uuid === 'undefined' || uuid === 'null') {
    return false;
  }
  // Match UUID versions 1-5
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper to validate and return error response if invalid
const validateUUIDParam = (paramValue, paramName = 'ID') => {
  if (!paramValue || paramValue === 'undefined' || paramValue === 'null') {
    return { valid: false, error: `${paramName} is required` };
  }
  if (!isValidUUID(paramValue)) {
    return { valid: false, error: `Invalid ${paramName} format` };
  }
  return { valid: true };
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const isValidTimeframe = (timeframe) => {
  return /^\d+[hdw]$/.test(timeframe);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

const sanitizeObject = (obj, sensitiveFields = ['password', 'token', 'creditCard']) => {
  const sanitized = { ...obj };
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  });
  return sanitized;
};

module.exports = {
  isValidUUID,
  validateUUIDParam,
  isValidDate,
  isValidTimeframe,
  isValidEmail,
  isValidPhoneNumber,
  sanitizeObject
};