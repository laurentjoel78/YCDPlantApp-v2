import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { adminService, DashboardStats } from '../../services/adminService';
import { useSocket } from '../../context/SocketContext';

export default function AdminDashboardScreen({ navigation }: any) {
    const { token, logout } = useAuth();
    const { subscribe, isConnected } = useSocket();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getDashboardStats(token);
            console.log('Dashboard data loaded:', data);
            setStats(data);
        } catch (err: any) {
            console.error('Failed to load dashboard:', err);
            setError(err.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Subscribe to real-time updates
    useEffect(() => {
        const events = [
            'ORDER_CREATE', 'ORDER_UPDATE',
            'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
            'USER_UPDATE', 'ADMIN_USER_APPROVAL_UPDATE'
        ];

        const unsubscribers = events.map(event =>
            subscribe(event, () => {
                console.log(`Real-time update received: ${event}`);
                loadDashboardData();
            })
        );

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [subscribe, loadDashboardData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const handleLogout = () => {
        logout();
        navigation.navigate('Login');
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity onPress={loadDashboardData} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.title}>Admin Dashboard</Text>
                        <Text style={styles.subtitle}>Overview & Statistics</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <MaterialCommunityIcons name="logout" size={24} color="#F44336" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.grid}>
                <StatCard
                    title="Total Users"
                    value={stats?.users.total || 0}
                    icon="account-group"
                    color="#4CAF50"
                    subtitle={`${stats?.users.active || 0} active`}
                />
                <StatCard
                    title="Products"
                    value={stats?.products.total || 0}
                    icon="package-variant"
                    color="#2196F3"
                    subtitle={`${stats?.products.active || 0} active`}
                />
                <StatCard
                    title="Farms"
                    value={stats?.farms.total || 0}
                    icon="barn"
                    color="#FF9800"
                    subtitle={`${stats?.farms.active || 0} active`}
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats?.users.pendingApprovals || 0}
                    icon="account-clock"
                    color="#F44336"
                    subtitle="Needs review"
                />
            </View>

            {/* Quick Actions */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <ActionButton
                            icon="package-variant-plus"
                            label="Add Product"
                            onPress={() => navigation.navigate('AddProduct')}
                        />
                        <ActionButton
                            icon="account-check"
                            label="User Approvals"
                            onPress={() => navigation.navigate('UserApprovals')}
                        />
                        <ActionButton
                            icon="format-list-bulleted"
                            label="Products"
                            onPress={() => navigation.navigate('ProductManagement')}
                        />
                        <ActionButton
                            icon="view-dashboard"
                            label="Dashboard"
                            onPress={() => navigation.navigate('AdminDashboard')}
                        />
                        <ActionButton
                            icon="account-tie"
                            label="Experts"
                            onPress={() => navigation.navigate('ExpertManagement')}
                        />
                        <ActionButton
                            icon="forum"
                            label="Forums"
                            onPress={() => navigation.navigate('ForumManagement')}
                        />
                        <ActionButton
                            icon="chart-timeline-variant"
                            label="Activity Logs"
                            onPress={() => navigation.navigate('ActivityMonitoring')}
                        />
                    </View>
                </Card.Content>
            </Card>

            {/* User Distribution */}
            {stats?.users.distribution && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>User Distribution</Text>
                        {Object.entries(stats.users.distribution).map(([role, count]) => (
                            <View key={role} style={styles.distributionRow}>
                                <Text style={styles.distributionLabel}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </Text>
                                <Text style={styles.distributionValue}>{count}</Text>
                            </View>
                        ))}
                    </Card.Content>
                </Card>
            )}

            {/* Advisory Status */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>Advisory Requests</Text>
                    <View style={styles.distributionRow}>
                        <Text style={styles.distributionLabel}>Total</Text>
                        <Text style={styles.distributionValue}>{stats?.advisories.total || 0}</Text>
                    </View>
                    <View style={styles.distributionRow}>
                        <Text style={styles.distributionLabel}>Pending</Text>
                        <Text style={[styles.distributionValue, { color: '#FF9800' }]}>
                            {stats?.advisories.pending || 0}
                        </Text>
                    </View>
                    <View style={styles.distributionRow}>
                        <Text style={styles.distributionLabel}>Completed</Text>
                        <Text style={[styles.distributionValue, { color: '#4CAF50' }]}>
                            {stats?.advisories.completed || 0}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

function StatCard({ title, value, icon, color, subtitle }: any) {
    return (
        <Card style={[styles.statCard, { borderLeftColor: color }]}>
            <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name={icon} size={32} color={color} />
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
                {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
            </Card.Content>
        </Card>
    );
}

function ActionButton({ icon, label, onPress }: any) {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <MaterialCommunityIcons name={icon} size={28} color="#2E7D32" />
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#2196F3',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        gap: 4,
    },
    logoutText: {
        color: '#F44336',
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
    },
    statCard: {
        width: '48%',
        margin: '1%',
        borderLeftWidth: 4,
        elevation: 2,
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    statTitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    card: {
        margin: 12,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '48%',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 12,
    },
    actionLabel: {
        marginTop: 8,
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
    distributionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    distributionLabel: {
        fontSize: 14,
        color: '#666',
    },
    distributionValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
});
