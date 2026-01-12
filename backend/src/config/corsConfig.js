/**
 * CORS Configuration
 * Controls which origins can access the API
 */

const allowedOrigins = [
    // Local development
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:19006',
    
    // Production Railway backend
    'https://zippy-flow-production-62fe.up.railway.app',
    
    // Environment variable for dynamic origins
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGIN,
    
    // Mobile app sends null origin
    null
].filter(Boolean); // Remove undefined values

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is in whitelist
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // In development, be more permissive
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[CORS] Allowing non-whitelisted origin in dev: ${origin}`);
                callback(null, true);
            } else {
                console.error(`[SECURITY] Blocked CORS request from: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'ngrok-skip-browser-warning' // For ngrok development
    ],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 600 // Cache preflight requests for 10 minutes
};

// Socket.io CORS configuration
const socketCorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[Socket.io CORS] Allowing non-whitelisted origin in dev: ${origin}`);
                callback(null, true);
            } else {
                console.error(`[SECURITY] Blocked Socket.io connection from: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST']
};

module.exports = {
    corsOptions,
    socketCorsOptions,
    allowedOrigins
};
