const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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
  isValidDate,
  isValidTimeframe,
  isValidEmail,
  isValidPhoneNumber,
  sanitizeObject
};