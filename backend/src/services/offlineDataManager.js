const { SQLite } = require('react-native-sqlite-storage');
const logger = require('../config/logger');
const AsyncStorage = require('@react-native-async-storage/async-storage');
const NetInfo = require('@react-native-community/netinfo');

class OfflineDataManager {
  constructor() {
    this.db = null;
    this.syncQueue = [];
    this.isOnline = false;
    this.initializeDatabase();
    this.setupConnectivityListener();
  }

  async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabase({
        name: 'ycd_offline.db',
        location: 'default'
      });

      await this.createTables();
    } catch (error) {
      logger.error('Failed to initialize offline database:', error);
    }
  }

  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS offline_consultations (
        id TEXT PRIMARY KEY,
        data TEXT,
        sync_status TEXT,
        created_at INTEGER,
        updated_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS offline_experts (
        id TEXT PRIMARY KEY,
        data TEXT,
        sync_status TEXT,
        created_at INTEGER,
        updated_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS offline_transactions (
        id TEXT PRIMARY KEY,
        data TEXT,
        sync_status TEXT,
        created_at INTEGER,
        updated_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT,
        action TEXT,
        data TEXT,
        priority TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at INTEGER
      )`
    ];

    for (const table of tables) {
      await this.db.executeSql(table);
    }
  }

  setupConnectivityListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      if (this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  async storeOfflineData(type, id, data) {
    const timestamp = Date.now();
    const table = `offline_${type}s`;
    
    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO ${table} (id, data, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, JSON.stringify(data), 'pending', timestamp, timestamp]
      );

      await this.addToSyncQueue({
        type,
        action: 'upsert',
        data: { id, ...data },
        priority: 'normal'
      });

      return true;
    } catch (error) {
      logger.error(`Failed to store offline ${type}:`, error);
      return false;
    }
  }

  async getOfflineData(type, id) {
    const table = `offline_${type}s`;
    
    try {
      const [results] = await this.db.executeSql(
        `SELECT * FROM ${table} WHERE id = ?`,
        [id]
      );

      if (results.rows.length > 0) {
        const item = results.rows.item(0);
        return {
          ...JSON.parse(item.data),
          syncStatus: item.sync_status
        };
      }

      return null;
    } catch (error) {
      logger.error(`Failed to get offline ${type}:`, error);
      return null;
    }
  }

  async addToSyncQueue(operation) {
    const timestamp = Date.now();
    
    try {
      await this.db.executeSql(
        `INSERT INTO sync_queue (id, type, action, data, priority, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          operation.id || timestamp.toString(),
          operation.type,
          operation.action,
          JSON.stringify(operation.data),
          operation.priority || 'normal',
          timestamp
        ]
      );

      if (this.isOnline) {
        this.processSyncQueue();
      }

      return true;
    } catch (error) {
      logger.error('Failed to add to sync queue:', error);
      return false;
    }
  }

  async processSyncQueue() {
    if (!this.isOnline) return;

    try {
      const [results] = await this.db.executeSql(
        `SELECT * FROM sync_queue 
         ORDER BY 
           CASE priority 
             WHEN 'critical' THEN 1 
             WHEN 'high' THEN 2 
             WHEN 'normal' THEN 3 
             WHEN 'low' THEN 4 
           END,
           created_at ASC
         LIMIT 10`
      );

      for (let i = 0; i < results.rows.length; i++) {
        const operation = results.rows.item(i);
        const success = await this.syncOperation(operation);

        if (success) {
          await this.db.executeSql(
            'DELETE FROM sync_queue WHERE id = ?',
            [operation.id]
          );
        } else {
          if (operation.retry_count < 3) {
            await this.db.executeSql(
              'UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?',
              [operation.id]
            );
          } else {
            // Move to failed sync log
            await this.logFailedSync(operation);
            await this.db.executeSql(
              'DELETE FROM sync_queue WHERE id = ?',
              [operation.id]
            );
          }
        }
      }
    } catch (error) {
      logger.error('Failed to process sync queue:', error);
    }
  }

  async syncOperation(operation) {
    try {
      const data = JSON.parse(operation.data);
      
      switch (operation.type) {
        case 'consultation':
          if (operation.action === 'upsert') {
            await this.syncConsultation(data);
          }
          break;

        case 'expert':
          if (operation.action === 'upsert') {
            await this.syncExpert(data);
          }
          break;

        case 'transaction':
          if (operation.action === 'upsert') {
            await this.syncTransaction(data);
          }
          break;
      }

      return true;
    } catch (error) {
      logger.error('Failed to sync operation:', error);
      return false;
    }
  }

  async syncConsultation(data) {
    const response = await fetch('/api/consultations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync consultation');
    }

    await this.db.executeSql(
      'UPDATE offline_consultations SET sync_status = ? WHERE id = ?',
      ['synced', data.id]
    );
  }

  async syncExpert(data) {
    const response = await fetch('/api/experts/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync expert');
    }

    await this.db.executeSql(
      'UPDATE offline_experts SET sync_status = ? WHERE id = ?',
      ['synced', data.id]
    );
  }

  async syncTransaction(data) {
    const response = await fetch('/api/transactions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync transaction');
    }

    await this.db.executeSql(
      'UPDATE offline_transactions SET sync_status = ? WHERE id = ?',
      ['synced', data.id]
    );
  }

  async logFailedSync(operation) {
    try {
      const failedSyncs = await AsyncStorage.getItem('failed_syncs') || '[]';
      const syncs = JSON.parse(failedSyncs);
      
      syncs.push({
        ...operation,
        failed_at: Date.now()
      });

      await AsyncStorage.setItem('failed_syncs', JSON.stringify(syncs));
    } catch (error) {
      logger.error('Failed to log failed sync:', error);
    }
  }

  async clearSyncedData(type, olderThan = 7) {
    const timestamp = Date.now() - (olderThan * 24 * 60 * 60 * 1000);
    const table = `offline_${type}s`;

    try {
      await this.db.executeSql(
        `DELETE FROM ${table} 
         WHERE sync_status = ? AND updated_at < ?`,
        ['synced', timestamp]
      );

      return true;
    } catch (error) {
      logger.error(`Failed to clear synced ${type}:`, error);
      return false;
    }
  }
}

module.exports = new OfflineDataManager();