# Security Implementation Guide

## Overview

This document describes the security measures implemented in the YCD Farmer Guide API.

## Security Features Implemented

### 1. Rate Limiting

**Purpose**: Prevents API abuse and DDoS attacks

**Implementation**:

- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 attempts per 15 minutes
- Sensitive operations: 10 requests per hour
- Read operations: 200 requests per 15 minutes

**Files**:

- `src/middleware/rateLimiter.js`

**Usage**:

```javascript
const {
  apiLimiter,
  authLimiter,
  sensitiveLimiter,
} = require("./middleware/rateLimiter");
app.use("/api/", apiLimiter);
router.post("/login", authLimiter, login);
```

### 2. CORS (Cross-Origin Resource Sharing)

**Purpose**: Controls which domains can access the API

**Allowed Origins**:

- Production: `https://zippy-flow-production-62fe.up.railway.app`
- Development: `localhost:3000`, `localhost:8081`, `localhost:19006`
- Mobile apps: `null` origin
- Environment variable: `FRONTEND_URL` or `ALLOWED_ORIGIN`

**Files**:

- `src/config/corsConfig.js`

**Configuration**:

- Credentials enabled for cookies/auth headers
- Specific methods allowed: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Preflight cache: 10 minutes

### 3. Input Sanitization

**Purpose**: Prevents NoSQL injection and XSS attacks

**Features**:

- Removes MongoDB operators (`$`, `.`) from keys
- Escapes HTML/JavaScript in string inputs
- Recursive sanitization for nested objects
- Preserves file uploads (skips multipart/form-data)

**Files**:

- `src/middleware/sanitization.js`

**Implementation**:

```javascript
app.use(mongoSanitizer);
app.use(xssProtection);
```

### 4. Brute Force Protection

**Purpose**: Prevents password guessing attacks

**Features**:

- Tracks failed login attempts by IP and user ID
- Blocks after 5 failed attempts for 1 hour
- Automatic cleanup of expired entries
- Shows remaining attempts to users

**Files**:

- `src/services/bruteForceProtection.js`

**Usage**:

```javascript
// In routes
router.post("/login", bruteForceProtection.checkBlocked(), login);

// In controller
bruteForceProtection.recordFailedAttempt(ip, userId);
bruteForceProtection.resetAttempts(ip, userId); // On success
```

### 5. Security Headers (Helmet)

**Purpose**: Protects against various web vulnerabilities

**Headers Set**:

- Content-Security-Policy: Prevents XSS
- X-Frame-Options: Prevents clickjacking
- Strict-Transport-Security (HSTS): Enforces HTTPS
- X-Content-Type-Options: Prevents MIME sniffing
- Referrer-Policy: Controls referrer information
- Permissions-Policy: Restricts browser features

**Files**:

- `src/config/securityHeaders.js`

**Configuration**:

- CSP starts in report-only mode (set `CSP_REPORT_ONLY=true`)
- HSTS with 1 year max-age
- Frame denial to prevent embedding

### 6. Request Size Limits

**Purpose**: Prevents memory exhaustion attacks

**Limits**:

- JSON body: 10MB
- URL-encoded body: 10MB

**Implementation**:

```javascript
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
```

### 7. HTTP Parameter Pollution (HPP) Protection

**Purpose**: Prevents parameter pollution attacks

**Files**:

- Package: `hpp`

**Implementation**:

```javascript
app.use(hpp());
```

## Environment Variables

Add these to your `.env` file:

```env
# Security Configuration
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGIN=https://your-frontend-domain.com
SKIP_RATE_LIMIT=false
CSP_REPORT_ONLY=true
```

## Testing Security

### Test Rate Limiting

```bash
# Should block after 5 attempts
for i in {1..6}; do
  curl -X POST https://your-api.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test CORS

```bash
# Should be blocked (non-whitelisted origin)
curl -X GET https://your-api.com/api/products \
  -H "Origin: https://malicious-site.com"
```

### Test Input Sanitization

```bash
# MongoDB operator should be sanitized
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":""},"password":"test"}'
```

## Security Best Practices

### Production Deployment

1. Set `NODE_ENV=production`
2. Set `CSP_REPORT_ONLY=false` after testing
3. Set specific `FRONTEND_URL` and `ALLOWED_ORIGIN`
4. Use strong `JWT_SECRET` (32+ characters)
5. Enable HTTPS only
6. Set `SKIP_RATE_LIMIT=false`

### Monitoring

- Monitor rate limit hits in logs
- Check for blocked CORS requests
- Review brute force protection blocks
- Audit failed login attempts

### Regular Maintenance

- Update dependencies monthly: `npm audit fix`
- Review security logs weekly
- Update rate limits based on usage patterns
- Rotate JWT secrets periodically

## Gradual Rollout Strategy

### Phase 1: Monitoring (Current)

- All security features active in permissive mode
- CSP in report-only mode
- Development CORS allowed
- Logs all security events

### Phase 2: Testing

- Tighten rate limits gradually
- Restrict CORS to production domains only
- Enable CSP enforcement
- Monitor for false positives

### Phase 3: Full Enforcement

- Strict rate limiting
- Production-only CORS
- Full CSP enforcement
- Automated security alerts

## Troubleshooting

### Rate Limit Issues

- Set `SKIP_RATE_LIMIT=true` temporarily for testing
- Check `RateLimit-*` headers in response
- Adjust limits in `src/middleware/rateLimiter.js`

### CORS Issues

- Add origin to `allowedOrigins` in `src/config/corsConfig.js`
- Check browser console for CORS errors
- Verify `Origin` header in request

### Brute Force Lockouts

- Wait for block duration (1 hour) to expire
- Use admin endpoint to manually reset (if implemented)
- Check `loginAttempts` map in service

## Additional Security Recommendations

### Not Yet Implemented

1. **2FA (Two-Factor Authentication)**: Add SMS/TOTP codes
2. **API Key Authentication**: For service-to-service calls
3. **Webhook Signature Verification**: For payment callbacks
4. **Redis for Distributed Rate Limiting**: For multiple server instances
5. **Security Audit Logging**: Detailed logs to external service
6. **Automated Threat Detection**: ML-based anomaly detection

### Future Enhancements

- Add CAPTCHA for repeated failed logins
- Implement IP reputation checking
- Add OAuth2/SSO integration
- Encrypt sensitive fields in database
- Implement API versioning
- Add request signing for critical operations

## Support

For security concerns or incidents, contact: security@ycd-app.com

Last Updated: January 2026
