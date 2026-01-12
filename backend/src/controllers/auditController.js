const logger = require('../config/logger');
const auditService = require('../services/auditService');
const { isValidUUID } = require('../utils/validators');

class AuditController {
  async getAuditLogs(req, res) {
    try {
      const {
        userId,
        actionType,
        startDate,
        endDate,
        limit,
        offset
      } = req.query;

      // Validate inputs
      if (userId && !isValidUUID(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      if (startDate && isNaN(Date.parse(startDate))) {
        return res.status(400).json({ error: 'Invalid start date format' });
      }

      if (endDate && isNaN(Date.parse(endDate))) {
        return res.status(400).json({ error: 'Invalid end date format' });
      }

      const logs = await auditService.getAuditLogs({
        userId,
        actionType,
        startDate,
        endDate,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
      });

      res.json(logs);
    } catch (error) {
      logger.error('Error in getAuditLogs:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  }

  async getSystemMetrics(req, res) {
    try {
      const { timeframe = '24h' } = req.query;

      // Validate timeframe format
      if (!/^\d+[hdw]$/.test(timeframe)) {
        return res.status(400).json({
          error: 'Invalid timeframe format. Use number followed by h (hours), d (days), or w (weeks)'
        });
      }

      const metrics = await auditService.getSystemMetrics(timeframe);
      res.json(metrics);
    } catch (error) {
      logger.error('Error in getSystemMetrics:', error);
      res.status(500).json({ error: 'Failed to retrieve system metrics' });
    }
  }

  async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      
      if (!isValidUUID(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const logs = await auditService.getAuditLogs({
        userId,
        limit: 100
      });

      res.json(logs);
    } catch (error) {
      logger.error('Error in getUserActivity:', error);
      res.status(500).json({ error: 'Failed to retrieve user activity' });
    }
  }

  async getDashboardStats(req, res) {
    try {
      // Get last 24 hours metrics
      const dailyMetrics = await auditService.getSystemMetrics('24h');
      
      // Get last 7 days metrics
      const weeklyMetrics = await auditService.getSystemMetrics('7d');

      // Get latest error logs
      const errorLogs = await SystemLog.findAll({
        where: { logLevel: 'error' },
        limit: 10,
        order: [['createdAt', 'DESC']]
      });

      // Get top endpoints by usage
      const topEndpoints = await PerformanceLog.findAll({
        attributes: [
          'endpoint',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime']
        ],
        group: ['endpoint'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10
      });

      res.json({
        dailyMetrics,
        weeklyMetrics,
        recentErrors: errorLogs,
        topEndpoints,
        systemStatus: {
          healthy: errorLogs.length === 0,
          lastError: errorLogs[0]?.createdAt || null
        }
      });
    } catch (error) {
      logger.error('Error in getDashboardStats:', error);
      res.status(500).json({ error: 'Failed to retrieve dashboard statistics' });
    }
  }
}

module.exports = new AuditController();