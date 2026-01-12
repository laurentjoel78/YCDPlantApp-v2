const logger = require('../config/logger');
const axios = require('axios');
const NodeCache = require('node-cache');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// Map API token for enhanced market discovery
const MAP_API_TOKEN = process.env.MAP_API_TOKEN || 'TXopVmOi6IfZJ1ZUecEM';
// Cache for 1 hour (3600 seconds)
const marketCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Enhanced service to discover markets using multiple data sources
 */
class MarketDiscoveryService {

    /**
     * Find markets near a specific location using OSM and local database
     * @param {number} lat Latitude
     * @param {number} lng Longitude
     * @param {number} radiusKm Search radius in km (default 50)
     * @param {Array<string>} cropFilter Optional array of crop names to filter markets
     * @returns {Promise<Array>} List of formatted market objects
     */
    async findNearbyMarkets(lat, lng, radiusKm = 50, cropFilter = []) {
        // Check for invalid coordinates
        if (lat === 0 && lng === 0) {
            logger.warn('marketDiscoveryService: received 0,0 coordinates, skipping OSM query');
            return await this.fetchFromDatabase(lat, lng, radiusKm);
        }

        try {
            // Check cache first
            const cacheKey = `markets_${lat}_${lng}_${radiusKm}`;
            const cachedMarkets = marketCache.get(cacheKey);

            if (cachedMarkets) {
                logger.info(`marketDiscoveryService: returning ${cachedMarkets.length} cached markets`);
                return this.filterByCrops(cachedMarkets, cropFilter);
            }

            // Fetch from both sources in parallel
            const [osmMarkets, dbMarkets] = await Promise.all([
                this.fetchFromOSM(lat, lng, radiusKm),
                this.fetchFromDatabase(lat, lng, radiusKm)
            ]);

            // Merge and deduplicate markets
            const allMarkets = this.mergeMarkets(osmMarkets, dbMarkets);

            // Calculate distances and sort
            const marketsWithDistance = allMarkets.map(market => ({
                ...market,
                distance_km: this.calculateDistance(lat, lng, market.location_lat, market.location_lng)
            })).sort((a, b) => a.distance_km - b.distance_km);

            // Cache the results
            marketCache.set(cacheKey, marketsWithDistance);

            logger.info(`marketDiscoveryService: found ${marketsWithDistance.length} total markets (${osmMarkets.length} OSM, ${dbMarkets.length} DB)`);

            return this.filterByCrops(marketsWithDistance, cropFilter);

        } catch (error) {
            logger.error('marketDiscoveryService: error finding markets:', error.message);
            return [];
        }
    }

    /**
     * Fetch markets from OpenStreetMap via Overpass API
     */
    async fetchFromOSM(lat, lng, radiusKm) {
        try {
            const radiusMeters = radiusKm * 1000;

            // Enhanced query to find various types of markets and agricultural points
            // Reduced timeout to 30 seconds to avoid 504 errors on large areas
            const query = `
                [out:json][timeout:30];
                (
                  node["amenity"="marketplace"](around:${radiusMeters},${lat},${lng});
                  way["amenity"="marketplace"](around:${radiusMeters},${lat},${lng});
                  node["amenity"="market_place"](around:${radiusMeters},${lat},${lng});
                  node["shop"="supermarket"](around:${radiusMeters},${lat},${lng});
                  node["shop"="farm"](around:${radiusMeters},${lat},${lng});
                  node["shop"="greengrocer"](around:${radiusMeters},${lat},${lng});
                  node["shop"="general"](around:${radiusMeters},${lat},${lng});
                  node["landuse"="farmyard"]["shop"](around:${radiusMeters},${lat},${lng});
                );
                out center;
            `;

            logger.info(`marketDiscoveryService: querying OSM for markets near ${lat},${lng} (r=${radiusKm}km)`);

            const response = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 45000 // 45 second client-side timeout
            });

            if (!response.data || !response.data.elements) {
                return [];
            }

            const markets = [];
            const elements = response.data.elements;

            for (const element of elements) {
                if (!element.tags) continue;

                // Get coordinates (handle both nodes and ways with center)
                let marketLat = element.lat || element.center?.lat;
                let marketLng = element.lon || element.center?.lon;

                if (!marketLat || !marketLng) continue;

                // Determine market type
                const marketType = this.determineMarketType(element.tags);

                markets.push({
                    id: `osm-${element.id}`,
                    name: element.tags.name || element.tags['name:en'] || `${marketType} Market`,
                    description: `Discovered via OpenStreetMap - ${marketType}`,
                    location_lat: marketLat,
                    location_lng: marketLng,
                    address: this.formatAddress(element.tags),
                    operating_hours: this.parseOperatingHours(element.tags.opening_hours),
                    market_days: this.parseMarketDays(element.tags),
                    contact_phone: element.tags.phone || element.tags['contact:phone'] || null,
                    contact_email: element.tags.email || element.tags['contact:email'] || null,
                    website: element.tags.website || null,
                    market_type: marketType,
                    accepts_crops: [], // Will be enriched later
                    source: 'osm',
                    verified: false
                });
            }

