const { logger } = require('./logger');

class DatabaseLogger {
  constructor(namespace = 'database') {
    this.logger = logger.child({ namespace });
  }

  logQuery(query, options = {}) {
    const startTime = process.hrtime();

    return (...args) => {
      const endTime = process.hrtime(startTime);
      const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

      this.logger.debug('SQL Query executed', {
        query: query.trim(),
        bindings: options.bind,
        duration: `${duration}ms`,
        model: options.model ? options.model.name : undefined,
        type: options.type
      });

      if (duration > 1000) {
        this.logger.warn('Slow query detected', {
          query: query.trim(),
          duration: `${duration}ms`,
          model: options.model ? options.model.name : undefined
        });
      }
    };
  }

  logMigration(migration) {
    this.logger.info('Running migration', {
      name: migration.file,
      direction: migration.direction
    });
  }

  logPoolStatus(pool) {
    this.logger.debug('Connection pool status', {
      total: pool.size,
      available: pool.available,
      borrowed: pool.borrowed,
      pending: pool.pending
    });
  }

  logTransaction(transaction) {
    const startTime = process.hrtime();
    const id = transaction.id;

    this.logger.debug('Transaction started', { id });

    transaction.afterCommit(() => {
      const endTime = process.hrtime(startTime);
      const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

      this.logger.info('Transaction committed', {
        id,
        duration: `${duration}ms`
      });
    });

    transaction.afterRollback(() => {
      const endTime = process.hrtime(startTime);
      const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

      this.logger.warn('Transaction rolled back', {
        id,
        duration: `${duration}ms`
      });
    });
  }
}

module.exports = new DatabaseLogger();