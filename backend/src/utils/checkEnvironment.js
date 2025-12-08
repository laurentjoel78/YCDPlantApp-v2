const loggingService = require('../services/loggingService');

function checkEnvironment() {
    const requiredVars = [
        {
            name: 'OPENWEATHER_API_KEY',
            service: 'Weather Service'
        },
        {
            name: 'GOOGLE_APPLICATION_CREDENTIALS',
            service: 'Voice & Language Services'
        }
    ];

    const missingVars = requiredVars.filter(v => !process.env[v.name]);

    if (missingVars.length > 0) {
        missingVars.forEach(async ({ name, service }) => {
            await loggingService.logSystem({
                logLevel: 'warn',
                module: 'Configuration',
                message: `Missing environment variable: ${name}`,
                metadata: {
                    affectedService: service
                }
            });
        });

        console.warn('⚠️ Some environment variables are missing. Certain features may be disabled.');
        console.warn('Missing variables:');
        missingVars.forEach(({ name, service }) => {
            console.warn(`  - ${name} (Required for: ${service})`);
        });
    }

    // Log successful startup
    loggingService.logSystem({
        logLevel: 'info',
        module: 'Configuration',
        message: 'Application configuration checked',
        metadata: {
            nodeEnv: process.env.NODE_ENV,
            missingVars: missingVars.map(v => v.name)
        }
    });
}

module.exports = checkEnvironment;