const validateSchema = (schema) => {
    return (req, res, next) => {
        const data = req.body;
        const errors = [];

        // Check required fields
        if (schema.required) {
            for (const field of schema.required) {
                if (data[field] === undefined || data[field] === null || data[field] === '') {
                    errors.push({ field, message: `${field} is required` });
                }
            }
        }

        // Check properties if they exist
        if (schema.properties) {
            for (const [field, rules] of Object.entries(schema.properties)) {
                if (data[field] !== undefined) {
                    // Type check
                    if (rules.type === 'string' && typeof data[field] !== 'string') {
                        errors.push({ field, message: `${field} must be a string` });
                    }
                    if (rules.type === 'boolean' && typeof data[field] !== 'boolean') {
                        errors.push({ field, message: `${field} must be a boolean` });
                    }

                    // String length checks
                    if (rules.type === 'string') {
                        if (rules.minLength && data[field].length < rules.minLength) {
                            errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
                        }
                        if (rules.maxLength && data[field].length > rules.maxLength) {
                            errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
                        }
                    }
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    };
};

module.exports = { validateSchema };