            return markets;

        } catch (error) {
            logger.error('marketDiscoveryService: OSM query error:', error.message);
            return [];
        }
    }

    /**
     * Fetch markets from local database
     */
    async fetchFromDatabase(lat, lng, radiusKm) {
        try {
            const { Market, MarketCrop, Crop } = require('../models');
            const { Op } = require('sequelize');

            // Calculate bounding box for efficient query
            const latDelta = radiusKm / 111; // Rough conversion: 1 degree lat ≈ 111 km
            const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

            const markets = await Market.findAll({
                where: {
                    location_lat: {
                        [Op.between]: [lat - latDelta, lat + latDelta]
                    },
                    location_lng: {
                        [Op.between]: [lng - lngDelta, lng + lngDelta]
                    },
                    is_active: true
                },
                include: [{
                    model: Crop,
                    as: 'acceptedCrops',
                    through: { attributes: [] },
                    required: false
                }]
            });

            return markets.map(market => ({
                id: market.id,
                name: market.name,
                description: market.description,
                location_lat: parseFloat(market.location_lat),
                location_lng: parseFloat(market.location_lng),
                address: market.address,
                operating_hours: market.operating_hours,
                market_days: market.market_days || [],
                contact_phone: market.contact_phone,
                contact_email: market.contact_email,
                website: market.website,
                market_type: market.market_type,
                accepts_crops: market.acceptedCrops?.map(c => c.name) || [],
                average_rating: market.average_rating || null,
                total_reviews: market.total_reviews || 0,
                source: 'database',
                verified: market.verified || false
            }));

        } catch (error) {
            logger.error('marketDiscoveryService: database query error:', error.message);
            return [];
        }
    }

    /**
     * Merge markets from different sources, removing duplicates
     */
    mergeMarkets(osmMarkets, dbMarkets) {
        const merged = [...dbMarkets]; // Start with database markets (higher priority)
        const dbCoords = new Set(dbMarkets.map(m => `${m.location_lat.toFixed(4)},${m.location_lng.toFixed(4)}`));

        // Add OSM markets that aren't near any database markets
        for (const osmMarket of osmMarkets) {
            const osmCoord = `${osmMarket.location_lat.toFixed(4)},${osmMarket.location_lng.toFixed(4)}`;

            // Check if this OSM market is very close to a DB market (within ~100m)
            const isDuplicate = dbMarkets.some(dbMarket =>
                this.calculateDistance(
                    osmMarket.location_lat, osmMarket.location_lng,
                    dbMarket.location_lat, dbMarket.location_lng
                ) < 0.1 // Less than 100 meters
            );

            if (!isDuplicate) {
                merged.push(osmMarket);
            }
        }

        return merged;
    }

    /**
     * Filter markets by crops they accept
     */
    filterByCrops(markets, cropFilter) {
        if (!cropFilter || cropFilter.length === 0) {
            return markets;
        }

        return markets.filter(market => {
            // If market has no crop info, include it (might accept anything)
            if (!market.accepts_crops || market.accepts_crops.length === 0) {
                return true;
            }

            // Check if market accepts any of the filtered crops
            return cropFilter.some(crop =>
                market.accepts_crops.some(acceptedCrop =>
                    (acceptedCrop || '').toLowerCase().includes((crop || '').toLowerCase())
                )
            );
        });
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Determine market type from OSM tags
     */
    determineMarketType(tags) {
        if (tags.amenity === 'marketplace' || tags.amenity === 'market_place') return 'Traditional Market';
        if (tags.shop === 'supermarket') return 'Supermarket';
        if (tags.shop === 'farm') return 'Farm Shop';
        if (tags.shop === 'greengrocer') return 'Greengrocer';
        if (tags.shop === 'general') return 'General Store';
        return 'Market';
    }

    /**
     * Format address from OSM tags
     */
    formatAddress(tags) {
        const parts = [
            tags['addr:street'],
            tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
            tags['addr:state'] || tags['addr:province'],
            tags['addr:country']
        ].filter(Boolean);

        return parts.length > 0 ? parts.join(', ') : 'Address not available';
    }

    /**
     * Parse operating hours
     */
    parseOperatingHours(openingHours) {
        if (!openingHours) return null;
        return { description: openingHours };
    }

    /**
     * Parse market days from tags
     */
    parseMarketDays(tags) {
        const days = [];
        const dayTags = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        for (const day of dayTags) {
            if (tags[`market:${day}`] === 'yes' || tags[day] === 'yes') {
                days.push(day.charAt(0).toUpperCase() + day.slice(1));
            }
        }

        return days;
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clearCache() {
        marketCache.flushAll();
        logger.info('marketDiscoveryService: cache cleared');
    }
}

module.exports = new MarketDiscoveryService();
