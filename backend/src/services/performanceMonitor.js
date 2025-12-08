const { EventEmitter } = require('events');
const os = require('os');
const loggingService = require('./loggingService');
const healthMonitoringService = require('./healthMonitoringService');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            requests: {
                total: 0,
                active: 0,
                errors: 0,
                responseTime: {
                    avg: 0,
                    max: 0,
                    min: Infinity
                }
            },
            memory: {
                usage: 0,
                heapTotal: 0,
                heapUsed: 0,
                external: 0,
                gc: {
                    minor: 0,
                    major: 0
                }
            },
            cpu: {
                usage: 0,
                loadAverage: []
            },
            database: {
                connections: 0,
                queryTime: {
                    avg: 0,
                    max: 0,
                    min: Infinity
                },
                activeQueries: 0
            }
        };

        this.thresholds = {
            responseTime: 1000,        // 1 second
            errorRate: 5,              // 5%
            cpuUsage: 80,             // 80%
            memoryUsage: 85,          // 85%
            databaseQueryTime: 500,    // 500ms
            activeConnections: 100     // Maximum concurrent connections
        };

        this.timeWindow = 60 * 1000;  // 1 minute for rolling metrics
        this.metricsHistory = [];
        this.alertsHistory = new Map();
        this.alertCooldown = 5 * 60 * 1000; // 5 minutes between similar alerts
    }

    start() {
        // Start periodic monitoring
        this.startMetricsCollection();
        this.startAlertChecking();
    }

    startMetricsCollection() {
        // Collect metrics every 10 seconds
        setInterval(() => {
            this.collectMetrics();
        }, 10000);

        // Update rolling metrics every minute
        setInterval(() => {
            this.updateRollingMetrics();
        }, this.timeWindow);
    }

    startAlertChecking() {
        // Check for alerts every 30 seconds
        setInterval(() => {
            this.checkAlerts();
        }, 30000);
    }

    async collectMetrics() {
        try {
            const currentMetrics = {
                timestamp: Date.now(),
                memory: process.memoryUsage(),
                cpu: {
                    usage: await this.getCPUUsage(),
                    loadAverage: os.loadavg()
                },
                requests: { ...this.metrics.requests },
                database: { ...this.metrics.database }
            };

            this.metricsHistory.push(currentMetrics);

            // Keep only last hour of metrics
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > oneHourAgo);

            // Update current metrics
            this.metrics.memory = currentMetrics.memory;
            this.metrics.cpu = currentMetrics.cpu;

            // Log metrics
            await loggingService.logSystem({
                logLevel: 'info',
                module: 'PerformanceMonitor',
                message: 'Performance metrics collected',
                performanceMetrics: currentMetrics
            });

        } catch (error) {
            await this.handleError('Metrics collection failed', error);
        }
    }

    async getCPUUsage() {
        const cpus = os.cpus();
        return cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total) * 100;
        }, 0) / cpus.length;
    }

    async checkAlerts() {
        try {
            const alerts = [];

            // Check response time
            if (this.metrics.requests.responseTime.avg > this.thresholds.responseTime) {
                alerts.push({
                    type: 'response_time',
                    message: `High average response time: ${this.metrics.requests.responseTime.avg.toFixed(2)}ms`,
                    value: this.metrics.requests.responseTime.avg,
                    threshold: this.thresholds.responseTime
                });
            }

            // Check error rate
            const errorRate = (this.metrics.requests.errors / this.metrics.requests.total) * 100;
            if (errorRate > this.thresholds.errorRate) {
                alerts.push({
                    type: 'error_rate',
                    message: `High error rate: ${errorRate.toFixed(2)}%`,
                    value: errorRate,
                    threshold: this.thresholds.errorRate
                });
            }

            // Check CPU usage
            if (this.metrics.cpu.usage > this.thresholds.cpuUsage) {
                alerts.push({
                    type: 'cpu_usage',
                    message: `High CPU usage: ${this.metrics.cpu.usage.toFixed(2)}%`,
                    value: this.metrics.cpu.usage,
                    threshold: this.thresholds.cpuUsage
                });
            }

            // Check memory usage
            const memoryUsage = (this.metrics.memory.heapUsed / this.metrics.memory.heapTotal) * 100;
            if (memoryUsage > this.thresholds.memoryUsage) {
                alerts.push({
                    type: 'memory_usage',
                    message: `High memory usage: ${memoryUsage.toFixed(2)}%`,
                    value: memoryUsage,
                    threshold: this.thresholds.memoryUsage
                });
            }

            // Process alerts
            await this.processAlerts(alerts);

        } catch (error) {
            await this.handleError('Alert check failed', error);
        }
    }

    async processAlerts(alerts) {
        for (const alert of alerts) {
            const lastAlert = this.alertsHistory.get(alert.type);
            const now = Date.now();

            // Check if we should send this alert (respect cooldown)
            if (!lastAlert || (now - lastAlert.timestamp) > this.alertCooldown) {
                // Update alert history
                this.alertsHistory.set(alert.type, {
                    timestamp: now,
                    value: alert.value
                });

                // Emit alert event
                this.emit('alert', alert);

                // Log alert
                await loggingService.logSystem({
                    logLevel: 'warn',
                    module: 'PerformanceMonitor',
                    message: alert.message,
                    metadata: {
                        alert,
                        metrics: this.metrics
                    }
                });

                // Create audit log for critical alerts
                if (alert.value > alert.threshold * 1.5) { // 50% over threshold
                    await loggingService.logAudit({
                        actionType: 'performance_alert',
                        severity: 'critical',
                        metadata: {
                            alert,
                            metrics: this.metrics
                        }
                    });
                }
            }
        }
    }

    trackRequest(requestId) {
        this.metrics.requests.active++;
        const start = Date.now();

        return {
            end: (error = null) => {
                const duration = Date.now() - start;
                this.metrics.requests.active--;
                this.metrics.requests.total++;
                
                if (error) {
                    this.metrics.requests.errors++;
                }

                // Update response time metrics
                const rt = this.metrics.requests.responseTime;
                rt.avg = ((rt.avg * (this.metrics.requests.total - 1)) + duration) / this.metrics.requests.total;
                rt.max = Math.max(rt.max, duration);
                rt.min = Math.min(rt.min, duration);

                return duration;
            }
        };
    }

    trackDatabaseQuery(queryId) {
        this.metrics.database.activeQueries++;
        const start = Date.now();

        return {
            end: (error = null) => {
                const duration = Date.now() - start;
                this.metrics.database.activeQueries--;
                
                // Update query time metrics
                const qt = this.metrics.database.queryTime;
                qt.avg = ((qt.avg * this.metrics.database.connections) + duration) / (this.metrics.database.connections + 1);
                qt.max = Math.max(qt.max, duration);
                qt.min = Math.min(qt.min, duration);
                this.metrics.database.connections++;

                if (duration > this.thresholds.databaseQueryTime) {
                    this.emit('slowQuery', {
                        queryId,
                        duration,
                        threshold: this.thresholds.databaseQueryTime
                    });
                }

                return duration;
            }
        };
    }

    async handleError(message, error) {
        await loggingService.logSystem({
            logLevel: 'error',
            module: 'PerformanceMonitor',
            message,
            errorDetails: {
                error: error.message,
                stack: error.stack
            }
        });
    }

    getMetrics() {
        return {
            current: this.metrics,
            history: this.metricsHistory,
            alerts: Array.from(this.alertsHistory.entries()).map(([type, data]) => ({
                type,
                ...data
            }))
        };
    }

    setThresholds(newThresholds) {
        this.thresholds = {
            ...this.thresholds,
            ...newThresholds
        };
    }
}

module.exports = new PerformanceMonitor();