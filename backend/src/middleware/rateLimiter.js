const rateLimit = (options) => {
    const windowMs = options.windowMs || 15 * 60 * 1000; // Default 15 mins
    const max = options.max || 100; // Default 100 requests

    const requests = new Map();

    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();

        if (!requests.has(ip)) {
            requests.set(ip, []);
        }

        const timestamps = requests.get(ip);

        // Filter out old timestamps
        const validTimestamps = timestamps.filter(time => now - time < windowMs);

        if (validTimestamps.length >= max) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later.'
            });
        }

        validTimestamps.push(now);
        requests.set(ip, validTimestamps);

        next();
    };
};

module.exports = { rateLimit };
