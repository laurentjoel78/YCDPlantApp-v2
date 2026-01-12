const helmet = require('helmet');

/**
 * Security Headers Configuration
 * Helmet helps secure Express apps by setting various HTTP headers
 */

// Content Security Policy - prevents XSS attacks
const cspConfig = {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for now (tighten later)
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"], // Allow external images (Cloudinary, etc.)
        connectSrc: ["'self'", "https://zippy-flow-production-62fe.up.railway.app"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
    reportOnly: process.env.CSP_REPORT_ONLY === 'true', // Start in report-only mode
};

// Helmet configuration with all security headers
const helmetConfig = helmet({
    // Content Security Policy
    contentSecurityPolicy: cspConfig,
    
    // X-DNS-Prefetch-Control: controls DNS prefetching
    dnsPrefetchControl: { allow: false },
    
    // Expect-CT: enforce Certificate Transparency
    expectCt: { maxAge: 86400 },
    
    // X-Frame-Options: prevent clickjacking
    frameguard: { action: 'deny' },
    
    // Hide X-Powered-By header
    hidePoweredBy: true,
    
    // HTTP Strict Transport Security (HSTS)
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    
    // X-Download-Options: prevent IE from executing downloads
    ieNoOpen: true,
    
    // X-Content-Type-Options: prevent MIME sniffing
    noSniff: true,
    
    // Referrer-Policy: control referrer information
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    
    // X-XSS-Protection: enable XSS filter (legacy but harmless)
    xssFilter: true,
});

// Additional security headers middleware
const additionalHeaders = (req, res, next) => {
    // Permissions Policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', 
        'geolocation=(self), microphone=(), camera=(), payment=(), usb=()');
    
    // X-Content-Security-Policy for older browsers
    res.setHeader('X-Content-Security-Policy', 
        "default-src 'self'");
    
    // Prevent caching of sensitive data
    if (req.path.includes('/api/auth') || req.path.includes('/api/users')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    
    next();
};

module.exports = {
    helmetConfig,
    additionalHeaders,
    cspConfig
};
