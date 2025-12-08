const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Farm = require('../models/Farm');
const Plot = require('../models/plot');

class FarmMappingService {
  async createFarm(farmData) {
    const transaction = await sequelize.transaction();

    try {
      // Convert coordinates to PostGIS geometry
      const location = {
        type: 'Point',
        coordinates: [farmData.longitude, farmData.latitude]
      };

      // Create farm
      const farm = await Farm.create({
        ...farmData,
        location: location,
        boundary: farmData.boundary || null,
        lastSyncedAt: new Date()
      }, { transaction });

      // Create initial plots if provided
      if (farmData.plots && farmData.plots.length > 0) {
        const plots = farmData.plots.map(plot => ({
          ...plot,
          farmId: farm.id,
          lastSyncedAt: new Date()
        }));

        await Plot.bulkCreate(plots, { transaction });
      }

      await transaction.commit();
      return farm;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Farm creation failed: ${error.message}`);
    }
  }

  async updateFarm(farmId, updates) {
    const transaction = await sequelize.transaction();

    try {
      const farm = await Farm.findByPk(farmId, { transaction });
      
      if (!farm) {
        throw new Error('Farm not found');
      }

      // Update location if provided
      if (updates.longitude && updates.latitude) {
        updates.location = {
          type: 'Point',
          coordinates: [updates.longitude, updates.latitude]
        };
      }

      // Update farm
      await farm.update({
        ...updates,
        lastSyncedAt: new Date()
      }, { transaction });

      await transaction.commit();
      return farm;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Farm update failed: ${error.message}`);
    }
  }

  async createPlot(plotData) {
    try {
      return await Plot.create({
        ...plotData,
        lastSyncedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Plot creation failed: ${error.message}`);
    }
  }

  async updatePlot(plotId, updates) {
    try {
      const plot = await Plot.findByPk(plotId);
      
      if (!plot) {
        throw new Error('Plot not found');
      }

      await plot.update({
        ...updates,
        lastSyncedAt: new Date()
      });

      return plot;
    } catch (error) {
      throw new Error(`Plot update failed: ${error.message}`);
    }
  }

  async findNearbyFarms(coords, radius = 5000) {
    try {
      // Find farms within radius (in meters)
      const farms = await Farm.findAll({
        where: sequelize.literal(
          `ST_DWithin(
            location::geography,
            ST_SetSRID(ST_MakePoint(${coords.longitude}, ${coords.latitude}), 4326)::geography,
            ${radius}
          )`
        ),
        order: [
          [
            sequelize.literal(
              `ST_Distance(
                location::geography,
                ST_SetSRID(ST_MakePoint(${coords.longitude}, ${coords.latitude}), 4326)::geography
              )`
            ),
            'ASC'
          ]
        ]
      });

      return farms;
    } catch (error) {
      throw new Error(`Nearby farms search failed: ${error.message}`);
    }
  }

  async getFarmWithPlots(farmId) {
    try {
      return await Farm.findByPk(farmId, {
        include: [{
          model: Plot,
          where: {
            status: {
              [Op.ne]: 'archived'
            }
          },
          required: false
        }]
      });
    } catch (error) {
      throw new Error(`Farm retrieval failed: ${error.message}`);
    }
  }

  async calculateFarmStats(farmId) {
    try {
      const plots = await Plot.findAll({
        where: { farmId },
        attributes: [
          'plotType',
          'status',
          [sequelize.fn('SUM', sequelize.col('area')), 'totalArea']
        ],
        group: ['plotType', 'status']
      });

      const cropDistribution = await Plot.findAll({
        where: { 
          farmId,
          status: 'planted'
        },
        attributes: [
          [sequelize.fn('jsonb_object_keys', sequelize.col('crops')), 'cropName'],
          [sequelize.fn('COUNT', sequelize.col('*')), 'count']
        ],
        group: [sequelize.fn('jsonb_object_keys', sequelize.col('crops'))]
      });

      return {
        plotStats: plots,
        cropDistribution
      };
    } catch (error) {
      throw new Error(`Farm stats calculation failed: ${error.message}`);
    }
  }

  async syncOfflineChanges(changes) {
    const transaction = await sequelize.transaction();

    try {
      for (const change of changes) {
        switch (change.type) {
          case 'farm':
            if (change.action === 'create') {
              await this.createFarm(change.data);
            } else if (change.action === 'update') {
              await this.updateFarm(change.id, change.data);
            }
            break;

          case 'plot':
            if (change.action === 'create') {
              await this.createPlot(change.data);
            } else if (change.action === 'update') {
              await this.updatePlot(change.id, change.data);
            }
            break;
        }
      }

      await transaction.commit();
      return true;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Offline sync failed: ${error.message}`);
    }
  }
}

module.exports = new FarmMappingService();