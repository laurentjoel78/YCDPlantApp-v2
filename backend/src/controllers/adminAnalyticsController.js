const { User, Product, Order, Farm, Advisory, Expert } = require('../models');
const { Op } = require('sequelize');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const logger = req.log?.child({
            controller: 'AdminAnalyticsController',
            method: 'getDashboardStats'
        });

        // Check admin permission
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Get date ranges
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        // User statistics
        const [
            totalUsers,
            activeUsers,
            newUsersThisMonth,
            pendingApprovals,
            usersByRole
        ] = await Promise.all([
            User.count(),
            User.count({ where: { is_active: true } }),
            User.count({ where: { created_at: { [Op.gte]: thirtyDaysAgo } } }),
            User.count({ where: { approval_status: 'pending' } }),
            User.findAll({
                attributes: [
                    'role',
                    [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
                ],
                group: ['role']
            })
        ]);

        // Product statistics
        const [
            totalProducts,
            activeProducts,
            productsThisWeek
        ] = await Promise.all([
            Product.count(),
            Product.count({ where: { status: 'active' } }),
            Product.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } })
        ]);

        // Farm statistics
        const [totalFarms, activeFarms] = await Promise.all([
            Farm.count(),
            Farm.count({ where: { is_active: true } })
        ]);

        // Advisory statistics
        const [
            totalAdvisories,
            pendingAdvisories,
            completedAdvisories
        ] = await Promise.all([
            Advisory.count(),
            Advisory.count({ where: { status: 'open' } }),
            Advisory.count({ where: { status: 'resolved' } })
        ]);

        // Expert statistics
        const totalExperts = await Expert.count();

        // Format user distribution
        const userDistribution = {};
        usersByRole.forEach(item => {
            userDistribution[item.role] = parseInt(item.get('count'));
        });

        logger?.info('Dashboard stats retrieved successfully');

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    newThisMonth: newUsersThisMonth,
                    pendingApprovals,
                    distribution: userDistribution
                },
                products: {
                    total: totalProducts,
                    active: activeProducts,
                    newThisWeek: productsThisWeek
                },
                farms: {
                    total: totalFarms,
                    active: activeFarms
                },
                advisories: {
                    total: totalAdvisories,
                    pending: pendingAdvisories,
                    completed: completedAdvisories
                },
                experts: {
                    total: totalExperts
                }
            }
        });

    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const limit = parseInt(req.query.limit) || 20;

        // Get recent users
        const recentUsers = await User.findAll({
            limit: 10,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'created_at']
        });

        // Get recent products
        const recentProducts = await Product.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'status', 'createdAt']
        });

        // Get recent advisories
        const recentAdvisories = await Advisory.findAll({
            limit: 10,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'title', 'status', 'created_at']
        });

        // Combine and sort activities
        const activities = [
            ...recentUsers.map(u => ({
                type: 'user',
                id: u.id,
                title: `${u.first_name} ${u.last_name} registered`,
                subtitle: u.email,
                timestamp: u.created_at,
                metadata: { role: u.role }
            })),
            ...recentProducts.map(p => ({
                type: 'product',
                id: p.id,
                title: 'New product listed',
                subtitle: p.name,
                timestamp: p.createdAt,
                metadata: { status: p.status }
            })),
            ...recentAdvisories.map(a => ({
                type: 'advisory',
                id: a.id,
                title: 'Advisory requested',
                subtitle: a.title,
                timestamp: a.created_at,
                metadata: { status: a.status }
            }))
        ];

        // Sort by timestamp and limit
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limitedActivities = activities.slice(0, limit);

        res.json({
            success: true,
            data: limitedActivities
        });

    } catch (error) {
        logger.error('Error fetching recent activities:', error);
        res.status(500).json({ error: 'Failed to fetch recent activities' });
    }
};

// Get user growth data
exports.getUserGrowth = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const users = await User.findAll({
            where: {
                created_at: { [Op.gte]: startDate }
            },
            attributes: [
                [User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'date'],
                [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
            ],
            group: [User.sequelize.fn('DATE', User.sequelize.col('created_at'))],
            order: [[User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'ASC']]
        });

        const growthData = users.map(u => ({
            date: u.get('date'),
            count: parseInt(u.get('count'))
        }));

        res.json({
            success: true,
            data: growthData
        });

    } catch (error) {
        logger.error('Error fetching user growth:', error);
        res.status(500).json({ error: 'Failed to fetch user growth data' });
    }
};

// Get system health
exports.getSystemHealth = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Test database connection
        let dbStatus = 'healthy';
        let dbLatency = 0;
        try {
            const startTime = Date.now();
            await User.sequelize.authenticate();
            dbLatency = Date.now() - startTime;
        } catch (err) {
            dbStatus = 'unhealthy';
        }

        // Get database stats
        const dbSize = await User.sequelize.query(
            "SELECT pg_size_pretty(pg_database_size(current_database())) as size",
            { type: User.sequelize.QueryTypes.SELECT }
        );

        res.json({
            success: true,
            data: {
                database: {
                    status: dbStatus,
                    latency: dbLatency,
                    size: dbSize[0]?.size || 'unknown'
                },
                server: {
                    status: 'healthy',
                    uptime: process.uptime(),
                    memory: {
                        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
                    }
                },
                timestamp: new Date()
            }
        });

    } catch (error) {
        logger.error('Error fetching system health:', error);
        res.status(500).json({ error: 'Failed to fetch system health' });
    }
};
