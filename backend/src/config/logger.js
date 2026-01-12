const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development (colorized and readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0 && meta.service !== 'ycd-farmer-guide') {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Daily rotate file transport for all logs
const allLogsTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: logFormat
});

// Daily rotate file transport for error logs only
const errorLogsTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d', // Keep error logs for 30 days
    level: 'error',
    format: logFormat
});

// Daily rotate file transport for security logs
const securityLogsTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d', // Keep security logs for 90 days
    format: logFormat
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'ycd-farmer-guide' },
    transports: [
        allLogsTransport,
        errorLogsTransport
    ],
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d'
        })
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d'
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Helper methods for common logging patterns
logger.security = (message, meta = {}) => {
    const securityLogger = winston.createLogger({
        format: logFormat,
        transports: [securityLogsTransport]
    });
    securityLogger.warn(message, { type: 'SECURITY', ...meta });
};

logger.api = (method, path, statusCode, duration, meta = {}) => {
    logger.info(`${method} ${path} ${statusCode} ${duration}ms`, {
        type: 'API',
        method,
        path,
        statusCode,
        duration,
        ...meta
    });
};

logger.database = (operation, table, duration, meta = {}) => {
    logger.info(`DB ${operation} on ${table} took ${duration}ms`, {
        type: 'DATABASE',
        operation,
        table,
        duration,
        ...meta
    });
};

logger.auth = (action, userId, success, meta = {}) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Auth ${action}: ${success ? 'SUCCESS' : 'FAILED'}`, {
        type: 'AUTH',
        action,
        userId,
        success,
        ...meta
    });
};

logger.payment = (action, amount, currency, success, meta = {}) => {
    logger.info(`Payment ${action}: ${amount} ${currency}`, {
        type: 'PAYMENT',
        action,
        amount,
        currency,
        success,
        ...meta
    });
};

// Stream for Morgan HTTP logger
logger.stream = {
    write: (message) => {
        logger.info(message.trim(), { type: 'HTTP' });
    }
};

module.exports = logger;
