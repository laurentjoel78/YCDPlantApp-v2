import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import MMKVStorage from '../utils/storage';
import { SOCKET_URL, STORAGE_KEYS } from '../config/constants';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    subscribe: (event: string, callback: (data: any) => void) => () => void;
    joinRoom: (room: string) => void;
    leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

    useEffect(() => {
        const initSocket = async () => {
            try {
                // Use STORAGE_KEYS for consistency with AuthContext
                const token = await MMKVStorage.getItem(STORAGE_KEYS.TOKEN);
                const storedUser = await MMKVStorage.getItem(STORAGE_KEYS.USER);
                const userId = storedUser ? JSON.parse(storedUser)?.id : null;

                const newSocket = io(SOCKET_URL, {
                    transports: ['websocket'],
                    autoConnect: true,
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });

                newSocket.on('connect', () => {
                    console.log('Socket connected:', newSocket.id);
                    setIsConnected(true);

                    // Register user with socket
                    if (userId) {
                        newSocket.emit('register', userId);
                    }
                });

                newSocket.on('disconnect', () => {
                    console.log('Socket disconnected');
                    setIsConnected(false);
                });

                newSocket.on('connect_error', (error) => {
                    console.log('Socket connection error:', error.message);
                });

                // Set up event forwarding to registered listeners
                const events = [
                    'ORDER_CREATE', 'ORDER_UPDATE', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED', 'NEW_ORDER',
                    'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
                    'FORUM_TOPIC_CREATE', 'FORUM_POST_CREATE', 'FORUM_MESSAGE',
                    'USER_UPDATE', 'CONSULTATION_UPDATE'
                ];

                events.forEach(event => {
                    newSocket.on(event, (data) => {
                        const listeners = listenersRef.current.get(event);
                        if (listeners) {
                            listeners.forEach(callback => callback(data));
                        }
                    });
                });

                setSocket(newSocket);

                return () => {
                    newSocket.disconnect();
                };
            } catch (error) {
                console.error('Error initializing socket:', error);
            }
        };

        initSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const subscribe = useCallback((event: string, callback: (data: any) => void) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            const listeners = listenersRef.current.get(event);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }, []);

    const joinRoom = useCallback((room: string) => {
        if (socket && isConnected) {
            socket.emit('join', room);
        }
    }, [socket, isConnected]);

    const leaveRoom = useCallback((room: string) => {
        if (socket && isConnected) {
            socket.emit('leave', room);
        }
    }, [socket, isConnected]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, subscribe, joinRoom, leaveRoom }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
