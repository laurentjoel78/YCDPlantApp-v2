import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

interface Order {
    id: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    items: any[];
}

export default function OrdersScreen() {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered'>('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await api.checkout.getOrders();
            setOrders(response.data.orders);
        } catch (error) {
            console.error('Load orders error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return '#4CAF50';
            case 'delivered': return '#2196F3';
            case 'pending': return '#FF9800';
            case 'cancelled': return '#F44336';
            default: return '#999';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return 'check-circle';
            case 'delivered': return 'package-variant-closed';
            case 'pending': return 'clock-outline';
            case 'cancelled': return 'close-circle';
            default: return 'information';
        }
    };

    const filteredOrders = orders.filter(order =>
        filter === 'all' || order.status === filter
    );

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderId}>Order #{item.id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <MaterialCommunityIcons
                        name={getStatusIcon(item.status)}
                        size={16}
                        color="#FFF"
                    />
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="package-variant" size={20} color="#666" />
                    <Text style={styles.detailText}>
                        {item.items?.length || 0} item{item.items?.length !== 1 ? 's' : ''}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="cash" size={20} color="#666" />
                    <Text style={styles.detailText}>
                        {Number(item.total_amount).toLocaleString('en-US')} XAF
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                        name={item.payment_status === 'paid' ? 'check-circle' : 'clock-outline'}
                        size={20}
                        color={item.payment_status === 'paid' ? '#4CAF50' : '#FF9800'}
                    />
                    <Text style={styles.detailText}>{item.payment_status}</Text>
                </View>
            </View>

            <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.primary} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.filterBar}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
                        Pending
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'confirmed' && styles.filterButtonActive]}
                    onPress={() => setFilter('confirmed')}
                >
                    <Text style={[styles.filterButtonText, filter === 'confirmed' && styles.filterButtonTextActive]}>
                        Confirmed
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'delivered' && styles.filterButtonActive]}
                    onPress={() => setFilter('delivered')}
                >
                    <Text style={[styles.filterButtonText, filter === 'delivered' && styles.filterButtonTextActive]}>
                        Delivered
                    </Text>
                </TouchableOpacity>
            </View>

            {filteredOrders.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="package-variant" size={80} color="#CCC" />
                    <Text style={styles.emptyText}>No orders found</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Main', { screen: 'Marketplace' })}
                    >
                        <Text style={styles.shopButtonText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.colors.primary]}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    filterBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DDD',
        alignItems: 'center'
    },
    filterButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary
    },
    filterButtonText: {
        fontSize: 14,
        color: '#666'
    },
    filterButtonTextActive: {
        color: '#FFF',
        fontWeight: '600'
    },
    list: {
        padding: 16
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4
    },
    orderDate: {
        fontSize: 12,
        color: '#999'
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4
    },
    statusText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize'
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    detailText: {
        fontSize: 14,
        color: '#666'
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
    },
    viewDetailsText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
        marginRight: 4
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        marginTop: 16,
        marginBottom: 24
    },
    shopButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8
    },
    shopButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600'
    }
});
