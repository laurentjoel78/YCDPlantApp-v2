import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, Searchbar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityLog {
    id: string;
    userId: string;
    userRole: string;
    actionType: string;
    actionDescription: string;
    createdAt: string;
    ipAddress: string;
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

    const getActionColor = (actionType: string) => {
        if (actionType.includes('LOGIN')) return '#4CAF50';
        if (actionType.includes('DELETE')) return '#F44336';
        if (actionType.includes('BLOCK')) return '#FF9800';
        if (actionType.includes('CREATE')) return '#2196F3';
        return '#757575';
    };

    const filteredActivities = activities.filter(activity => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            activity.actionDescription.toLowerCase().includes(searchLower) ||
            activity.userId.toLowerCase().includes(searchLower) ||
            activity.actionType.toLowerCase().includes(searchLower)
        );
    });

    const renderActivity = ({ item }: { item: ActivityLog }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.activityHeader}>
                    <View style={styles.headerLeft}>
                        <Chip
                            icon="account"
                            style={[styles.actionChip, { backgroundColor: getActionColor(item.actionType) }]}
                            textStyle={styles.chipText}
                        >
                            {item.actionType}
                        </Chip>
                        <Text style={styles.role}>{item.userRole}</Text>
                    </View>
                    <Text style={styles.timestamp}>
                        {new Date(item.createdAt).toLocaleString()}
                    </Text>
                </View>

                <Text style={styles.description}>{item.actionDescription}</Text>

                <View style={styles.meta}>
                    <Text style={styles.metaText}>
                        👤 User: {item.userId ? item.userId.substring(0, 8) + '...' : 'System'}
                    </Text>
                    {item.location?.city && (
                        <Text style={styles.metaText}>
                            📍 {item.location.city}, {item.location.country || 'Unknown'}
                        </Text>
                    )}
                    {item.deviceInfo && (
                        <Text style={styles.metaText}>
                            🖥️ {item.deviceInfo.os || 'Unknown OS'} - {item.deviceInfo.browser || 'Unknown Browser'}
                            {item.deviceInfo.isMobile ? ' (Mobile)' : ''}
                        </Text>
                    )}
                    <Text style={styles.metaText}>
                        🌐 {item.ipAddress}
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
