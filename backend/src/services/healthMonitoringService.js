const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const { Pool } = require('pg');
const loggingService = require('./loggingService');

const execPromise = util.promisify(exec);

class HealthMonitoringService {
  constructor() {
    this.metrics = {
      lastCheck: null,
      system: {},
      process: {},
      database: {},
      memory: {},
      uptime: 0
    };

    this.thresholds = {
      cpuUsage: 80, // 80%
      memoryUsage: 85, // 85%
      diskUsage: 90, // 90%
      responseTime: 1000, // 1 second
      errorRate: 5 // 5%
    };
  }

  async monitorHealth() {
    try {
      const startTime = Date.now();
      
      // Gather all metrics
      await Promise.all([
        this.checkSystem(),
        this.checkProcess(),
        this.checkDatabase(),
        this.checkMemory()
      ]);

      this.metrics.lastCheck = new Date();
      this.metrics.uptime = process.uptime();

      // Log health check results
      await loggingService.logSystem({
        logLevel: 'info',
        module: 'HealthMonitor',
        message: 'Health check completed',
        performanceMetrics: {
          duration: Date.now() - startTime,
          ...this.metrics
        }
      });

      // Check for threshold violations
      await this.checkThresholds();

      return this.metrics;
    } catch (error) {
      await loggingService.logSystem({
        logLevel: 'error',
        module: 'HealthMonitor',
        message: 'Health check failed',
        errorDetails: {
          error: error.message,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  async checkSystem() {
    // CPU Usage
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Disk Usage (Windows)
    const { stdout: diskInfo } = await execPromise('wmic logicaldisk get size,freespace,caption');
    const disks = diskInfo.trim().split('\n').slice(1).map(line => {
      const [caption, freeSpace, size] = line.trim().split(/\s+/);
      return {
        drive: caption,
        total: parseInt(size),
        free: parseInt(freeSpace),
        used: parseInt(size) - parseInt(freeSpace)
      };
    });

    this.metrics.system = {
      cpuUsage,
      cpuCount: cpus.length,
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      disks
    };
  }

  async checkProcess() {
    const { heapUsed, heapTotal } = process.memoryUsage();
    
    this.metrics.process = {
      pid: process.pid,
      heapUsed,
      heapTotal,
      heapUsedPercentage: (heapUsed / heapTotal) * 100,
      uptime: process.uptime(),
      nodeVersion: process.version
    };
  }

  async checkDatabase() {
    const pool = new Pool(); // Using default connection config
    try {
      const startTime = Date.now();
      await pool.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      const { rows: [dbStats] } = await pool.query(`
        SELECT sum(numbackends) as connections,
               sum(xact_commit + xact_rollback) as transactions,
               sum(blks_read) as disk_reads,
               sum(blks_hit) as buffer_hits
        FROM pg_stat_database;
      `);

      this.metrics.database = {
        status: 'connected',
        responseTime,
        ...dbStats
      };
    } catch (error) {
      this.metrics.database = {
        status: 'error',
        error: error.message
      };
      throw error;
    } finally {
      await pool.end();
    }
  }

  async checkMemory() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    this.metrics.memory = {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usedPercentage: (usedMem / totalMem) * 100
    };
  }

  async checkThresholds() {
    const alerts = [];

    // CPU Usage Check
    if (this.metrics.system.cpuUsage > this.thresholds.cpuUsage) {
      alerts.push({
        type: 'cpu',
        message: `High CPU usage: ${this.metrics.system.cpuUsage.toFixed(2)}%`,
        value: this.metrics.system.cpuUsage,
        threshold: this.thresholds.cpuUsage
      });
    }

    // Memory Usage Check
    const memoryUsage = this.metrics.memory.usedPercentage;
    if (memoryUsage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'memory',
        message: `High memory usage: ${memoryUsage.toFixed(2)}%`,
        value: memoryUsage,
        threshold: this.thresholds.memoryUsage
      });
    }

    // Disk Usage Check
    for (const disk of this.metrics.system.disks) {
      const usagePercent = (disk.used / (disk.used + disk.free)) * 100;
      if (usagePercent > this.thresholds.diskUsage) {
        alerts.push({
          type: 'disk',
          message: `High disk usage on ${disk.drive}: ${usagePercent.toFixed(2)}%`,
          value: usagePercent,
          threshold: this.thresholds.diskUsage,
          drive: disk.drive
        });
      }
    }

    // Database Response Time Check
    if (this.metrics.database.status === 'connected' &&
        this.metrics.database.responseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'database',
        message: `Slow database response: ${this.metrics.database.responseTime}ms`,
        value: this.metrics.database.responseTime,
        threshold: this.thresholds.responseTime
      });
    }

    // Log alerts if any
    if (alerts.length > 0) {
      await loggingService.logSystem({
        logLevel: 'warn',
        module: 'HealthMonitor',
        message: 'Health check thresholds exceeded',
        errorDetails: { alerts }
      });

      // Create audit log for critical alerts
      const criticalAlerts = alerts.filter(alert => 
        alert.value > alert.threshold * 1.2); // 20% over threshold
      
      if (criticalAlerts.length > 0) {
        await loggingService.logAudit({
          actionType: 'system_health',
          severity: 'critical',
          metadata: {
            alerts: criticalAlerts
          }
        });
      }
    }

    return alerts;
  }

  // Update monitoring thresholds
  setThresholds(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds
    };
  }

  // Get current thresholds
  getThresholds() {
    return this.thresholds;
  }
}

module.exports = new HealthMonitoringService();