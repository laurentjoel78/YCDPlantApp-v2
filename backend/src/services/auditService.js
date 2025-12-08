const { AuditLog, SystemLog, PerformanceLog } = require('../models');
const geoip = require('geoip-lite');

class AuditService {
  constructor() {
    this.defaultRetention = 730; // days (2 years)
  }

  async logUserAction(data) {
    try {
      const {
        userId,
        userRole,
        actionType,
        actionDescription,
        req,
        metadata = {},
        tableName,
        recordId,
        oldValues,
        newValues
      } = data;

      // Get location from IP
      const ip = req?.ip || req?.connection?.remoteAddress;
      const geo = ip ? geoip.lookup(ip) : null;

      const logEntry = await AuditLog.create({
        userId,
        userRole,
        actionType,
        actionDescription,
        ipAddress: ip,
        userAgent: req?.headers?.['user-agent'],
        deviceInfo: this.parseDeviceInfo(req?.headers?.['user-agent']),
        location: geo ? {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          ll: geo.ll // latitude/longitude
        } : null,
        metadata,
        tableName,
        recordId,
        oldValues,
        newValues,
        sessionId: req?.sessionID
      });

      return logEntry;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  async logSystemEvent(data) {
    try {
      const {
        logLevel,
        module,
        message,
        errorDetails,
        metrics,
        requestId
      } = data;

      const logEntry = await SystemLog.create({
        logLevel,
        module,
        message,
        errorDetails,
        metrics,
        requestId
      });

      return logEntry;
    } catch (error) {
      console.error('Error creating system log:', error);
      throw error;
    }
  }

  async logPerformance(data) {
    try {
      const {
        endpoint,
        responseTime,
        status,
        requestMethod,
        userAgent,
        ipAddress,
        requestSize,
        responseSize,
        cache,
        userId
      } = data;

      const logEntry = await PerformanceLog.create({
        endpoint,
        responseTime,
        status,
        requestMethod,
        userAgent,
        ipAddress,
        requestSize,
        responseSize,
        cache,
        userId
      });

      return logEntry;
    } catch (error) {
      console.error('Error creating performance log:', error);
      throw error;
    }
  }

  async getAuditLogs(filters = {}) {
    try {
      const {
        userId,
        actionType,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = filters;

      const where = {};

      if (userId) where.userId = userId;
      if (actionType) where.actionType = actionType;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt['$gte'] = new Date(startDate);
        if (endDate) where.createdAt['$lte'] = new Date(endDate);
      }

      const logs = await AuditLog.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return logs;
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      throw error;
    }
  }

  async getSystemMetrics(timeframe = '24h') {
    try {
      const { sequelize } = require('../models');
      const now = new Date();
      const startTime = new Date(now - this.parseTimeframe(timeframe));

      const performanceMetrics = await PerformanceLog.findAll({
        where: {
          createdAt: {
            $gte: startTime
          }
        },
        attributes: [
          'endpoint',
          [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalRequests'],
          [sequelize.fn('SUM',
            sequelize.literal('CASE WHEN status >= 400 THEN 1 ELSE 0 END')),
            'errorCount']
        ],
        group: ['endpoint']
      });

      const errorLogs = await SystemLog.findAll({
        where: {
          logLevel: 'error',
          createdAt: {
            $gte: startTime
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      return {
        performanceMetrics,
        errorLogs,
        timeframe
      };
    } catch (error) {
      console.error('Error retrieving system metrics:', error);
      throw error;
    }
  }

  parseDeviceInfo(userAgent) {
    if (!userAgent) return null;

    // Simple user agent parsing - in production, use a proper UA parser library
    return {
      raw: userAgent,
      isMobile: /Mobile|Android|iPhone/i.test(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent)
    };
  }

  detectBrowser(userAgent) {
    if (!userAgent) return 'unknown';

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  detectOS(userAgent) {
    if (!userAgent) return 'unknown';

    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  }

  parseTimeframe(timeframe) {
    const units = {
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000
    };

    const match = timeframe.match(/^(\d+)([hdw])$/);
    if (!match) return 24 * 60 * 60 * 1000; // default to 24 hours

    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }

  async cleanOldLogs(retentionDays = null) {
    try {
      const retention = retentionDays || this.defaultRetention;
      const cutoffDate = new Date(Date.now() - retention * 24 * 60 * 60 * 1000);

      const deletedAudit = await AuditLog.destroy({
        where: {
          createdAt: {
            $lt: cutoffDate
          }
        }
      });

      const deletedSystem = await SystemLog.destroy({
        where: {
          createdAt: {
            $lt: cutoffDate
          }
        }
      });

      const deletedPerformance = await PerformanceLog.destroy({
        where: {
          createdAt: {
            $lt: cutoffDate
          }
        }
      });

      return {
        deletedAudit,
        deletedSystem,
        deletedPerformance,
        cutoffDate
      };
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();