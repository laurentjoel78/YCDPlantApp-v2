const FarmMappingService = require('../services/farmMappingService');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateSchema } = require('../middleware/schemaValidator');

const farmSchema = {
  type: 'object',
  required: ['name', 'size', 'latitude', 'longitude'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    size: { type: 'number', minimum: 0 },
    latitude: { 
      type: 'number',
      minimum: -90,
      maximum: 90
    },
    longitude: { 
      type: 'number',
      minimum: -180,
      maximum: 180
    },
    boundary: {
      type: 'object',
      properties: {
        type: { const: 'Polygon' },
        coordinates: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2
            }
          }
        }
      }
    },
    altitude: { type: 'number' },
    soilType: { type: 'string' },
    plots: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'plotType', 'area', 'boundary'],
        properties: {
          name: { type: 'string' },
          plotType: { 
            type: 'string',
            enum: ['crop', 'tree', 'mixed']
          },
          area: { type: 'number', minimum: 0 },
          boundary: {
            type: 'object',
            properties: {
              type: { const: 'Polygon' },
              coordinates: {
                type: 'array',
                items: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: { type: 'number' },
                    minItems: 2,
                    maxItems: 2
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

const plotSchema = {
  type: 'object',
  required: ['name', 'plotType', 'area', 'boundary'],
  properties: {
    name: { type: 'string' },
    plotType: { 
      type: 'string',
      enum: ['crop', 'tree', 'mixed']
    },
    area: { type: 'number', minimum: 0 },
    boundary: {
      type: 'object',
      properties: {
        type: { const: 'Polygon' },
        coordinates: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2
            }
          }
        }
      }
    },
    crops: { type: 'object' },
    plantingDate: { 
      type: 'string',
      format: 'date-time'
    },
    harvestDate: { 
      type: 'string',
      format: 'date-time'
    },
    soilData: { type: 'object' },
    irrigation: { type: 'object' }
  }
};

class FarmMappingController {
  async createFarm(req, res) {
    const farmData = {
      ...req.body,
      ownerId: req.user.id
    };

    const farm = await FarmMappingService.createFarm(farmData);

    res.status(201).json({
      success: true,
      data: farm
    });
  }

  async updateFarm(req, res) {
    const { id } = req.params;
    const farm = await FarmMappingService.updateFarm(id, req.body);

    res.json({
      success: true,
      data: farm
    });
  }

  async getFarm(req, res) {
    const { id } = req.params;
    const farm = await FarmMappingService.getFarmWithPlots(id);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    res.json({
      success: true,
      data: farm
    });
  }

  async createPlot(req, res) {
    const plotData = {
      ...req.body,
      farmId: req.params.farmId
    };

    const plot = await FarmMappingService.createPlot(plotData);

    res.status(201).json({
      success: true,
      data: plot
    });
  }

  async updatePlot(req, res) {
    const { id } = req.params;
    const plot = await FarmMappingService.updatePlot(id, req.body);

    res.json({
      success: true,
      data: plot
    });
  }

  async getNearbyFarms(req, res) {
    const { latitude, longitude, radius } = req.query;
    
    const farms = await FarmMappingService.findNearbyFarms(
      {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      parseFloat(radius)
    );

    res.json({
      success: true,
      data: farms
    });
  }

  async getFarmStats(req, res) {
    const { id } = req.params;
    const stats = await FarmMappingService.calculateFarmStats(id);

    res.json({
      success: true,
      data: stats
    });
  }

  async syncOfflineChanges(req, res) {
    const { changes } = req.body;
    await FarmMappingService.syncOfflineChanges(changes);

    res.json({
      success: true,
      message: 'Changes synced successfully'
    });
  }
}

const controller = new FarmMappingController();

module.exports = {
  createFarm: [
    validateSchema(farmSchema),
    asyncHandler(controller.createFarm)
  ],
  updateFarm: [
    validateSchema(farmSchema),
    asyncHandler(controller.updateFarm)
  ],
  getFarm: asyncHandler(controller.getFarm),
  createPlot: [
    validateSchema(plotSchema),
    asyncHandler(controller.createPlot)
  ],
  updatePlot: [
    validateSchema(plotSchema),
    asyncHandler(controller.updatePlot)
  ],
  getNearbyFarms: asyncHandler(controller.getNearbyFarms),
  getFarmStats: asyncHandler(controller.getFarmStats),
  syncOfflineChanges: asyncHandler(controller.syncOfflineChanges)
};