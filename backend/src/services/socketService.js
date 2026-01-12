const { Server } = require('socket.io');

let io = null;
const userSockets = new Map(); // Map userId to socket id(s)

/**
 * Initialize Socket.io with the HTTP server
 * @param {http.Server} server - The HTTP server instance
 * @param {Object} corsOptions - CORS options for Socket.io (optional)
 */
function initialize(server, corsOptions = null) {
    const defaultCors = {
        origin: '*',
        methods: ['GET', 'POST']
    };
    
    io = new Server(server, {
        cors: corsOptions || defaultCors
    });

    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        // Handle user authentication/registration
        socket.on('register', (userId) => {
            if (userId) {
                userSockets.set(userId, socket.id);
                socket.userId = userId;
                logger.info(`User ${userId} registered with socket ${socket.id}`);
            }
        });

        // Handle room joins (e.g., for specific forums, orders)
        socket.on('join', (room) => {
            socket.join(room);
            logger.info(`Socket ${socket.id} joined room: ${room}`);
        });

        socket.on('leave', (room) => {
            socket.leave(room);
            logger.info(`Socket ${socket.id} left room: ${room}`);
        });

        socket.on('disconnect', () => {
            if (socket.userId) {
                userSockets.delete(socket.userId);
            }
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    logger.info('Socket.io initialized');
    return io;
}

/**
 * Emit an event to all connected clients
 * @param {string} event - Event name
 * @param {object} data - Data to send
 */
function emitToAll(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

/**
 * Emit an event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Data to send
 */
function emitToUser(userId, event, data) {
    if (io) {
        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(socketId).emit(event, data);
        }
    }
}

/**
 * Emit an event to a specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {object} data - Data to send
 */
function emitToRoom(room, event, data) {
    if (io) {
        io.to(room).emit(event, data);
    }
}

/**
 * Get the Socket.io instance
 * @returns {Server|null}
 */
function getIO() {
    return io;
}

module.exports = {
    initialize,
    emitToAll,
    emitToUser,
    emitToRoom,
    getIO
};
