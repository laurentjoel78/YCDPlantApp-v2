import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, Searchbar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityLog {
    id: string;
    userId?: string;
    user_id?: string;
    userRole?: string;
    user_role?: string;
    actionType?: string;
    action_type?: string;
    actionDescription?: string;
    action_description?: string;
    createdAt?: string;
    created_at?: string;
    ipAddress?: string;
    ip_address?: string;
    location?: {
        country?: string;
        city?: string;
        region?: string;
    };
    deviceInfo?: {
        os?: string;
        browser?: string;
        isMobile?: boolean;
    };
    device_info?: {
        os?: string;
        browser?: string;
        is_mobile?: boolean;
    };
    metadata?: {
        duration?: number;
        statusCode?: number;
    };
}


const ActivityMonitoringScreen = () => {
    const { token } = useAuth();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchActivities();
    }, [filter]);

    const fetchActivities = async () => {
        if (!token) return;

        try {
            setLoading(true);
            const response = await adminService.getRecentActivities(token, {
                actionType: filter === 'all' ? undefined : filter,
                limit: 100
            });
            setActivities(response.data.rows || []);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchActivities();
    };

    const getActionColor = (actionType: string | undefined) => {
        if (!actionType) return '#757575';
        if (actionType.includes('LOGIN')) return '#4CAF50';
        if (actionType.includes('DELETE')) return '#F44336';
        if (actionType.includes('BLOCK')) return '#FF9800';
        if (actionType.includes('CREATE')) return '#2196F3';
        return '#757575';
    };

    const filteredActivities = activities.filter(activity => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        const description = (activity.actionDescription || activity.action_description || '').toLowerCase();
        const usrId = (activity.userId || activity.user_id || '').toLowerCase();
        const actType = (activity.actionType || activity.action_type || '').toLowerCase();
        return (
            description.includes(searchLower) ||
            usrId.includes(searchLower) ||
            actType.includes(searchLower)
        );
    });


    const renderActivity = ({ item }: { item: ActivityLog }) => {
        // Handle both camelCase and snake_case field names
        const actionType = item.actionType || item.action_type || '';
        const userRole = item.userRole || item.user_role || '';
        const createdAt = item.createdAt || item.created_at;
        const actionDescription = item.actionDescription || item.action_description || '';
        const userId = item.userId || item.user_id || '';
        const ipAddress = item.ipAddress || item.ip_address || '';
        const deviceInfo = item.deviceInfo || item.device_info;

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.activityHeader}>
                        <View style={styles.headerLeft}>
                            <Chip
                                icon="account"
                                style={[styles.actionChip, { backgroundColor: getActionColor(actionType) }]}
                                textStyle={styles.chipText}
                            >
                                {actionType || 'Unknown'}
                            </Chip>
                            <Text style={styles.role}>{userRole || 'Unknown'}</Text>
                        </View>
                        <Text style={styles.timestamp}>
                            {createdAt ? new Date(createdAt).toLocaleString() : 'Unknown'}
                        </Text>
                    </View>

                    <Text style={styles.description}>{actionDescription || 'No description'}</Text>

                    <View style={styles.meta}>
                        <Text style={styles.metaText}>
                            👤 User: {userId ? userId.substring(0, 8) + '...' : 'System'}
                        </Text>
                        {item.location?.city && (
                            <Text style={styles.metaText}>
                                📍 {item.location.city}, {item.location.country || 'Unknown'}
                            </Text>
                        )}

                        {deviceInfo && (
                            <Text style={styles.metaText}>
                                🖥️ {deviceInfo.os || 'Unknown OS'} - {deviceInfo.browser || 'Unknown Browser'}
                                {(deviceInfo as any).isMobile || (deviceInfo as any).is_mobile ? ' (Mobile)' : ''}
                            </Text>
                        )}

                        <Text style={styles.metaText}>
                            🌐 {ipAddress || 'Unknown IP'}
                        </Text>
                        {item.metadata?.duration && (
                            <Text style={styles.metaText}>
                                ⏱️ {item.metadata.duration}ms
                            </Text>
                        )}
                    </View>
                </Card.Content>
            </Card>
        );
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Loading activities...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Activity Monitoring</Text>
                <Text style={styles.subtitle}>Track all user actions in the app</Text>
            </View>

            <Searchbar
                placeholder="Search activities..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchBar}
            />

            <SegmentedButtons
                value={filter}
                onValueChange={setFilter}
                buttons={[
                    { value: 'all', label: 'All' },
                    { value: 'USER_LOGIN', label: 'Logins' },
                    { value: 'USER_BLOCKED', label: 'Blocked' },
                    { value: 'PRODUCT_CREATE', label: 'Products' },
                    { value: 'TOPIC_CREATE', label: 'Forums' }
                ]}
                style={styles.filter}
            />

            <FlatList
                data={filteredActivities}
                renderItem={renderActivity}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2E7D32']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No activities found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16,
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    searchBar: {
        margin: 16,
        elevation: 2,
    },
    filter: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        marginBottom: 12,
        elevation: 2,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    actionChip: {
        height: 28,
    },
    chipText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    role: {
        fontSize: 12,
        color: '#666',
        textTransform: 'uppercase',
    },
    timestamp: {
        color: '#666',
        fontSize: 11,
    },
    description: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    meta: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
        marginTop: 8,
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});

export default ActivityMonitoringScreen;
