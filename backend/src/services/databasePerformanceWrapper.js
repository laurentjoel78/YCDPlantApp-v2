const performanceMonitor = require('./performanceMonitor');
const { v4: uuidv4 } = require('uuid');
const loggingService = require('./loggingService');

class DatabasePerformanceWrapper {
    constructor(sequelize) {
        this.sequelize = sequelize;
        this.wrapSequelizeMethods();
    }

    wrapSequelizeMethods() {
        // Wrap query method
        const originalQuery = this.sequelize.query.bind(this.sequelize);
        this.sequelize.query = async function (...args) {
            const queryId = uuidv4();
            const tracker = performanceMonitor.trackDatabaseQuery(queryId);

            try {
                const result = await originalQuery(...args);
                const duration = tracker.end();

                // Log slow queries
                if (duration > performanceMonitor.thresholds.databaseQueryTime) {
                    await loggingService.logSystem({
                        logLevel: 'warn',
                        module: 'Database',
                        message: 'Slow database query detected',
                        performanceMetrics: {
                            queryId,
                            duration,
                            threshold: performanceMonitor.thresholds.databaseQueryTime,
                            query: args[0]
                        }
                    });
                }

                return result;
            } catch (error) {
                tracker.end(error);
                throw error;
            }
        };
    }

    static wrapModel(model) {
        const methods = ['findAll', 'findOne', 'create', 'update', 'destroy'];
        
        methods.forEach(method => {
            const original = model[method].bind(model);
            model[method] = async function (...args) {
                const queryId = uuidv4();
                const tracker = performanceMonitor.trackDatabaseQuery(queryId);

                try {
                    const result = await original(...args);
                    const duration = tracker.end();

                    // Log slow queries
                    if (duration > performanceMonitor.thresholds.databaseQueryTime) {
                        await loggingService.logSystem({
                            logLevel: 'warn',
                            module: 'Database',
                            message: 'Slow database operation detected',
                            performanceMetrics: {
                                queryId,
                                duration,
                                threshold: performanceMonitor.thresholds.databaseQueryTime,
                                model: model.name,
                                operation: method,
                                args: JSON.stringify(args)
                            }
                        });
                    }

                    return result;
                } catch (error) {
                    tracker.end(error);
                    throw error;
                }
            };
        });
    }
}

module.exports = DatabasePerformanceWrapper;