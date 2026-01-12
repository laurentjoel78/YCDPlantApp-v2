const { v4: uuidv4 } = require('uuid');

// Lazy load models to avoid circular dependencies
let AuditLog, UserActivityLog, SystemLog;

const getModels = () => {
  if (!AuditLog || !UserActivityLog || !SystemLog) {
    try {
      const logger = require('../config/logger');
const models = require('../models');
      AuditLog = models.AuditLog;
      UserActivityLog = models.UserActivityLog;
      SystemLog = models.SystemLog;
    } catch (e) {
      logger.warn('LoggingService: Could not load models', e.message);
    }
  }
  return { AuditLog, UserActivityLog, SystemLog };
};

class LoggingService {
  constructor() {
    this.systemContext = {};
  }


  setSystemContext(context) {
    this.systemContext = {
      ...this.systemContext,
      ...context
    };
  }

  async logAudit({
    userId,
    userRole,
    actionType,
    tableAffected,
    recordId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
    sessionId,
    metadata = {},
    severity = 'low'
  }) {
    try {
      const { AuditLog } = getModels();
      if (!AuditLog) return null;
      const log = await AuditLog.create({
        user_id: userId,
        user_role: userRole,
        action_type: actionType,
        table_name: tableAffected,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: sessionId,
        metadata: {
          ...metadata,
          systemContext: this.systemContext,
          severity
        },
        status: severity === 'success' ? 'success' : 'pending'
      });

      // For critical severity, also create a system log
      if (severity === 'critical') {
        await this.logSystem({
          logLevel: 'critical',
          module: 'Audit',
          message: `Critical audit event: ${actionType}`,
          errorDetails: {
            auditLogId: log.id,
            ...metadata
          }
        });
      }

      return log;
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Create system log for logging failure
      await this.logSystem({
        logLevel: 'error',
        module: 'Audit',
        message: 'Failed to create audit log',
        errorDetails: {
          error: error.message,
          stack: error.stack
        }
      });
    }
  }

  async logUserActivity({
    userId,
    activityType,
    description,
    metadata = {},
    duration,
    deviceInfo,
    location,
    status = 'success'
  }) {
    try {
      const { UserActivityLog } = getModels();
      if (!UserActivityLog) return null;
      return await UserActivityLog.create({
        userId,
        activityType,
        description,
        metadata: {
          ...metadata,
          systemContext: this.systemContext
        },
        duration,
        deviceInfo,
        location,
        status
      });
    } catch (error) {
      logger.error('Failed to create user activity log:', error);
      await this.logSystem({
        logLevel: 'error',
        module: 'UserActivity',
        message: 'Failed to create user activity log',
        errorDetails: {
          error: error.message,
          stack: error.stack
        }
      });
    }
  }

  async logSystem({
    logLevel,
    module,
    message,
    errorDetails = {},
    requestId = uuidv4(),
    performanceMetrics = {}
  }) {
    try {
      const { SystemLog } = getModels();
      if (!SystemLog) return null;
      return await SystemLog.create({
        level: logLevel || 'info',
        category: module || 'System',
        source: 'Backend',
        message,
        details: {
          ...errorDetails,
          systemContext: this.systemContext,
          performanceMetrics
        },
        environment: process.env.NODE_ENV || 'development',
        requestId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to create system log:', error);
      // If system logging fails, log to console as last resort
      logger.error({
        timestamp: new Date(),
        logLevel,
        module,
        message,
        error: error.message
      });
    }
  }

  async queryAuditLogs(filters = {}, pagination = { page: 1, limit: 20 }) {
    const where = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.actionType) where.actionType = filters.actionType;
    if (filters.severity) where.severity = filters.severity;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }

    return await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (pagination.page - 1) * pagination.limit,
      limit: pagination.limit
    });
  }

  async queryUserActivity(filters = {}, pagination = { page: 1, limit: 20 }) {
    const where = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.activityType) where.activityType = filters.activityType;
    if (filters.status) where.status = filters.status;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }

    return await UserActivityLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (pagination.page - 1) * pagination.limit,
      limit: pagination.limit
    });
  }

  async querySystemLogs(filters = {}, pagination = { page: 1, limit: 20 }) {
    const where = {};
    if (filters.logLevel) where.logLevel = filters.logLevel;
    if (filters.module) where.module = filters.module;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }

    return await SystemLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (pagination.page - 1) * pagination.limit,
      limit: pagination.limit
    });
  }

  async getAuditSummary(startDate, endDate) {
    const summary = {
      totalEvents: await AuditLog.count({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }),
      bySeverity: await AuditLog.count({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        group: ['severity']
      }),
      byActionType: await AuditLog.count({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        group: ['actionType']
      }),
      criticalEvents: await AuditLog.findAll({
        where: {
          severity: 'critical',
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        limit: 10,
        order: [['createdAt', 'DESC']]
      })
    };

    return summary;
  }
}

module.exports = new LoggingService();